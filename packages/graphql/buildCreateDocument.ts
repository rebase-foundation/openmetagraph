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

import { number, object, pick, record, string, type } from "superstruct";
import {
  assertOrThrow,
  buildJSONValidatorFromSchemas,
  ValidOpenMetaGraphDocument,
} from "./validation";
import { CreateResponse, DocumentInputType, FileInputType } from "./fields";
import { Hooks } from "./types";
import { OpenMetaGraphAlias, OpenMetaGraphSchema } from "openmetagraph";
import getAllSchemas from "./getAllSchemas";
import { createTypeName } from "./createTypeName";

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

async function jsonToOpenMetaGraph(hooks: Hooks, doc: any) {}

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
    name: "DocumentInput",
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
      const validator = await buildJSONValidatorFromSchemas(
        hooks,
        schemaStrings
      );

      // TODO: create a validator
      assertOrThrow(document, validator);

      // document.elements.forEach((e: any) => {
      //   if (!e) throw new GraphQLError("Empty elements are not allowed");

      //   // Check that the key is valid
      //   const schemaElement = validSchemaElements.find(
      //     (el) => el.key === e.key
      //   );
      //   if (!schemaElement) {
      //     throw new GraphQLError(
      //       `Key '${e.key}' is not a valid key. It is either not in the provided schema or is an invalid multiple.`
      //     );
      //   }
      //   // Remove the element from missing elements
      //   missingSchemaElements = missingSchemaElements.filter(
      //     (elm) => elm.key !== e.key
      //   );

      //   // Check that the element is the proper type
      //   if (schemaElement.object !== e.object)
      //     throw new GraphQLError(
      //       `Invalid object '${e.object}' for key '${e.key}', expected '${schemaElement.object}'`
      //     );

      //   // If multiple is false, the element cannot be in the schema again
      //   if (!schemaElement.multiple) {
      //     validSchemaElements = validSchemaElements.filter(
      //       (elm) => elm.key !== e.key
      //     );
      //   }

      //   return null;
      // });

      // // Check that all required elements were provided
      // if (missingSchemaElements.length > 0) {
      //   throw new GraphQLError(
      //     `The following elements must be provided:${missingSchemaElements.map(
      //       (el) => ` ${el.key} (${el.object})`
      //     )}`
      //   );
      // }

      // const result = await hooks.onPostDocument({
      //   object: "omg",
      //   version: "0.1.0",
      //   schemas: document.schemas,
      //   elements: document.elements as any,
      // });
      // return result;
    },
  };
}
