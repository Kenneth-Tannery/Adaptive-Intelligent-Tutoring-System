from db import get_connection


def main() -> int:
    conn = get_connection()
    if not conn:
        print("SUPABASE_DB_URL not set.")
        return 1

    with conn:
        with conn.cursor() as cur:
            cur.execute("alter table public.skills add column if not exists skill_id_numeric integer;")
            cur.execute("select skill_name from public.skills order by skill_name;")
            skills = [row["skill_name"] for row in cur.fetchall()]
            for idx, name in enumerate(skills, start=1):
                cur.execute(
                    "update public.skills set skill_id_numeric = %s where skill_name = %s",
                    (idx, name),
                )
    print(f"Updated {len(skills)} skills with numeric ids.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
