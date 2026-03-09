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

/**
 * Parse a `-- params: key=value, key2=expr` comment header into a binding map.
 * Values are arbitrary Python expressions; we split on commas that are followed
 * by an identifier= pattern to avoid splitting inside expressions.
 */
function parseCommentHeader(headerLine: string): Record<string, string> {
  const result: Record<string, string> = {};
  const content = headerLine.replace(/^--\s*params:\s*/i, "").trim();
  if (!content) return result;

  const entries = content.split(/,\s*(?=[a-zA-Z_][a-zA-Z0-9_]*=)/);
  for (const entry of entries) {
    const eqIdx = entry.indexOf("=");
    if (eqIdx > 0) {
      const key = entry.slice(0, eqIdx).trim();
      const value = entry.slice(eqIdx + 1).trim();
      if (key) result[key] = value;
    }
  }
  return result;
}

/**
 * Scan a Cypher query for $identifier patterns and return the unique param names.
 */
function detectAutoParams(query: string): string[] {
  const params = new Set<string>();
  const regex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = regex.exec(query)) !== null) {
    params.add(match[1]);
  }
  return [...params];
}

/**
 * Parse `parameters={...}` from the Python args string.
 * Keys are always double-quoted strings; values are Python expressions.
 * Only handles one level of braces (sufficient for variable names and attribute access).
 */
function parseParametersFromArgs(argsStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  const paramsMatch = argsStr.match(/parameters=\{([^}]*)\}/);
  if (!paramsMatch) return result;

  const inner = paramsMatch[1].trim();
  if (!inner) return result;

  // Split on comma followed by a double-quoted key
  const entries = inner.split(/,\s*(?=")/);
  for (const entry of entries) {
    const entryMatch = entry.match(/^"([^"]+)":\s*(.+)$/);
    if (entryMatch) {
      result[entryMatch[1]] = entryMatch[2].trim();
    }
  }
  return result;
}

export class CypherParser implements LanguageParser<CypherMetadata> {
  readonly type = "cypher";
  readonly defaultMetadata: CypherMetadata = {
    dataframeName: "_df",
    engine: "",
    showOutput: true,
    outputType: "dataframe",
  };

  get defaultCode(): string {
    return `${IMPORT_LINE}\n_df = ${IMPORT_ALIAS}.cypher(\n    """\n    MATCH (n) RETURN n LIMIT 25\n    """\n)`;
  }

  transformIn(pythonCode: string): ParseResult<CypherMetadata> {
    const metadata = { ...this.defaultMetadata };

    // Accept both plain and f-string for backward compatibility
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

      // Parse parameters and reconstruct comment header for non-trivial bindings
      const parameters = parseParametersFromArgs(argsStr);
      const overrides = Object.entries(parameters).filter(([k, v]) => v !== k);

      let displayCode = dedent(`\n${cypherString}\n`).trim();

      if (overrides.length > 0) {
        const headerEntries = overrides.map(([k, v]) => `${k}=${v}`).join(", ");
        displayCode = `-- params: ${headerEntries}\n${displayCode}`;
      }

      return {
        code: displayCode,
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

    // Parse explicit bindings from optional comment header
    const lines = code.split("\n");
    let explicitBindings: Record<string, string> = {};
    let queryLines = lines;

    const firstLine = lines[0]?.trim() ?? "";
    if (/^--\s*params:/i.test(firstLine)) {
      explicitBindings = parseCommentHeader(firstLine);
      queryLines = lines.slice(1);
    }

    const queryCode = queryLines.join("\n");

    // Auto-detect $param names not already covered by explicit bindings
    const autoParams = detectAutoParams(queryCode).filter(
      (p) => !(p in explicitBindings),
    );

    // Merge: explicit bindings take precedence, auto-bindings fill the rest
    const allBindings: Record<string, string> = { ...explicitBindings };
    for (const p of autoParams) {
      allBindings[p] = p; // param name == Python variable name
    }

    const assignStart = `${dataframeName} = ${IMPORT_ALIAS}.cypher(\n    """\n`;
    const escapedCode = queryCode.replaceAll('"""', String.raw`\"""`);

    const showOutputParam = showOutput ? "" : ",\n    output=False";
    const outputTypeParam =
      outputType === "visualization" ? ',\n    output_type="visualization"' : "";
    const engineParam = engine ? `,\n    engine=${engine}` : "";

    let parametersParam = "";
    if (Object.keys(allBindings).length > 0) {
      const entries = Object.entries(allBindings)
        .map(([k, v]) => `"${k}": ${v}`)
        .join(", ");
      parametersParam = `,\n    parameters={${entries}}`;
    }

    const end = `\n    """${showOutputParam}${outputTypeParam}${engineParam}${parametersParam}\n)`;
    const assignment =
      assignStart +
      escapedCode
        .split("\n")
        .map((l) => (l.trim() ? `    ${l}` : l))
        .join("\n") +
      end;

    const fullCode = `${IMPORT_LINE}\n${assignment}`;
    const offset = IMPORT_LINE.length + 1 + assignStart.length + 1;

    return { code: fullCode, offset };
  }

  isSupported(pythonCode: string): boolean {
    return pythonCode.includes(`${IMPORT_ALIAS}.cypher`);
  }
}
