import request, { gql } from "graphql-request";
import { NextPageContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { OpenMetaGraphAlias, OpenMetaGraphSchema } from "openmetagraph";
import cn from "classnames";
import { useState } from "react";
import { useSWR } from "../lib/useSWR";

export default function SchemaLayout({
  cid,
  schema,
}: {
  cid: string;
  schema: OpenMetaGraphSchema;
}) {
  const loadedSchema = Object.entries(schema?.elements || []).map(
    ([key, value]: any) => ({
      key,
      ...value,
    })
  );

  const elements = loadedSchema.map((el) => {
    return (
      <div
        className="flex text-sm items-center border-b flex-row w-full h-full font-mono bg-gray-50"
        key={"el" + el.key}
      >
        <div
          className={cn({
            "px-2 border-r justify-between items-center w-24 flex h-full": true,
            "text-green-800 bg-green-50": el.object === "node",
            "text-blue-800 bg-blue-50": el.object === "file",
            "text-red-800 bg-red-50": el.object === "number",
            "text-purple-800 bg-purple-50": el.object === "string",
          })}
        >
          <div>{el.object}</div>
          {el.object === "file" && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          )}

          {el.object === "node" && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          )}

          {el.object === "number" && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
          )}
        </div>

        <div className="bg-gray-50 flex flex-1 items-start px-2 border-r h-full flex-col">
          <div className="text-xs text-gray-400 pt-1">key</div>
          {el.key}
        </div>

        {el.object === "node" && (
          <div className="flex flex-col h-full border-r">
            <div className="px-2 pt-1 text-xs text-gray-400">schemas</div>
            {el.schemas.map((s) => (
              <a
                key={el.key + s}
                href={`/schemas?schema=${s}`}
                target="_blank"
                className="bg-gray-50 underline hover:opacity-50 flex flex-1 items-center px-2 "
              >
                {s}
              </a>
            ))}
          </div>
        )}

        <div
          className={cn({
            "bg-gray-50 flex items-center px-4 h-full": true,
          })}
        >
          {el.multiple ? "multiple" : "single"}
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col w-full">
      <div className="px-2 justify-between items-center font-mono flex w-full  py-2 border-b text-sm">
        <div className="flex flex-col">
          <div
            className={cn({
              "text-sm transition-all": true,
              "opacity-0": !schema,
            })}
          >
            {schema?.name || "loading"}
          </div>
          <div className="text-gray-400">{cid}</div>
        </div>
        <a className="underline" href={`/schemas?schema=${cid}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
          </svg>{" "}
        </a>
      </div>
      {elements}
    </div>
  );
}
