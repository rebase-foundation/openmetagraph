import { GraphQLSchema, GraphQLObjectType } from "graphql";
import { buildQuery } from "./buildQuery";
import { buildCreateDocument } from "./buildCreateDocument";
import { buildCreateSchema } from "./buildCreateSchema";
import { Hooks } from "./types";
import { buildCreateAlias } from "./buildCreateAlias";

// Generates a graphql schema for open meta graph
export async function buildGraphqlSchema(hooks: Hooks, omgSchemas: string[]) {
  const query = await buildQuery(hooks, omgSchemas);
  const createSchema = buildCreateSchema(hooks);
  const createAlias = buildCreateAlias(hooks);

  const fields = { createSchema, createAlias } as any;
  if (omgSchemas.length > 0) {
    const createDocument = await buildCreateDocument(hooks, omgSchemas);
    fields.createDocument = createDocument;
  }

  return new GraphQLSchema({
    ...query,
    mutation: new GraphQLObjectType({
      name: "Mutation",

      fields,
    }),
  });
}
