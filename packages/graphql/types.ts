import {
  Fetcher,
  OpenMetaGraph,
  OpenMetaGraphSchema,
  OpenMetaGraphAlias,
} from "openmetagraph";

export interface Hooks {
  onGetResource: Fetcher;
  onPostSchema: (schema: OpenMetaGraphSchema) => Promise<{ key: string }>;
  onPostDocument: (doc: OpenMetaGraph) => Promise<{ key: string }>;
  onPostAlias: (alias: OpenMetaGraphAlias) => Promise<{ key: string }>;
}
