import React from "react";
import type { CypherOutputType, CypherMetadata, VizConfig } from "./parser";

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

interface Schema {
  nodeLabels: string[];
  relTypes: string[];
  nodeProperties: string[];
  relProperties: string[];
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = {
  outer: {
    fontFamily: "inherit",
    fontSize: "12px",
  } as React.CSSProperties,

  panel: {
    display: "flex", gap: "12px", padding: "4px 8px",
    fontSize: "12px", alignItems: "center", fontFamily: "inherit",
  } as React.CSSProperties,

  label: {
    display: "flex", gap: "6px", alignItems: "center",
    userSelect: "none",
  } as React.CSSProperties,

  input: {
    fontSize: "12px", padding: "1px 4px", borderRadius: "3px",
    border: "1px solid var(--border-color)", background: "var(--background)",
    color: "inherit", width: "80px",
  } as React.CSSProperties,

  select: {
    fontSize: "12px", padding: "1px 4px", borderRadius: "3px",
    border: "1px solid var(--border-color)", background: "var(--background)",
    color: "inherit",
  } as React.CSSProperties,

  styleSection: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0",
    borderTop: "1px solid var(--border-color)", padding: "8px 8px 6px",
  } as React.CSSProperties,

  styleColumnLeft: {
    padding: "0 10px 0 0",
    borderRight: "1px solid var(--border-color)",
  } as React.CSSProperties,

  styleColumn: {
    padding: "0 0 0 10px",
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: "10px", fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
    opacity: 0.5, marginBottom: "6px", display: "block",
  } as React.CSSProperties,

  row: {
    display: "flex", alignItems: "center",
    gap: "5px", marginBottom: "5px", minHeight: "20px",
  } as React.CSSProperties,

  rowLabel: {
    width: "48px", flexShrink: 0, opacity: 0.65, fontSize: "11px",
  } as React.CSSProperties,

  propInput: {
    fontSize: "11px", padding: "1px 4px", borderRadius: "3px",
    border: "1px solid var(--border-color)", background: "var(--background)",
    color: "inherit", width: "90px",
  } as React.CSSProperties,

  modeToggle: {
    display: "flex", border: "1px solid var(--border-color)",
    borderRadius: "3px", overflow: "hidden", flexShrink: 0,
  } as React.CSSProperties,

  continuousToggle: {
    display: "flex", alignItems: "center", gap: "3px",
    fontSize: "10px", opacity: 0.7, cursor: "pointer", userSelect: "none",
  } as React.CSSProperties,

  entityLabel: {
    fontSize: "11px", flex: 1, overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "90px",
  } as React.CSSProperties,

  colorDotWrap: {
    position: "relative" as const, width: "14px", height: "14px", flexShrink: 0,
  } as React.CSSProperties,

  colorPickerOverlay: {
    position: "absolute" as const, inset: 0, opacity: 0,
    width: "100%", height: "100%", cursor: "pointer", padding: 0, border: "none",
  } as React.CSSProperties,

  clearBtn: {
    fontSize: "10px", padding: "0 3px", borderRadius: "2px",
    border: "1px solid var(--border-color)", background: "var(--background)",
    color: "inherit", cursor: "pointer", lineHeight: "14px", opacity: 0.55,
  } as React.CSSProperties,

  addColorBtn: {
    fontSize: "10px", padding: "0 5px", borderRadius: "2px",
    border: "1px dashed var(--border-color)", background: "transparent",
    color: "inherit", cursor: "pointer", lineHeight: "14px", opacity: 0.5,
  } as React.CSSProperties,

  schemaBar: {
    gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "6px",
    paddingTop: "6px", marginTop: "2px",
    borderTop: "1px solid var(--border-color)",
    fontSize: "10px", opacity: 0.5,
  } as React.CSSProperties,

  refreshBtn: {
    fontSize: "11px", padding: "0 4px", borderRadius: "3px",
    border: "1px solid var(--border-color)", background: "var(--background)",
    color: "inherit", cursor: "pointer", lineHeight: "16px",
  } as React.CSSProperties,
};

const modeBtn = (active: boolean): React.CSSProperties => ({
  fontSize: "11px", padding: "1px 5px", border: "none", cursor: "pointer",
  background: active ? "var(--accent-color, #018BFF)" : "var(--background)",
  color: active ? "#fff" : "inherit",
  opacity: active ? 1 : 0.65,
});

const styleToggleStyle = (active: boolean): React.CSSProperties => ({
  display: "flex", alignItems: "center", justifyContent: "center",
  width: "22px", height: "18px", padding: "0", borderRadius: "3px",
  border: "1px solid var(--border-color)",
  background: active ? "var(--accent-color, #018BFF)" : "var(--background)",
  color: active ? "#fff" : "inherit",
  cursor: "pointer", marginLeft: "auto", flexShrink: 0,
});

const colorDot = (color: string): React.CSSProperties => ({
  width: "14px", height: "14px", borderRadius: "50%",
  background: color, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0,
});

// ── Icons ────────────────────────────────────────────────────────────────────

const SlidersIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <line x1="1" y1="2.5" x2="11" y2="2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    <line x1="1" y1="6"   x2="11" y2="6"   stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    <line x1="1" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    <circle cx="3.5" cy="2.5" r="1.5" fill="currentColor"/>
    <circle cx="7.5" cy="6"   r="1.5" fill="currentColor"/>
    <circle cx="4.5" cy="9.5" r="1.5" fill="currentColor"/>
  </svg>
);

// ── Sub-components ───────────────────────────────────────────────────────────

/**
 * A color swatch with a hidden <input type="color"> overlay.
 * Shows a "+" placeholder when no color is explicitly set.
 */
const ColorSwatch: React.FC<{
  color: string | undefined;
  onChange: (hex: string) => void;
  onClear: () => void;
}> = ({ color, onChange, onClear }) => {
  if (!color) {
    return (
      <button style={s.addColorBtn} title="Set custom color"
        onClick={() => onChange("#4e91e0")}>+</button>
    );
  }
  return (
    <>
      <div style={s.colorDotWrap} title="Click to change color">
        <div style={colorDot(color)} />
        <input type="color" value={color}
          onChange={(e) => onChange(e.target.value)}
          style={s.colorPickerOverlay} />
      </div>
      <button style={s.clearBtn} onClick={onClear} title="Reset to default color">×</button>
    </>
  );
};

/**
 * Phase-1 fallback: auto-color mode toggle (by label/type or by property)
 * with an optional property name input and continuous-scale checkbox.
 */
const ColorModeRow: React.FC<{
  label: string;
  modeLabel: [string, string];
  modeValues: [string, string];
  mode: string;
  onModeChange: (m: string) => void;
  property: string;
  onPropertyChange: (v: string) => void;
  continuous: string;
  onContinuousChange: (v: string) => void;
}> = ({ label, modeLabel, modeValues, mode, onModeChange, property, onPropertyChange, continuous, onContinuousChange }) => {
  const byAuto = mode === modeValues[0] || mode === "";
  return (
    <>
      <div style={s.row}>
        <span style={s.rowLabel}>{label}</span>
        <div style={s.modeToggle}>
          <button style={modeBtn(byAuto)} onClick={() => onModeChange(modeValues[0])}
            title={`Color by ${modeLabel[0]}`}>{modeLabel[0]}</button>
          <button style={modeBtn(!byAuto)} onClick={() => onModeChange(modeValues[1])}
            title="Color by a property value">prop</button>
        </div>
        {!byAuto && (
          <input style={s.propInput} type="text" placeholder="property"
            value={property} onChange={(e) => onPropertyChange(e.target.value)} />
        )}
      </div>
      {!byAuto && (
        <div style={{ ...s.row, paddingLeft: "53px" }}>
          <label style={s.continuousToggle}>
            <input type="checkbox" checked={continuous === "true"}
              onChange={(e) => onContinuousChange(e.target.checked ? "true" : "false")}
              style={{ margin: 0 }} />
            <span>continuous scale</span>
          </label>
        </div>
      )}
    </>
  );
};

// ── Main panel ───────────────────────────────────────────────────────────────

export const CypherPanel: React.FC<CypherPanelProps> = ({ metadata, onChange, connections }) => {
  const m = metadata as CypherMetadata;
  const [styleOpen, setStyleOpen] = React.useState(false);
  const [schema, setSchema] = React.useState<Schema | null>(null);
  const neo4jConnections = connections.filter((c) => c.source === "neo4j");

  const update = (patch: Partial<CypherMetadata>) => onChange({ ...m, ...patch });
  const updateViz = (patch: Partial<VizConfig>) =>
    update({ vizConfig: { ...(m.vizConfig ?? {}), ...patch } });
  const vc = m.vizConfig ?? {};

  // Read schema from the hidden <div data-mcy-schema> that Python appends to
  // the cell output after each visualization run.
  const readSchema = React.useCallback(() => {
    const varName = m.dataframeName;
    const el =
      document.querySelector<HTMLElement>(`[data-mcy-schema][data-mcy-var="${varName}"]`) ??
      document.querySelector<HTMLElement>("[data-mcy-schema]");
    if (el) {
      try { setSchema(JSON.parse(el.getAttribute("data-schema") ?? "{}")); } catch {}
    }
  }, [m.dataframeName]);

  // Watch for the schema element while the style panel is open.
  React.useEffect(() => {
    if (!styleOpen) return;
    readSchema();
    const observer = new MutationObserver(readSchema);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [styleOpen, readSchema]);

  const setNodeColor = (label: string, hex: string) =>
    updateViz({ nodeColors: { ...(vc.nodeColors ?? {}), [label]: hex } });
  const clearNodeColor = (label: string) => {
    const { [label]: _, ...rest } = vc.nodeColors ?? {};
    updateViz({ nodeColors: rest });
  };
  const setRelColor = (type: string, hex: string) =>
    updateViz({ relColors: { ...(vc.relColors ?? {}), [type]: hex } });
  const clearRelColor = (type: string) => {
    const { [type]: _, ...rest } = vc.relColors ?? {};
    updateViz({ relColors: rest });
  };

  const hasSchema = !!(schema && (schema.nodeLabels.length > 0 || schema.relTypes.length > 0));

  return (
    <div style={s.outer}>
      {/* ── Toolbar row ── */}
      <div style={s.panel}>
        <label style={s.label}>
          <span>Output variable:</span>
          <input style={s.input} type="text" value={m.dataframeName}
            onChange={(e) => update({ dataframeName: e.target.value })}
            onBlur={(e) => {
              const name = e.target.value.replace(/[^a-zA-Z0-9_]/g, "_") || "_df";
              update({ dataframeName: name });
            }} />
        </label>

        <label style={s.label}>
          <span>Connection:</span>
          {neo4jConnections.length > 0 ? (
            <select style={s.select} value={m.engine}
              onChange={(e) => update({ engine: e.target.value })}>
              <option value="">Select…</option>
              {neo4jConnections.map((c) => (
                <option key={c.name} value={c.name}>{c.displayName || c.name}</option>
              ))}
            </select>
          ) : (
            <input style={s.input} type="text" value={m.engine} placeholder="e.g. driver"
              onChange={(e) => update({ engine: e.target.value })} />
          )}
        </label>

        <label style={s.label}>
          <span>Output:</span>
          <select style={s.select} value={m.outputType}
            onChange={(e) => {
              const next = e.target.value as CypherOutputType;
              update({ outputType: next });
              if (next !== "visualization") setStyleOpen(false);
            }}>
            <option value="dataframe">Dataframe</option>
            <option value="visualization">Visualization</option>
          </select>
        </label>

        <label style={s.label}>
          <input type="checkbox" checked={m.showOutput}
            onChange={(e) => update({ showOutput: e.target.checked })} />
          <span>Show output</span>
        </label>

        {m.outputType === "visualization" && (
          <button style={styleToggleStyle(styleOpen)}
            onClick={() => setStyleOpen((o) => !o)}
            title="Style visualization">
            <SlidersIcon />
          </button>
        )}
      </div>

      {/* ── Style panel ── */}
      {m.outputType === "visualization" && styleOpen && (
        <div style={s.styleSection}>

          {/* Nodes column */}
          <div style={s.styleColumnLeft}>
            <span style={s.sectionTitle}>Nodes</span>

            <div style={s.row}>
              <span style={s.rowLabel}>Caption</span>
              <input style={s.propInput} type="text" placeholder="property name"
                value={vc.nodeCaptionProperty ?? ""}
                onChange={(e) => updateViz({ nodeCaptionProperty: e.target.value })}
                title="Show this property as the caption instead of the node label" />
            </div>

            {hasSchema ? (
              /* Per-label color pickers */
              <>
                <div style={{ ...s.row, marginBottom: "3px" }}>
                  <span style={s.rowLabel}>Color</span>
                  <span style={{ fontSize: "10px", opacity: 0.45 }}>per label</span>
                </div>
                {schema!.nodeLabels.map((label) => (
                  <div key={label} style={{ ...s.row, paddingLeft: "8px" }}>
                    <span style={s.entityLabel} title={label}>{label}</span>
                    <ColorSwatch
                      color={vc.nodeColors?.[label]}
                      onChange={(hex) => setNodeColor(label, hex)}
                      onClear={() => clearNodeColor(label)}
                    />
                  </div>
                ))}
              </>
            ) : (
              /* Phase-1 fallback: mode toggle */
              <ColorModeRow
                label="Color"
                modeLabel={["label", "prop"]}
                modeValues={["label", "property"]}
                mode={vc.nodeColorMode ?? "label"}
                onModeChange={(v) => updateViz({ nodeColorMode: v as "label" | "property" })}
                property={vc.nodeColorProperty ?? ""}
                onPropertyChange={(v) => updateViz({ nodeColorProperty: v })}
                continuous={vc.nodeColorContinuous ?? "false"}
                onContinuousChange={(v) => updateViz({ nodeColorContinuous: v })}
              />
            )}

            <div style={s.row}>
              <span style={s.rowLabel}>Size</span>
              <input style={s.propInput} type="text" placeholder="property name"
                value={vc.nodeSizeProperty ?? ""}
                onChange={(e) => updateViz({ nodeSizeProperty: e.target.value })}
                title="Scale node size by this numeric property" />
            </div>
          </div>

          {/* Relationships column */}
          <div style={s.styleColumn}>
            <span style={s.sectionTitle}>Relationships</span>

            {hasSchema ? (
              /* Per-type color pickers */
              <>
                <div style={{ ...s.row, marginBottom: "3px" }}>
                  <span style={s.rowLabel}>Color</span>
                  <span style={{ fontSize: "10px", opacity: 0.45 }}>per type</span>
                </div>
                {schema!.relTypes.map((type) => (
                  <div key={type} style={{ ...s.row, paddingLeft: "8px" }}>
                    <span style={s.entityLabel} title={type}>{type}</span>
                    <ColorSwatch
                      color={vc.relColors?.[type]}
                      onChange={(hex) => setRelColor(type, hex)}
                      onClear={() => clearRelColor(type)}
                    />
                  </div>
                ))}
              </>
            ) : (
              <ColorModeRow
                label="Color"
                modeLabel={["type", "prop"]}
                modeValues={["type", "property"]}
                mode={vc.relColorMode ?? "type"}
                onModeChange={(v) => updateViz({ relColorMode: v as "type" | "property" })}
                property={vc.relColorProperty ?? ""}
                onPropertyChange={(v) => updateViz({ relColorProperty: v })}
                continuous={vc.relColorContinuous ?? "false"}
                onContinuousChange={(v) => updateViz({ relColorContinuous: v })}
              />
            )}

            <div style={s.row}>
              <span style={s.rowLabel}>Width</span>
              <input style={s.propInput} type="text" placeholder="property name"
                value={vc.relWidthProperty ?? ""}
                onChange={(e) => updateViz({ relWidthProperty: e.target.value })}
                title="Scale relationship width by this numeric property" />
            </div>
          </div>

          {/* Schema status bar */}
          <div style={s.schemaBar}>
            <span>
              {hasSchema
                ? `${schema!.nodeLabels.length} label${schema!.nodeLabels.length !== 1 ? "s" : ""}, ${schema!.relTypes.length} type${schema!.relTypes.length !== 1 ? "s" : ""}`
                : "Run query to capture schema"}
            </span>
            <button style={s.refreshBtn} onClick={readSchema} title="Re-read schema from last query result">↺</button>
          </div>

        </div>
      )}
    </div>
  );
};
