export type OpenMetaGraphValueElement = {
  key: string;
  type: string;
  value: string;
};

export type OpenMetaGraphLinkedElement = {
  key: string;
  type: string;
  uri: string;
};

export type OpenMetaGraphElement =
  | OpenMetaGraphValueElement
  | OpenMetaGraphLinkedElement;

export interface OpenMetaGraph {
  version: "0.1.0";
  //   formats: string[];
  elements: OpenMetaGraphElement[];
}

export type Fetcher = (key: string) => Promise<OpenMetaGraph>;

function isLinkedElement(
  el: OpenMetaGraphElement
): el is OpenMetaGraphLinkedElement {
  return !!(el as OpenMetaGraphLinkedElement).uri;
}

function isValueElement(
  el: OpenMetaGraphElement
): el is OpenMetaGraphValueElement {
  return !!(el as OpenMetaGraphValueElement).value;
}

interface Checker {
  asNode: () => Node;
  asElement: () => OpenMetaGraphValueElement;
}

function check(e: Node | OpenMetaGraphValueElement): Checker {
  return {
    asNode: () => {
      if (e instanceof Node) return e;
      else
        throw new Error(
          `.asNode(X) failed. X resolved to an element with the key: '${e.key}'`
        );
    },
    asElement: () => {
      if (e instanceof Node)
        throw new Error(`.asElement(X) failed. X resolved to a node.`);
      else return e;
    },
  };
}

class Node {
  graph: OpenMetaGraph;
  private fetcher: Fetcher;
  constructor(graph: OpenMetaGraph, fetcher: Fetcher) {
    this.graph = graph;
    this.fetcher = fetcher;
  }

  private async resolve(el: OpenMetaGraphLinkedElement): Promise<Node> {
    const result = await this.fetcher(el.uri);
    return new Node(result, this.fetcher);
  }

  find(key: string) {
    const els = this.graph.elements
      .filter((e) => e.key === key)
      .map(async (e) => {
        if (isLinkedElement(e)) {
          return check(await this.resolve(e));
        } else {
          return check(e);
        }
      });

    return els;
  }

  async first(key: string): Promise<Checker | null> {
    const els = this.find(key);
    if (els.length === 0) return null;
    return els[0];
  }

  async last(key: string): Promise<Checker | null> {
    const els = this.find(key);
    if (els.length === 0) return null;
    return els[els.length - 1];
  }
}

export default async function omg(key: string, fetcher: Fetcher) {
  const result = await fetcher(key);

  return new Node(result, fetcher);
}
