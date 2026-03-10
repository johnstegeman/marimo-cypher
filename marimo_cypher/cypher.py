from __future__ import annotations

import html
import json
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
    parameters: Optional[dict] = None,
    viz_config: Optional[dict] = None,
    _output_var: str = "",
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

        raw_result = neo4j_engine.execute_raw(query, parameters)
        vg = from_neo4j(raw_result)

        if viz_config:
            _apply_viz_config(vg, viz_config)

        if output:
            widget = vg.render_widget(theme=mo.app_meta().theme)
            mo.output.replace(widget)

            # Append a hidden element carrying schema JSON so the style panel
            # can populate per-label / per-type color pickers automatically.
            schema = _extract_schema(vg)
            var_attr = f' data-mcy-var="{html.escape(_output_var)}"' if _output_var else ""
            schema_div = (
                f'<div hidden data-mcy-schema{var_attr} '
                f'data-schema="{html.escape(json.dumps(schema))}"></div>'
            )
            mo.output.append(mo.Html(schema_div))

        return widget

    df = neo4j_engine.execute(query, parameters)

    if df is None:
        return None

    if output:
        mo.output.replace(
            mo.ui.table(
                df,
                selection=None,
                pagination=True,
            )
        )

    return df


def _extract_schema(vg: Any) -> dict:
    """Extract labels, types, and property keys from a VisualizationGraph."""
    node_labels = sorted({
        label
        for node in vg.nodes
        for label in node.properties.get("labels", [])
    })
    rel_types = sorted({
        rel.properties["type"]
        for rel in vg.relationships
        if rel.properties.get("type")
    })
    node_props = sorted({
        k
        for node in vg.nodes
        for k in node.properties
        if not k.startswith("__") and k != "labels"
    })
    rel_props = sorted({
        k
        for rel in vg.relationships
        for k in rel.properties
        if not k.startswith("__") and k != "type"
    })
    return {
        "nodeLabels": node_labels,
        "relTypes": rel_types,
        "nodeProperties": node_props,
        "relProperties": rel_props,
    }


def _apply_viz_config(vg: Any, viz_config: dict) -> None:
    """Apply VizConfig settings from the style panel to a VisualizationGraph."""
    from neo4j_viz.colors import ColorSpace

    # Node caption: override default label-based caption with a property value
    if prop := viz_config.get("nodeCaptionProperty"):
        vg.set_node_captions(property=prop)

    # Per-label colors take priority over the generic nodeColorMode setting
    node_colors = viz_config.get("nodeColors")
    if node_colors and isinstance(node_colors, dict) and node_colors:
        vg.color_nodes(field="caption", colors=node_colors, color_space=ColorSpace.DISCRETE)
    elif node_color_mode := viz_config.get("nodeColorMode"):
        space = (
            ColorSpace.CONTINUOUS
            if viz_config.get("nodeColorContinuous") == "true"
            else ColorSpace.DISCRETE
        )
        if node_color_mode == "property":
            if prop := viz_config.get("nodeColorProperty", ""):
                vg.color_nodes(property=prop, color_space=space)
        else:
            # "label" — color by caption (from_neo4j sets caption = label name)
            vg.color_nodes(field="caption", color_space=space)

    # Node size
    if size_prop := viz_config.get("nodeSizeProperty"):
        vg.resize_nodes(property=size_prop)

    # Per-type relationship colors take priority over relColorMode
    rel_colors = viz_config.get("relColors")
    if rel_colors and isinstance(rel_colors, dict) and rel_colors:
        vg.color_relationships(field="caption", colors=rel_colors, color_space=ColorSpace.DISCRETE)
    elif rel_color_mode := viz_config.get("relColorMode"):
        space = (
            ColorSpace.CONTINUOUS
            if viz_config.get("relColorContinuous") == "true"
            else ColorSpace.DISCRETE
        )
        if rel_color_mode == "property":
            if prop := viz_config.get("relColorProperty", ""):
                vg.color_relationships(property=prop, color_space=space)
        else:
            # "type" — color by caption (from_neo4j sets caption = type name)
            vg.color_relationships(field="caption", color_space=space)

    # Relationship width
    if width_prop := viz_config.get("relWidthProperty"):
        vg.resize_relationships(property=width_prop)
