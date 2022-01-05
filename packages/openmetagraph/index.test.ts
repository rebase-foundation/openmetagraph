import omg, { OpenMetaGraph } from "./index";

test("Can filter for some things", async () => {
  const fetcher = async (uri: string): Promise<OpenMetaGraph> => {
    return {
      object: "omg",
      version: "0.1.0",
      schemas: [],
      elements: [
        {
          object: "string",
          key: "dog",
          value: "spot",
        },
        {
          object: "string",
          key: "dog",
          value: "mop",
        },
        {
          object: "string",
          key: "cat",
          value: "winston",
        },
      ],
    };
  };

  const root = await omg("ipfs://arglebargle", fetcher);

  const dogs = await Promise.all(root.find("dog"));
  expect(dogs.map((e) => e.asStringElement().value)).toEqual(["spot", "mop"]);

  const firstDog = await root.first("dog");
  expect(firstDog?.asStringElement().value).toBe("spot");

  const lastDog = await root.last("dog");
  expect(lastDog?.asStringElement().value).toBe("mop");

  const getCat = await root.first("cat");
  expect(getCat?.asStringElement().value).toBe("winston");
});

test("Can fetch a URI", async () => {
  const fetcher = async (uri: string): Promise<OpenMetaGraph> => {
    if (uri === "ipfs://inner") {
      return {
        object: "omg",
        schemas: [],
        version: "0.1.0",
        elements: [
          {
            object: "string",
            key: "data",
            value: "value",
          },
        ],
      };
    }

    return {
      object: "omg",
      schemas: [],
      version: "0.1.0",
      elements: [
        {
          object: "node",
          key: "inner",
          uri: "ipfs://inner",
        },
        {
          object: "string",
          key: "cat",
          value: "winston",
        },
      ],
    };
  };

  const root = await omg("ipfs://outer", fetcher);

  const inner = await root.first("inner");
  const value = await inner?.asNode().first("data");
  expect(value?.asStringElement()).toEqual({
    object: "string",
    key: "data",
    value: "value",
  });
});
