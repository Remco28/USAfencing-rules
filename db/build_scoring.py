"""Validate reviewed scoring content against the shared USA source; export static data."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

def normalized(text):
    return re.sub(r"\s+", " ", text).strip()

def build():
    data = json.loads((ROOT / "db/scoring_cases.json").read_text())
    text = (ROOT / "build/rules.txt").read_text()
    # Printed headers are extraction artifacts, not rule wording.
    text = re.sub(r"USA Fencing Rules for Competition[^\n]*", "", text)
    articles = {}
    for match in re.finditer(r"^([tom]\.\d+)\s*\n(.*?)(?=^[tom]\.\d+\s*$|\Z)", text, re.M | re.S):
        articles[match[1]] = normalized(match[2])
    for ref, quote in data["sources"].items():
        base = re.match(r"[tom]\.\d+", ref).group()
        if normalized(quote) not in articles.get(base, ""):
            raise ValueError(f"Source excerpt does not match shared rulebook: {ref}")
    ids = set()
    for sort, case in enumerate(data["cases"]):
        if case["id"] in ids or not re.fullmatch(r"[a-z0-9-]+", case["id"]):
            raise ValueError("Invalid or duplicate case ID")
        ids.add(case["id"])
        if not case["weapons"] or set(case["weapons"]) - {"epee", "foil", "sabre"}:
            raise ValueError(f"Invalid weapon coverage: {case['id']}")
        for field in ("title", "summary", "conditions", "questions", "articles", "search_terms", "review_note"):
            if not case[field]:
                raise ValueError(f"Missing {field}: {case['id']}")
        if len(case["search_terms"]) != len(set(case["search_terms"])):
            raise ValueError(f"Duplicate search phrase: {case['id']}")
        if set(case["articles"]) - set(data["sources"]):
            raise ValueError(f"Missing source: {case['id']}")
        case["sort"] = sort
    data["official_url"] = "https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blt0f86b976c72458f2/690baa8337acae1b6b5ac0d3/2025-11_USA_Fencing_Rules.pdf"
    target = ROOT / "site/scoring/data/cases.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"Scoring: {len(ids)} situations, {len(data['sources'])} verified source excerpts")

if __name__ == "__main__":
    build()
