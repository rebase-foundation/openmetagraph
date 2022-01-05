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
import crypto from "crypto";

export const FileType = new GraphQLObjectType({
  name: "File",
  description: "A URI to a file somewhere else",
  fields: {
    contentType: {
      type: GraphQLString,
      description: "A mime type, like 'image/gif'",
    },
    uri: {
      type: GraphQLString,
      description: "A URI, like ipfs://mycid, or https://example.com/foo.gif",
    },
  },
});

function createTypeName(schemas: string[]) {
  const hash = crypto.createHash("md5");
  for (let schema of schemas) {
    hash.update(schema);
  }
  return hash.digest("hex");
}

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
      type = FileType;
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
        name: "Node_" + createTypeName(el.schemas),
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
      resolve: async (source: OpenMetaGraph) => {
        console.log("source", source);
        const result = source.elements.find((k) => k.key === key);
        console.log("found element", result);
        if (!result) throw new Error(`${key} does not exist.`);

        if (result.object === "number" || result.object === "string") {
          console.log("found string", result);
          return result.value;
        }

        if (result.object === "file") {
          return {
            contentType: result.contentType,
            uri: result.uri,
          };
        }

        console.log("omg res", result);

        const doc = await fetcher(result.uri);
        console.log("doc", doc);
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
  omgSchemas: string[],
  fetcher: Fetcher
) {
  let innerFields = {};
  for (let schema of omgSchemas) {
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
  const NodeType = new GraphQLObjectType({
    name: "Node_" + createTypeName(omgSchemas),
    fields: innerFields,
  });

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        get: {
          type: NodeType,
          args: {
            key: {
              type: GraphQLString,
            },
          },
          resolve: async (src, { key }, ctx) => {
            const result = await fetcher(key);
            console.log("resolve", result);
            return result;
          },
        },
      },
    }),
  });
}
