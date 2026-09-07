import json

import pytest

from skill_gap_cli.cli import run
from skill_gap_cli.domain import analyze_skill_gaps
from skill_gap_cli.errors import InputError
from skill_gap_cli.parsers import parse_jobs_csv, parse_jobs_json, parse_resume_json
from skill_gap_cli.reporters import render_json, render_markdown


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ('{"skills": []}', {"skills": []}),
        ('{"skills": ["Python", "TypeScript"]}', {"skills": ["Python", "TypeScript"]}),
    ],
)
def test_parses_resume(value, expected):
    assert parse_resume_json(value) == expected


@pytest.mark.parametrize(
    "value",
    ["{", '{"skills": "Python"}', '{"skills": [], "unknown": true}'],
)
def test_rejects_malformed_resume(value):
    with pytest.raises(InputError):
        parse_resume_json(value)


def test_parses_json_and_csv_jobs_consistently():
    json_jobs = parse_jobs_json('[{"title":"FE","skills":["Python","TS"]}]')
    csv_jobs = parse_jobs_csv("title,skills\nFE,Python|TS\n")
    assert json_jobs == csv_jobs


def test_rejects_unknown_job_fields():
    with pytest.raises(InputError, match="unknown fields"):
        parse_jobs_json('[{"title":"FE","skills":[],"salary":1}]')


def test_normalizes_aliases_deduplicates_per_job_and_ranks_gaps():
    report = analyze_skill_gaps(
        {"skills": [" Python ", "TS"]},
        [
            {"title": "A", "skills": ["python", "JS", "js"]},
            {"title": "B", "skills": ["JavaScript", "CSS"]},
        ],
        {"js": "javascript", "ts": "typescript"},
    )
    assert report == {
        "job_count": 2,
        "matched": ["python"],
        "missing": [
            {"skill": "javascript", "frequency": 2},
            {"skill": "css", "frequency": 1},
        ],
    }


def test_empty_jobs_have_a_complete_empty_report():
    assert analyze_skill_gaps({"skills": []}, [], {}) == {
        "job_count": 0,
        "matched": [],
        "missing": [],
    }


def test_reports_are_deterministic_and_escape_markdown():
    report = {
        "job_count": 1,
        "matched": [],
        "missing": [{"skill": "ci|cd", "frequency": 1}],
    }
    assert json.loads(render_json(report)) == report
    assert "| ci\\|cd | 1 |" in render_markdown(report)
    assert render_markdown(report) == render_markdown(report)


def test_unicode_is_preserved():
    report = analyze_skill_gaps(
        {"skills": []},
        [{"title": "資料", "skills": ["資料工程"]}],
        {},
    )
    assert "資料工程" in render_json(report)


def test_cli_reads_files_and_renders_json(tmp_path, capsys):
    resume = tmp_path / "resume.json"
    jobs = tmp_path / "jobs.json"
    resume.write_text('{"skills":["Python"]}', encoding="utf-8")
    jobs.write_text('[{"title":"FE","skills":["Python","JS"]}]', encoding="utf-8")
    assert run([
        "--resume", str(resume),
        "--jobs", str(jobs),
        "--format", "json",
    ]) == 0
    assert json.loads(capsys.readouterr().out)["missing"] == [
        {"frequency": 1, "skill": "javascript"}
    ]


def test_cli_reports_invalid_utf8_and_missing_file(tmp_path, capsys):
    invalid = tmp_path / "resume.json"
    invalid.write_bytes(b"\xff")
    missing = tmp_path / "missing.json"
    assert run(["--resume", str(invalid), "--jobs", str(missing)]) == 2
    assert "utf-8" in capsys.readouterr().err.casefold()
