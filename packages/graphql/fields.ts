import { Kind } from "graphql/language";
import {
  GraphQLSchema,
  GraphQLString,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLError,
  GraphQLBoolean,
  GraphQLScalarType,
} from "graphql";
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";

export const FileInputType = new GraphQLInputObjectType({
  name: "FileInput",
  description: "A URI to a file somewhere else",
  fields: {
    contentType: {
      type: GraphQLString,
      description: "A mime type, like 'image/gif'",
    },
    uri: {
      type: GraphQLString,
      description: "A URI, like ipfs://mycid, or https://example.com/foo.gif",
    },
  },
});

export const FileType = new GraphQLObjectType({
  name: "File",
  description: "A URI to a file somewhere else",
  fields: {
    contentType: {
      type: GraphQLString,
      description: "A mime type, like 'image/gif'",
    },
    uri: {
      type: GraphQLString,
      description: "A URI, like ipfs://mycid, or https://example.com/foo.gif",
    },
  },
});

export const StringSchemaInput = new GraphQLInputObjectType({
  name: "StringSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const NumberSchemaInput = new GraphQLInputObjectType({
  name: "NumberSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const FileSchemaInput = new GraphQLInputObjectType({
  name: "FileSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const NodeSchemaInput = new GraphQLInputObjectType({
  name: "NodeSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    schemas: {
      type: new GraphQLList(GraphQLString),
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const SchemaInputType = new GraphQLInputObjectType({
  name: "SchemaInput",
  description: "Input for creating a schema",
  fields: {
    name: {
      type: GraphQLString,
    },
    files: {
      type: new GraphQLList(FileSchemaInput),
    },
    strings: {
      type: new GraphQLList(StringSchemaInput),
    },
    numbers: {
      type: new GraphQLList(NumberSchemaInput),
    },
    nodes: {
      type: new GraphQLList(NodeSchemaInput),
    },
  },
});

export const AliasInputType = new GraphQLInputObjectType({
  name: "AliasInput",
  description: "Input for creating an alias",
  fields: {
    schemas: {
      type: new GraphQLList(GraphQLString),
    },
    name: {
      type: GraphQLString,
    },
  },
});

const ObjectType = new GraphQLScalarType({
  name: "ObjectType",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.OBJECT) {
      throw new GraphQLError(
        `Query error: Can only parse object but got a: ${ast.kind}`,
        [ast]
      );
    }
    return ast.fields;
  },
});

export const DocumentInputType = new GraphQLInputObjectType({
  name: "DocumentInput",
  description: "Input for creating a document",
  fields: {
    elements: {
      type: new GraphQLList(ObjectType),
    },
    schemas: {
      type: new GraphQLList(GraphQLString),
    },
  },
});

export const CreateResponse = new GraphQLObjectType({
  name: "CreateResponse",
  fields: {
    key: {
      type: GraphQLString,
    },
  },
});
