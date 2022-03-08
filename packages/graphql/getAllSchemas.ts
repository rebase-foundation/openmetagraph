import { GraphQLError } from "graphql";
import { OpenMetaGraphSchema } from "openmetagraph";
import { Hooks } from "./types";
import { assertOrThrow, ValidOpenMetaGraphSchemaOrAlias } from "./validation";

export default async function getAllSchemas(
  hooks: Hooks,
  keys: string[]
): Promise<OpenMetaGraphSchema[]> {
  let schemas = await Promise.all(
    keys.map(async (key) => {
      try {
        const result = await hooks.onGetResource(key);

        assertOrThrow(result, ValidOpenMetaGraphSchemaOrAlias);

        // if an alias, resolve all the aliases
        if (result.object === "alias") {
          const aliased = await getAllSchemas(hooks, result.schemas);
          return aliased;
        } else if (result.object === "schema") {
          return [result];
        } else {
          throw new Error(`key '${key}' is unexpectedly not a schema or alias`);
        }
      } catch (err) {
        throw new GraphQLError(
          `Schema '${key}' is missing or invalid.\n\n${err}`
        );
      }
    })
  );

  return schemas.flat();
}
