import { acceptCompletion, autocompletion } from "@codemirror/autocomplete";
import { insertTab } from "@codemirror/commands";
import { sql } from "@codemirror/lang-sql";
import { linter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { CypherParser, type CypherOutputType, type CypherMetadata } from "./parser";

// We mock the marimo internal types since this is a decoupled plugin
type CellId = string;
type PlaceholderType = string;
type CompletionConfig = any;
type HotkeyProvider = any;
type LSPConfig = any;
interface LanguageAdapter<T> {
  type: string;
  defaultMetadata: T;
  defaultCode: string;
  transformIn(pythonCode: string): [string, number, T];
  transformOut(code: string, metadata: T): [string, number];
  isSupported(pythonCode: string): boolean;
  getExtension(
    cellId: CellId,
    completionConfig: CompletionConfig,
    hotkeys: HotkeyProvider,
    placeholderType: PlaceholderType,
    lspConfig: LSPConfig
  ): Extension[];
}

export class CypherLanguageAdapter implements LanguageAdapter<CypherMetadata> {
  private readonly parser: CypherParser;
  readonly type = "cypher";

  constructor(parser?: CypherParser) {
    this.parser = parser ?? new CypherParser();
  }

  get defaultMetadata(): CypherMetadata {
    return { ...this.parser.defaultMetadata };
  }

  get defaultCode(): string {
    return this.parser.defaultCode;
  }

  transformIn(pythonCode: string): [string, number, CypherMetadata] {
    const result = this.parser.transformIn(pythonCode);
    return [result.code, result.offset, result.metadata];
  }

  transformOut(code: string, metadata: CypherMetadata): [string, number] {
    const result = this.parser.transformOut(code, metadata);
    return [result.code, result.offset];
  }

  isSupported(pythonCode: string): boolean {
    return this.parser.isSupported(pythonCode);
  }

  getExtension(
    _cellId: CellId,
    _completionConfig: CompletionConfig,
    _hotkeys: HotkeyProvider,
    _placeholderType: PlaceholderType,
    lspConfig: LSPConfig
  ): Extension[] {
    const extensions: Extension[] = [
      sql(),
      keymap.of([
        {
          key: "Tab",
          run: (cm) => acceptCompletion(cm) || insertTab(cm),
          preventDefault: true,
        },
      ]),
      autocompletion({
        defaultKeymap: false,
        activateOnTyping: false,
        override: [],
      }),
    ];

    const cypherLinterEnabled = false;
    if (cypherLinterEnabled) {
      // extensions.push(cypherLinterExtension());
    }

    return extensions;
  }
}


