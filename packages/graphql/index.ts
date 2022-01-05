import omg, { Fetcher, OpenMetaGraphSchema } from "openmetagraph";
import {
  graphql,
  GraphQLSchema,
  GraphQLString,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLFloat,
  execute,
  parse,
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
      resolve: (source, args, context) => {
        console.log(source, args, context);
        return {};
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

  const schema = await buildGraphqlSchema(omgschema, async () => {
    return {} as any;
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
      data: "anything",
    },
  });

  return result;
}
