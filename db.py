import os
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional, Set

import psycopg
from psycopg.rows import dict_row

from dotenv import load_dotenv

load_dotenv()

_TABLE_COLUMNS_CACHE: Dict[str, Set[str]] = {}


def normalize_db_url(db_url: str) -> str:
    if db_url.startswith("postgresql+psycopg://"):
        return "postgresql://" + db_url.split("postgresql+psycopg://", 1)[1]
    return db_url


def get_db_url() -> Optional[str]:
    db_url = (
        os.getenv("SUPABASE_DB_URL")
        or os.getenv("DATABASE_URL")
        or os.getenv("SUPABASE_DATABASE_URL")
    )
    if not db_url:
        return None
    return normalize_db_url(db_url)


def get_connection() -> Optional[psycopg.Connection]:
    db_url = get_db_url()
    if not db_url:
        return None
    return psycopg.connect(db_url, row_factory=dict_row)


def get_table_columns(conn: psycopg.Connection, table_name: str) -> Set[str]:
    if table_name in _TABLE_COLUMNS_CACHE:
        return _TABLE_COLUMNS_CACHE[table_name]
    with conn.cursor() as cur:
        cur.execute(
            """
            select column_name
            from information_schema.columns
            where table_schema = 'public' and table_name = %s
            """,
            (table_name,),
        )
        cols = {row["column_name"] for row in cur.fetchall()}
    _TABLE_COLUMNS_CACHE[table_name] = cols
    return cols


def pick_column(columns: Set[str], candidates: Iterable[str]) -> Optional[str]:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    return None


def filter_payload_for_table(
    conn: psycopg.Connection, table_name: str, payload: Dict[str, Any]
) -> Dict[str, Any]:
    columns = get_table_columns(conn, table_name)
    return {key: value for key, value in payload.items() if key in columns}


def fetch_skill_prior(
    conn: psycopg.Connection, skill_name: str, default: float = 0.3
) -> float:
    columns = get_table_columns(conn, "skills")
    prior_col = pick_column(columns, ("prior_mastery", "prior_skill_mastery", "prior"))
    if not prior_col:
        return default
    with conn.cursor() as cur:
        cur.execute(
            f"select {prior_col} from public.skills where skill_name = %s limit 1",
            (skill_name,),
        )
        row = cur.fetchone()
        if row and row.get(prior_col) is not None:
            return float(row[prior_col])
    return default

def ensure_student(conn: psycopg.Connection, student_id: str) -> None:
    columns = get_table_columns(conn, "students")
    if "student_id" not in columns:
        return
    insert_cols = ["student_id"]
    values = [student_id]
    if "created_at" in columns:
        insert_cols.append("created_at")
        values.append(datetime.now(timezone.utc))
    columns_sql = ", ".join(insert_cols)
    placeholders = ", ".join(["%s"] * len(values))
    query = (
        f"insert into public.students ({columns_sql}) values ({placeholders}) "
        "on conflict (student_id) do nothing"
    )
    with conn.cursor() as cur:
        cur.execute(query, values)

