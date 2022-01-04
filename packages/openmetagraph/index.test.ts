import omg, { OpenMetaGraphValueElement } from "./index";

test("Can filter for some things", async () => {
  const fetcher = async () => {
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

  const root = await omg("ipfs://arglebargle", fetcher as any);

  const dogs = await Promise.all(root.find("dog"));
  expect(dogs.map((e) => e.asElement().value)).toEqual(["spot", "mop"]);

  const firstDog = await root.first("dog");
  expect(firstDog?.asElement().value).toBe("spot");

  const lastDog = await root.last("dog");
  expect(lastDog?.asElement().value).toBe("mop");

  const getCat = await root.first("cat");
  expect(getCat?.asElement().value).toBe("winston");
});
