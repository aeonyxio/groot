import { extname, join } from "https://deno.land/std@0.114.0/path/win32.ts";
import { YAML } from "../../../deps.ts";
import { PathData } from "../../types/path-data.ts";
import {
  apiMethods,
  ObjectSchema,
  Schema,
  Specification,
  StandardSchema,
} from "../../types/specification.ts";
import { writeInterface } from "../../util/write-interface.ts";
import { createType } from "./create-dto.ts";
import { parsePath } from "./parse-path.ts";

const resolveReferences = (
  // deno-lint-ignore no-explicit-any
  schema: any,
  commonDefinitions: Map<string, Schema>,
) => {
  if (schema && typeof schema === "object") {
    if (schema.$ref) {
      const def = commonDefinitions.get(schema.$ref);
      if (!def) {
        throw new Error(`Could not find reference '${schema.$ref}'`);
      }
      delete schema.$ref;
      schema = {
        ...def,
        ...schema,
      };
    }
    for (const key of Object.keys(schema)) {
      resolveReferences(schema[key], commonDefinitions);
    }
  }
};

const getFileContents = (path: string) => {
  const fileExt = extname(path).toLowerCase();
  const rawFileContents = Deno.readTextFileSync(path);
  if (fileExt === ".json") {
    return JSON.parse(rawFileContents);
  } else {
    return YAML.parse(rawFileContents);
  }
};

const doArraysMatch = (array1: string[], array2: string[]) => {
  array1 = array1.sort();
  array2 = array2.sort();
  return (
    array1.length === array2.length &&
    array1.every((value, index) => value === array2[index])
  );
};

export const parseFiles = (
  appPath: string,
  filePaths: string[],
  tsImportSuffix: boolean,
) => {
  const pathData = new Map<string, PathData>();
  const commonDefinitionData = new Map<string, Schema>();

  // This is where we build typescript interfaces for everything
  for (const filePath of filePaths) {
    const fileExt = extname(filePath).toLowerCase();
    if (fileExt !== ".json" && fileExt !== ".yaml" && fileExt !== ".yml") {
      throw new Error("The files must be a json or yaml format.");
    }

    const specification = getFileContents(filePath) as Specification;

    if (specification.paths) {
      for (const url of Object.keys(specification.paths)) {
        for (const method of apiMethods) {
          const rawEndpoint = specification.paths?.[url][method];
          if (!rawEndpoint) {
            continue;
          }
          const pathId = `${method}#${url}`;
          if (commonDefinitionData.has(pathId)) {
            throw new Error("Paths should be unique (url/method).");
          } else {
            pathData.set(pathId, {
              raw: rawEndpoint,
              ...parsePath(appPath, url, method, rawEndpoint, tsImportSuffix),
              textResponseBody: false,
              fullyOptionalQueryParams: true,
            });
          }
        }
      }
    }

    if (specification.components) {
      for (
        const schemaName of Object.keys(
          specification.components.definitions,
        )
      ) {
        const { code } = createType({
          name: schemaName,
          schema: specification.components.definitions[schemaName],
          depth: 0,
          semiColon: true,
          importPathPrefix: ".",
          tsImportSuffix,
        });

        const ref = `${specification.components.referenceId}#${schemaName}`;
        if (commonDefinitionData.has(ref)) {
          throw new Error("Component names should be unique.");
        } else {
          commonDefinitionData.set(
            ref,
            specification.components.definitions[schemaName],
          );
        }

        writeInterface(
          join(appPath, `interfaces/common/${schemaName}.ts`),
          code,
        );
      }
    }
  }

  // Now that everything is loaded, connect the dots and set some final flags
  for (const path of pathData.values()) {
    resolveReferences(path.raw, commonDefinitionData);
    if ((path.raw.responseBody as StandardSchema)?.type === "string") {
      path.textResponseBody = true;
    }
    if ((path.raw.queryParams as ObjectSchema)?.properties) {
      if (!(path.raw.queryParams as ObjectSchema).required) {
        path.fullyOptionalQueryParams = true;
      } else {
        path.fullyOptionalQueryParams = !doArraysMatch(
          (path.raw.queryParams as ObjectSchema).required!,
          Object.keys((path.raw.queryParams as ObjectSchema).properties!),
        );
      }
    }
  }

  return pathData;
};
