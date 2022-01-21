import { assert } from "superstruct";
import { ValidOpenMetaGraphSchema } from "./validation";

test("valid schema", () => {
  const reasonableSchema = {
    object: "schema",
    version: "0.1.0",
    elements: {
      title: { object: "string", multiple: false },
      photos: { object: "file", types: ["image/png"], multiple: true },
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
  const reasonableSchema = {
    object: "schema",
    version: "0.1.0",
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

  expect(() => assert(reasonableSchema, ValidOpenMetaGraphSchema)).toThrow();
});
