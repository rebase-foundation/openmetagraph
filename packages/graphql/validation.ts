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
} from "superstruct";

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
  elements: record(
    string(),
    union([
      object({
        object: pattern(string(), /file/),
        multiple: boolean(),
        types: array(string()),
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