import { OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
import { getGraphQLParams, graphqlHTTP } from "express-graphql";
import express, { response } from "express";
import { execute, graphql, parse, Source, validate } from "graphql";
import { buildGraphqlSchema } from "omg-graphql";
import fetch from "node-fetch";

const app = express();
app.use("/graphql", async (req, res) => {
  let schemas = req.headers["x-omg-schemas"];
  if (!schemas) {
    return res.status(400).send("Missing 'x-omg-schemas' header");
  }

  if (!Array.isArray(schemas)) {
    schemas = [schemas];
  }

  async function fetcher(
    key: string
  ): Promise<OpenMetaGraph | OpenMetaGraphSchema> {
    let url = "https://ipfs.io/ipfs/" + key;
    const result = await fetch(url);
    if (result.status !== 200) {
      throw new Error(
        `Unexpectedly failed to fetch '${url}' with status code ${
          result.status
        } and body ${await result.text()}`
      );
    }
    const json = await result.json();
    return json as any;
  }

  const schema = await buildGraphqlSchema(schemas as string[], fetcher);

  const params = await getGraphQLParams(req);
  const { query, variables, operationName } = params;
  if (!query) return res.status(400).send("Expected a 'query' parameter");

  const document = parse(new Source(query, "GraphQL request"));
  const result = await execute({
    schema,
    document,
  });

  return res.json(result);
});
