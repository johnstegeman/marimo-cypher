from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, Optional

import marimo as mo

if TYPE_CHECKING:
    import neo4j

def cypher(
    query: str,
    *,
    output: bool = True,
    output_type: Literal["dataframe", "visualization"] = "dataframe",
    engine: Optional["neo4j.Driver | neo4j.Session"] = None,
) -> Any:
    """
    Execute a Cypher query against a Neo4j database.
    """
    if query is None or query.strip() == "":
        return None

    if engine is None:
        raise ValueError(
            "A Neo4j driver or session is required to execute Cypher queries. "
        )

    from marimo_cypher.engines.neo4j import Neo4jEngine

    if not Neo4jEngine.is_compatible(engine):
        raise ValueError(
            "Unsupported engine. Must be a neo4j.Driver or neo4j.Session. "
            "Install the neo4j driver with: pip install neo4j"
        )

    neo4j_engine = Neo4jEngine(connection=engine)

    if output_type == "visualization":
        from neo4j_viz.neo4j import from_neo4j

        raw_result = neo4j_engine.execute_raw(query)
        vg = from_neo4j(raw_result)

        if output:
            mo.output.replace(vg.render_widget())

        return vg

    df = neo4j_engine.execute(query)

    if df is None:
        return None

    if output:
        # Simplification: use public mo.ui.table instead of internal undocumented functions
        mo.output.replace(
            mo.ui.table(
                df,
                selection=None,
                pagination=True,
            )
        )

    return df
