import { dirname } from "https://deno.land/std@0.156.0/path/mod.ts";
import { formatCode } from "./format-code.ts";

export const writeInterface = (path: string, code: string) => {
  Deno.mkdirSync(dirname(path), { recursive: true });
  Deno.writeTextFileSync(path, formatCode(code));
};
