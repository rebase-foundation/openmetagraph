import { AliasInputType, CreateResponse } from "./fields";
import { Hooks } from "./types";

export function buildCreateAlias(hooks: Hooks) {
  return {
    type: CreateResponse,
    args: {
      alias: {
        type: AliasInputType,
      },
    },
    resolve: async (_: any, args: any, __: any) => {
      return await hooks.onPostAlias({
        object: "alias",
        name: args.name,
        version: "0.1.0",
        schemas: args.schemas,
      });
    },
  };
}
