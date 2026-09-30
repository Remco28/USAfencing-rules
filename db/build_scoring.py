"""Validate reviewed scoring content against the shared USA source; export static data."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

def normalized(text):
    return re.sub(r"\s+", " ", text).strip()

def build():
    data = json.loads((ROOT / "db/scoring_cases.json").read_text())
    catalog = {s["id"]: s for s in json.loads((ROOT / "research/sources.json").read_text())["sources"]}
    records = json.loads((ROOT / "research/article-index.json").read_text())["articles"]
    raw = (ROOT / catalog["usa-rules-2025-11"]["extracted_path"]).read_text().split("\n")
    articles = {r["ref"]: normalized(re.sub(r"USA Fencing Rules for Competition[^\n]*", "", "\n".join(raw[r["line_start"]-1:r["line_end"]]))) for r in records if r["source"] == "usa-rules-2025-11"}
    for ref, quote in data["sources"].items():
        if not isinstance(quote, str) or not normalized(quote):
            raise ValueError(f"Empty source excerpt: {ref}")
        detail = data.get("source_details", {}).get(ref)
        if detail:
            source = catalog[detail["source"]]
            raw_source = (ROOT / source["extracted_path"]).read_text()
            page = raw_source.split("\f")[detail["page"]-1] if "page" in detail else raw_source
            if "column_start" in detail:
                page = "\n".join(line[detail["column_start"]:detail.get("column_end")] for line in page.split("\n"))
            page = re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", page)
            body = normalized(page)
            detail["authority"] = source["authority"]
            detail["title"] = source["title"] + " · " + source["version"]
            detail["url"] = source["url"] + ("#page=" + str(detail["page"]) if "page" in detail else "")
        else:
            match = re.match(r"[tom]\.\d+", ref)
            body = articles.get(match.group() if match else ref, "")
        if normalized(quote) not in body:
            raise ValueError(f"Source excerpt does not match pinned document: {ref}")
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
    for case in data["cases"]:
        for link in case.get("companion_links", []):
            if link.get("href") not in {"../#/learn", "../#/lookup", "../#/dispute"} or not link.get("title"):
                raise ValueError("Invalid companion link")
        for target in case.get("related_cases", []):
            other = next((c for c in data["cases"] if c["id"] == target), None)
            if other is None or not set(case["weapons"]) & set(other["weapons"]):
                raise ValueError(f"Invalid related situation: {case['id']} -> {target}")
    topics = json.loads((ROOT / "research/scoring/topics.json").read_text())["topics"]
    by_id = {case["id"]: case for case in data["cases"]}
    data["coverage"] = []
    for topic in topics:
        coverage = topic["coverage"]
        if coverage["level"] not in {"bounded", "partial", "deferred"}:
            raise ValueError("Invalid coverage level")
        for case_id in coverage["case_ids"]:
            if case_id not in by_id:
                raise ValueError(f"Missing coverage case: {topic['id']} {case_id}")
        for weapon in topic["weapons"]:
            if coverage["level"] != "deferred" and not coverage.get("route") and not any(weapon in by_id[id]["weapons"] for id in coverage["case_ids"]):
                raise ValueError(f"Coverage weapon mismatch: {topic['id']} {weapon}")
        data["coverage"].append(dict(id=topic["id"],title=topic["title"],weapons=topic["weapons"],**coverage))
    data["official_url"] = "https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blt0f86b976c72458f2/690baa8337acae1b6b5ac0d3/2025-11_USA_Fencing_Rules.pdf"
    target = ROOT / "site/scoring/data/cases.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"Scoring: {len(ids)} situations, {len(data['sources'])} verified source excerpts")

if __name__ == "__main__":
    build()
