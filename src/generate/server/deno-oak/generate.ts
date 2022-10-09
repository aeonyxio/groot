import { join } from "https://deno.land/std@0.114.0/path/win32.ts";
import { PathData } from "../../../types/path-data.ts";
import { writeInterface } from "../../../util/write-interface.ts";
import {
  importInterfaceForRouter,
  registerOperationsTemplate,
  routerTemplate,
  routeTemplate,
} from "./router-template.ts";

export const generateDenoOakRouter = (
  appPath: string,
  pathData: Set<PathData>
) => {
  const routeImports = new Set<string>();
  const routeOperations = new Set<string>();
  let routeCode = "";

  for (const path of Array.from(pathData)) {
    if (path.pathParams) {
      routeImports.add(
        importInterfaceForRouter(
          path.pathParams.type,
          `./${path.pathParams.path}`
        )
      );
    }
    if (path.queryParams) {
      routeImports.add(
        importInterfaceForRouter(
          path.queryParams.type,
          `./${path.queryParams.path}`
        )
      );
    }
    if (path.requestBody) {
      routeImports.add(
        importInterfaceForRouter(
          path.requestBody.type,
          `./${path.requestBody.path}`
        )
      );
    }
    if (path.responseBody) {
      routeImports.add(
        importInterfaceForRouter(
          path.responseBody.type,
          `./${path.responseBody.path}`
        )
      );
    }

    routeCode += routeTemplate({
      method: path.method,
      url: path.url,
      operationId: path.operationId,
      pathParamsType: path.pathParams?.type,
      queryParamsType: path.queryParams?.type,
      requestBodyType: path.requestBody?.type,
      responseBodyType: path.responseBody?.type,
    });

    routeOperations.add(
      registerOperationsTemplate({
        operationId: path.operationId,
        pathParamsType: path.pathParams?.type,
        queryParamsType: path.queryParams?.type,
        requestBodyType: path.requestBody?.type,
        responseBodyType: path.responseBody?.type,
      })
    );
  }

  const routerCode = routerTemplate(
    Array.from(routeImports).join("\n"),
    Array.from(routeOperations).join("\n"),
    routeCode
  );
  writeInterface(join(appPath, `router.ts`), routerCode);
};
