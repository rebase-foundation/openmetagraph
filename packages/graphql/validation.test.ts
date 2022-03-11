import { OpenMetaGraphAlias, OpenMetaGraphSchema } from "openmetagraph";
import { assert } from "superstruct";
import {
  buildJSONValidatorFromSchemas,
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

test("buildJSONValidatorFromSchemas", async () => {
  const omgschema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    name: "schema",
    elements: {
      title: {
        object: "string",
        multiple: false,
      },
      photos: {
        object: "file",
        multiple: true,
      },
    },
  };

  const fetcher = async (uri: string): Promise<any> => {
    if (uri == "schema") {
      return omgschema;
    }
    throw new Error("Unexpected schema " + uri);
  };

  let postCalled = false;
  const hooks = {
    onGetResource: fetcher,
    onPostDocument: async () => {
      postCalled = true;
      return { key: "doc" } as any;
    },
    onPostSchema: async () => {
      return { key: "schema" } as any;
    },
    onPostAlias: async () => {
      return { key: "key" } as any;
    },
  };

  const validator = await buildJSONValidatorFromSchemas(hooks, ["schema"]);

  assert(
    {
      title: "hello",
      photos: [
        {
          contentType: "image/jpeg",
          uri: "hello",
        },
        {
          contentType: "image/jpeg",
          uri: "hello",
        },
      ],
    },
    validator
  );
});
