import { OpenMetaGraphSchema } from "openmetagraph";
import { CreateResponse, SchemaInputType } from "./fields";
import { Hooks } from "./types";
import { assertOrThrow, ValidOpenMetaGraphSchema } from "./validation";

export function buildCreateSchema(hooks: Hooks) {
  return {
    type: CreateResponse,
    args: {
      schema: {
        type: SchemaInputType,
      },
    },
    resolve: async (_: any, args: any, __: any) => {
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

      const openMetagraphSchema: OpenMetaGraphSchema = {
        object: "schema",
        version: "0.1.0",
        elements: elements,
      };
      assertOrThrow(openMetagraphSchema, ValidOpenMetaGraphSchema);

      const result = await hooks.onPostSchema(openMetagraphSchema);
      return result;
    },
  };
}
