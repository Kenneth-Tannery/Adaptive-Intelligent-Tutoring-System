import json
import logging
import os
import re
from typing import Any, Dict, Optional

from openai import OpenAI

logger = logging.getLogger("aits")


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def generate_problem_with_llm(
    *, skill_name: str, mastery: float, zpd_status: str
) -> Optional[Dict[str, str]]:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        return None

    model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

    system_prompt = (
        "You are a math tutor. Generate ONE practice problem for the given skill. "
        "Return ONLY valid JSON with keys: prompt, latex, answer. "
        "The answer must be a short string (number or short expression)."
    )

    user_prompt = f"""Skill: {skill_name}
Mastery (0-1): {mastery:.2f}
ZPD: {zpd_status}
Target the most common misconception for this skill and keep the problem concise."""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
        )
    except Exception as exc:
        logger.warning("llm.problem.call_failed", extra={"error": str(exc)})
        return None

    content = response.choices[0].message.content.strip()
    data = _extract_json(content)
    if not data:
        return None

    prompt = str(data.get("prompt", "")).strip()
    latex = str(data.get("latex", "")).strip()
    answer = str(data.get("answer", "")).strip()
    if not prompt or not latex or not answer:
        return None

    return {"prompt": prompt, "latex": latex, "answer": answer}
