import { GraphQLSchema, GraphQLObjectType } from "graphql";
import { buildQuery } from "./buildQuery";
import { buildCreateDocument } from "./buildCreateDocument";
import { buildCreateSchema } from "./buildCreateSchema";
import { Hooks } from "./types";
import { buildCreateAlias } from "./buildCreateAlias";

// Generates a graphql schema for open meta graph
export async function buildGraphqlSchema(hooks: Hooks, omgSchemas: string[]) {
  const query = await buildQuery(hooks, omgSchemas);
  const createDocument = buildCreateDocument(hooks);
  const createSchema = buildCreateSchema(hooks);
  const createAlias = buildCreateAlias(hooks);

  return new GraphQLSchema({
    ...query,
    mutation: new GraphQLObjectType({
      name: "Mutation",

      fields: {
        createDocument,
        createSchema,
        createAlias,
      },
    }),
  });
}
