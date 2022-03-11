import {
  OpenMetaGraph,
  OpenMetaGraphElement,
  OpenMetaGraphFileElement,
  OpenMetaGraphStringElement,
} from "openmetagraph";
import { array, number, object, string } from "superstruct";
import getAllSchemas from "./getAllSchemas";
import { Hooks } from "./types";
import { assertOrThrow, buildJSONValidatorFromSchemas } from "./validation";

export async function jsonToOpenMetaGraph(
  hooks: Hooks,
  doc: { [key: string]: any },
  schemaStrings: string[]
) {
  // Ensure this document matches this schema
  const validator = await buildJSONValidatorFromSchemas(hooks, schemaStrings);
  assertOrThrow(doc, validator);

  const schemas = await getAllSchemas(hooks, schemaStrings);
  let total = schemas.reduce((acc, schema) => {
    acc.elements = Object.assign(acc.elements, schema.elements);
    return { ...acc };
  });

  let omg: OpenMetaGraph = {
    object: "omg",
    version: "0.1.0",
    schemas: schemaStrings,
    elements: [],
  };

  // Coerce the document into an OpenMetaGraph document
  for (let [key, value] of Object.entries(doc)) {
    const elSchema = total.elements[key];

    // Handle strings and arrays of strings
    if (elSchema.object === "string") {
      if (elSchema.multiple) {
        assertOrThrow(value, array(string()));
        for (let v of value as string[]) {
          omg.elements.push({
            key,
            object: "string",
            value: v,
          });
        }
      } else {
        omg.elements.push({
          key,
          object: "string",
          value: value as string,
        });
      }
      continue;
    }

    // Handle numbers and arrays of numbers
    if (elSchema.object === "number") {
      if (elSchema.multiple) {
        assertOrThrow(value, array(number()));
        for (let v of value as number[]) {
          omg.elements.push({
            key,
            object: "number",
            value: v,
          });
        }
      } else {
        omg.elements.push({
          key,
          object: "number",
          value: value as number,
        });
      }
      continue;
    }

    // Handle files and arrays of files
    if (elSchema.object === "file") {
      if (elSchema.multiple) {
        for (let v of value as Array<{ contentType: string; uri: string }>) {
          omg.elements.push({
            key,
            object: "file",
            contentType: v.contentType,
            uri: v.uri,
          });
        }
      } else {
        omg.elements.push({
          key,
          object: "file",
          contentType: value.contentType,
          uri: value.uri,
        });
      }

      continue;
    }

    // Handle nodes and arrays of nodes
    if (elSchema.object === "node") {
      if (elSchema.multiple) {
        for (let v of value) {
          const doc = await jsonToOpenMetaGraph(hooks, v, elSchema.schemas);
          const { key: cid } = await hooks.onPostDocument(doc);

          omg.elements.push({
            key,
            object: "node",
            uri: cid,
          });
        }
      } else {
        const doc = await jsonToOpenMetaGraph(hooks, value, elSchema.schemas);
        const { key: cid } = await hooks.onPostDocument(doc);
        omg.elements.push({
          key,
          object: "node",
          uri: cid,
        });
      }
      continue;
    }
  }

  return omg;
}
