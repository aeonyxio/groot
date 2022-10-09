import { describe, it } from "https://deno.land/std@0.158.0/testing/bdd.ts";
import { clientUrlTemplate } from "./client-url-template.ts";
import { expect } from "https://cdn.skypack.dev/chai@4.3.4?dts";

describe("client-url-template", () => {
  it("should convert template", () => {
    const res = clientUrlTemplate("/post/:id/inner/:id2");
    expect(res).to.equal("/post/${params.id}/inner/${params.id2}");
  });
});
