import cn from "classnames";
import { gql, request } from "graphql-request";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface StringSchemaElement {
  object: "string";
  multiple: boolean;
  key: string;
}

interface FileSchemaElement {
  object: "file";
  multiple: boolean;
  types: string[];
  key: string;
}

interface NumberSchemaElement {
  object: "number";
  multiple: boolean;
  key: string;
}

interface NodeSchemaElement {
  object: "node";
  multiple: boolean;
  schemas: string[];
  key: string;
}

type SchemaElement =
  | FileSchemaElement
  | StringSchemaElement
  | NumberSchemaElement
  | NodeSchemaElement;

type Schema = {
  elements: {
    [key: string]: SchemaElement;
  };
};

async function postSchema(elements: SchemaElement[]) {
  if (!elements || elements.length === 0) {
    return false;
  }

  const files = elements
    .filter((e) => e.object === "file")
    .map((e) => ({
      key: e.key,
      types: (e as FileSchemaElement).types || [],
      multiple: !!e.multiple,
    }));
  const numbers = elements
    .filter((e) => e.object === "number")
    .map((e) => ({
      key: e.key,
      multiple: !!e.multiple,
    }));
  const strings = elements
    .filter((e) => e.object === "string")
    .map((e) => ({
      key: e.key,
      multiple: !!e.multiple,
    }));
  const nodes = elements
    .filter((e) => e.object === "node")
    .map((e) => ({
      key: e.key,
      multiple: !!e.multiple,
      schemas: (e as NodeSchemaElement).schemas,
    }));

  const mutation = gql`
    # Write your query or mutation here
    mutation createSchema($schema: SchemaInput) {
      createSchema(schema: $schema) {
        key
      }
    }
  `;

  const data = await request("/api/graphql", mutation, {
    schema: {
      files,
      nodes,
      strings,
      numbers,
    },
  });
  return data.createSchema.key;
}

export default function Web(props) {
  let loadedSchema = Object.entries(props.schema?.elements || []).map(
    ([key, value]: any) => ({
      key,
      ...value,
    })
  );
  const [schema, setSchema] = useState<SchemaElement[]>(loadedSchema);
  const [next, setNext] = useState<Partial<SchemaElement>>({
    object: "string",
  });

  const elements = schema.map((el) => {
    return (
      <div
        className="flex text-sm items-center border-b flex-row w-full h-full font-mono bg-gray-50"
        key={"el" + el.key}
      >
        <div className="px-2 border-r justify-center w-24 bg-gray-50 flex items-center h-full">
          {el.object}
        </div>

        <div className="bg-gray-50 flex flex-1 items-center px-2 border-r h-full">
          {el.key}
        </div>

        {el.object === "file" && (
          <div className="bg-gray-50 flex flex-1 items-center px-2 border-r h-full">
            {JSON.stringify(el.types || [])}
          </div>
        )}

        {el.object === "node" && (
          <div className="flex flex-col h-full">
            {el.schemas.map((s) => (
              <a
                key={el.key + s}
                href={`/studio?schema=${s}`}
                target="_blank"
                className="bg-gray-50 underline hover:opacity-50 flex flex-1 items-center px-2 border-r"
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
          {!!next.multiple ? "multiple" : "single"}
        </div>
      </div>
    );
  });

  const router = useRouter();

  function onNewElment() {
    setSchema((s) => {
      return [...s, next as any];
    });

    setNext({
      object: "string",
    });

    postSchema([...schema, next as any]).then((key) => {
      if (!key) return;
      router.push("?schema=" + key.replace("ipfs://", ""));
    });
  }

  const [filesInput, setFilesInput] = useState("");
  const [badFiles, setBadFiles] = useState(false);

  const [schemasInput, setSchemasInput] = useState("");
  const [badSchema, setBadSchemas] = useState(false);

  return (
    <div className="bg-gray-50 flex w-full">
      <div className="flex flex-col bg-white w-full h-full max-w-6xl mx-auto border-l border-r">
        <div className="px-2 py-4 border-b items-center flex text-sm  text-gray-400">
          <div className="mr-4">OpenMetaGraph Studio</div>
          <input
            placeholder="ipfs://..."
            value={("ipfs://" + router.query.schema) as any}
            onChange={() => {}}
            className="flex border bg-white p-2 flex-1"
          />
        </div>

        <div className="px-2 py-1 border-b flex justify-between text-sm bg-gray-100 text-gray-400">
          <div>Schema</div>
        </div>

        <div className="flex flex-col">
          {elements}

          <div className="px-2 py-1 border-b text-sm bg-gray-100  text-gray-400">
            <div>Add new element</div>
          </div>

          <div className="p-1 bg-blue-50">
            <div className="flex flex-row justify-between gap-1">
              <button
                className={cn({
                  "border hover:opacity-70 px-4 py-2 flex-1": true,
                  "bg-blue-500 text-white border-blue-900 shadow-inner":
                    next.object === "string",
                  "bg-white": next.object !== "string",
                })}
                onClick={() => setNext((p) => ({ ...p, object: "string" }))}
              >
                String
              </button>
              <button
                className={cn({
                  "border hover:opacity-70 px-4 py-2 flex-1": true,
                  "bg-blue-500 text-white border-blue-900 shadow-inner":
                    next.object === "number",
                  "bg-white": next.object !== "number",
                })}
                onClick={() => setNext((p) => ({ ...p, object: "number" }))}
              >
                Number
              </button>
              <button
                className={cn({
                  "border hover:opacity-70 px-4 py-2 flex-1": true,
                  "bg-blue-500 text-white border-blue-900 shadow-inner":
                    next.object === "file",
                  "bg-white": next.object !== "file",
                })}
                onClick={() => setNext((p) => ({ ...p, object: "file" }))}
              >
                File
              </button>
              <button
                className={cn({
                  "border hover:opacity-70 px-4 py-2 flex-1": true,
                  "bg-blue-500 text-white border-blue-900 shadow-inner":
                    next.object === "node",
                  "bg-white": next.object !== "node",
                })}
                onClick={() => setNext((p) => ({ ...p, object: "node" }))}
              >
                Node
              </button>
            </div>
          </div>

          <div className="border-t flex border-b w-full bg-blue-50">
            <input
              placeholder="key"
              className={cn({
                "border-r ml-1 border-l px-2 py-2 flex font-mono text-sm": true,
                "flex-1": next.object !== "file" && next.object !== "node",
                "flex-2": next.object === "file",
              })}
              value={next.key}
              onChange={(e) =>
                setNext((p) => ({
                  ...p,
                  key: e.target.value.replace(" ", "_"),
                }))
              }
            />

            {next.object === "file" && (
              <input
                placeholder={`["images/png", "images/gif"]`}
                className={cn({
                  "border-r px-2 py-2 flex flex-1 font-mono text-sm": true,
                  "bg-red-50 border border-red-700": badFiles,
                })}
                value={filesInput}
                onChange={(e) => setFilesInput(e.target.value)}
                onBlur={() => {
                  let fs;
                  try {
                    fs = JSON.parse(filesInput);
                    setBadFiles(false);
                  } catch (err) {
                    setBadFiles(true);
                    return;
                  }
                  console.log("fs", fs);
                  setNext((p) => ({
                    ...next,
                    types: fs,
                  }));
                }}
              />
            )}
            {next.object === "node" && (
              <input
                placeholder={`["QmTmZJxiTVgzTmaopkjsy2XiXTu8qQp7F1uSA8wtzHrn9c", "QmQQp9f6fJtyMYXTb7tGic36hPCQ1Z47Z1Y6h86aUyudwT"]`}
                className={cn({
                  "border-r px-2 py-2 flex flex-1 font-mono text-sm": true,
                  "bg-red-50 border border-red-700": badSchema,
                })}
                value={schemasInput}
                onChange={(e) => setSchemasInput(e.target.value)}
                onBlur={() => {
                  let fs;
                  try {
                    fs = JSON.parse(schemasInput);
                    setBadSchemas(false);
                  } catch (err) {
                    setBadSchemas(true);
                    return;
                  }
                  setNext((p) => ({
                    ...next,
                    schemas: fs,
                  }));
                }}
              />
            )}
            <div className="p-1 bg-blue-50 ">
              <button
                placeholder="key"
                className={cn({
                  "border px-2 py-2 flex flex-1 text-center ": true,
                  "bg-white": !next.multiple,
                  "bg-blue-500 text-white border-blue-900 shadow-inner":
                    !!next.multiple,
                })}
                onClick={() =>
                  setNext((p) => ({ ...p, multiple: !p.multiple }))
                }
              >
                {!!next.multiple ? "multiple" : "single"}
              </button>
            </div>
          </div>
          <div className="px-2 py-2 bg-blue-50 border-b flex justify-end">
            <button
              className="border flex items-center bg-white px-4 py-2 border-blue-500 text-blue-700 disabled:opacity-20"
              disabled={
                // Is file, but no types
                (next.key === "file" && !(next as FileSchemaElement).types) ||
                // Is node, but no schema
                (next.key === "node" && !(next as NodeSchemaElement).schema) ||
                // Is anything, but no keys
                !next.key ||
                next.key.length === 0
              }
              onClick={() => {
                onNewElment();
              }}
            >
              Add New Element{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1"></div>
        <div className="px-2 py-1 flex justify-between text-sm bg-gray-100 text-gray-400 border-t">
          <a
            className="underline"
            href="https://github.com/rebase-foundation/openmetagraph"
          >
            Edit this website
          </a>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx: NextPageContext) {
  if (!ctx.query.schema) {
    return {
      props: {},
    };
  }

  let k = (ctx.query.schema as any).replace("ipfs://", "");

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

  const json = await result.json();
  if (!json || json.object !== "schema") {
    return {
      props: {},
    };
  }

  return {
    props: {
      schema: json,
    },
  };
}
