import request, { gql } from "graphql-request";
import { NextPageContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { OpenMetaGraphAlias, OpenMetaGraphSchema } from "openmetagraph";
import cn from "classnames";
import { useState } from "react";
import { useSWR } from "../../lib/useSWR";
import SchemaLayout from "../../components/SchemaLayout";

function Schema({ schema }: { schema: string }) {
  const data = useSWR<OpenMetaGraphSchema>("/api/ipfs/" + schema);

  return <SchemaLayout schema={data.data} cid={schema} />;
}

export default function Alias(props: { alias: OpenMetaGraphAlias }) {
  const router = useRouter();

  return (
    <div className="bg-gray-50 flex w-full">
      <Head>
        <title>Alias</title>
      </Head>
      <div className="flex flex-col bg-white w-full h-full max-w-6xl mx-auto border-l border-r">
        <div className="px-2 py-4 border-b md:items-center flex flex-col md:flex-row md:justify-between text-sm  text-gray-400">
          <h1 className="mr-4 text-sm font-normal p-0">
            OpenMetaGraph Aliases
          </h1>
          <div
            placeholder="ipfs://..."
            onChange={() => {}}
            className={cn({
              "bg-gray-50  flex items-center": true,
              hidden: !router.query.alias,
            })}
          >
            <div className="py-2 px-2">
              {(router.query.alias as any) || "..."}
            </div>
            <a
              className="border-l flex items-center py-2 pl-2 px-2 hover:bg-gray-200"
              href={`https://ipfs.io/ipfs/${router.query.alias}`}
              target="_blank"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              ipfs
            </a>

            <a
              className="border-l px-2 py-2 hover:bg-blue-400 hover:text-white"
              href="/alias"
              target={"_blank"}
            >
              new
            </a>
          </div>
        </div>

        {props.alias && (
          <div className="flex flex-col">
            <div className="px-2 py-1 border-b text-sm items-center justify-between flex bg-gray-100  text-gray-400">
              <div>Alias</div>
            </div>

            <div className="flex border-b bg-gray-50 p-2">
              <div className=" flex flex-1 items-start h-full flex-col font-mono">
                <div className="text-xs text-gray-400 pt-1 ">Name</div>
                {props.alias.name}
              </div>
            </div>

            <div className=" flex flex-1 w-full items-start bg-gray-50 h-full flex-col font-mono">
              <div className="text-xs text-gray-400 w-full bg-gray-100  py-1 px-2 border-b">
                schemas
              </div>

              {props.alias?.schemas?.map((schema) => (
                <Schema key={schema} schema={schema} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx: NextPageContext) {
  if (!ctx.query.alias) {
    return {
      props: {},
    };
  }

  let k = (ctx.query.alias as any).replace("ipfs://", "");

  let url = "https://ipfs.io/api/v0/cat?arg=" + k;
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

  const json = (await result.json()) as OpenMetaGraphAlias;
  if (!json || json.object !== "alias") {
    return {
      props: {},
    };
  }

  return {
    props: {
      alias: json,
    },
  };
}
