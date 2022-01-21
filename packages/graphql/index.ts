import { Fetcher, OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";
import { GraphQLSchema, GraphQLObjectType } from "graphql";
import { buildQuery } from "./buildQuery";
import { buildCreateDocument } from "./buildCreateDocument";
import { buildCreateSchema } from "./buildCreateSchema";

export async function buildGraphqlSchema(
  hooks: {
    onGetResource: Fetcher;
    onPostSchema: (schema: OpenMetaGraphSchema) => Promise<{ key: string }>;
    onPostDocument: (doc: OpenMetaGraph) => Promise<{ key: string }>;
  },
  omgSchemas: string[]
) {
  const query = await buildQuery(hooks, omgSchemas);
  const createDocument = buildCreateDocument(hooks);
  const createSchema = buildCreateSchema(hooks);

  return new GraphQLSchema({
    ...query,
    mutation: new GraphQLObjectType({
      name: "Mutation",

      fields: {
        createDocument,
        createSchema,
      },
    }),
  });
}
