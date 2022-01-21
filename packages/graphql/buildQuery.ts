import {
  Fetcher,
  OpenMetaGraph,
  OpenMetaGraphFileElement,
  OpenMetaGraphNodeElement,
  OpenMetaGraphSchema,
  OpenMetaGraphStringElement,
} from "openmetagraph";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLFloat,
  GraphQLList,
  GraphQLError,
} from "graphql";
import crypto from "crypto";
import { GraphQLJSONObject } from "graphql-type-json";
import { assert } from "superstruct";
import {
  ValidOpenMetaGraphDocument,
  ValidOpenMetaGraphSchema,
} from "./validation";
import { FileType } from "./fields";
import { Hooks } from "./types";

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
        if (!multiple && data.length > 1)
          throw new GraphQLError(
            `${key} is marked as not multiple in the schema, yet the document contains ${data.length} instances`
          );

        if (object === "number" || object === "string") {
          return multiple
            ? data.map((d) => (d as OpenMetaGraphStringElement).value)
            : (data[0] as OpenMetaGraphStringElement).value;
        }

        if (object === "file") {
          if (!multiple) return data[0];
          else {
            return data.map((d) => {
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

export async function buildQuery(hooks: Hooks, omgSchemas: string[]) {
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

  const queryWithSchema = {
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
  };

  const queryWithoutSchema = {
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

  return omgSchemas.length > 0 ? queryWithSchema : queryWithoutSchema;
}
