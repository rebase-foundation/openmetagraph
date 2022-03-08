import { GraphQLError } from "graphql";
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
} from "superstruct";

export const assertOrThrow = (value: any, struct: any) => {
  try {
    assert(value, struct);
  } catch (err: any) {
    throw new GraphQLError(err);
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
  schemas: array(string()),
});

export const ValidOpenMetaGraphSchemaOrAlias = object({
  object: union([ValidOpenMetaGraphAlias, ValidOpenMetaGraphSchema]),
});
