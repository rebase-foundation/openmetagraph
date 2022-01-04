import omg, { OpenMetaGraph } from "./index";

test("Can filter for some things", async () => {
  const fetcher = async (uri: string): Promise<OpenMetaGraph> => {
    return {
      version: "0.1.0",
      elements: [
        {
          key: "dog",
          type: "plain/text",
          value: "spot",
        },
        {
          key: "dog",
          type: "plain/text",
          value: "mop",
        },
        {
          key: "cat",
          type: "plain/text",
          value: "winston",
        },
      ],
    };
  };

  const root = await omg("ipfs://arglebargle", fetcher);

  const dogs = await Promise.all(root.find("dog"));
  expect(dogs.map((e) => e.asElement().value)).toEqual(["spot", "mop"]);

  const firstDog = await root.first("dog");
  expect(firstDog?.asElement().value).toBe("spot");

  const lastDog = await root.last("dog");
  expect(lastDog?.asElement().value).toBe("mop");

  const getCat = await root.first("cat");
  expect(getCat?.asElement().value).toBe("winston");
});

test("Can fetch a URI", async () => {
  const fetcher = async (uri: string): Promise<OpenMetaGraph> => {
    if (uri === "ipfs://inner") {
      return {
        version: "0.1.0",
        elements: [
          {
            key: "data",
            type: "plain/text",
            value: "value",
          },
        ],
      };
    }

    return {
      version: "0.1.0",
      elements: [
        {
          key: "inner",
          type: "plain/text",
          uri: "ipfs://inner",
        },
        {
          key: "cat",
          type: "plain/text",
          value: "winston",
        },
      ],
    };
  };

  const root = await omg("ipfs://outer", fetcher);

  const inner = await root.first("inner");
  const value = await inner?.asNode().first("data");
  expect(value?.asElement()).toEqual({
    key: "data",
    type: "plain/text",
    value: "value",
  });
});
