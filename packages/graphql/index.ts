import { Fetcher, OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
import {
  graphql,
  GraphQLSchema,
  GraphQLString,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLFloat,
} from "graphql";

async function buildGraphqlSchemaFields(
  omgSchema: OpenMetaGraphSchema,
  fetcher: Fetcher
) {
  let fields: GraphQLObjectTypeConfig<any, any>["fields"] = {};
  for (let key in omgSchema.elements) {
    let el = omgSchema.elements[key];
    let type: GraphQLOutputType;
    if (el.object === "string") {
      type = GraphQLString;
    } else if (el.object === "number") {
      type = GraphQLFloat;
    } else if (el.object === "file") {
      type = new GraphQLObjectType({
        name: "File",
        description: "A URI to a file somewhere else",
        fields: {
          contentType: {
            type: GraphQLString,
            description: "A mime type, like 'image/gif'",
          },
          uri: {
            type: GraphQLString,
            description:
              "A URI, like ipfs://mycid, or https://example.com/foo.gif",
          },
        },
      });
    } else if (el.object === "node") {
      let innerFields = {};
      for (let schema of el.schemas) {
        const result = await fetcher(schema);
        if (result.object !== "schema") {
          throw new Error(`Resource at ${schema} does not look like a schema.`);
        }
        innerFields = Object.assign(
          {},
          innerFields,
          await buildGraphqlSchemaFields(result, fetcher)
        );
      }
      type = new GraphQLObjectType({
        name: "Node",
        fields: innerFields,
      });
    } else {
      throw new Error(
        `Unexpected schema object type '${
          (el as any).object
        }' for '${key}' field.`
      );
    }

    fields[key] = {
      type: type as any,
      resolve: async (source, args, context: OpenMetaGraph) => {
        const result = context.elements.find((k) => k.key === key);
        if (!result) throw new Error(`${key} does not exist.`);

        if (result.object === "number" || result.object === "string") {
          return result.value;
        }

        if (result.object === "file") {
          return {
            contentType: result.contentType,
            uri: result.uri,
          };
        }

        const doc = await fetcher(result.uri);
        if (doc.object !== "omg") {
          throw new Error(
            `${key} did not resolve to an OMG document at '${result.uri}'`
          );
        }
        return doc;
      },
    };
  }

  return fields;
}

export async function buildGraphqlSchema(
  omgSchema: OpenMetaGraphSchema,
  fetcher: Fetcher
) {
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Node",
      fields: await buildGraphqlSchemaFields(omgSchema, fetcher),
    }),
  });
}

export async function example() {
  const omgschema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    elements: {
      title: {
        object: "string",
      },
    },
  };

  const schema = await buildGraphqlSchema(omgschema, async (uri: string) => {
    if (uri == "schema") {
      return omgschema;
    }

    return {
      object: "omg",
      version: "0.1.0",
      schemas: ["schema"],
      elements: [
        {
          key: "title",
          object: "string",
          value: "hello world",
        },
      ],
    };
  });

  const query = `
  {
    title
  }
  `;

  const result = await graphql({
    schema: schema,
    source: "{ title }",
    contextValue: {
      object: "omg",
      version: "0.1.0",
      schemas: ["schema"],
      elements: [
        {
          key: "title",
          object: "string",
          value: "hello world",
        },
      ],
    },
  });

  return result;
}
