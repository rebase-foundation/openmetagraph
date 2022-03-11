import { GraphQLError } from "graphql";
import { OpenMetaGraphNodeElement, OpenMetaGraphSchema } from "openmetagraph";
import {
  object,
  number,
  string,
  array,
  pattern,
  union,
  nonempty,
  record,
  boolean,
  assert,
  StructError,
  Struct,
} from "superstruct";
import { ObjectSchema, ObjectType } from "superstruct/lib/utils";
import getAllSchemas from "./getAllSchemas";
import { Hooks } from "./types";

export const assertOrThrow = (value: any, struct: any) => {
  try {
    assert(value, struct);
  } catch (err: any) {
    throw new GraphQLError(
      `${err.message}\nvalue is: ${JSON.stringify(value, null, 2)}`
    );
  }
};

export const ValidStringElement = object({
  object: pattern(string(), /string/),
  key: nonempty(string()),
  value: string(),
});

export const ValidNumberElement = object({
  object: pattern(string(), /number/),
  key: nonempty(string()),
  value: number(),
});

export const ValidFileElement = object({
  object: pattern(string(), /file/),
  key: nonempty(string()),
  contentType: string(),
  uri: string(),
});

export const ValidNodeElement = object({
  object: pattern(string(), /node/),
  key: nonempty(string()),
  uri: string(),
});

export const ValidOpenMetaGraphDocument = object({
  object: pattern(string(), /omg/),
  version: string(),
  schemas: array(string()),
  elements: array(
    union([
      ValidStringElement,
      ValidNumberElement,
      ValidFileElement,
      ValidNodeElement,
    ])
  ),
});

export const ValidOpenMetaGraphSchema = object({
  object: pattern(string(), /schema/),
  version: string(),
  name: string(),
  elements: record(
    string(),
    union([
      object({
        object: pattern(string(), /file/),
        multiple: boolean(),
      }),
      object({
        object: pattern(string(), /string/),
        multiple: boolean(),
      }),
      object({
        object: pattern(string(), /number/),
        multiple: boolean(),
      }),
      object({
        object: pattern(string(), /node/),
        multiple: boolean(),
        schemas: array(string()),
      }),
    ])
  ),
});

export const ValidOpenMetaGraphAlias = object({
  object: pattern(string(), /alias/),
  version: string(),
  name: string(),
  schemas: array(string()),
});

export const ValidOpenMetaGraphSchemaOrAlias = union([
  ValidOpenMetaGraphAlias,
  ValidOpenMetaGraphSchema,
]);

// Builds a superstruct validator for schemas
export async function buildJSONValidatorFromSchemas(
  hooks: Hooks,
  schemaStrings: string[]
) {
  const schemas = await getAllSchemas(hooks, schemaStrings);

  let total = schemas.reduce((acc, schema) => {
    acc.elements = Object.assign(acc.elements, schema.elements);
    return { ...acc };
  });

  let inner: { [key: string]: Struct<any, any> } = {};
  for (let key in total.elements) {
    let el = total.elements[key];

    if (el.object === "string") {
      if (el.multiple) inner[key] = array(string());
      else inner[key] = string();
    } else if (el.object === "number") {
      if (el.multiple) inner[key] = array(number());
      else inner[key] = number();
    } else if (el.object === "file") {
      if (el.multiple) {
        inner[key] = array(
          object({
            contentType: string(),
            uri: string(),
          })
        );
      } else {
        inner[key] = object({
          contentType: string(),
          uri: string(),
        });
      }
    } else if (el.object === "node") {
      const validator = await buildJSONValidatorFromSchemas(hooks, el.schemas);
      if (el.multiple) {
        inner[key] = array(validator);
      } else {
        inner[key] = validator;
      }
    }
  }

  return object(inner);
}
