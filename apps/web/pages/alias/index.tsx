import request, { gql } from "graphql-request";
import { NextPageContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { OpenMetaGraphAlias } from "openmetagraph";
import cn from "classnames";
import { useState } from "react";

export default function Alias(props: { alias: OpenMetaGraphAlias }) {
  const [nameInput, setNameInput] = useState("");
  const [schemasInput, setSchemasInput] = useState("");
  const router = useRouter();

  async function onCreate() {
    const mutation = gql`
      # Write your query or mutation here
      mutation createAlias($alias: AliasInput) {
        createAlias(alias: $alias) {
          key
        }
      }
    `;

    const schemas = JSON.parse(schemasInput);
    if (!Array.isArray(schemas)) {
      throw new Error("schemas should be an array");
    }

    const data = await request("/api/graphql", mutation, {
      alias: {
        name: nameInput,
        schemas: schemas,
      },
    });
    if (data.createAlias?.key) {
      router.push("/alias/" + data.createAlias.key.replace("ipfs://", ""));
      setNameInput("");
      setSchemasInput("");
    } else {
      throw new Error("Failed to create alias");
    }
  }

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

        <div className="flex flex-col border-b h-full">
          <div className="px-2 py-1 border-b text-sm items-center justify-between flex bg-gray-100  text-gray-400">
            <div>Create a new alias</div>
          </div>
          <div className="flex w-full bg-blue-50 p-1 pb-12 h-full flex-col">
            <label>
              <span className="text-sm text-gray-400">name</span>
              <input
                onChange={(e) => setNameInput(e.target.value)}
                value={nameInput}
                className="border px-2 py-2 flex w-full flex-1 mb-2"
              />
            </label>
            <label className="flex flex-1 flex-col">
              <span className="text-sm text-gray-400">schemas</span>
              <textarea
                className="border px-2 py-2 flex w-full flex-1 font-mono text-sm"
                value={schemasInput}
                placeholder={`[
    "QmcNWGTHUHxnTM4gnWRPnP2y8pzZP2RWFc8UH6pMgeeRxk",
    "QmcNWGTHUHxnTM4gnWRPnP2y8pzZP2RWFc8UH6pMgeeRxk",
    "QmWSf6NNbNoYVjwSGDrxWQ6Z4HdgRcqGWZyrxgf2vKKuFJ"
]`}
                onChange={(e) => setSchemasInput(e.target.value)}
              />
            </label>
          </div>

          <button
            className="p-2 hover:bg-blue-100 hover:border-blue-500  border bg-white hover:opacity-70 px-4 py-2 ml-2"
            onClick={() => onCreate().catch(console.error)}
          >
            create
          </button>
        </div>
      </div>
    </div>
  );
}
