import type {
  ArraySchema,
  ObjectSchema,
  Parameter,
  ReferenceSchema,
  Schema,
  StandardSchema,
} from "./specification.types.ts";

const typeMap = new Map<string, string>([
  ["integer", "number"],
  ["number", "number"],
  ["string", "string"],
  ["boolean", "boolean"],
]);

const buildDescription = (config: { description: string | undefined }) => {
  const contents: string[] = [];
  if (config.description) {
    contents.push(config.description);
  }
  if (contents.length) {
    return `
/**
${contents.map((line) => ` * ${line}`)}
 */
`;
  } else {
    return "";
  }
};

export const createParamType = ({
  name,
  parameters,
  importPathPrefix,
}: {
  name?: string;
  parameters: Parameter[];
  importPathPrefix: string;
}): {
  imports: Set<string>;
  code: string;
} => {
  let props = "";
  let importRes = new Set<string>();
  for (const param of parameters) {
    const { code, imports, description } = createType({
      schema: param.schema,
      depth: 1,
      semiColon: true,
      importPathPrefix,
    });
    importRes = new Set([...importRes, ...imports]);
    const optionalFlag = param.required ? "" : "?";
    if (description) {
      props += buildDescription({ description });
    }
    props += `${param.name}${optionalFlag}:${code}`;
  }
  const codeRes = `export type ${name} = {${props}}`;
  return { imports: importRes, code: codeRes };
};

export const createType = (config: {
  name?: string;
  schema: Schema;
  depth: number;
  semiColon: boolean;
  importPathPrefix: string;
}): {
  imports: Set<string>;
  code: string;
  description: string | undefined;
} => {
  let codeRes = "";
  let descriptionRes: string | undefined = undefined;
  const { name, depth, semiColon } = config;
  let importRes = new Set<string>();

  if ((config.schema as ReferenceSchema).$ref) {
    const schema = config.schema as ReferenceSchema;
    const referencedType = schema.$ref.replace(/^#\/components\/schemas\//, "");
    if (depth === 0) codeRes += `export type ${name} = `;
    codeRes += `${referencedType}`;
    importRes.add(
      `import {${referencedType}} from '${config.importPathPrefix}/${referencedType}.ts';`
    );
  } else if ((config.schema as ArraySchema).type === "array") {
    const schema = config.schema as ArraySchema;
    const { code, imports } = createType({
      schema: schema.items,
      depth: depth + 1,
      semiColon: false,
      importPathPrefix: config.importPathPrefix,
    });
    importRes = new Set([...importRes, ...imports]);
    if (depth === 0) codeRes += `export type ${name} = `;
    codeRes += `Array<${code}>`;
  } else if ((config.schema as ObjectSchema).type === "object") {
    const schema = config.schema as ObjectSchema;
    let props = "";
    for (const propName of Object.getOwnPropertyNames(schema.properties)) {
      const { code, imports, description } = createType({
        schema: schema.properties[propName],
        depth: depth + 1,
        semiColon: true,
        importPathPrefix: config.importPathPrefix,
      });
      importRes = new Set([...importRes, ...imports]);
      const optionalFlag = schema.required?.includes(propName) ? "" : "?";
      if (description) {
        props += buildDescription({ description });
      }
      props += `${propName}${optionalFlag}:${code}`;
    }
    if (depth === 0) codeRes += `export interface ${name} `;
    codeRes += `{${props}}`;
  } else {
    const schema = config.schema as StandardSchema;
    if (schema.description) {
      descriptionRes = schema.description;
    }
    if (depth === 0) codeRes += `export type ${name} = `;
    codeRes += `${typeMap.get(schema.type)}`;
  }
  if (semiColon) codeRes += ";";
  if (depth === 0) {
    let importsStr = "";
    importRes.forEach((imp) => (importsStr += imp));
    codeRes = `${importsStr}${codeRes}`;
  }
  return { imports: importRes, code: codeRes, description: descriptionRes };
};
