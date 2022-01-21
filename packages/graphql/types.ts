import { Fetcher, OpenMetaGraph, OpenMetaGraphSchema } from "openmetagraph";

export interface Hooks {
  onGetResource: Fetcher;
  onPostSchema: (schema: OpenMetaGraphSchema) => Promise<{ key: string }>;
  onPostDocument: (doc: OpenMetaGraph) => Promise<{ key: string }>;
}
