import json

from .domain import GapReport


def render_json(report: GapReport) -> str:
    return json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def _markdown_cell(value: str) -> str:
    return value.replace("|", "\\|")


def render_markdown(report: GapReport) -> str:
    lines = [
        "# Skill Gap Report",
        "",
        f"Jobs analyzed: {report['job_count']}",
        "",
        "Matched: " + (", ".join(report["matched"]) or "None"),
        "",
        "| Missing skill | Frequency |",
        "| --- | ---: |",
    ]
    lines.extend(
        f"| {_markdown_cell(item['skill'])} | {item['frequency']} |"
        for item in report["missing"]
    )
    if not report["missing"]:
        lines.append("| None | 0 |")
    return "\n".join(lines) + "\n"
