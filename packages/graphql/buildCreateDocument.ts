import { GraphQLError } from "graphql";

import { pick, type } from "superstruct";
import { assertOrThrow, ValidOpenMetaGraphDocument } from "./validation";
import { CreateResponse, DocumentInputType } from "./fields";
import { Hooks } from "./types";
import { OpenMetaGraphSchema } from "openmetagraph";

export function buildCreateDocument(hooks: Hooks) {
  return {
    type: CreateResponse,
    args: {
      doc: {
        type: DocumentInputType,
      },
    },
    resolve: async (source: any, args: any) => {
      const document = args.doc;
      assertOrThrow(
        document,
        pick(ValidOpenMetaGraphDocument, ["schemas", "elements"])
      );

      let validSchemaElements: {
        key: string;
        object: "string" | "number" | "file" | "node";
        multiple: boolean;
      }[] = [];
      for (const schemaCID of document.schemas) {
        const schema = (await hooks.onGetResource(
          schemaCID
        )) as OpenMetaGraphSchema;
        Object.keys(schema.elements).forEach((key: string) => {
          validSchemaElements.push({
            key: key,
            object: schema.elements[key].object,
            multiple: schema.elements[key].multiple,
          });
        });
      }
      let missingSchemaElements = [...validSchemaElements];
      document.elements.forEach((e: any) => {
        if (!e) throw new GraphQLError("Empty elements are not allowed");

        // Check that the key is valid
        const schemaElement = validSchemaElements.find(
          (el) => el.key === e.key
        );
        if (!schemaElement) {
          throw new GraphQLError(
            `Key '${e.key}' is not a valid key. It is either not in the provided schema or is an invalid multiple.`
          );
        }
        // Remove the element from missing elements
        missingSchemaElements = missingSchemaElements.filter(
          (elm) => elm.key !== e.key
        );

        // Check that the element is the proper type
        if (schemaElement.object !== e.object)
          throw new GraphQLError(
            `Invalid object '${e.object}' for key '${e.key}', expected '${schemaElement.object}'`
          );

        // If multiple is false, the element cannot be in the schema again
        if (!schemaElement.multiple) {
          validSchemaElements = validSchemaElements.filter(
            (elm) => elm.key !== e.key
          );
        }

        return null;
      });

      // Check that all required elements were provided
      if (missingSchemaElements.length > 0) {
        throw new GraphQLError(
          `The following elements must be provided:${missingSchemaElements.map(
            (el) => ` ${el.key} (${el.object})`
          )}`
        );
      }

      const result = await hooks.onPostDocument({
        object: "omg",
        version: "0.1.0",
        schemas: document.schemas,
        elements: document.elements as any,
      });
      return result;
    },
  };
}
