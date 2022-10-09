export interface PathData {
  method: string;
  url: string;
  operationId: string;
  pathParams?: {
    type: string;
    path: string;
  };
  queryParams?: {
    type: string;
    path: string;
  };
  requestBody?: {
    type: string;
    path: string;
  };
  responseBody?: {
    type: string;
    path: string;
  };
}
