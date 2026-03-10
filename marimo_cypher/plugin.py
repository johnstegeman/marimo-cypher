from pathlib import Path

from marimo._plugins.core.cell_plugin import CellPlugin

from marimo_cypher.engines.neo4j import Neo4jEngine


def _bundle_paths() -> list[str]:
    """Resolve JS bundle path for both installed package and development layout."""
    pkg_dir = Path(__file__).parent
    # Installed: bundle is inside the package (included via wheel force-include)
    installed = pkg_dir / "static" / "index.js"
    if installed.is_file():
        return [str(installed)]
    # Development: bundle at repo root frontend/dist
    dev = pkg_dir.parent / "frontend" / "dist" / "index.js"
    if dev.is_file():
        return [str(dev)]
    return []


cypher_plugin = CellPlugin(
    name="Cypher",
    js_bundle_paths=_bundle_paths(),
    css_bundle_paths=[],
    engine_classes=[Neo4jEngine],
)
