import { GraphQLError } from "graphql";

import { pick, assert, type } from "superstruct";
import { ValidOpenMetaGraphDocument } from "./validation";
import { CreateResponse, DocumentInputType } from "./fields";
import { Hooks } from "./types";

export function buildCreateDocument(hooks: Hooks) {
  return {
    type: CreateResponse,
    args: {
      doc: {
        type: DocumentInputType,
      },
    },
    resolve: async (source: any, args: any) => {
      const document = args.document;
      assert(
        document,
        pick(ValidOpenMetaGraphDocument, ["schemas", "elements"])
      );
      document.elements.forEach((e: any) => {
        if (!e) throw new GraphQLError("Empty elements are not allowed");
        const obj = e.object;
        if (
          !(
            obj === "number" ||
            obj === "string" ||
            obj === "file" ||
            obj === "node"
          )
        ) {
          return new GraphQLError(`Unexpected object '${e.object}'`);
        }
        return null;
      });

      const result = await hooks.onPostDocument({
        object: "omg",
        version: "0.1.0",
        schemas: document.schemas,
        elements: document.elements as any,
      });
      return result;
    },
  };
}
