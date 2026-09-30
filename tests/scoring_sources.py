"""Reject bad source claims without altering the repository or downloading files."""
import copy
import importlib.util
import json
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("scoring_builder", root / "db/build_scoring.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
original = json.loads((root / "db/scoring_cases.json").read_text())
with tempfile.TemporaryDirectory(prefix="scoring-validation-") as directory:
    target = Path(directory)
    (target / "research").symlink_to(root / "research", target_is_directory=True)
    (target / "db").mkdir()
    builder.ROOT = target
    def run(data):
        (target / "db/scoring_cases.json").write_text(json.dumps(data))
        builder.build()
    run(original)
    assert len(json.loads((target / "site/scoring/data/cases.json").read_text())["cases"]) == 82
    for label, mutate in [
        ("empty source quote", lambda d: d["sources"].update({"t.56.7": ""})),
        ("fabricated rule quote", lambda d: d["sources"].update({"t.56.7": "All broken blades award a touch to the owner."})),
        ("fabricated domestic quote", lambda d: d["sources"].update({"USA protest timing": "A parent may appeal at any time after unhooking."})),
        ("wrong domestic page", lambda d: d["source_details"]["USA on-strip protest"].update({"page": 4})),
        ("missing case source", lambda d: d["cases"][0]["articles"].append("t.999")),
        ("cross-weapon related link", lambda d: d["cases"][2].update({"related_cases": ["sabre-guard-contact"]})),
        ("missing related case", lambda d: d["cases"][0].update({"related_cases": ["invented-case"]})),
    ]:
        data = copy.deepcopy(original)
        mutate(data)
        try:
            run(data)
        except ValueError:
            pass
        else:
            raise AssertionError(label)
print("Scoring sources: valid build and seven false-source/link rejection checks passed")
