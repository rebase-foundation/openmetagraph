import { graphql } from "graphql";
import { OpenMetaGraphSchema } from "openmetagraph";
import { buildGraphqlSchema } from "./index";

test("Basic Example", async () => {
  const omgschema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    elements: {
      title: {
        object: "string",
        multiple: false,
      },
    },
  };

  const fetcher = async (uri: string): Promise<any> => {
    if (uri == "schema") {
      return omgschema;
    }

    return {
      object: "omg",
      version: "0.1.0",
      schemas: ["schema"],
      elements: [
        {
          key: "title",
          object: "string",
          value: "hello world",
        },
      ],
    };
  };

  const schema = await buildGraphqlSchema(["schema"], {
    onGetResource: fetcher,
    onPostDocument: async () => {
      return { key: "key" } as any;
    },
    onPostSchema: async () => {
      return { key: "key" } as any;
    },
  });

  const query = `
  {
    get(key: "ipfs://cid") {
      title
    }
  }
  `;

  const result = await graphql({
    schema: schema,
    source: query,
  });

  expect(result.data).toEqual({
    get: {
      title: "hello world",
    },
  });
});

test("Resolving a node", async () => {
  const innerSchema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    elements: {
      data: {
        object: "string",
        multiple: false,
      },
    },
  };

  const outerSchema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    elements: {
      inner: {
        object: "node",
        schemas: ["innerSchema"],
        multiple: false,
      },
    },
  };

  const fetcher = async (uri: string): Promise<any> => {
    if (uri == "outerSchema") {
      return outerSchema;
    }
    if (uri == "innerSchema") {
      return innerSchema;
    }

    if (uri == "inner") {
      return {
        object: "omg",
        version: "0.1.0",
        schemas: ["innerSchema"],
        elements: [
          {
            key: "data",
            object: "string",
            value: "inner",
          },
        ],
      };
    }

    if (uri === "outer") {
      return {
        object: "omg",
        version: "0.1.0",
        schemas: ["outerSchema"],
        elements: [
          {
            key: "inner",
            object: "node",
            uri: "inner",
          },
        ],
      };
    }

    throw new Error(`Unexpected key '${uri}'`);
  };

  const schema = await buildGraphqlSchema(["outerSchema"], {
    onGetResource: fetcher,
    onPostDocument: async () => {
      return { key: "key" } as any;
    },
    onPostSchema: async () => {
      return { key: "key" } as any;
    },
  });

  const query = `
  {
    get(key: "outer") {
      inner {
        data
      }
    }
  }
  `;

  const result = await graphql({
    schema: schema,
    source: query,
  });
  expect(result.errors).toBeFalsy();
  expect(result.data).toEqual({
    get: {
      inner: {
        data: "inner",
      },
    },
  });
});
