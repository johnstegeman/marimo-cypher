# marimo-cypher

A [marimo](https://marimo.io) plugin that adds a Cypher cell type and Neo4j database connection for querying Neo4j graphs directly from your notebook.

## Installation

```bash
pip install marimo-cypher
```

## Usage

### Connecting to Neo4j

Create a connection in a Python cell using the neo4j driver:

```python
import neo4j

driver = neo4j.GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))
```

marimo will automatically detect the driver and make it available in the connection selector of any Cypher cell.

### Cypher cells

Add a Cypher cell from the cell type menu. The cell editor accepts Cypher directly. Use the toolbar to:

- **Output variable** — name of the Python variable the result is assigned to
- **Connection** — select which Neo4j driver or session to use
- **Output** — `Dataframe` (default) returns a pandas/polars DataFrame; `Visualization` renders an interactive graph using `neo4j-viz`
- **Show output** — toggle whether the result is displayed automatically below the cell

### Parameter binding

Cypher cells support binding Python variables from your notebook as query parameters. Parameters are passed to Neo4j natively (not interpolated into the query string), which is safe and enables query plan caching.

Cypher parameters use the `$param_name` syntax.

#### Default: auto-binding

Any `$param_name` reference in your query is automatically bound to a Python variable of the same name from the notebook scope. No extra syntax is needed.

```cypher
MATCH (n:Person {name: $name})
RETURN n LIMIT $limit
```

This generates the equivalent of:

```python
cypher(query, parameters={"name": name, "limit": limit}, engine=driver)
```

Both `name` and `limit` must be defined as variables in another cell of the notebook.

#### Override: `-- params:` comment header

When the Python variable name differs from the Cypher parameter name, or when you need to bind an expression (such as a UI element value), add a `-- params:` comment as the first line of the cell:

```cypher
-- params: name=name_input.value, limit=limit_slider.value
MATCH (n:Person {name: $name})
RETURN n LIMIT $limit
```

The format is:

```
-- params: cypher_param=python_expression, cypher_param2=python_expression2
```

Values on the right-hand side are arbitrary Python expressions — variable names, attribute access, literals, or anything that evaluates to a valid Neo4j parameter value.

#### Mixing auto-binding and overrides

You can mix both styles in the same cell. Any `$param` not listed in the `-- params:` header is auto-bound to the Python variable of the same name:

```cypher
-- params: name=name_input.value
MATCH (n:Person {name: $name})
RETURN n LIMIT $limit
```

Here `$name` uses the explicit override, and `$limit` is auto-bound to the Python variable `limit`.
