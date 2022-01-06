import { Fetcher, OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
import {
  GraphQLSchema,
  GraphQLString,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
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

export const FileSchemaInput = new GraphQLInputObjectType({
  name: "FileSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    types: {
      type: new GraphQLList(GraphQLString),
    },
  },
});

export const NodeSchemaInput = new GraphQLInputObjectType({
  name: "NodeSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    schemas: {
      type: new GraphQLList(GraphQLString),
    },
  },
});

export const SchemaInputType = new GraphQLInputObjectType({
  name: "SchemaInput",
  description: "Input for creating a schema",
  fields: {
    files: {
      type: new GraphQLList(FileSchemaInput),
    },
    strings: {
      type: new GraphQLList(GraphQLString),
    },
    numbers: {
      type: new GraphQLList(GraphQLString),
    },
    nodes: {
      type: new GraphQLList(NodeSchemaInput),
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
        const result = source.elements.find((k) => k.key === key);
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
  omgSchemas: string[],
  hooks: {
    onGetResource: Fetcher;
    onPostSchema: (schema: OpenMetaGraphSchema) => Promise<{ key: string }>;
    onPostDocument: (schema: OpenMetaGraph) => Promise<any>;
  }
) {
  let innerFields = {};
  for (let schema of omgSchemas) {
    const result = await hooks.onGetResource(schema);
    if (result.object !== "schema") {
      throw new Error(`Resource at ${schema} does not look like a schema.`);
    }
    innerFields = Object.assign(
      {},
      innerFields,
      await buildGraphqlSchemaFields(result, hooks.onGetResource)
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
            const result = await hooks.onGetResource(key);
            console.log("resolve", result);
            return result;
          },
        },
      },
    }),
    mutation: new GraphQLObjectType({
      name: "Mutation",

      fields: {
        createSchema: {
          type: new GraphQLObjectType({
            name: "CreateSchemaResponse",
            fields: {
              key: {
                type: GraphQLString,
              },
            },
          }),
          args: {
            schema: {
              type: SchemaInputType,
            },
          },
          resolve: async (source, args, ctx) => {
            const strings = args.schema.strings.reduce(
              (s: object, key: string) => {
                return {
                  ...s,
                  [key]: {
                    object: "string",
                  },
                };
              },
              {}
            );
            const numbers = args.schema.numbers.reduce(
              (s: object, key: string) => {
                return {
                  ...s,
                  [key]: {
                    object: "number",
                  },
                };
              },
              {}
            );
            const files = args.schema.files.reduce(
              (s: object, value: { key: string; types: string[] }) => {
                return {
                  ...s,
                  [value.key]: {
                    object: "file",
                    types: value.types,
                  },
                };
              },
              {}
            );
            const nodes = args.schema.nodes.reduce(
              (s: object, value: { key: string; schemas: string[] }) => {
                return {
                  ...s,
                  [value.key]: {
                    object: "node",
                    schemas: value.schemas,
                  },
                };
              },
              {}
            );

            const elements = Object.assign({}, strings, numbers, files, nodes);

            const result = await hooks.onPostSchema({
              object: "schema",
              version: "0.1.0",
              elements: elements,
            });
            console.log("resolve", result);
            return result;
          },
        },
      },
    }),
  });
}
