import React from "react";
import type { CypherOutputType, CypherMetadata } from "./parser";

interface PluginPanelConnection {
  name: string;
  displayName: string;
  source: string;
}

interface CypherPanelProps {
  metadata: Record<string, unknown>;
  onChange: (metadata: Record<string, unknown>) => void;
  connections: PluginPanelConnection[];
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    display: "flex", gap: "12px", padding: "4px 8px",
    fontSize: "12px", alignItems: "center",
    fontFamily: "inherit",
  },
  label: { display: "flex", gap: "6px", alignItems: "center", userSelect: "none" },
  input: {
    fontSize: "12px", padding: "1px 4px", borderRadius: "3px",
    border: "1px solid var(--border-color)", background: "var(--background)",
    color: "inherit", width: "80px",
  },
  select: {
    fontSize: "12px", padding: "1px 4px", borderRadius: "3px",
    border: "1px solid var(--border-color)", background: "var(--background)",
    color: "inherit",
  },
};

export const CypherPanel: React.FC<CypherPanelProps> = ({ metadata, onChange, connections }) => {
  const m = metadata as CypherMetadata;
  const neo4jConnections = connections.filter((c) => c.source === "neo4j");

  const update = (patch: Partial<CypherMetadata>) => onChange({ ...m, ...patch });

  return (
    <div style={s.panel}>
      <label style={s.label}>
        <span>Output variable:</span>
        <input
          style={s.input}
          type="text"
          value={m.dataframeName}
          onChange={(e) => update({ dataframeName: e.target.value })}
          onBlur={(e) => {
            // normalize to valid identifier
            const name = e.target.value.replace(/[^a-zA-Z0-9_]/g, "_") || "_df";
            update({ dataframeName: name });
          }}
        />
      </label>
      <label style={s.label}>
        <span>Connection:</span>
        {neo4jConnections.length > 0 ? (
          <select
            style={s.select}
            value={m.engine}
            onChange={(e) => update({ engine: e.target.value })}
          >
            <option value="">Select…</option>
            {neo4jConnections.map((c) => (
              <option key={c.name} value={c.name}>
                {c.displayName || c.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            style={s.input}
            type="text"
            value={m.engine}
            placeholder="e.g. driver"
            onChange={(e) => update({ engine: e.target.value })}
          />
        )}
      </label>
      <label style={s.label}>
        <span>Output:</span>
        <select
          style={s.select}
          value={m.outputType}
          onChange={(e) => update({ outputType: e.target.value as CypherOutputType })}
        >
          <option value="dataframe">Dataframe</option>
          <option value="visualization">Visualization</option>
        </select>
      </label>
      <label style={s.label}>
        <input
          type="checkbox"
          checked={m.showOutput}
          onChange={(e) => update({ showOutput: e.target.checked })}
        />
        <span>Show output</span>
      </label>
    </div>
  );
};
