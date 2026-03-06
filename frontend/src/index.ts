import { CypherLanguageAdapter } from "./language-adapter";
import { CypherPanel } from "./panel";
import { CypherParser } from "./parser";
import { Neo4jConnectionForm } from "./neo4j-connection-form";

const cellPluginRegistration = {
  type: "cypher",
  name: "Neo4j Cypher",
  languageAdapter: new CypherLanguageAdapter(),
  parser: new CypherParser(),
  panel: CypherPanel,
};

const connectionPluginRegistration = {
  id: "neo4j",
  name: "Neo4j",
  color: "#018BFF",
  form: Neo4jConnectionForm,
};

if (typeof window !== "undefined") {
  console.log("[marimo-cypher] plugin script loaded, window.marimo =", window.marimo);
  if (window.marimo?.registerCellPlugin) {
    // @ts-expect-error
    window.marimo.registerCellPlugin(cellPluginRegistration);
    console.log("[marimo-cypher] cell plugin registered successfully");
  } else {
    console.warn("[marimo-cypher] window.marimo.registerCellPlugin not found");
  }

  // @ts-expect-error
  if (window.marimo?.registerConnectionPlugin) {
    // @ts-expect-error
    window.marimo.registerConnectionPlugin(connectionPluginRegistration);
    console.log("[marimo-cypher] connection plugin registered successfully");
  } else {
    console.warn("[marimo-cypher] window.marimo.registerConnectionPlugin not found");
  }
}

export default { cellPluginRegistration, connectionPluginRegistration };
