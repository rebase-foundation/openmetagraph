import { example } from "./index";

test("boop", async () => {
  expect(await example()).toEqual({ data: { get: { title: "hello world" } } });
});
