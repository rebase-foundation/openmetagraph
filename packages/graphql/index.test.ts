import { graphql } from "graphql";
import {
  OpenMetaGraph,
  OpenMetaGraphAlias,
  OpenMetaGraphSchema,
} from "openmetagraph";
import { buildGraphqlSchema } from "./index";
import { Hooks } from "./types";
import axios from "axios";
import * as IPFS from "ipfs-http-client";

test("Real example", async () => {
  const ipfs = IPFS.create("https://ipfs.io/api/v0" as any);

  let cache = {} as any;

  const fetcher = async (uri: string): Promise<any> => {
    const cid = uri.replace("ipfs://", uri);
    if (cache[cid]) return cache[cid];

    const result = await axios.post(
      "https://ipfs.io/api/v0/cat?arg=" + cid
    );

    cache[cid] = result.data;
    return result.data;
  };

  const hooks: Hooks = {
    onGetResource: fetcher,
    onPostDocument: async (doc) => {
      const result = await ipfs.add(JSON.stringify(doc));
      return {
        key: "ipfs://" + result.cid.toString(),
      };
    },
    onPostSchema: async (doc) => {
      const result = await ipfs.add(JSON.stringify(doc));
      return {
        key: "ipfs://" + result.cid.toString(),
      };
    },
    onPostAlias: async (doc) => {
      const result = await ipfs.add(JSON.stringify(doc));
      return {
        key: "ipfs://" + result.cid.toString(),
      };
    },
  };

  const schema = await buildGraphqlSchema(hooks, [
    "QmRcvWdCSQXdVdwLpsepqb8BAvfR9SJLDtk1LnrwjNnGvd",
  ]);

  const query = `
  mutation createDocument($input:CreateDocumentInput) {
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
        name: "hi",
        description: "description",
        primaryImage: {
          src: {
            contentType: "contenttype",
            uri: "uri",
          },
          height: 100,
          width: 200,
          alt: "alt",
          type: "type",
        },
        createdAt: 0,
        updatedAt: 0,
        images: [],
        links: [],
        tags: [],
        videos: [],
        platforms: [],
        creators: [],
      },
    },
  });

  expect(result.errors).toBeFalsy();
  expect(result.data).toBeTruthy();
});

test("Basic Example", async () => {
  const omgschema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    name: "schema",
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
      onPostAlias: async () => {
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
      onPostAlias: async () => {
        return { key: "key" } as any;
      },
    },
    ["schema"]
  );

  const query = `
    mutation createDocument($input:CreateDocumentInput) {
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
        title: "hello world",
        photos: [
          {
            contentType: "image/jpeg",
            uri: "ipfs://cid",
          },
          {
            contentType: "image/jpeg",
            uri: "ipfs://cid",
          },
        ],
      },
    },
  });

  expect(result.errors).toBeFalsy();
  expect((result.data as any).createDocument.key).toBe("doc");
  expect(postCalled).toBeTruthy();
});

test("CreateSchema example", async () => {
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
      onPostAlias: async () => {
        return { key: "key" } as any;
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
        name: "name",
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

  expect(result.errors).toBeFalsy();
  expect((result.data as any).createSchema.key).toBe("schema");
  expect(postCalled).toBeTruthy();
});

test("CreateDocument missing element", async () => {
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
      onPostAlias: async () => {
        return { key: "key" } as any;
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
        ],
        schemas: ["schema"],
      },
    },
  });

  expect(result.errors).toBeTruthy();
  expect(postCalled).toBeFalsy();
});

test("CreateDocument duplicate element", async () => {
  const omgschema: OpenMetaGraphSchema = {
    object: "schema",
    version: "0.1.0",
    name: "schema",
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
      onPostAlias: async () => {
        return { key: "key" } as any;
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
            key: "title",
            object: "string",
            value: "hello worlds",
          },
        ],
        schemas: ["schema"],
      },
    },
  });

  expect(result.errors).toBeTruthy();
  expect(postCalled).toBeFalsy();
});

test("Multiple example", async () => {
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
      onPostAlias: async () => {
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
    name: "schema",
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
    name: "schema",
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
      onPostAlias: async () => {
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
