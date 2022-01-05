export type OpenMetaGraphStringElement = {
  object: "string";
  key: string;
  value: string;
};

export type OpenMetaGraphNumberElement = {
  object: "number";
  key: string;
  value: number;
};

export type OpenMetaGraphFileElement = {
  object: "file";
  key: string;
  contentType: string;
  uri: string;
};

export type OpenMetaGraphNodeElement = {
  object: "node";
  key: string;
  uri: string;
};

export interface OpenMetaGraphSchema {
  version: string;
  elements: {
    [key: string]:
      | {
          object: "file";
          types: string[];
        }
      | {
          object: "string";
        }
      | {
          object: "number";
        }
      | {
          object: "node";
        };
  };
}

export type OpenMetaGraphElement =
  | OpenMetaGraphStringElement
  | OpenMetaGraphNumberElement
  | OpenMetaGraphFileElement
  | OpenMetaGraphNodeElement;

export interface OpenMetaGraph {
  version: "0.1.0";
  //   formats: string[];
  elements: OpenMetaGraphElement[];
}

export type Fetcher = (key: string) => Promise<OpenMetaGraph>;

function isFileElement(
  el: OpenMetaGraphElement
): el is OpenMetaGraphFileElement {
  return el.object === "file";
}

function isValueElement(
  el: OpenMetaGraphElement
): el is OpenMetaGraphStringElement {
  return !!(el as OpenMetaGraphStringElement).value;
}

interface Checker {
  asNode: () => Node;
  asStringElement: () => OpenMetaGraphStringElement;
  asNumberElement: () => OpenMetaGraphNumberElement;
  asFileElement: () => OpenMetaGraphFileElement;
}

function check(
  e:
    | Node
    | OpenMetaGraphNumberElement
    | OpenMetaGraphStringElement
    | OpenMetaGraphFileElement
): Checker {
  return {
    asNode: () => {
      if (e instanceof Node) return e;
      else
        throw new Error(
          `.asNode(X) failed. X resolved to an element with the key: '${e.key}'`
        );
    },
    asNumberElement: () => {
      if (e instanceof Node)
        throw new Error(`.asElement(X) failed. X resolved to a node.`);
      else if (e.object === "number") return e;
      else throw new Error(`.asNumberElement(X) failed. X is a '${e.object}'`);
    },
    asFileElement: () => {
      if (e instanceof Node)
        throw new Error(`.asElement(X) failed. X resolved to a node.`);
      else if (e.object === "file") return e;
      else throw new Error(`.asNumberElement(X) failed. X is a '${e.object}'`);
    },
    asStringElement: () => {
      if (e instanceof Node)
        throw new Error(`.asElement(X) failed. X resolved to a node.`);
      else if (e.object === "string") return e;
      else throw new Error(`.asNumberElement(X) failed. X is a '${e.object}'`);
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

  private async resolve(el: OpenMetaGraphNodeElement): Promise<Node> {
    const result = await this.fetcher(el.uri);
    return new Node(result, this.fetcher);
  }

  find(key: string) {
    const els = this.graph.elements
      .filter((e) => e.key === key)
      .map(async (e) => {
        if (e.object === "node") {
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
