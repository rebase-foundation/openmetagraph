import cn from "classnames";
import { useState } from "react";

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
  schema: string;
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

export default function Web() {
  const [schema, setSchema] = useState<SchemaElement[]>([
    {
      key: "title",
      object: "string",
      multiple: false,
    },
    {
      key: "description",
      object: "string",
      multiple: false,
    },
    {
      key: "primaryPhoto",
      object: "file",
      multiple: false,
      types: ["image/png"],
    },
  ]);
  const [next, setNext] = useState<Partial<SchemaElement>>({
    object: "string",
  });

  const elements = schema.map((el) => {
    return (
      <div className="flex items-center border-b flex-row w-full h-full font-mono">
        <div className="px-2 border-r justify-center w-24 bg-gray-50 flex items-center h-12">
          {el.object}
        </div>
        <div className="bg-gray-50 flex flex-1 items-center p-2 border-r h-12">
          {el.key}
        </div>

        <div
          className={cn({
            "bg-gray-50 flex h-12 items-center px-4": true,
          })}
        >
          multiple
        </div>
      </div>
    );
  });

  return (
    <div className="bg-gray-50 flex w-full">
      <div className="flex flex-col bg-white w-full h-full max-w-6xl mx-auto border-l border-r">
        <div className="px-2 py-4 border-b items-center flex text-sm  text-gray-400">
          <div className="mr-4">OpenMetaGraph Studio</div>
          <input
            placeholder="ipfs://cid"
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
                className="border-r px-2 py-2 flex flex-1 font-mono text-sm"
                value={next.types}
                onChange={(e) =>
                  setNext((p) => ({
                    ...p,
                    key: e.target.value.replace(" ", "_"),
                  }))
                }
              />
            )}
            {next.object === "node" && (
              <div className="flex items-center flex-1 pl-2 border-r bg-white ">
                <div className="text-sm font-mono">{`ipfs://`}</div>
                <input
                  placeholder={`cid`}
                  className="h-full flex flex-1 font-mono text-sm"
                  value={next.schema}
                  onChange={(e) =>
                    setNext((p) => ({
                      ...p,
                      schema: e.target.value
                        .replace(" ", "_")
                        .replace("https://openmetagraph.com/sudio/", "")
                        .replace("localhost:3000/studio/", "")
                        .replace("openmetagraph.com/studio/", "")
                        .replace("ipfs://", ""),
                    }))
                  }
                />
              </div>
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
                multiple
              </button>
            </div>
          </div>
          <div className="px-2 py-2 bg-blue-50 border-b flex justify-end">
            <button className="border flex items-center bg-white px-4 py-2 border-blue-500 text-blue-700">
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
