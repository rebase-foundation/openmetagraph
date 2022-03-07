import Ajv, { JSONSchemaType, JSONType } from "ajv";

interface OpenMetaGraphSchema {
  version: string;
  elements: {
    [key: string]:
      | {
          object: "file";
        }
      | {
          object: "string";
        }
      | {
          object: "number";
        }
      | {
          object: "node";
        };
  };
}

const foo: OpenMetaGraphSchema = {
  version: "0.1.0",
  elements: {
    photos: {
      object: "file",
    },
    title: {
      object: "string",
    },
    description: {
      object: "node",
    },
  },
};
