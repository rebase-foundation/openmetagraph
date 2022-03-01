import { NextApiRequest, NextApiResponse } from "next";
import { getGraphQLParams } from "express-graphql";
import { OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
import { execute, GraphQLError, parse, Source } from "graphql";
import { buildGraphqlSchema } from "openmetagraph-graphql";
import fetch from "node-fetch";
import * as IPFS from "ipfs-http-client";

function readSchemasFromQuery(req: NextApiRequest) {
  const schemas = req.query.schema;
  if (schemas) {
    if (Array.isArray(schemas)) return schemas;
    else return [schemas];
  } else {
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let schemas = req.headers["x-omg-schemas"];
  if (!schemas || schemas.length === 0) {
    schemas = [];
  }

  if (!Array.isArray(schemas)) {
    schemas = [schemas];
  }
  schemas.push(...readSchemasFromQuery(req));
  console.log("schemas", req.query);
  schemas = schemas.map((s) => s.replace("ipfs://", ""));

  const ipfs = IPFS.create("https://ipfs.rebasefoundation.org/api/v0" as any);

  async function fetcher(
    key: string
  ): Promise<OpenMetaGraph | OpenMetaGraphSchema> {
    let k = key.replace("ipfs://", "");

    let url = "https://ipfs.rebasefoundation.org/api/v0/cat?arg=" + k;
    const result = await fetch(url, {
      method: "POST",
    });
    if (result.status !== 200) {
      throw new GraphQLError(
        `Unexpectedly failed to fetch '${url}' with status code ${
          result.status
        } and body ${await result.text()}`
      );
    }

    const json = await result.json();
    console.log("key", json);
    return json as any;
  }

  const schema = await buildGraphqlSchema(
    {
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
    },
    schemas as string[]
  );

  const params = await getGraphQLParams(req as any);
  const { query, variables, operationName } = params;
  if (!query)
    return res.status(200).json({
      errors: ["Missing 'query' parameter"],
    });

  const document = parse(new Source(query, "GraphQL request"));

  try {
    const result = await execute({
      schema,
      document,
      variableValues: variables,
      operationName,
    });
    return res.json(result);
  } catch (err) {
    return res.json({
      errors: [
        new GraphQLError("Something went wrong executing"),
        new GraphQLError(err),
      ],
    });
  }
}
