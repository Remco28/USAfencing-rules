"""Offline source integrity, article/page extraction and cited scoring inventory.

No downloads, network or model calls. Run after reviewing a pinned source version.
--check verifies the generated inventory without changing files.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
RESEARCH = ROOT / "research"

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def article_records(source):
    path = ROOT / source["extracted_path"]
    raw = path.read_text()
    lines = raw.split("\n")
    offset = 0
    pages = []
    for number, page in enumerate(raw.split("\f"), 1):
        pages.append({"source":source["id"], "pdf_page":number, "text":page})
    headings = []
    seen_technical = set()
    seen_international = set()
    start_page = {"fie-technical-2026-08": 5, "fie-material-2026-08": 7, "fie-organisation-2026-08": 4}.get(source["id"], 1)
    for i,line in enumerate(lines):
        # USA headings are standalone; FIE m./o. headings can begin an inline body.
        pattern = r"^[ \t\f]*([tom]\.\d+(?:\.\d+)*[a-z]?)[ \t]*$" if source["id"].startswith("usa-") else r"^[ \t\f]*([tom]\.\d+)(?:[ \t. …]|$)"
        m = re.match(pattern, line)
        if m:
            ref=m[1]
            page=raw[:offset].count("\f")+1
            indent=len(line.replace("\f", ""))-len(line.replace("\f", "").lstrip())
            if page<start_page or (source["id"] in ["fie-technical-2026-08","fie-organisation-2026-08"] and indent>4):
                offset += len(line)+1
                continue
            if source["id"]=="fie-material-2026-08" and i>1900 and "ANNEXE A TO THE MATERIAL RULES" in "\n".join(lines[1900:i]):
                offset += len(line)+1
                continue
            if source['id'].startswith('fie-'):
                expected={'fie-technical-2026-08':'t.','fie-material-2026-08':'m.','fie-organisation-2026-08':'o.'}[source['id']]
                if not ref.startswith(expected) or ref in seen_international:
                    offset += len(line)+1
                    continue
                seen_international.add(ref)
            # A t.117 table citation is not a second technical article.
            if ref.startswith('t.') and ref in seen_technical:
                offset += len(line)+1
                continue
            if ref.startswith('t.'):
                seen_technical.add(ref)
            headings.append((ref, i, offset+m.start(1)))
        offset += len(line) + 1
    records = []
    occurrences = {}
    for j,(ref,start,char) in enumerate(headings):
        end = headings[j+1][1] if j+1<len(headings) else len(lines)
        # Material appendices do not belong to the last numbered m. article.
        if ref == "m.60":
            for k in range(start+1,end):
                if "Appendix A to the Material Rules" in lines[k] or "ANNEXE A TO THE MATERIAL RULES" in lines[k]:
                    end=k;break
        text="\n".join(lines[start:end])
        end_char=sum(len(line)+1 for line in lines[:end])
        body=raw[char:end_char].rstrip()
        printed_ref=ref
        occurrences[ref]=occurrences.get(ref,0)+1
        if occurrences[ref]>1:
            ref=ref+'--'+str(occurrences[ref])
        records.append(dict(source=source["id"], ref=ref, printed_ref=printed_ref, line_start=start+1, line_end=end, pdf_page_start=raw[:char].count("\f")+1, pdf_page_end=raw[:char+len(body)].count("\f")+1, text=text, extraction_status="heading-bounded raw transcription; verify the PDF for graphics, columns and nested clauses"))
    if source["id"] == "usa-rules-2025-11":
        for name,needle,stop in [("appendix-b","APPENDIX B TO THE MATERIAL RULES","APPENDIX C TO THE MATERIAL RULES"),("appendix-c","APPENDIX C TO THE MATERIAL RULES",None)]:
            start=raw.index(needle); end=raw.index(stop,start) if stop else raw.index("Fencers’ Publicity Code",start) if "Fencers’ Publicity Code" in raw[start:] else len(raw)
            records.append(dict(source=source["id"],ref=name,line_start=raw[:start].count("\n")+1,line_end=raw[:end].count("\n"),pdf_page_start=raw[:start].count("\f")+1,pdf_page_end=raw[:end].count("\f")+1,text=raw[start:end],extraction_status="raw appendix transcription; verify diagrams and labels in PDF"))
    return records,pages

def build(check=False):
    catalog=json.loads((RESEARCH/"sources.json").read_text())
    sources={s["id"]:s for s in catalog["sources"]}
    if len(sources)!=len(catalog["sources"]):raise ValueError("Duplicate source ID")
    records=[];pages=[]
    for source in sources.values():
        for field,hash_field in [("path","sha256"),("extracted_path","extracted_sha256")]:
            p=ROOT/source[field]
            if not p.is_file() or digest(p)!=source[hash_field]:raise ValueError(f"Missing or changed pinned source: {source['id']} {field}")
        if source["authority"] in ["domestic rulebook","international rules"]:
            a,p=article_records(source);records.extend(a);pages.extend(p)
    for r in records:
        if r['source']=='usa-rules-2025-11' and r['ref'] in ['t.20','t.72','t.124']:
            r['applicability_note']='Historical November 2025 text; current domestic guidance is in docs/RULE-UPDATES-2026-10.md. Do not re-derive the completed update.'
        elif r['source'].startswith('fie-'):
            r['applicability_note']='International comparison source; domestic adoption must be established separately.'
    usa=[r for r in records if r["source"]=="usa-rules-2025-11"]
    by_ref={(r["source"],r["ref"]):r for r in records}
    required={"t."+str(n) for n in range(1,179)}
    if required-set(r["ref"] for r in usa):raise ValueError("USA technical article extraction is incomplete")
    for id,prefix,total in [('fie-technical-2026-08','t.',178),('fie-material-2026-08','m.',60),('fie-organisation-2026-08','o.',119)]:
        found={r['ref'] for r in records if r['source']==id}
        if {prefix+str(i) for i in range(1,total+1)}-found:raise ValueError(f'Incomplete pinned international article extraction: {id}')
    if len(usa)!=len({r["ref"] for r in usa}):raise ValueError("Duplicate USA article extraction")
    topics=json.loads((RESEARCH/"scoring/topics.json").read_text())["topics"]
    if len(topics)!=len({t["id"] for t in topics}):raise ValueError("Duplicate topic ID")
    markdown=["# Scoring research inventory", "", "Generated from `topics.json` and pinned source extracts. Research candidates are not approved app content.", "", "Each article link goes to the complete raw heading-bounded excerpt, with original line and PDF-page coordinates in `article-index.json`. Nested clauses and illustrations require PDF review.", "", "| Topic | Weapons | Priority | Status |", "|---|---|---|---|"]
    for t in topics:
        markdown.append(f"| [{t['title']}](#{t['id']}) | {', '.join(t['weapons'])} | {t['priority']} | {t['status']} |")
    for t in topics:
        markdown.extend(["",f"<a id=\"{t['id']}\"></a>",f"## {t['title']}","",t["finding"],"","Facts to establish: "+" ".join(t["facts"]),"","Draft retrieval terms: "+", ".join(t["search_terms"])+".","","Sources:",""])
        for reference in t["refs"]:
            s=sources[reference["source"]];loc=reference["locator"]
            if loc.startswith('pdf:'):
                numbers=[int(n) for n in loc[4:].split('-')]
                if max(numbers)>s.get('pages',0) or min(numbers)<1:raise ValueError('Invalid PDF locator')
                markdown.append(f"- [{s['title']} · PDF page {loc[4:]}](../{s['path'].removeprefix('research/')}#page={numbers[0]})")
            elif loc=='page':
                markdown.append(f"- [{s['title']}](../{s['extracted_path'].removeprefix('research/')}) · captured {s['verified_on']}")
            else:
                r=by_ref.get((s["id"],loc))
                if not r:raise ValueError(f"Missing source article {s['id']} {loc}")
                markdown.append(f"- [{loc}](../articles/{s['id']}/{loc}.txt) · PDF pp. {r['pdf_page_start']}–{r['pdf_page_end']}; extract lines {r['line_start']}–{r['line_end']}")
        markdown.extend(["", "Publication limit: "+t["publication_limit"]])
    outputs={RESEARCH/'scoring/INVENTORY.md':'\n'.join(markdown)+'\n',RESEARCH/'article-index.json':json.dumps(dict(schema=1,articles=[{k:v for k,v in r.items() if k!='text'} for r in records]),ensure_ascii=False,indent=2)+'\n'}
    def table(text):
        return text.replace("|", "\\|")
    source_lines=["# Source catalog", "", "Pinned official documents and rendered page captures. Source hashes and legacy filenames are in `sources.json`.", "", "| Source ID | Edition / date | Authority | Local document |", "|---|---|---|---|"]
    for source in sources.values():
        source_lines.append(f"| `{source['id']}` | {source['version']} | {source['authority']} | [{table(source['title'])}]({source['path'].removeprefix('research/')}) |")
    for source in sources.values():
        source_lines.extend(["",f"## {source['id']}","",source['scope'],"",f"Publisher: {source['publisher']}. Verified/captured: {source['verified_on']}.","",f"[Publisher source]({source['url']}) · [Complete text]({source['extracted_path'].removeprefix('research/')})", "",f"Capture: {source['capture_method']}."])
    outputs[RESEARCH/'SOURCE-CATALOG.md']='\n'.join(source_lines)+'\n'
    for r in records:
        outputs[RESEARCH/'articles'/r['source']/(r['ref']+'.txt')]=r['text'].strip()+'\n'
    # Keep whole-page extracts of multi-column domestic context, avoiding invented section boundaries.
    for s in sources.values():
        if s['id'] in ['usa-handbook-2026-27-09-27','usa-operations-2026-27']:
            pages.extend(dict(source=s['id'],pdf_page=i,text=p) for i,p in enumerate((ROOT/s['extracted_path']).read_text().split('\f'),1))
    wanted={('usa-operations-2026-27',i) for i in [4,15,16,17,18,19,22,23,26]}|{('usa-handbook-2026-27-09-27',i) for i in [35,36,37,38,39,40,41,82,83,84,85]}
    for p in pages:
        if (p['source'],p['pdf_page']) in wanted:
            outputs[RESEARCH/'pages'/p['source']/f"{p['pdf_page']:03}.txt"]=p['text'].strip()+'\n'
    # These directories are generated; remove obsolete extraction files only.
    for folder in ['articles','pages']:
        for orphan in (RESEARCH/folder).rglob('*.txt'):
            if orphan not in outputs:
                if check:raise ValueError(f'Obsolete generated research file: {orphan.relative_to(ROOT)}')
                orphan.unlink()
    for p,text in outputs.items():
        if check:
            if not p.is_file() or p.read_text()!=text:raise ValueError(f"Stale generated research file: {p.relative_to(ROOT)}")
        else:
            p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
    print(json.dumps(dict(sources=len(sources),articles=len(records),usa_articles=len(usa),topics=len(topics),context_pages=len(wanted),mode='check' if check else 'build')))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true')
    build(parser.parse_args().check)
