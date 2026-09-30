import importlib.util
from pathlib import Path
root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("builder", root / "db/build_db.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
articles, spans, order = builder.parse_rules_articles(builder.RULES_TEXT)
assert len([ref for ref in articles if ref.startswith("t.") and ref.count(".") == 1]) == 178
assert "two weapons" in articles["t.117"]
assert "two bodycords" in articles["t.117"]
assert spans["t.117"][0] == 2217
assert "Placing weapon on conductive strip" not in articles["t.117"]
print("Article boundaries: complete technical coverage and t.117 table-citation regression passed")
