import Cors from "cors";
import { NextApiRequest, NextApiResponse } from "next";
import { getGraphQLParams } from "express-graphql";
import { OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
import { execute, GraphQLError, parse, Source } from "graphql";
import { buildGraphqlSchema } from "openmetagraph-graphql";
import fetch from "node-fetch";
import * as IPFS from "ipfs-http-client";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run cors
  await cors(req, res);

  const ipfs = IPFS.create("https://ipfs.rebasefoundation.org/api/v0" as any);

  const cid = req.query.cid as string;
  if (Array.isArray(cid)) throw new Error("cid cannot be query param too");

  let k = cid.replace("ipfs://", "");

  let url = "https://ipfs.rebasefoundation.org/api/v0/cat?arg=" + k;
  const result = await fetch(url, {
    method: "POST",
  });
  if (result.status !== 200) {
    throw new Error(
      `Unexpectedly failed to fetch '${url}' with status code ${
        result.status
      } and body ${await result.text()}`
    );
  }

  const json = (await result.json()) as any;
  res.status(200).json(json);
}
