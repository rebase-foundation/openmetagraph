import {
  Fetcher,
  OpenMetaGraph,
  OpenMetaGraphAlias,
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
import { GraphQLJSONObject } from "graphql-type-json";
import {
  assertOrThrow,
  ValidOpenMetaGraphDocument,
  ValidOpenMetaGraphSchemaOrAlias,
} from "./validation";
import { FileType } from "./fields";
import { Hooks } from "./types";
import getAllSchemas from "./getAllSchemas";

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function createTypeName(hooks: Hooks, keys: string[]): Promise<string> {
  let aliasOrSchemas = await Promise.all(
    keys.map(async (k) => {
      const schemaOrResource = await hooks.onGetResource(k);
      assertOrThrow(schemaOrResource, ValidOpenMetaGraphSchemaOrAlias);
      return schemaOrResource;
    })
  );

  return (
    "Node" +
    aliasOrSchemas
      .map((s) =>
        capitalizeFirstLetter(
          (s as OpenMetaGraphSchema | OpenMetaGraphAlias).name
        )
      )
      .join("")
  );
}

async function buildGraphqlSchemaFields(
  hooks: Hooks,
  omgSchema: OpenMetaGraphSchema,
  nodeTypes: { [key: string]: GraphQLObjectType }
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
      let schemas = await getAllSchemas(hooks, el.schemas);
      for (let schema of schemas) {
        innerFields = Object.assign(
          {},
          innerFields,
          await buildGraphqlSchemaFields(hooks, schema, nodeTypes)
        );
      }

      let name = await createTypeName(hooks, el.schemas);
      let obj;
      if (nodeTypes[name]) {
        obj = nodeTypes[name];
      } else {
        obj = new GraphQLObjectType({
          name: name,
          fields: innerFields,
        });
        nodeTypes[name] = obj;
      }

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
          const doc = await hooks.onGetResource(result.uri);
          assertOrThrow(doc, ValidOpenMetaGraphDocument);
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
  const nodeTypes = {} as any;
  let innerFields = {};
  for (let schema of await getAllSchemas(hooks, omgSchemas)) {
    innerFields = Object.assign(
      {},
      innerFields,
      await buildGraphqlSchemaFields(hooks, schema, nodeTypes)
    );
  }

  const name = await createTypeName(hooks, omgSchemas);
  const NodeType = new GraphQLObjectType({
    name: await createTypeName(hooks, omgSchemas),
    fields: innerFields,
  });
  nodeTypes[name] = NodeType;

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
            assertOrThrow(result, ValidOpenMetaGraphDocument);
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
            throw new Error("Schema is required"); // todo
            const result = await hooks.onGetResource(key);
            assertOrThrow(result, ValidOpenMetaGraphDocument);
            return result;
          },
        },
      },
    }),
  };

  return omgSchemas.length > 0 ? queryWithSchema : queryWithoutSchema;
}
