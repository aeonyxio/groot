import { join } from "https://deno.land/std@0.114.0/path/win32.ts";
import { PathData } from "../../../types/path-data.ts";
import { writeInterface } from "../../../util/write-interface.ts";
import {
  importInterfaceTemplate,
  operationsTemplate,
  template,
} from "./template.ts";

export const generateFetchClient = (
  appPath: string,
  pathData: Set<PathData>,
  tsImportSuffix: boolean,
) => {
  const routeImports = new Set<string>();
  const routeOperations = new Set<string>();

  for (const path of Array.from(pathData)) {
    if (path.pathParams) {
      routeImports.add(
        importInterfaceTemplate(
          path.pathParams.type,
          `./${path.pathParams.path}`,
          tsImportSuffix,
        ),
      );
    }
    if (path.queryParams) {
      routeImports.add(
        importInterfaceTemplate(
          path.queryParams.type,
          `./${path.queryParams.path}`,
          tsImportSuffix,
        ),
      );
    }
    if (path.requestBody) {
      routeImports.add(
        importInterfaceTemplate(
          path.requestBody.type,
          `./${path.requestBody.path}`,
          tsImportSuffix,
        ),
      );
    }
    if (path.responseBody) {
      routeImports.add(
        importInterfaceTemplate(
          path.responseBody.type,
          `./${path.responseBody.path}`,
          tsImportSuffix,
        ),
      );
    }

    routeOperations.add(
      operationsTemplate({
        url: path.url,
        method: path.method,
        operationId: path.operationId,
        pathParamsType: path.pathParams?.type,
        queryParamsType: path.queryParams?.type,
        requestBodyType: path.requestBody?.type,
        responseBodyType: path.responseBody?.type,
      }),
    );
  }

  const routerCode = template(
    Array.from(routeImports).join("\n"),
    Array.from(routeOperations).join("\n"),
  );
  writeInterface(join(appPath, `service.ts`), routerCode);
};
