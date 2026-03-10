import { CypherLanguageAdapter } from "./language-adapter";
import { CypherPanel } from "./panel";
import { CypherParser } from "./parser";
import { Neo4jConnectionForm } from "./neo4j-connection-form";

const cypherParser = new CypherParser();
const cellPluginRegistration = {
  type: "cypher",
  name: "Neo4j Cypher",
  languageAdapter: new CypherLanguageAdapter(cypherParser),
  parser: cypherParser,
  panel: CypherPanel,
};

const connectionPluginRegistration = {
  id: "neo4j",
  name: "Neo4j",
  color: "#018BFF",
  form: Neo4jConnectionForm,
};

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV === true;

if (typeof window !== "undefined") {
  if (window.marimo?.registerCellPlugin) {
    // @ts-expect-error
    window.marimo.registerCellPlugin(cellPluginRegistration);
    if (isDev) console.log("[marimo-cypher] cell plugin registered");
  } else if (isDev) {
    console.warn("[marimo-cypher] window.marimo.registerCellPlugin not found");
  }

  // @ts-expect-error
  if (window.marimo?.registerConnectionPlugin) {
    // @ts-expect-error
    window.marimo.registerConnectionPlugin(connectionPluginRegistration);
    if (isDev) console.log("[marimo-cypher] connection plugin registered");
  } else if (isDev) {
    console.warn("[marimo-cypher] window.marimo.registerConnectionPlugin not found");
  }
}

export default { cellPluginRegistration, connectionPluginRegistration };
