import Cors from "cors";
import { NextApiRequest, NextApiResponse } from "next";
import { getGraphQLParams } from "express-graphql";
import { OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
import { execute, GraphQLError, parse, Source } from "graphql";
import { buildGraphqlSchema } from "openmetagraph-graphql";
import fetch from "node-fetch";
import * as IPFS from "ipfs-http-client";
import { Web3Storage, File } from "web3.storage";
import NodeCache from "node-cache";

export async function saveJson(obj: any) {
  const web3Client = new Web3Storage({
    token: "proxy_replaces",
    endpoint: new URL("https://web3proxy.fly.dev/api/web3/"),
  });
  const file = new File([JSON.stringify(obj)], "metadata.json", {
    type: "application/json",
  });
  return await web3Client.put([file], { wrapWithDirectory: false });
}

function readSchemasFromQuery(req: NextApiRequest) {
  const schemas = req.query.schema;
  if (schemas) {
    if (Array.isArray(schemas)) return schemas;
    else return [schemas];
  } else {
    return [];
  }
}

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function initMiddleware(middleware) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}

// Initialize the cors middleware
const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
  Cors({
    // Only allow requests with GET, POST and OPTIONS
    methods: ["GET", "POST", "OPTIONS"],
  })
);

const cache = new NodeCache({
  maxKeys: 1000,
  stdTTL: 60 * 60 * 24 * 30, // 30 days
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run cors
  await cors(req, res);

  let schemas = req.headers["x-omg-schemas"];
  if (!schemas || schemas.length === 0) {
    schemas = [];
  }

  if (!Array.isArray(schemas)) {
    schemas = [schemas];
  }
  schemas.push(...readSchemasFromQuery(req));
  schemas = schemas.map((s) => s.replace("ipfs://", ""));

  async function fetcher(
    key: string
  ): Promise<OpenMetaGraph | OpenMetaGraphSchema> {
    let k = key.replace("ipfs://", "");
    if (cache.has(k)) {
      return cache.get(k);
    }

    const auth =
      'Basic ' + Buffer.from(process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_PROJECT_SECRET).toString('base64');
    let url = "https://ipfs.infura.io:5001/api/v0/cat?arg=" + k;
    const result = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": auth
      }
    });
    if (result.status !== 200) {
      throw new GraphQLError(
        `Unexpectedly failed to fetch '${url}' with status code ${result.status
        } and body ${await result.text()}`
      );
    }

    const json = await result.json();
    cache.set(k, json);
    return json as any;
  }

  const sortObject = (o) =>
    Object.keys(o)
      .sort()
      .reduce((r, k) => ((r[k] = o[k]), r), {});

  const schema = await buildGraphqlSchema(
    {
      onGetResource: fetcher,
      onPostDocument: async (doc) => {
        const cid = await saveJson(doc);

        return {
          key: "ipfs://" + cid.toString(),
        };
      },
      onPostSchema: async (doc) => {
        // Schema's should sort elements by their keys, to make the
        // IPFS CID hash the same.
        doc.elements = JSON.parse(JSON.stringify(sortObject(doc.elements)));

        const cid = await saveJson(doc);

        return {
          key: "ipfs://" + cid.toString(),
        };
      },
      onPostAlias: async (doc) => {
        const cid = await saveJson(doc);
        return {
          key: "ipfs://" + cid.toString(),
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
