import { register } from "node:module";

const sourceUrl = import.meta.url;
const hooks = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return {
      url: new URL("../src/" + specifier.slice(2) + ".ts", ${JSON.stringify(sourceUrl)}).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
`;

register(`data:text/javascript,${encodeURIComponent(hooks)}`, sourceUrl);
