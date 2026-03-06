import React, { useState } from "react";

interface Neo4jConnectionValues {
  uri: string;
  username: string;
  password: string;
  database: string;
}

function isSecret(value: string): boolean {
  return value.startsWith("env:");
}

function unprefixSecret(value: string): string {
  return value.replace(/^env:/, "");
}

function resolveValue(
  varName: string,
  value: string | undefined,
  envKey: string,
): { envVarLine?: string; ref: string } {
  if (!value) {
    return {
      envVarLine: `_${varName} = os.environ.get("${envKey}")`,
      ref: `_${varName}`,
    };
  }
  if (isSecret(value)) {
    const key = unprefixSecret(value);
    return {
      envVarLine: `_${varName} = os.environ.get("${key}")`,
      ref: `_${varName}`,
    };
  }
  return { ref: `"${value}"` };
}

function generateNeo4jCode(values: Neo4jConnectionValues): string {
  const { envVarLine: uriVar, ref: uriRef } = resolveValue("uri", values.uri, "NEO4J_URI");
  const { envVarLine: userVar, ref: userRef } = resolveValue("username", values.username, "NEO4J_USERNAME");
  const { envVarLine: pwVar, ref: pwRef } = resolveValue("password", values.password, "NEO4J_PASSWORD");

  const envLines = [uriVar, userVar, pwVar].filter((v): v is string => v !== undefined);
  const needsOs = envLines.length > 0;

  const importLines = ["import neo4j"];
  if (needsOs) importLines.push("import os");

  const databaseArg = values.database ? `, database="${values.database}"` : "";
  const connectionCode = `driver = neo4j.GraphDatabase.driver(${uriRef}, auth=(${userRef}, ${pwRef})${databaseArg})`;

  const lines = [...importLines];
  if (envLines.length > 0) lines.push("", ...envLines);
  lines.push("", connectionCode);
  return lines.join("\n");
}

interface Props {
  onSubmit: () => void;
  onBack: () => void;
  insertCode: (code: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  marginBottom: "4px",
  color: "#374151",
};

const hintStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#9ca3af",
  marginTop: "2px",
};

export const Neo4jConnectionForm: React.FC<Props> = ({ onSubmit, onBack, insertCode }) => {
  const [values, setValues] = useState<Neo4jConnectionValues>({
    uri: "bolt://localhost:7687",
    username: "neo4j",
    password: "",
    database: "",
  });

  const set = (field: keyof Neo4jConnectionValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    insertCode(generateNeo4jCode(values));
    onSubmit();
  };

  const isValid = values.uri.trim() !== "" && values.username.trim() !== "";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={labelStyle}>URI</label>
        <input
          style={inputStyle}
          type="text"
          value={values.uri}
          onChange={set("uri")}
          placeholder="bolt://localhost:7687"
          required
        />
        <div style={hintStyle}>Use env: prefix to reference an environment variable (e.g. env:NEO4J_URI)</div>
      </div>
      <div>
        <label style={labelStyle}>Username</label>
        <input
          style={inputStyle}
          type="text"
          value={values.username}
          onChange={set("username")}
          placeholder="neo4j"
          required
        />
        <div style={hintStyle}>Use env: prefix to reference an environment variable (e.g. env:NEO4J_USERNAME)</div>
      </div>
      <div>
        <label style={labelStyle}>Password</label>
        <input
          style={inputStyle}
          type="password"
          value={values.password}
          onChange={set("password")}
          placeholder="password"
        />
        <div style={hintStyle}>Use env: prefix to reference an environment variable (e.g. env:NEO4J_PASSWORD)</div>
      </div>
      <div>
        <label style={labelStyle}>
          Database <span style={{ color: "#9ca3af" }}>(optional)</span>
        </label>
        <input
          style={inputStyle}
          type="text"
          value={values.database}
          onChange={set("database")}
          placeholder="neo4j (default)"
        />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "6px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            background: "white",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!isValid}
          style={{
            padding: "6px 14px",
            border: "none",
            borderRadius: "6px",
            background: isValid ? "#018BFF" : "#93c5fd",
            color: "white",
            cursor: isValid ? "pointer" : "not-allowed",
            fontSize: "14px",
          }}
        >
          Add
        </button>
      </div>
    </form>
  );
};
