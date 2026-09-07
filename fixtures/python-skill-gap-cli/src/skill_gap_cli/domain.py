from typing import TypedDict


class ResumeData(TypedDict):
    skills: list[str]


class JobData(TypedDict):
    title: str
    skills: list[str]


class GapItem(TypedDict):
    skill: str
    frequency: int


class GapReport(TypedDict):
    job_count: int
    matched: list[str]
    missing: list[GapItem]


def canonical_skill(value: str, aliases: dict[str, str]) -> str:
    key = value.strip().casefold()
    if not key:
        return ""
    return aliases.get(key, key).strip().casefold()


def _normalized_skills(
    values: list[str], aliases: dict[str, str]
) -> set[str]:
    return {
        normalized
        for value in values
        if (normalized := canonical_skill(value, aliases))
    }


def analyze_skill_gaps(
    resume: ResumeData,
    jobs: list[JobData],
    aliases: dict[str, str],
) -> GapReport:
    resume_skills = _normalized_skills(resume["skills"], aliases)
    frequencies: dict[str, int] = {}

    for job in jobs:
        for skill in _normalized_skills(job["skills"], aliases):
            frequencies[skill] = frequencies.get(skill, 0) + 1

    matched = sorted(resume_skills.intersection(frequencies))
    missing = [
        {"skill": skill, "frequency": frequency}
        for skill, frequency in sorted(
            frequencies.items(), key=lambda item: (-item[1], item[0])
        )
        if skill not in resume_skills
    ]
    return {"job_count": len(jobs), "matched": matched, "missing": missing}
