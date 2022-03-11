import { GraphQLSchema, GraphQLObjectType } from "graphql";
import { buildQuery } from "./buildQuery";
import { buildCreateDocument } from "./buildCreateDocument";
import { buildCreateSchema } from "./buildCreateSchema";
import { Hooks } from "./types";
import { buildCreateAlias } from "./buildCreateAlias";

// Generates a graphql schema for open meta graph
export async function buildGraphqlSchema(hooks: Hooks, omgSchemas: string[]) {
  console.log("build graphql schema");
  const query = await buildQuery(hooks, omgSchemas);
  const createDocument = await buildCreateDocument(hooks, omgSchemas);
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
