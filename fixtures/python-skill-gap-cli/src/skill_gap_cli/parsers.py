import csv
import io
import json

from .domain import JobData, ResumeData
from .errors import InputError


def _string_list(value: object, field: str) -> list[str]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise InputError(f"{field} must be a list of strings")
    return value


def _object(value: object, allowed: set[str], source: str) -> dict[str, object]:
    if not isinstance(value, dict):
        raise InputError(f"{source} must be an object")
    unknown = set(value).difference(allowed)
    if unknown:
        raise InputError(f"{source} contains unknown fields: {', '.join(sorted(unknown))}")
    return value


def _load_json(text: str, source: str) -> object:
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        raise InputError(f"malformed JSON in {source}") from error


def parse_resume_json(text: str) -> ResumeData:
    data = _object(_load_json(text, "resume"), {"skills"}, "resume")
    if "skills" not in data:
        raise InputError("resume.skills is required")
    return {"skills": _string_list(data["skills"], "resume.skills")}


def parse_jobs_json(text: str) -> list[JobData]:
    raw = _load_json(text, "jobs")
    if not isinstance(raw, list):
        raise InputError("jobs must be an array")
    jobs: list[JobData] = []
    for index, value in enumerate(raw):
        data = _object(value, {"title", "skills"}, f"jobs[{index}]")
        if not isinstance(data.get("title"), str):
            raise InputError(f"jobs[{index}].title must be a string")
        jobs.append({
            "title": data["title"],
            "skills": _string_list(data.get("skills"), f"jobs[{index}].skills"),
        })
    return jobs


def parse_jobs_csv(text: str) -> list[JobData]:
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames != ["title", "skills"]:
        raise InputError("CSV columns must be exactly: title,skills")
    jobs: list[JobData] = []
    for index, row in enumerate(reader, start=2):
        title = row.get("title")
        skills = row.get("skills")
        if not title or skills is None:
            raise InputError(f"invalid CSV row {index}")
        jobs.append({
            "title": title,
            "skills": [part for part in skills.split("|")],
        })
    return jobs
