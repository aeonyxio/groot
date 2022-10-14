export type ApiMethods = "get" | "post" | "put" | "delete" | "patch";
export const apiMethods: ApiMethods[] = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
];

export interface Endpoint {
  operationId: string;
  pathParams?: Schema;
  queryParams?: Schema;
  requestHeaders?: Schema;
  requestBody?: Schema;
  responseHeaders?: Schema;
  responseBody?: Schema;
}

export type Path = Record<string, Method>;

export type Method = {
  operationId: string;
  pathParams?: Schema;
  queryParams?: Schema;
  requestHeaders?: Schema;
  requestBody?: Schema;
  responseHeaders?: Schema;
  responseBody?: Schema;
};

export interface Specification {
  paths?: Record<string, Path>;
  components?: {
    referenceId: string;
    definitions: {
      [schema: string]: Schema;
    };
  };
}

export type Schema =
  | StandardSchema
  | ArraySchema
  | ObjectSchema
  | ReferenceSchema;

export interface StandardSchema {
  pattern?: string;
  type: "string" | "number" | "integer" | "boolean";
  default?: string;
  enum?: string[];
  description?: string;
  example?: string | number | boolean;
}

export interface ArraySchema {
  type: "array";
  items: Schema;
}

export interface ObjectSchema {
  type: "object";
  properties?: { [url: string]: Schema };
  additionalProperties?: Schema;
  required?: Array<string>;
}

export interface ReferenceSchema {
  $ref: string;
}
