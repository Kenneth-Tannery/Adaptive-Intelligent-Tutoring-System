import os
from pathlib import Path

import psycopg

from db import get_db_url


def main() -> int:
    db_url = get_db_url()
    if not db_url:
        print("SUPABASE_DB_URL or DATABASE_URL not set.")
        return 1

    csv_path = Path(os.getenv("SKILL_PRIORS_CSV", r"C:\\Users\\tanne\\Downloads\\skill_priors.csv"))
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        return 1

    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select column_name
                from information_schema.columns
                where table_schema = 'public' and table_name = 'skills'
                """
            )
            columns = {row[0] for row in cur.fetchall()}
            if "prior_mastery" in columns:
                prior_col = "prior_mastery"
            elif "prior_skill_mastery" in columns:
                prior_col = "prior_skill_mastery"
            else:
                print("skills table missing prior_mastery column.")
                return 1

            cur.execute("truncate table public.skills;")
            with open(csv_path, "r", encoding="utf-8") as handle:
                cur.copy_expert(
                    f"copy public.skills(skill_name, {prior_col}) from stdin with (format csv, header true)",
                    handle,
                )
        conn.commit()

    print("Loaded skill priors into public.skills")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
