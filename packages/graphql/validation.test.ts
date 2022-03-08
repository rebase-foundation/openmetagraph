import { OpenMetaGraphAlias, OpenMetaGraphSchema } from "openmetagraph";
import { assert } from "superstruct";
import {
  ValidOpenMetaGraphSchema,
  ValidOpenMetaGraphSchemaOrAlias,
} from "./validation";

test("valid schema", () => {
  const reasonableSchema = {
    object: "schema",
    version: "0.1.0",
    name: "name",
    elements: {
      title: { object: "string", multiple: false },
      photos: { object: "file", multiple: true },
      reference: {
        object: "node",
        schemas: ["ipfs://QmNaSWxyxx6rdpAr7KXXrJP8ehwXDVxUPp1q2sbkybgNz4"],
        multiple: false,
      },
    },
  };

  assert(reasonableSchema, ValidOpenMetaGraphSchema);
});

test("bad schema", () => {
  const unreasonableSchema = {
    object: "schema",
  };

  expect(() => assert(unreasonableSchema, ValidOpenMetaGraphSchema)).toThrow();
});

test("good schema or alias", () => {
  const reasonableSchema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    name: "name",
    elements: {
      title: { object: "string", multiple: false },
      photos: { object: "file", multiple: true },
      reference: {
        object: "node",
        schemas: ["ipfs://QmNaSWxyxx6rdpAr7KXXrJP8ehwXDVxUPp1q2sbkybgNz4"],
        multiple: false,
      },
    },
  };

  const reasonableAlias: OpenMetaGraphAlias = {
    object: "alias",
    version: "0.1.0",
    name: "name",
    schemas: ["okay", "cool"],
  };

  assert(reasonableSchema, ValidOpenMetaGraphSchemaOrAlias);
  assert(reasonableAlias, ValidOpenMetaGraphSchemaOrAlias);
});
