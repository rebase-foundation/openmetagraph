import {
  Fetcher,
  OpenMetaGraph,
  OpenMetaGraphFileElement,
  OpenMetaGraphNodeElement,
  OpenMetaGraphSchema,
} from "openmetagraph";
import {
  GraphQLSchema,
  GraphQLString,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLUnionType,
  GraphQLError,
  GraphQLBoolean,
} from "graphql";
import crypto from "crypto";
import { GraphQLJSONObject } from "graphql-type-json";
import { pick, assert } from "superstruct";
import {
  ValidOpenMetaGraphDocument,
  ValidOpenMetaGraphSchema,
} from "./validation";

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

export const StringSchemaInput = new GraphQLInputObjectType({
  name: "StringSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const NumberSchemaInput = new GraphQLInputObjectType({
  name: "NumberSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    multiple: {
      type: GraphQLBoolean,
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
    multiple: {
      type: GraphQLBoolean,
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
    multiple: {
      type: GraphQLBoolean,
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
      type: new GraphQLList(StringSchemaInput),
    },
    numbers: {
      type: new GraphQLList(NumberSchemaInput),
    },
    nodes: {
      type: new GraphQLList(NodeSchemaInput),
    },
  },
});

export const DocumentInputType = new GraphQLInputObjectType({
  name: "DocumentInput",
  description: "Input for creating a document",
  fields: {
    elements: {
      type: new GraphQLList(GraphQLJSONObject),
    },
    schemas: {
      type: new GraphQLList(GraphQLString),
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
      if (el.multiple) {
        type = new GraphQLList(GraphQLString);
      } else {
        type = GraphQLString;
      }
    } else if (el.object === "number") {
      if (el.multiple) {
        type = new GraphQLList(GraphQLFloat);
      } else {
        type = GraphQLFloat;
      }
    } else if (el.object === "file") {
      if (el.multiple) {
        type = new GraphQLList(FileType);
      } else {
        type = FileType;
      }
    } else if (el.object === "node") {
      let innerFields = {};
      for (let schema of el.schemas) {
        const result = await fetcher(schema);
        assert(result, ValidOpenMetaGraphSchema);
        innerFields = Object.assign(
          {},
          innerFields,
          await buildGraphqlSchemaFields(result as OpenMetaGraphSchema, fetcher)
        );
      }

      let obj = new GraphQLObjectType({
        name: "Node_" + createTypeName(el.schemas),
        fields: innerFields,
      });
      if (el.multiple) {
        type = new GraphQLList(obj);
      } else {
        type = obj;
      }
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
        const multiple = omgSchema.elements[key].multiple;
        const object = omgSchema.elements[key].object;
        const data = source.elements.filter((k) => k.key === key);

        if (!data || (!multiple && data.length === 0))
          throw new GraphQLError(`${key} does not exist.`);
        if (multiple && data.length > 1)
          throw new GraphQLError(
            `${key} is marked as not multiple in the schema, yet the document contains ${data.length} instances`
          );

        if (object === "number" || object === "string") {
          return multiple ? data : data[0];
        }

        if (object === "file") {
          if (!multiple) return data[0];
          else {
            data.map((d) => {
              return {
                contentType: (d as OpenMetaGraphFileElement).contentType,
                uri: (d as OpenMetaGraphFileElement).uri,
              };
            });
          }
        }

        async function resolveNode(result: OpenMetaGraphNodeElement) {
          const doc = await fetcher(result.uri);
          assert(doc, ValidOpenMetaGraphDocument);
          return doc as OpenMetaGraph;
        }

        if (!multiple) {
          return await resolveNode(data[0] as OpenMetaGraphNodeElement);
        } else {
          return await Promise.all(
            data.map(async (d) => {
              return await resolveNode(d as OpenMetaGraphNodeElement);
            })
          );
        }
      },
    };
  }

  return fields;
}

const CreateResponse = new GraphQLObjectType({
  name: "CreateResponse",
  fields: {
    key: {
      type: GraphQLString,
    },
  },
});

export async function buildGraphqlSchema(
  omgSchemas: string[],
  hooks: {
    onGetResource: Fetcher;
    onPostSchema: (schema: OpenMetaGraphSchema) => Promise<{ key: string }>;
    onPostDocument: (doc: OpenMetaGraph) => Promise<{ key: string }>;
  }
) {
  let innerFields = {};
  for (let schema of omgSchemas) {
    const result = await hooks.onGetResource(schema);
    assert(result, ValidOpenMetaGraphSchema);
    innerFields = Object.assign(
      {},
      innerFields,
      await buildGraphqlSchemaFields(
        result as OpenMetaGraphSchema,
        hooks.onGetResource
      )
    );
  }
  const NodeType = new GraphQLObjectType({
    name: "Node_" + createTypeName(omgSchemas),
    fields: innerFields,
  });

  const maybeQuery =
    omgSchemas.length > 0
      ? {
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
                  assert(result, ValidOpenMetaGraphDocument);
                  return result;
                },
              },
            },
          }),
        }
      : {
          query: new GraphQLObjectType({
            name: "Query",
            fields: {
              get: {
                type: GraphQLJSONObject,
                args: {
                  key: {
                    type: GraphQLString,
                  },
                },
                resolve: async (src, { key }, ctx) => {
                  const result = await hooks.onGetResource(key);
                  assert(result, ValidOpenMetaGraphDocument);
                  return result;
                },
              },
            },
          }),
        };

  return new GraphQLSchema({
    ...maybeQuery,
    mutation: new GraphQLObjectType({
      name: "Mutation",

      fields: {
        createDocument: {
          type: CreateResponse,
          args: {
            doc: {
              type: DocumentInputType,
            },
          },
          resolve: async (source, args, ctx) => {
            const document = args.document;
            assert(
              document,
              pick(ValidOpenMetaGraphDocument, ["schemas", "elements"])
            );
            document.elements.forEach((e: any) => {
              if (!e) throw new GraphQLError("Empty elements are not allowed");
              const obj = e.object;
              if (
                !(
                  obj === "number" ||
                  obj === "string" ||
                  obj === "file" ||
                  obj === "node"
                )
              ) {
                return new GraphQLError(`Unexpected object '${e.object}'`);
              }
              return null;
            });

            const result = await hooks.onPostDocument({
              object: "omg",
              version: "0.1.0",
              schemas: document.schemas,
              elements: document.elements as any,
            });
            return result;
          },
        },

        createSchema: {
          type: CreateResponse,
          args: {
            schema: {
              type: SchemaInputType,
            },
          },
          resolve: async (source, args, ctx) => {
            const strings = args.schema.strings.reduce(
              (s: object, value: { key: string; multiple: boolean }) => {
                return {
                  ...s,
                  [value.key]: {
                    object: "string",
                    multiple: value.multiple,
                  },
                };
              },
              {}
            );
            const numbers = args.schema.numbers.reduce(
              (s: object, value: { key: string; multiple: boolean }) => {
                return {
                  ...s,
                  [value.key]: {
                    object: "number",
                    multiple: value.multiple,
                  },
                };
              },
              {}
            );
            const files = args.schema.files.reduce(
              (
                s: object,
                value: { key: string; types: string[]; multiple: boolean }
              ) => {
                return {
                  ...s,
                  [value.key]: {
                    object: "file",
                    types: value.types,
                    multiple: value.multiple,
                  },
                };
              },
              {}
            );
            const nodes = args.schema.nodes.reduce(
              (
                s: object,
                value: { key: string; schemas: string[]; multiple: boolean }
              ) => {
                return {
                  ...s,
                  [value.key]: {
                    object: "node",
                    schemas: value.schemas,
                    multiple: value.multiple,
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
            return result;
          },
        },
      },
    }),
  });
}
