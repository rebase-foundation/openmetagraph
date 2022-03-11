import {
  GraphQLError,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLString,
} from "graphql";
import { CreateResponse, FileInputType } from "./fields";
import { Hooks } from "./types";
import { OpenMetaGraphAlias, OpenMetaGraphSchema } from "openmetagraph";
import getAllSchemas from "./getAllSchemas";
import { createTypeName } from "./createTypeName";
import { jsonToOpenMetaGraph } from "./jsonToOpenMetaGraph";

async function buildGraphqlSchemaInputFields(
  hooks: Hooks,
  omgSchema: OpenMetaGraphSchema,
  nodeTypes: { [key: string]: GraphQLInputObjectType }
) {
  let fields: GraphQLObjectTypeConfig<any, any>["fields"] = {};

  for (let key in omgSchema.elements) {
    let el = omgSchema.elements[key];

    let type: GraphQLInputType;
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
        type = new GraphQLList(FileInputType);
      } else {
        type = FileInputType;
      }
    } else if (el.object === "node") {
      let innerFields = {};
      let schemas = await getAllSchemas(hooks, el.schemas);
      for (let schema of schemas) {
        innerFields = Object.assign(
          {},
          innerFields,
          await buildGraphqlSchemaInputFields(hooks, schema, nodeTypes)
        );
      }

      let name = await createTypeName(hooks, el.schemas, "CreateInput");
      let obj;
      if (nodeTypes[name]) {
        obj = nodeTypes[name];
      } else {
        obj = new GraphQLInputObjectType({
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
    };
  }
  return fields;
}

export async function buildCreateDocument(
  hooks: Hooks,
  schemaStrings: string[]
) {
  const nodeTypes = {} as any;
  let innerFields = {};
  for (let schema of await getAllSchemas(hooks, schemaStrings)) {
    innerFields = Object.assign(
      {},
      innerFields,
      await buildGraphqlSchemaInputFields(hooks, schema, nodeTypes)
    );
  }

  const InputDocumentType = new GraphQLInputObjectType({
    name: "CreateDocumentInput",
    fields: innerFields,
  });

  return {
    type: CreateResponse,
    args: {
      doc: {
        type: InputDocumentType,
      },
    },
    resolve: async (source: any, args: any) => {
      const document = args.doc;
      const omg = await jsonToOpenMetaGraph(hooks, document, schemaStrings);
      const result = await hooks.onPostDocument(omg);
      return result;
    },
  };
}
