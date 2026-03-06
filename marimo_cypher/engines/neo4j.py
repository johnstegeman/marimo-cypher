from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Optional

from marimo._sql.engines.types import QueryEngine
from marimo._types.ids import VariableName

LOGGER = logging.getLogger(__name__)

if TYPE_CHECKING:
    import neo4j


class Neo4jEngine(QueryEngine["neo4j.Driver | neo4j.Session"]):
    """Neo4j Cypher query engine for marimo."""

    def __init__(
        self,
        connection: "neo4j.Driver | neo4j.Session",
        engine_name: Optional[VariableName] = None,
    ) -> None:
        super().__init__(connection, engine_name)

    @property
    def source(self) -> str:
        return "neo4j"

    @property
    def dialect(self) -> str:
        return "cypher"

    @staticmethod
    def is_compatible(var: Any) -> bool:
        try:
            import neo4j
            return isinstance(var, (neo4j.Driver, neo4j.Session))
        except ImportError:
            return False

    def execute(self, query: str) -> Any:
        import neo4j

        connection = self._connection
        if isinstance(connection, neo4j.Driver):
            records, _, keys = connection.execute_query(query)
        elif isinstance(connection, neo4j.Session):
            result = connection.run(query)
            keys = result.keys()
            records = list(result)
        else:
            raise TypeError(
                f"Unsupported Neo4j connection type: {type(connection)}"
            )

        rows = [dict(zip(keys, record.values())) for record in records]

        try:
            import pandas as pd
            return pd.DataFrame(rows)
        except Exception:
            try:
                import polars as pl
                return pl.DataFrame(rows)
            except Exception:
                return rows

    def execute_raw(self, query: str) -> Any:
        """Execute a query and return raw neo4j result for graph visualization."""
        import neo4j

        connection = self._connection
        if isinstance(connection, neo4j.Driver):
            session = connection.session()
            return session.run(query)
        elif isinstance(connection, neo4j.Session):
            return connection.run(query)
        else:
            raise TypeError(
                f"Unsupported Neo4j connection type: {type(connection)}"
            )
