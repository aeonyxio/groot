import { extname, join } from "https://deno.land/std@0.114.0/path/win32.ts";
import { YAML } from "../../../deps.ts";
import { PathData } from "../../types/path-data.ts";
import { apiMethods, Specification } from "../../types/specification.ts";
import { capitalizeFirstLetter } from "../../util/casing.ts";
import { writeInterface } from "../../util/write-interface.ts";
import { createType } from "./create-dto.ts";
import { parsePath } from "./parse-path.ts";

const getFileContents = (path: string) => {
  const fileExt = extname(path).toLowerCase();
  const rawFileContents = Deno.readTextFileSync(path);
  if (fileExt === ".json") {
    return JSON.parse(rawFileContents);
  } else {
    return YAML.parse(rawFileContents);
  }
};

export const parseFiles = (
  appPath: string,
  filePaths: string[],
  tsImportSuffix: boolean
) => {
  const pathData = new Set<PathData>();

  for (const filePath of filePaths) {
    const fileExt = extname(filePath).toLowerCase();
    if (fileExt !== ".json" && fileExt !== ".yaml" && fileExt !== ".yml") {
      throw new Error("The files must be a json or yaml format.");
    }

    const specification = getFileContents(filePath) as Specification;

    if (specification.paths) {
      for (const url of Object.getOwnPropertyNames(specification.paths)) {
        for (const method of apiMethods) {
          const rawEndpoint = specification.paths?.[url][method];
          if (!rawEndpoint) {
            continue;
          }
          pathData.add(
            parsePath(appPath, url, method, rawEndpoint, tsImportSuffix)
          );
        }
      }
    }

    if (specification.components) {
      for (const schemaName of Object.getOwnPropertyNames(
        specification.components.definitions
      )) {
        const name = capitalizeFirstLetter(schemaName);
        const { code } = createType({
          name,
          schema: specification.components.definitions[schemaName],
          depth: 0,
          semiColon: true,
          importPathPrefix: ".",
          tsImportSuffix,
        });

        writeInterface(join(appPath, `interfaces/common/${name}.ts`), code);
      }
    }
  }

  return pathData;
};
