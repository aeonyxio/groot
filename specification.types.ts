export type ApiMethods = "get" | "post" | "put" | "delete" | "patch";
export const apiMethods: ApiMethods[] = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
];

export interface Specification {
  paths?: {
    [url: string]: {
      [method in ApiMethods]: {
        operationId: string;
        pathParams?: Schema;
        queryParams?: Schema;
        requestHeaders?: Schema;
        requestBody?: Schema;
        responseHeaders?: Schema;
        responseBody?: Schema;
      };
    };
  };
  components?: {
    schemas: {
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
  properties: { [url: string]: Schema };
  required?: Array<string>;
}

export interface ReferenceSchema {
  $ref: string;
}
