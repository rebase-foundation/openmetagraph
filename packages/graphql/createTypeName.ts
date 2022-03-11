import {
  Fetcher,
  OpenMetaGraph,
  OpenMetaGraphAlias,
  OpenMetaGraphFileElement,
  OpenMetaGraphNodeElement,
  OpenMetaGraphSchema,
  OpenMetaGraphStringElement,
} from "openmetagraph";
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLFloat,
  GraphQLList,
  GraphQLError,
} from "graphql";
import { GraphQLJSONObject } from "graphql-type-json";
import {
  assertOrThrow,
  ValidOpenMetaGraphDocument,
  ValidOpenMetaGraphSchemaOrAlias,
} from "./validation";
import { FileType } from "./fields";
import { Hooks } from "./types";
import getAllSchemas from "./getAllSchemas";

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function createTypeName(
  hooks: Hooks,
  keys: string[],
  postfix: string
): Promise<string> {
  let aliasOrSchemas = await Promise.all(
    keys.map(async (k) => {
      const schemaOrResource = await hooks.onGetResource(k);
      assertOrThrow(schemaOrResource, ValidOpenMetaGraphSchemaOrAlias);
      return schemaOrResource;
    })
  );

  return (
    aliasOrSchemas
      .map((s) =>
        capitalizeFirstLetter(
          (s as OpenMetaGraphSchema | OpenMetaGraphAlias).name
        )
      )
      .join("") + postfix
  );
}
