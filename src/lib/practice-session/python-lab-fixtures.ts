import type {
  PracticeUserFiles,
  PracticeWorkspace,
} from "./workspace";

export type PythonLabFixture = {
  lessonId: string;
  title: string;
  workspace: PracticeWorkspace;
  validUserFiles: PracticeUserFiles;
  infiniteLoopUserFiles: PracticeUserFiles;
};

function fixture(
  lessonId: string,
  title: string,
  description: string,
  entryFile: string,
  code: string,
  tests: string,
  extraFiles: Array<{ path: string; code: string }> = [],
): PythonLabFixture {
  const starterFiles = [
    { path: entryFile, code },
    ...extraFiles,
  ];
  return {
    lessonId,
    title,
    workspace: {
      version: 2,
      description,
      entryFile,
      files: [
        ...starterFiles.map((file) => ({
          ...file,
          role: "starter" as const,
          readOnly: false,
        })),
        {
          path: `/test_${entryFile.slice(1)}`,
          code: tests,
          role: "test",
          readOnly: true,
        },
      ],
    },
    validUserFiles: Object.fromEntries(
      starterFiles.map(({ path, code: fileCode }) => [path, fileCode]),
    ),
    infiniteLoopUserFiles: Object.fromEntries(
      starterFiles.map(({ path, code: fileCode }) => [
        path,
        path === entryFile ? "while True:\n    pass\n" : fileCode,
      ]),
    ),
  };
}

const normalizerCode = `def _canonical(value, aliases):
    key = value.strip().casefold()
    if not key:
        return ""
    return aliases.get(key, key).strip().casefold()


def normalize_job_skills(jobs, aliases):
    frequencies = {}
    for skills in jobs:
        unique = {
            canonical
            for value in skills
            if (canonical := _canonical(value, aliases))
        }
        for skill in unique:
            frequencies[skill] = frequencies.get(skill, 0) + 1
    return [
        {"skill": skill, "frequency": frequency}
        for skill, frequency in sorted(
            frequencies.items(), key=lambda item: (-item[1], item[0])
        )
    ]
`;

const normalizerTests = `from job_skills import normalize_job_skills


def test_normalizes_aliases_and_case():
    result = normalize_job_skills([[" JS ", "javascript", "Python"]], {"js": "javascript"})
    assert result == [
        {"skill": "javascript", "frequency": 1},
        {"skill": "python", "frequency": 1},
    ]


def test_deduplicates_within_each_job():
    result = normalize_job_skills([["JS", "js"], ["js"]], {"js": "javascript"})
    assert result == [{"skill": "javascript", "frequency": 2}]


def test_ignores_blank_values_and_handles_empty_input():
    assert normalize_job_skills([[], [" "]], {}) == []


def test_sorts_frequency_then_name_deterministically():
    result = normalize_job_skills([["b", "a", "c"], ["c"]], {})
    assert result == [
        {"skill": "c", "frequency": 2},
        {"skill": "a", "frequency": 1},
        {"skill": "b", "frequency": 1},
    ]
`;

const lazyPipelineCode = `from functools import wraps


def traced_stage(name, metrics):
    def decorate(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            metrics(name)
            return function(*args, **kwargs)
        return wrapper
    return decorate


def build_pipeline(rows, metrics):
    @traced_stage("normalize", metrics)
    def normalize(source):
        for row in source:
            if not isinstance(row, dict) or not isinstance(row.get("skill"), str):
                raise ValueError("row.skill must be a string")
            skill = row["skill"].strip().casefold()
            if skill:
                yield {**row, "skill": skill}

    yield from normalize(rows)
`;

const lazyPipelineTests = `from lazy_pipeline import build_pipeline


def test_pipeline_is_lazy_until_iteration():
    consumed = []
    def source():
        consumed.append("read")
        yield {"skill": " Python "}
    pipeline = build_pipeline(source(), lambda _: None)
    assert consumed == []
    assert list(pipeline) == [{"skill": "python"}]
    assert consumed == ["read"]


def test_empty_iterator_stays_empty():
    assert list(build_pipeline(iter(()), lambda _: None)) == []


def test_invalid_row_fails_when_consumed():
    pipeline = build_pipeline(iter([{"skill": 3}]), lambda _: None)
    try:
        list(pipeline)
    except ValueError as error:
        assert str(error) == "row.skill must be a string"
    else:
        raise AssertionError("expected ValueError")


def test_metrics_are_injected_per_run():
    first = []
    second = []
    list(build_pipeline(iter([{"skill": "A"}]), first.append))
    list(build_pipeline(iter([{"skill": "B"}]), second.append))
    assert first == ["normalize"]
    assert second == ["normalize"]
`;

const capstoneCode = `from typing import TypedDict


class GapItem(TypedDict):
    skill: str
    frequency: int


class GapReport(TypedDict):
    job_count: int
    matched: list[str]
    missing: list[GapItem]


def _skills(value, aliases):
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ValueError("skills must be a list of strings")
    normalized = set()
    for item in value:
        key = item.strip().casefold()
        if key:
            normalized.add(aliases.get(key, key).strip().casefold())
    return normalized


def analyze_skill_gaps(resume, jobs, aliases) -> GapReport:
    if not isinstance(resume, dict) or set(resume) != {"skills"}:
        raise ValueError("invalid resume schema")
    resume_skills = _skills(resume["skills"], aliases)
    frequencies = {}
    for job in jobs:
        if not isinstance(job, dict) or set(job) != {"title", "skills"}:
            raise ValueError("invalid job schema")
        if not isinstance(job["title"], str):
            raise ValueError("job title must be a string")
        for skill in _skills(job["skills"], aliases):
            frequencies[skill] = frequencies.get(skill, 0) + 1
    return {
        "job_count": len(jobs),
        "matched": sorted(resume_skills & frequencies.keys()),
        "missing": [
            {"skill": skill, "frequency": frequency}
            for skill, frequency in sorted(
                frequencies.items(), key=lambda item: (-item[1], item[0])
            )
            if skill not in resume_skills
        ],
    }
`;

const capstoneTests = `from skill_gap import analyze_skill_gaps


def test_ranks_missing_skills_and_matches_resume():
    report = analyze_skill_gaps(
        {"skills": ["Python", "TS"]},
        [
            {"title": "A", "skills": ["Python", "JS", "js"]},
            {"title": "B", "skills": ["JavaScript", "CSS"]},
        ],
        {"js": "javascript", "ts": "typescript"},
    )
    assert report["matched"] == ["python"]
    assert report["missing"] == [
        {"skill": "javascript", "frequency": 2},
        {"skill": "css", "frequency": 1},
    ]


def test_empty_jobs_return_a_complete_report():
    assert analyze_skill_gaps({"skills": []}, [], {}) == {
        "job_count": 0, "matched": [], "missing": []
    }


def test_rejects_unknown_fields():
    try:
        analyze_skill_gaps({"skills": [], "extra": True}, [], {})
    except ValueError as error:
        assert str(error) == "invalid resume schema"
    else:
        raise AssertionError("expected ValueError")


def test_rejects_non_string_skill():
    try:
        analyze_skill_gaps({"skills": [3]}, [], {})
    except ValueError as error:
        assert str(error) == "skills must be a list of strings"
    else:
        raise AssertionError("expected ValueError")
`;

const cliRefactorCode = `import json


def run_cli(args, read_text, write_text):
    try:
        source = args["input"]
        target = args["output"]
        payload = json.loads(read_text(source))
        if not isinstance(payload, dict) or set(payload) != {"skills"}:
            raise ValueError("invalid input schema")
        skills = payload["skills"]
        if not isinstance(skills, list) or any(not isinstance(item, str) for item in skills):
            raise ValueError("skills must be strings")
        normalized = sorted({item.strip().casefold() for item in skills if item.strip()})
        write_text(target, json.dumps({"skills": normalized}, ensure_ascii=False))
        return 0
    except (KeyError, ValueError, json.JSONDecodeError, UnicodeError, OSError):
        return 2
`;

const cliRefactorTests = `from cli_refactor import run_cli


def test_writes_normalized_output_through_adapter():
    writes = {}
    code = run_cli(
        {"input": "in.json", "output": "out.json"},
        lambda _: '{"skills":[" Python ","python","TS"]}',
        writes.__setitem__,
    )
    assert code == 0
    assert writes == {"out.json": '{"skills": ["python", "ts"]}'}


def test_malformed_json_returns_nonzero_without_writing():
    writes = {}
    assert run_cli({"input": "in", "output": "out"}, lambda _: "{", writes.__setitem__) == 2
    assert writes == {}


def test_reader_error_returns_nonzero():
    def missing(_):
        raise FileNotFoundError("missing")
    assert run_cli({"input": "in", "output": "out"}, missing, lambda *_: None) == 2


def test_runs_do_not_share_output_state():
    first = {}
    second = {}
    args = {"input": "in", "output": "out"}
    run_cli(args, lambda _: '{"skills":[]}', first.__setitem__)
    run_cli(args, lambda _: '{"skills":["A"]}', second.__setitem__)
    assert first["out"] != second["out"]
`;

const codingLabCode = `def solve_skill_interview_case(items, window):
    if window <= 0 or window > len(items):
        if not items and window == 0:
            return []
        raise ValueError("window out of range")
    counts = {}
    best = {}
    for index, skill in enumerate(items):
        if index >= window:
            outgoing = items[index - window]
            counts[outgoing] -= 1
        counts[skill] = counts.get(skill, 0) + 1
        if index >= window - 1:
            best[skill] = max(best.get(skill, 0), counts[skill])
    return sorted(best.items(), key=lambda item: (-item[1], item[0]))
`;

const codingLabTests = `from coding_lab import solve_skill_interview_case


def test_tracks_best_frequency_in_a_sliding_window():
    assert solve_skill_interview_case(["js", "js", "ts", "js"], 2) == [
        ("js", 2), ("ts", 1)
    ]


def test_ties_sort_by_skill_name():
    assert solve_skill_interview_case(["b", "a"], 1) == [("a", 1), ("b", 1)]


def test_empty_input_contract():
    assert solve_skill_interview_case([], 0) == []


def test_rejects_out_of_range_window():
    for window in (-1, 0, 4):
        try:
            solve_skill_interview_case(["a", "b", "c"], window)
        except ValueError as error:
            assert str(error) == "window out of range"
        else:
            raise AssertionError("expected ValueError")
`;

export const PYTHON_LAB_FIXTURES: PythonLabFixture[] = [
  fixture(
    "py-job-skills-normalizer",
    "職缺技能資料正規化",
    "固定驗收解答：casefold、alias、單筆去重、frequency 與 deterministic sorting。",
    "/job_skills.py",
    normalizerCode,
    normalizerTests,
  ),
  fixture(
    "py-lazy-pipeline-lab",
    "惰性資料 Pipeline",
    "固定驗收解答：lazy consumption、例外時機、wraps 與 per-run metrics。",
    "/lazy_pipeline.py",
    lazyPipelineCode,
    lazyPipelineTests,
  ),
  fixture(
    "py-typed-cli-capstone",
    "技能差距分析 CLI Core",
    "固定驗收解答：runtime schema validation、normalization、frequency 與 gap ranking。",
    "/skill_gap.py",
    capstoneCode,
    capstoneTests,
  ),
  fixture(
    "py-cli-test-refactor-lab",
    "CLI Refactor 與 Boundary Tests",
    "固定驗收解答：注入 read/write adapter、pure transformation 與 exit code。",
    "/cli_refactor.py",
    cliRefactorCode,
    cliRefactorTests,
  ),
  fixture(
    "py-junior-coding-lab",
    "Junior 限時 Coding Lab",
    "固定驗收解答：sliding window frequency、deterministic sorting 與 boundary contract。",
    "/coding_lab.py",
    codingLabCode,
    codingLabTests,
  ),
];
