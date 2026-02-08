import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Dict, List

import psycopg

from db import get_connection, get_table_columns, pick_column, ensure_student
from main import COURSE_CATALOG, DEFAULT_PRIOR, sync_learning_path


DEMO_PROFILES: List[Dict[str, object]] = [
    {
        "student_id": "S-1001",
        "skills": {
            "6.EE.A.1": {"mastery": 0.35, "velocity": 0.02, "attempts": 3},
            "6.EE.A.3": {"mastery": 0.05, "velocity": 0.01, "attempts": 1},
            "7.RP.A.2": {"mastery": 0.0, "velocity": 0.0, "attempts": 0},
        },
    },
    {
        "student_id": "S-1002",
        "skills": {
            "6.EE.A.1": {"mastery": 0.7, "velocity": 0.05, "attempts": 8},
            "6.EE.A.3": {"mastery": 0.4, "velocity": 0.03, "attempts": 5},
            "7.RP.A.2": {"mastery": 0.2, "velocity": 0.02, "attempts": 2},
        },
    },
    {
        "student_id": "S-1003",
        "skills": {
            "6.EE.A.1": {"mastery": 1.0, "velocity": 0.0, "attempts": 14},
            "6.EE.A.3": {"mastery": 0.85, "velocity": 0.02, "attempts": 10},
            "7.RP.A.2": {"mastery": 0.6, "velocity": 0.03, "attempts": 7},
        },
    },
    {
        "student_id": "S-1004",
        "skills": {
            "6.EE.A.1": {"mastery": 1.0, "velocity": 0.0, "attempts": 16},
            "6.EE.A.3": {"mastery": 1.0, "velocity": 0.0, "attempts": 12},
            "7.RP.A.2": {"mastery": 0.9, "velocity": 0.01, "attempts": 9},
        },
    },
]

SUPABASE_URL_ENV = "SUPABASE_URL"
SUPABASE_SERVICE_ROLE_ENV = "SUPABASE_SERVICE_ROLE_KEY"


def _clamp(value: float) -> float:
    if value < 0.0:
        return 0.0
    if value > 1.0:
        return 1.0
    return float(value)


def create_auth_user(
    supabase_url: str, service_role_key: str, email: str, password: str
) -> str:
    endpoint = supabase_url.rstrip("/") + "/auth/v1/admin/users"
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {service_role_key}",
        "apikey": service_role_key,
    }
    req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read().decode("utf-8")
            return f"created ({response.status}) {body}"
    except urllib.error.HTTPError as exc:
        if exc.code == 409:
            return "exists"
        body = exc.read().decode("utf-8")
        return f"error ({exc.code}) {body}"
    except Exception as exc:
        return f"error ({exc})"


def upsert_bkt_state(
    conn: psycopg.Connection,
    student_id: str,
    skill_name: str,
    mastery: float,
    velocity: float,
    attempts: int,
) -> None:
    columns = get_table_columns(conn, "bkt_state")
    mastery_col = pick_column(columns, ("prior_skill_mastery", "prior_mastery", "mastery"))
    attempt_col = pick_column(columns, ("attempt_count", "attempts"))
    velocity_col = pick_column(columns, ("learning_velocity", "velocity"))
    if not mastery_col:
        raise RuntimeError("bkt_state table missing mastery column")

    now = datetime.now(timezone.utc)
    update_cols = [mastery_col]
    update_vals = [_clamp(mastery)]
    if attempt_col:
        update_cols.append(attempt_col)
        update_vals.append(int(attempts))
    if velocity_col:
        update_cols.append(velocity_col)
        update_vals.append(float(velocity))
    if "updated_at" in columns:
        update_cols.append("updated_at")
        update_vals.append(now)

    assignments = ", ".join([f"{col} = %s" for col in update_cols])
    update_query = (
        f"update public.bkt_state set {assignments} where student_id = %s and skill_name = %s"
    )
    with conn.cursor() as cur:
        cur.execute(update_query, update_vals + [student_id, skill_name])
        if cur.rowcount:
            return

    insert_cols = ["student_id", "skill_name", mastery_col]
    insert_vals = [student_id, skill_name, _clamp(mastery)]
    if attempt_col:
        insert_cols.append(attempt_col)
        insert_vals.append(int(attempts))
    if velocity_col:
        insert_cols.append(velocity_col)
        insert_vals.append(float(velocity))
    if "created_at" in columns:
        insert_cols.append("created_at")
        insert_vals.append(now)
    if "updated_at" in columns:
        insert_cols.append("updated_at")
        insert_vals.append(now)
    placeholders = ", ".join(["%s"] * len(insert_cols))
    insert_query = (
        f"insert into public.bkt_state ({', '.join(insert_cols)}) values ({placeholders})"
    )
    with conn.cursor() as cur:
        cur.execute(insert_query, insert_vals)


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed demo students with BKT profiles.")
    parser.add_argument(
        "--password",
        default=os.getenv("DEMO_STUDENT_PASSWORD", "Student123!"),
        help="Password for created auth users.",
    )
    parser.add_argument(
        "--skip-auth",
        action="store_true",
        help="Skip creating Supabase auth users.",
    )
    args = parser.parse_args()

    supabase_url = os.getenv(SUPABASE_URL_ENV, "")
    service_role_key = os.getenv(SUPABASE_SERVICE_ROLE_ENV, "")

    if not args.skip_auth:
        if not supabase_url or not service_role_key:
            print(
                "Auth users skipped: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to create auth users.",
                file=sys.stderr,
            )
        else:
            print("Creating Supabase auth users...")
            for profile in DEMO_PROFILES:
                student_id = str(profile["student_id"])
                email = f"{student_id}@student.local"
                result = create_auth_user(supabase_url, service_role_key, email, args.password)
                print(f"- {email}: {result}")

    conn = get_connection()
    if not conn:
        print("SUPABASE_DB_URL is not set.", file=sys.stderr)
        return 1

    try:
        with conn:
            for profile in DEMO_PROFILES:
                student_id = str(profile["student_id"])
                ensure_student(conn, student_id)

                skill_payloads = profile.get("skills", {})
                for skill_name in skill_payloads:
                    payload = skill_payloads[skill_name]
                    upsert_bkt_state(
                        conn,
                        student_id,
                        skill_name,
                        mastery=float(payload.get("mastery", DEFAULT_PRIOR)),
                        velocity=float(payload.get("velocity", 0.0)),
                        attempts=int(payload.get("attempts", 0)),
                    )

                for course in COURSE_CATALOG:
                    target_skill = course.get("target_skill")
                    if not target_skill or target_skill in skill_payloads:
                        continue
                    upsert_bkt_state(
                        conn,
                        student_id,
                        target_skill,
                        mastery=DEFAULT_PRIOR,
                        velocity=0.0,
                        attempts=0,
                    )

                sync_learning_path(conn, student_id)

        print("Seeded demo profiles:")
        for profile in DEMO_PROFILES:
            print(f"- {profile['student_id']}")
        return 0
    except psycopg.Error as exc:
        print(f"Database error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
