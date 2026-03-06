import type { FormatResult, LanguageParser, ParseResult } from "@marimo-team/smart-cells";
import dedent from "string-dedent";

export type CypherOutputType = "dataframe" | "visualization";

export interface CypherMetadata {
  dataframeName: string;
  engine: string;
  showOutput: boolean;
  outputType: CypherOutputType;
}

const IMPORT_ALIAS = "_marimo_cypher_plugin_";
const IMPORT_LINE = `import marimo_cypher as ${IMPORT_ALIAS}`;

export class CypherParser implements LanguageParser<CypherMetadata> {
  readonly type = "cypher";
  readonly defaultMetadata: CypherMetadata = {
    dataframeName: "_df",
    engine: "",
    showOutput: true,
    outputType: "dataframe",
  };

  get defaultCode(): string {
    return `${IMPORT_LINE}\n_df = ${IMPORT_ALIAS}.cypher(\n    f"""\n    MATCH (n) RETURN n LIMIT 25\n    """\n)`;
  }

  transformIn(pythonCode: string): ParseResult<CypherMetadata> {
    const metadata = { ...this.defaultMetadata };

    const match = pythonCode.match(
      /([a-zA-Z0-9_]+)\s*=\s*_marimo_cypher_plugin_\.cypher\(\s*f?"""([\s\S]*?)"""([\s\S]*?)\)/,
    );

    if (match) {
      metadata.dataframeName = match[1];
      const cypherString = match[2];
      const argsStr = match[3];

      const engineMatch = argsStr.match(/engine=([a-zA-Z0-9_.]+)/);
      if (engineMatch) metadata.engine = engineMatch[1];

      if (argsStr.includes("output=False")) metadata.showOutput = false;
      if (
        argsStr.includes('output_type="visualization"') ||
        argsStr.includes("output_type='visualization'")
      ) {
        metadata.outputType = "visualization";
      }

      return {
        code: dedent(`\n${cypherString}\n`).trim(),
        offset:
          match.index !== undefined
            ? match.index + match[0].indexOf('"""') + 3
            : 0,
        metadata,
      };
    }

    return { code: pythonCode, offset: 0, metadata };
  }

  transformOut(code: string, metadata: CypherMetadata): FormatResult {
    const { showOutput, engine, dataframeName, outputType } = metadata;
    const assignStart = `${dataframeName} = ${IMPORT_ALIAS}.cypher(\n    f"""\n`;
    const escapedCode = code.replaceAll('"""', String.raw`\"""`);

    const showOutputParam = showOutput ? "" : ",\n    output=False";
    const outputTypeParam =
      outputType === "visualization" ? ',\n    output_type="visualization"' : "";
    const engineParam = engine ? `,\n    engine=${engine}` : "";

    const end = `\n    """${showOutputParam}${outputTypeParam}${engineParam}\n)`;
    const assignment =
      assignStart +
      escapedCode
        .split("\n")
        .map((l) => (l.trim() ? `    ${l}` : l))
        .join("\n") +
      end;

    const fullCode = `${IMPORT_LINE}\n${assignment}`;
    // offset points into the query string, accounting for the import line + assignment prefix
    const offset = IMPORT_LINE.length + 1 + assignStart.length + 1;

    return { code: fullCode, offset };
  }

  isSupported(pythonCode: string): boolean {
    return pythonCode.includes(`${IMPORT_ALIAS}.cypher`);
  }
}
