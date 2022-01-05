import { NextApiRequest, NextApiResponse } from "next";
import { getGraphQLParams } from "express-graphql";
import { OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
import { execute, parse, Source } from "graphql";
import { buildGraphqlSchema } from "omg-graphql";
import fetch from "node-fetch";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  const params = await getGraphQLParams(req as any);
  const { query, variables, operationName } = params;
  if (!query) return res.status(400).send("Expected a 'query' parameter");

  const document = parse(new Source(query, "GraphQL request"));
  const result = await execute({
    schema,
    document,
    variableValues: variables,
    operationName,
  });

  return res.json(result);
}
