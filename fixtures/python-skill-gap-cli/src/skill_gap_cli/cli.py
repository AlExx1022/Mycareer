import argparse
import sys
from pathlib import Path
from collections.abc import Sequence

from .domain import analyze_skill_gaps
from .errors import InputError
from .parsers import parse_jobs_csv, parse_jobs_json, parse_resume_json
from .reporters import render_json, render_markdown


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Analyze resume skill gaps")
    parser.add_argument("--resume", required=True)
    parser.add_argument("--jobs", required=True)
    parser.add_argument("--format", choices=("json", "markdown"), default="markdown")
    return parser


def run(argv: Sequence[str]) -> int:
    args = build_parser().parse_args(argv)
    try:
        resume = parse_resume_json(Path(args.resume).read_text(encoding="utf-8"))
        jobs_text = Path(args.jobs).read_text(encoding="utf-8")
        jobs = parse_jobs_csv(jobs_text) if args.jobs.endswith(".csv") else parse_jobs_json(jobs_text)
        report = analyze_skill_gaps(resume, jobs, {"js": "javascript", "ts": "typescript"})
        output = render_json(report) if args.format == "json" else render_markdown(report)
    except (OSError, UnicodeError, InputError) as error:
        print(f"skill-gap: {error}", file=sys.stderr)
        return 2
    print(output, end="")
    return 0


def main() -> None:
    raise SystemExit(run(sys.argv[1:]))
