import logging
import os
import random
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from bkt import DEFAULT_BKT_PARAMS, update_mastery
from db import (
    ensure_student,
    fetch_skill_prior,
    filter_payload_for_table,
    get_connection,
    get_db_url,
    get_table_columns,
    pick_column,
)
from llm import generate_problem_with_llm

app = FastAPI(title="Adaptive Intelligent Tutoring System API")
logger = logging.getLogger("aits")

cors_origins = os.getenv("CORS_ORIGINS")
if cors_origins:
    origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
else:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_URL = get_db_url()
USE_DB = bool(DB_URL)

DEFAULT_PRIOR = float(os.getenv("DEFAULT_SKILL_PRIOR", "0.3"))

COURSE_UNLOCK_THRESHOLD = float(os.getenv("COURSE_UNLOCK_MASTERY", "1.0"))
MASTERY_SNAP_THRESHOLD = float(os.getenv("MASTERY_SNAP_THRESHOLD", "0.99"))
MAX_HINTS_PER_QUESTION = int(os.getenv("MAX_HINTS_PER_QUESTION", "3"))

COURSE_CATALOG = [
    {
        "id": "math-foundations",
        "title": "Math Foundations",
        "module": "Linear Equations",
        "summary": "Solve one-step and multi-step linear equations.",
        "parent_id": None,
        "target_skill": "6.EE.A.1",
        "sequence": 1,
        "assignment": {
            "name": "Linear Equations Skill Builder",
            "assignment_type": "Skill Builder",
            "problem_count": 12,
        },
    },
    {
        "id": "expressions-properties",
        "title": "Expressions & Properties",
        "module": "Combining Like Terms",
        "summary": "Simplify expressions with properties of operations.",
        "parent_id": "math-foundations",
        "target_skill": "6.EE.A.3",
        "sequence": 2,
        "assignment": {
            "name": "Expressions & Properties Practice",
            "assignment_type": "Problem Set",
            "problem_count": 15,
        },
    },
    {
        "id": "ratios-proportions",
        "title": "Ratios & Proportions",
        "module": "Unit Rates",
        "summary": "Use ratios to solve real-world problems.",
        "parent_id": "expressions-properties",
        "target_skill": "7.RP.A.2",
        "sequence": 3,
        "assignment": {
            "name": "Ratio Reasoning Problem Set",
            "assignment_type": "Problem Set",
            "problem_count": 18,
        },
    },
]

COURSE_BY_ID = {course["id"]: course for course in COURSE_CATALOG}

DEFAULT_COURSES = [
    {
        "id": course["id"],
        "title": course["title"],
        "module": course.get("module"),
        "progress": 0.0,
        "status": "Assigned" if not course.get("parent_id") else "Locked",
        "target_skill": course.get("target_skill"),
        "parent_id": course.get("parent_id"),
        "sequence": course.get("sequence"),
    }
    for course in COURSE_CATALOG
]

MEMORY_STATE: Dict[Tuple[str, str], Dict[str, Any]] = {}
INTERVENTION_STATE: Dict[Tuple[str, str], Dict[str, Any]] = {}


class SnapshotResponse(BaseModel):
    prior_skill_mastery: float
    learning_velocity: float
    attempt_count: int
    intervention_active: bool = False
    recovery_streak: int = 0


class AnswerPayload(BaseModel):
    student_id: str
    skill_name: str
    answer: Optional[str] = None
    correct: bool
    attempt_count: int = Field(ge=0)
    time_on_task: Optional[int] = Field(default=None, ge=0)
    hints_used: Optional[int] = Field(default=None, ge=0)


class ProblemRequest(BaseModel):
    student_id: Optional[str] = None
    skill_name: str
    zpd_status: Optional[str] = "challenge"


class ProblemResponse(BaseModel):
    prompt: str
    latex: str
    answer: str


class CourseItem(BaseModel):
    id: str
    title: str
    module: Optional[str] = None
    progress: float = 0.0
    status: Optional[str] = None
    target_skill: Optional[str] = None
    parent_id: Optional[str] = None
    sequence: Optional[int] = None


class AssignmentItem(BaseModel):
    id: str
    name: str
    assignment_type: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    problem_count: int = 0
    completion_rate: float = 0.0
    status: Optional[str] = None
    start_time: Optional[str] = None
    session_duration: Optional[str] = None


class OpikTracePayload(BaseModel):
    student_id: Optional[str] = None
    skill_name: Optional[str] = None
    time_on_task: Optional[int] = None
    attempt_count: Optional[int] = None
    hint_count: Optional[int] = None
    question: Optional[str] = None
    source: Optional[str] = None


def build_problem(skill_name: str, zpd_status: Optional[str]) -> ProblemResponse:
    status = (zpd_status or "challenge").lower()
    harder = status in {"stretch", "challenge"}
    if skill_name == "6.EE.A.1":
        if harder:
            a = random.randint(3, 6)
            x = random.randint(3, 9)
            b = random.randint(2, 9)
        else:
            a = random.randint(1, 3)
            x = random.randint(2, 6)
            b = random.randint(1, 6)
        c = a * x + b
        return ProblemResponse(
            prompt="Solve for x.",
            latex=f"{a}x + {b} = {c}",
            answer=str(x),
        )
    if skill_name == "7.RP.A.2":
        k = random.randint(2, 8)
        return ProblemResponse(
            prompt="Find the constant of proportionality.",
            latex=f"y = {k}x",
            answer=str(k),
        )
    x = random.randint(5, 15)
    b = random.randint(3, 10)
    c = x + b
    return ProblemResponse(
        prompt="Solve for x.",
        latex=f"x + {b} = {c}",
        answer=str(x),
    )


def derive_zpd_status(mastery: Optional[float], fallback: Optional[str]) -> str:
    if fallback:
        return fallback
    if mastery is None:
        return "challenge"
    if mastery < 0.6:
        return "support"
    if mastery < 0.85:
        return "challenge"
    return "stretch"


def clamp_mastery(value: Optional[float]) -> float:
    if value is None:
        return 0.0
    if value < 0.0:
        return 0.0
    if value > 1.0:
        return 1.0
    return float(value)


def ensure_courses_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            create table if not exists public.courses (
                id text primary key,
                title text not null,
                module text,
                summary text,
                parent_id text references public.courses(id),
                target_skill text,
                sequence int,
                created_at timestamptz default now()
            );
            """
        )
        cur.execute(
            """
            create table if not exists public.enrollments (
                student_id text not null references public.students(student_id),
                course_id text not null references public.courses(id),
                progress numeric default 0,
                status text,
                created_at timestamptz default now(),
                primary key (student_id, course_id)
            );
            """
        )
        cur.execute(
            """
            create table if not exists public.assignments (
                id text primary key,
                student_id text not null references public.students(student_id),
                course_id text references public.courses(id),
                title text not null,
                assignment_type text,
                skill_name text,
                problem_count integer default 0,
                completion_rate numeric default 0,
                status text,
                created_at timestamptz default now()
            );
            """
        )
        cur.execute(
            "create unique index if not exists assignments_student_course_idx on public.assignments(student_id, course_id);"
        )
        cur.execute("alter table public.courses add column if not exists module text;")
        cur.execute("alter table public.courses add column if not exists summary text;")
        cur.execute("alter table public.courses add column if not exists parent_id text;")
        cur.execute("alter table public.courses add column if not exists target_skill text;")
        cur.execute("alter table public.courses add column if not exists sequence int;")
        cur.execute("alter table public.enrollments add column if not exists progress numeric default 0;")
        cur.execute("alter table public.enrollments add column if not exists status text;")
        cur.execute("alter table public.assignments add column if not exists assignment_type text;")
        cur.execute("alter table public.assignments add column if not exists skill_name text;")
        cur.execute("alter table public.assignments add column if not exists problem_count integer default 0;")
        cur.execute("alter table public.assignments add column if not exists completion_rate numeric default 0;")
        cur.execute("alter table public.assignments add column if not exists status text;")


def seed_courses_for_student(conn: psycopg.Connection, student_id: str) -> None:
    with conn.cursor() as cur:
        for course in COURSE_CATALOG:
            cur.execute(
                """
                insert into public.courses (id, title, module, summary, parent_id, target_skill, sequence)
                values (%s, %s, %s, %s, %s, %s, %s)
                on conflict (id) do update set
                    title = excluded.title,
                    module = excluded.module,
                    summary = excluded.summary,
                    parent_id = excluded.parent_id,
                    target_skill = excluded.target_skill,
                    sequence = excluded.sequence
                """,
                (
                    course["id"],
                    course["title"],
                    course.get("module"),
                    course.get("summary"),
                    course.get("parent_id"),
                    course.get("target_skill"),
                    course.get("sequence"),
                ),
            )
        for course in COURSE_CATALOG:
            status = "Assigned" if not course.get("parent_id") else "Locked"
            cur.execute(
                """
                insert into public.enrollments (student_id, course_id, progress, status)
                values (%s, %s, %s, %s)
                on conflict (student_id, course_id) do nothing
                """,
                (student_id, course["id"], 0.0, status),
            )
            cur.execute(
                """
                update public.enrollments
                set status = %s
                where student_id = %s and course_id = %s and status is null
                """,
                (status, student_id, course["id"]),
            )
            cur.execute(
                """
                update public.enrollments
                set progress = 0
                where student_id = %s and course_id = %s and progress is null
                """,
                (student_id, course["id"]),
            )


def fetch_courses_db(conn: psycopg.Connection, student_id: str) -> List[CourseItem]:
    with conn.cursor() as cur:
        cur.execute(
            """
            select c.id,
                   c.title,
                   c.module,
                   c.target_skill,
                   c.parent_id,
                   c.sequence,
                   e.progress,
                   e.status
            from public.enrollments e
            join public.courses c on c.id = e.course_id
            where e.student_id = %s
            order by c.sequence nulls last, c.title
            """,
            (student_id,),
        )
        rows = cur.fetchall()
    courses: List[CourseItem] = []
    for row in rows:
        status = row.get("status")
        progress = float(row.get("progress") or 0.0)
        target_skill = row.get("target_skill")
        if status != "Locked":
            computed = fetch_mastery(conn, student_id, target_skill, DEFAULT_PRIOR)
            progress = computed
            if computed >= COURSE_UNLOCK_THRESHOLD:
                status = "Completed"
            elif computed > 0:
                status = "In Progress"
            elif not status:
                status = "Assigned"
        courses.append(
            CourseItem(
                id=row.get("id"),
                title=row.get("title"),
                module=row.get("module"),
                progress=progress,
                status=status,
                target_skill=target_skill,
                parent_id=row.get("parent_id"),
                sequence=row.get("sequence"),
            )
        )
    return courses


def fetch_mastery(
    conn: psycopg.Connection,
    student_id: str,
    skill_name: Optional[str],
    default_prior: float,
) -> float:
    if not skill_name:
        return default_prior
    columns = get_table_columns(conn, "bkt_state")
    mastery_col = pick_column(columns, ("prior_skill_mastery", "prior_mastery", "mastery"))
    if not mastery_col:
        return fetch_skill_prior(conn, skill_name, default_prior)
    with conn.cursor() as cur:
        cur.execute(
            f"select {mastery_col} from public.bkt_state where student_id = %s and skill_name = %s limit 1",
            (student_id, skill_name),
        )
        row = cur.fetchone()
    if row and row.get(mastery_col) is not None:
        return clamp_mastery(row.get(mastery_col))
    return fetch_skill_prior(conn, skill_name, default_prior)


def update_enrollment_progress(conn: psycopg.Connection, student_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            select e.course_id, e.status, c.target_skill, c.parent_id
            from public.enrollments e
            join public.courses c on c.id = e.course_id
            where e.student_id = %s
            """,
            (student_id,),
        )
        rows = cur.fetchall()

    for row in rows:
        status = row.get("status")
        if status == "Locked":
            continue
        course_id = row.get("course_id")
        target_skill = row.get("target_skill")
        mastery = fetch_mastery(conn, student_id, target_skill, DEFAULT_PRIOR)
        progress = clamp_mastery(mastery)
        next_status = status
        if progress >= COURSE_UNLOCK_THRESHOLD:
            next_status = "Completed"
        elif status in (None, "", "Assigned") and progress > 0:
            next_status = "In Progress"
        payload = {
            "student_id": student_id,
            "course_id": course_id,
            "progress": progress,
            "status": next_status,
        }
        update_record(conn, "enrollments", payload, ("student_id", "course_id"))


def unlock_courses_for_student(conn: psycopg.Connection, student_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            select e.course_id, e.status, parent.target_skill as parent_skill
            from public.enrollments e
            join public.courses c on c.id = e.course_id
            join public.courses parent on parent.id = c.parent_id
            where e.student_id = %s and c.parent_id is not null
            """,
            (student_id,),
        )
        rows = cur.fetchall()

    for row in rows:
        if row.get("status") != "Locked":
            continue
        parent_skill = row.get("parent_skill")
        mastery = fetch_mastery(conn, student_id, parent_skill, DEFAULT_PRIOR)
        if mastery >= COURSE_UNLOCK_THRESHOLD:
            payload = {
                "student_id": student_id,
                "course_id": row.get("course_id"),
                "status": "Assigned",
            }
            update_record(conn, "enrollments", payload, ("student_id", "course_id"))


def ensure_assignments_for_student(conn: psycopg.Connection, student_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            select e.course_id, e.status, e.progress, c.title, c.target_skill
            from public.enrollments e
            join public.courses c on c.id = e.course_id
            where e.student_id = %s and e.status != 'Locked'
            """,
            (student_id,),
        )
        rows = cur.fetchall()

    now = datetime.now(timezone.utc)
    for row in rows:
        course_id = row.get("course_id")
        course = COURSE_BY_ID.get(course_id, {})
        assignment_config = course.get("assignment", {})
        title = assignment_config.get("name") or f"{row.get('title')} Practice"
        assignment_payload = {
            "student_id": student_id,
            "course_id": course_id,
            "title": title,
            "assignment_type": assignment_config.get("assignment_type", "Practice"),
            "skill_name": row.get("target_skill"),
            "problem_count": assignment_config.get("problem_count", 10),
            "completion_rate": clamp_mastery(row.get("progress")),
            "status": row.get("status"),
        }
        with conn.cursor() as cur:
            cur.execute(
                """
                select id from public.assignments
                where student_id = %s and course_id = %s
                limit 1
                """,
                (student_id, course_id),
            )
            existing = cur.fetchone()
        if existing:
            update_record(conn, "assignments", assignment_payload, ("student_id", "course_id"))
            continue
        assignment_payload["id"] = str(uuid.uuid4())
        assignment_payload["created_at"] = now
        insert_record(conn, "assignments", assignment_payload)


def fetch_assignments_db(conn: psycopg.Connection, student_id: str) -> List[AssignmentItem]:
    with conn.cursor() as cur:
        cur.execute(
            """
            select a.id,
                   a.title,
                   a.assignment_type,
                   a.skill_name,
                   a.problem_count,
                   a.completion_rate,
                   a.status,
                   a.created_at
            from public.assignments a
            where a.student_id = %s
            order by a.created_at desc
            """,
            (student_id,),
        )
        rows = cur.fetchall()

    assignments: List[AssignmentItem] = []
    for row in rows:
        created_at = row.get("created_at")
        if isinstance(created_at, datetime):
            start_time = created_at.strftime("%Y-%m-%d %H:%M")
        else:
            start_time = str(created_at) if created_at else None
        assignments.append(
            AssignmentItem(
                id=row.get("id"),
                name=row.get("title"),
                assignment_type=row.get("assignment_type"),
                skills=[row.get("skill_name")] if row.get("skill_name") else [],
                problem_count=int(row.get("problem_count") or 0),
                completion_rate=float(row.get("completion_rate") or 0.0),
                status=row.get("status"),
                start_time=start_time,
                session_duration=None,
            )
        )
    return assignments


def sync_learning_path(conn: psycopg.Connection, student_id: str) -> None:
    ensure_courses_schema(conn)
    seed_courses_for_student(conn, student_id)
    update_enrollment_progress(conn, student_id)
    unlock_courses_for_student(conn, student_id)
    ensure_assignments_for_student(conn, student_id)


def insert_record(conn: psycopg.Connection, table: str, payload: Dict[str, Any]) -> None:
    data = filter_payload_for_table(conn, table, payload)
    if not data:
        return
    columns = list(data.keys())
    values = [data[col] for col in columns]
    placeholders = ", ".join(["%s"] * len(columns))
    query = f"insert into public.{table} ({', '.join(columns)}) values ({placeholders})"
    with conn.cursor() as cur:
        cur.execute(query, values)


def update_record(
    conn: psycopg.Connection,
    table: str,
    payload: Dict[str, Any],
    where_cols: Tuple[str, str],
) -> None:
    data = filter_payload_for_table(conn, table, payload)
    update_cols = [col for col in data if col not in where_cols]
    if not update_cols:
        return
    assignments = ", ".join([f"{col} = %s" for col in update_cols])
    where_clause = " and ".join([f"{col} = %s" for col in where_cols])
    values = [data[col] for col in update_cols] + [data[col] for col in where_cols]
    query = f"update public.{table} set {assignments} where {where_clause}"
    with conn.cursor() as cur:
        cur.execute(query, values)


def get_state_memory(student_id: str, skill_name: str) -> Dict[str, Any]:
    key = (student_id, skill_name)
    state = MEMORY_STATE.get(key)
    if not state:
        state = {
            "prior_skill_mastery": DEFAULT_PRIOR,
            "learning_velocity": 0.0,
            "attempt_count": 0,
        }
        MEMORY_STATE[key] = state
    return state


def get_intervention_state(student_id: str, skill_name: str) -> Dict[str, Any]:
    key = (student_id, skill_name)
    state = INTERVENTION_STATE.get(key)
    if not state:
        state = {"intervention_active": False, "recovery_streak": 0}
        INTERVENTION_STATE[key] = state
    return state


def get_state_db(student_id: str, skill_name: str) -> Dict[str, Any]:
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="SUPABASE_DB_URL not set")

    try:
        with conn:
            ensure_student(conn, student_id)
            columns = get_table_columns(conn, "bkt_state")
            mastery_col = pick_column(columns, ("prior_skill_mastery", "prior_mastery", "mastery"))
            attempt_col = pick_column(columns, ("attempt_count", "attempts"))
            velocity_col = pick_column(columns, ("learning_velocity", "velocity"))
            if not mastery_col:
                raise HTTPException(status_code=500, detail="bkt_state missing mastery column")

            with conn.cursor() as cur:
                cur.execute(
                    "select * from public.bkt_state where student_id = %s and skill_name = %s limit 1",
                    (student_id, skill_name),
                )
                row = cur.fetchone()

            if row:
                return {
                    "prior_skill_mastery": float(row.get(mastery_col) or DEFAULT_PRIOR),
                    "learning_velocity": float(row.get(velocity_col) or 0.0) if velocity_col else 0.0,
                    "attempt_count": int(row.get(attempt_col) or 0) if attempt_col else 0,
                }

            prior = fetch_skill_prior(conn, skill_name, DEFAULT_PRIOR)
            now = datetime.now(timezone.utc)
            insert_payload = {
                "student_id": student_id,
                "skill_name": skill_name,
                mastery_col: prior,
            }
            if attempt_col:
                insert_payload[attempt_col] = 0
            if velocity_col:
                insert_payload[velocity_col] = 0.0
            if "created_at" in columns:
                insert_payload["created_at"] = now
            if "updated_at" in columns:
                insert_payload["updated_at"] = now

            insert_record(conn, "bkt_state", insert_payload)

        return {
            "prior_skill_mastery": float(prior),
            "learning_velocity": 0.0,
            "attempt_count": 0,
        }
    except psycopg.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


def update_state_memory(payload: AnswerPayload) -> Dict[str, Any]:
    state = get_state_memory(payload.student_id, payload.skill_name)
    prior = state["prior_skill_mastery"]
    intervention = get_intervention_state(payload.student_id, payload.skill_name)
    active_before = intervention["intervention_active"]
    trigger_now = payload.attempt_count > 3
    active_for_update = active_before or trigger_now

    if active_for_update:
        next_mastery = prior
    else:
        next_mastery = update_mastery(prior, payload.correct, **DEFAULT_BKT_PARAMS)
        if next_mastery >= MASTERY_SNAP_THRESHOLD:
            next_mastery = 1.0
    velocity = next_mastery - prior

    if trigger_now and not active_before:
        intervention["intervention_active"] = True
        intervention["recovery_streak"] = 0
    elif active_before:
        hints_used = payload.hints_used
        used_max_hints = (
            hints_used is not None and hints_used >= MAX_HINTS_PER_QUESTION
        )
        if payload.correct and not used_max_hints:
            intervention["recovery_streak"] += 1
        else:
            intervention["recovery_streak"] = 0
        if intervention["recovery_streak"] >= 3:
            intervention["intervention_active"] = False
            intervention["recovery_streak"] = 0

    state.update(
        {
            "prior_skill_mastery": next_mastery,
            "learning_velocity": velocity,
            "attempt_count": payload.attempt_count,
        }
    )
    return {**state, **intervention}


def update_state_db(payload: AnswerPayload) -> Dict[str, Any]:
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="SUPABASE_DB_URL not set")

    try:
        with conn:
            ensure_student(conn, payload.student_id)
            columns = get_table_columns(conn, "bkt_state")
            mastery_col = pick_column(columns, ("prior_skill_mastery", "prior_mastery", "mastery"))
            attempt_col = pick_column(columns, ("attempt_count", "attempts"))
            velocity_col = pick_column(columns, ("learning_velocity", "velocity"))
            if not mastery_col:
                raise HTTPException(status_code=500, detail="bkt_state missing mastery column")

            with conn.cursor() as cur:
                cur.execute(
                    "select * from public.bkt_state where student_id = %s and skill_name = %s limit 1",
                    (payload.student_id, payload.skill_name),
                )
                row = cur.fetchone()

            prior = float(row.get(mastery_col) or DEFAULT_PRIOR) if row else fetch_skill_prior(
                conn, payload.skill_name, DEFAULT_PRIOR
            )

            intervention = get_intervention_state(payload.student_id, payload.skill_name)
            active_before = intervention["intervention_active"]
            trigger_now = payload.attempt_count > 3
            active_for_update = active_before or trigger_now

            if active_for_update:
                next_mastery = prior
            else:
                next_mastery = update_mastery(prior, payload.correct, **DEFAULT_BKT_PARAMS)
                if next_mastery >= MASTERY_SNAP_THRESHOLD:
                    next_mastery = 1.0
            velocity = next_mastery - prior
            next_attempt = payload.attempt_count
            now = datetime.now(timezone.utc)
            attempt_payload = {
                "student_id": payload.student_id,
                "skill_name": payload.skill_name,
                "answer": payload.answer,
                "attempt_count": payload.attempt_count,
                "time_on_task": payload.time_on_task,
                "hints_used": payload.hints_used,
                "correct": payload.correct,
                "created_at": now,
            }

            if row:
                update_payload = {
                    "student_id": payload.student_id,
                    "skill_name": payload.skill_name,
                    mastery_col: next_mastery,
                }
                if attempt_col:
                    update_payload[attempt_col] = next_attempt
                if velocity_col:
                    update_payload[velocity_col] = velocity
                if "updated_at" in columns:
                    update_payload["updated_at"] = now
                update_record(conn, "bkt_state", update_payload, ("student_id", "skill_name"))
            else:
                insert_payload = {
                    "student_id": payload.student_id,
                    "skill_name": payload.skill_name,
                    mastery_col: next_mastery,
                }
                if attempt_col:
                    insert_payload[attempt_col] = next_attempt
                if velocity_col:
                    insert_payload[velocity_col] = velocity
                if "created_at" in columns:
                    insert_payload["created_at"] = now
                if "updated_at" in columns:
                    insert_payload["updated_at"] = now
                insert_record(conn, "bkt_state", insert_payload)
            insert_record(conn, "attempts", attempt_payload)
            sync_learning_path(conn, payload.student_id)

        if trigger_now and not active_before:
            intervention["intervention_active"] = True
            intervention["recovery_streak"] = 0
        elif active_before:
            hints_used = payload.hints_used
            used_max_hints = (
                hints_used is not None and hints_used >= MAX_HINTS_PER_QUESTION
            )
            if payload.correct and not used_max_hints:
                intervention["recovery_streak"] += 1
            else:
                intervention["recovery_streak"] = 0
            if intervention["recovery_streak"] >= 3:
                intervention["intervention_active"] = False
                intervention["recovery_streak"] = 0

        return {
            "prior_skill_mastery": float(next_mastery),
            "learning_velocity": float(velocity),
            "attempt_count": int(next_attempt),
            "intervention_active": bool(intervention["intervention_active"]),
            "recovery_streak": int(intervention["recovery_streak"]),
        }
    except psycopg.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"status": "ok", "db_enabled": USE_DB}


@app.get("/courses", response_model=List[CourseItem])
def list_courses(student_id: str) -> List[CourseItem]:
    if USE_DB:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="SUPABASE_DB_URL not set")
        try:
            with conn:
                ensure_student(conn, student_id)
                sync_learning_path(conn, student_id)
                courses = fetch_courses_db(conn, student_id)
            if courses:
                return courses
        except psycopg.Error as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    return [CourseItem(**course) for course in DEFAULT_COURSES]


@app.get("/assignments", response_model=List[AssignmentItem])
def list_assignments(student_id: str) -> List[AssignmentItem]:
    if USE_DB:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="SUPABASE_DB_URL not set")
        try:
            with conn:
                ensure_student(conn, student_id)
                sync_learning_path(conn, student_id)
                assignments = fetch_assignments_db(conn, student_id)
            if assignments:
                return assignments
        except psycopg.Error as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    return []


@app.get("/bkt/snapshot", response_model=SnapshotResponse)
def bkt_snapshot(student_id: str, skill_name: str) -> SnapshotResponse:
    if USE_DB:
        state = get_state_db(student_id, skill_name)
    else:
        state = get_state_memory(student_id, skill_name)
    intervention = get_intervention_state(student_id, skill_name)
    return SnapshotResponse(**{**state, **intervention})


@app.post("/answers", response_model=SnapshotResponse)
def submit_answer(payload: AnswerPayload) -> SnapshotResponse:
    if USE_DB:
        state = update_state_db(payload)
    else:
        state = update_state_memory(payload)
    return SnapshotResponse(**state)


@app.post("/llm/problem", response_model=ProblemResponse)
def llm_problem(payload: ProblemRequest) -> ProblemResponse:
    mastery = None
    intervention = None
    if payload.student_id:
        if USE_DB:
            state = get_state_db(payload.student_id, payload.skill_name)
        else:
            state = get_state_memory(payload.student_id, payload.skill_name)
        mastery = state.get("prior_skill_mastery")
        intervention = get_intervention_state(payload.student_id, payload.skill_name)
    if mastery is None:
        mastery = DEFAULT_PRIOR

    zpd_status = derive_zpd_status(mastery, payload.zpd_status)
    if intervention and intervention.get("intervention_active"):
        zpd_status = "support"
    llm_problem_data = generate_problem_with_llm(
        skill_name=payload.skill_name,
        mastery=mastery,
        zpd_status=zpd_status,
    )
    if llm_problem_data:
        logger.info("llm.problem.generated", extra={"skill": payload.skill_name, "zpd": zpd_status})
        problem = ProblemResponse(**llm_problem_data)
    else:
        logger.info("llm.problem.fallback", extra={"skill": payload.skill_name, "zpd": zpd_status})
        problem = build_problem(payload.skill_name, zpd_status)
    if USE_DB:
        conn = get_connection()
        if conn:
            try:
                with conn:
                    now = datetime.now(timezone.utc)
                    problem_payload = {
                        "prompt": problem.prompt,
                        "answer": problem.answer,
                        "latex": problem.latex,
                        "skill_name": payload.skill_name,
                        "student_id": payload.student_id,
                        "zpd_status": zpd_status,
                        "created_at": now,
                    }
                    insert_record(conn, "problems", problem_payload)
            except psycopg.Error as exc:
                logger.warning("llm.problem.db_insert_failed", extra={"error": str(exc)})
    return problem


@app.post("/opik/trace")
def opik_trace(payload: OpikTracePayload) -> Dict[str, str]:
    if USE_DB:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="SUPABASE_DB_URL not set")
        try:
            with conn:
                now = datetime.now(timezone.utc)
                trace_payload = {
                    "student_id": payload.student_id,
                    "skill_name": payload.skill_name,
                    "time_on_task": payload.time_on_task,
                    "attempt_count": payload.attempt_count,
                    "hint_count": payload.hint_count,
                    "question": payload.question,
                    "source": payload.source,
                    "created_at": now,
                }
                insert_record(conn, "opik_traces", trace_payload)
        except psycopg.Error as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {exc}")
    return {"status": "ok"}
