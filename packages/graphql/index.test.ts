import { graphql } from "graphql";
import { OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
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

  const schema = await buildGraphqlSchema(
    {
      onGetResource: fetcher,
      onPostDocument: async () => {
        return { key: "key" } as any;
      },
      onPostSchema: async () => {
        return { key: "key" } as any;
      },
    },
    ["schema"]
  );

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

  expect(result.errors).toBeFalsy();
  expect(result.data).toEqual({
    get: {
      title: "hello world",
    },
  });
});

test("CreateDocument example", async () => {
  const omgschema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    elements: {
      title: {
        object: "string",
        multiple: false,
      },
      photos: {
        types: ["image/png"],
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
  const schema = await buildGraphqlSchema(
    {
      onGetResource: fetcher,
      onPostDocument: async () => {
        postCalled = true;
        return { key: "doc" } as any;
      },
      onPostSchema: async () => {
        return { key: "schema" } as any;
      },
    },
    ["schema"]
  );

  const query = `
    mutation createDocument($input:DocumentInput) {
      createDocument(doc: $input) {
        key
      }
    }
  `;

  const result = await graphql({
    schema: schema,
    source: query,
    variableValues: {
      input: {
        elements: [
          {
            key: "title",
            object: "string",
            value: "hello world",
          },
          {
            key: "photos",
            object: "file",
            contentType: "img",
            uri: "testuri"
          },
        ],
        schemas: ["schema"],
      },
    },
  });

  expect((result.data as any).createDocument.key).toBe("doc");
  expect(result.errors).toBeFalsy();
  expect(postCalled).toBeTruthy();
});

test("CreateDocument example", async () => {
  const omgschema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    elements: {
      title: {
        object: "string",
        multiple: false,
      },
      photos: {
        types: ["image/png"],
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
  const schema = await buildGraphqlSchema(
    {
      onGetResource: fetcher,
      onPostDocument: async () => {
        return { key: "doc" } as any;
      },
      onPostSchema: async () => {
        postCalled = true;
        return { key: "schema" } as any;
      },
    },
    ["schema"]
  );

  const query = `
  mutation createSchema($mySchema:SchemaInput) {
    createSchema(schema: $mySchema) {
      key
    }
  }
  `;

  const result = await graphql({
    schema: schema,
    source: query,
    variableValues: {
      mySchema: {
        files: [],
        strings: [
          {
            key: "title",
            multiple: false,
          },
          {
            key: "tag",
            multiple: true,
          },
        ],
        numbers: [],
        nodes: [],
      },
    },
  });

  expect((result.data as any).createSchema.key).toBe("schema");
  expect(result.errors).toBeFalsy();
  expect(postCalled).toBeTruthy();
});

test("Multiple example", async () => {
  const omgschema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    elements: {
      title: {
        object: "string",
        multiple: false,
      },
      photos: {
        types: ["image/png"],
        object: "file",
        multiple: true,
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
        {
          key: "photos",
          object: "file",
          uri: "ipfs://my-photo",
          contentType: "image/png",
        },
        {
          key: "photos",
          object: "file",
          uri: "ipfs://another-photo",
          contentType: "image/png",
        },
      ],
    } as OpenMetaGraph;
  };

  const schema = await buildGraphqlSchema(
    {
      onGetResource: fetcher,
      onPostDocument: async () => {
        return { key: "key" } as any;
      },
      onPostSchema: async () => {
        return { key: "key" } as any;
      },
    },
    ["schema"]
  );

  const query = `
  {
    get(key: "ipfs://cid") {
      title
      photos {
        uri
        contentType
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
      title: "hello world",
      photos: [
        {
          uri: "ipfs://my-photo",
          contentType: "image/png",
        },
        {
          uri: "ipfs://another-photo",
          contentType: "image/png",
        },
      ],
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

  const schema = await buildGraphqlSchema(
    {
      onGetResource: fetcher,
      onPostDocument: async () => {
        return { key: "key" } as any;
      },
      onPostSchema: async () => {
        return { key: "key" } as any;
      },
    },
    ["outerSchema"]
  );

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
