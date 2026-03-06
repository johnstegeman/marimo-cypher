from pathlib import Path
from marimo._plugins.core.cell_plugin import CellPlugin
from marimo_cypher.engines.neo4j import Neo4jEngine

_DIST_DIR = Path(__file__).parent.parent / "frontend" / "dist"

cypher_plugin = CellPlugin(
    name="Cypher",
    js_bundle_paths=[str(_DIST_DIR / "index.js")],
    css_bundle_paths=[],
    engine_classes=[Neo4jEngine],
)
