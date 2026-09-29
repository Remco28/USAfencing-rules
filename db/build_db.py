#!/usr/bin/env python3
"""Build the penalties database (source of truth) from visual transcription + rules.txt.

Pass 1 data entry: transcribed from 250dpi visual renders of the 2-page penalty chart
(2026-09-29), NOT from pdftotext flow. See AUDIT.md for verification procedure.
"""
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
DBDIR = ROOT / "db"
SITE_DATA = ROOT / "site" / "data"
DB_PATH = DBDIR / "penalties.sqlite"

# ----------------------------------------------------------------------------
# Pass 1 transcription (visual). as_printed preserves source quirks (e.g. t.29,2).
# pen_* values are the literal cell contents from the visual. The separate
# passivity detail in the app supplements the chart row and notes the Oct. 2026 update.
# ----------------------------------------------------------------------------
OFFENSES = [
    # ---- preamble ----
    dict(id="presence", section="preamble", sort=1,
         offense_official="Fencer or team member not present upon 1st and then 2nd call. If still not present at 3rd call Elimination from the competition.",
         source_title="Fencer or team member not present upon 1st and then 2nd call. If still not present at 3rd call Elimination from the competition.",
         plain_override="Fencer or team member absent when called.",
         as_printed="t.119", articles=["t.119"],
         pen_first="1st call: Yellow", pen_second="2nd call: Red", pen_third="3rd call: Elimination",
         annuls=0, team=0, superscript="", notes=""),
    dict(id="unwillingness", section="preamble", sort=2, passivity=True,
         offense_official="Unwillingness to fight: the sanctions imposed are shown by specific P-cards which are not cumulative with any other sanction awarded.",
         source_title="Unwillingness to fight: the sanctions imposed are shown by specific P-cards which are not cumulative with any other sanction awarded.",
         plain_override="Unwillingness to fight (passivity).",
         as_printed="t.124.1, t.124.2", articles=["t.124.1", "t.124.2"],
         pen_first="1st time: P-yellow", pen_second="2nd time: P-red", pen_third="3rd time: P-black",
         annuls=0, team=0, superscript="", notes="P-cards not cumulative with any other sanction."),
    # ---- 1st group: Yellow / Red / Red ----
    dict(id="g1-leaving-strip", section="1st Group", sort=3,
         offense_official="Leaving the strip without permission", as_printed="t.23.6", articles=["t.23.6"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g1-corps-a-corps", section="1st Group", sort=4,
         offense_official="Corps à corps to avoid a touch *", as_printed="t.25.2", articles=["t.25.2"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    dict(id="g1-turning-back", section="1st Group", sort=5,
         offense_official="Turning the back to the opponent *", as_printed="t.27.2", articles=["t.27.2"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    dict(id="g1-covering-target", section="1st Group", sort=6,
         offense_official="Covering/substitution of valid target *", as_printed="t.29,2; t.30.1; t.79, t.97",
         articles=["t.29.2", "t.30.1", "t.79", "t.97"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes="SOURCE TYPO: printed 't.29,2' with comma; normalized to t.29.2."),
    dict(id="g1-electrical-equipment", section="1st Group", sort=7,
         offense_official="Touching/taking hold of electrical equipment *", as_printed="t.29.3", articles=["t.29.3"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    dict(id="g1-crossing-side", section="1st Group", sort=8,
         offense_official="Crossing the side of the strip to avoid being touched *", as_printed="t.35.3", articles=["t.35.3"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    dict(id="g1-delaying", section="1st Group", sort=9,
         offense_official="Delaying the bout", as_printed="t.43.2", articles=["t.43.2"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g1-equipment-conforming", section="1st Group", sort=10,
         offense_official="Clothing/equipment not working or not conforming; absence of second regulation weapon or bodycord",
         as_printed="t.71; t.72; t.73.1.a; t.117", articles=["t.71", "t.72", "t.73.1.a", "t.117"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g1-straighten-weapon", section="1st Group", sort=11,
         offense_official="Placing the weapon on the strip to straighten it", as_printed="t.76.2; t.90.2; t.96.5",
         articles=["t.76.2", "t.90.2", "t.96.5"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g1-dragging-point", section="1st Group", sort=12,
         offense_official="Bending/dragging weapon point on conductive strip (F,E)", as_printed="t.76.2; t.90.2",
         articles=["t.76.2", "t.90.2"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes="(F,E) = foil and épée only."),
    dict(id="g1-sabre-guard", section="1st Group", sort=13,
         offense_official="In sabre, touch scored with the guard *; any forward movement crossing the legs or feet *",
         source_title="In sabre, touch scored with the guard; any forward movement crossing the legs or feet",
         as_printed="t.96.3, t.101.5", articles=["t.96.3", "t.101.5"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes="Sabre only."),
    dict(id="g1-refusal-obey", section="1st Group", sort=14,
         offense_official="Refusal to obey the Referee", as_printed="t.108; t.112", articles=["t.108", "t.112"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g1-hair", section="1st Group", sort=15,
         offense_official="Hair not conforming", as_printed="t.115.2", articles=["t.115.2"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g1-jostling", section="1st Group", sort=16,
         offense_official="Jostling, disorderly fencing *; taking off mask before the Referee calls \u201cHalt\u201d; undressing on the strip",
         as_printed="t.116; t.121.2; t.125; t.126", articles=["t.116", "t.121.2", "t.125", "t.126"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="",
         notes="AUDIT: '*' printed after 'disorderly fencing' — annulment may apply only to that sub-offense, not mask/undressing. Flagged for ref-check."),
    dict(id="g1-abnormal-action", section="1st Group", sort=17,
         offense_official="Abnormal fencing action *; touches with brutality or an intentional fall to avoid being hit *",
         source_title="Abnormal fencing action; touches with brutality or an intentional fall to avoid being hit",
         as_printed="t.121.2", articles=["t.121.2"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    dict(id="g1-unjustified-appeal", section="1st Group", sort=18,
         offense_official="Unjustified appeal, casting doubt on the decision of the Referee on a point of fact",
         as_printed="t.172; t.173; t.174", articles=["t.172", "t.173", "t.174"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g1-strip-enclosure", section="1st Group", sort=19,
         offense_official="Entering the Strip Enclosure without the Referee\u2019s permission +",
         as_printed="t.132.2", articles=["t.132.2"],
         pen_first="Yellow", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=1, superscript="",
         notes="+ = team special: Special Yellow Card for whole team, valid whole team match; repeat 1st-group offense by any fencer in same match = Red each time."),
    # ---- 2nd group: Red / Red / Red ----
    dict(id="g2-nonweapon-arm", section="2nd Group", sort=20,
         offense_official="Using the non-weapon arm or hand *", as_printed="t.29.1; t.30", articles=["t.29.1", "t.30"],
         pen_first="Red", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    dict(id="g2-medical", section="2nd Group", sort=21,
         offense_official="Interruption of bout for medical reason not confirmed by doctor", as_printed="t.45.3", articles=["t.45.3"],
         pen_first="Red", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g2-control-mark", section="2nd Group", sort=22,
         offense_official="Absence of equipment control mark *", as_printed="t.73.1.a", articles=["t.73.1.a"],
         pen_first="Red", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    dict(id="g2-dropping-weapon", section="2nd Group", sort=23,
         offense_official="Intentionally dropping a weapon during the fencing phrase", as_printed="t.56.11", articles=["t.56.11"],
         pen_first="Red", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g2-name-colors", section="2nd Group", sort=24,
         offense_official="Absence of name on back, absence of national colors where required", as_printed="t.74", articles=["t.74"],
         pen_first="Red", pen_second="Red", pen_third="Red (≥3rd)", annuls=0, team=0, superscript="", notes=""),
    dict(id="g2-deliberate-off-target", section="2nd Group", sort=25,
         offense_official="Deliberate touch not on opponent *", as_printed="t.55.2", articles=["t.55.2"],
         pen_first="Red", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    dict(id="g2-dangerous-action", section="2nd Group", sort=26,
         offense_official="Dangerous, violent or vindictive action, blow with guard or pommel *",
         as_printed="t.26.1, t.121.2; t.147", articles=["t.26.1", "t.121.2", "t.147"],
         pen_first="Red", pen_second="Red", pen_third="Red (≥3rd)", annuls=1, team=0, superscript="", notes=""),
    # ---- 3rd group ----
    dict(id="g3-disturbing-order", section="3rd Group", sort=27,
         offense_official="Fencer disturbing order on the strip", as_printed="t.108.2; t.137.2", articles=["t.108.2", "t.137.2"],
         pen_first="Red (footnote 4)", pen_second="Black (footnote 1)", pen_third="",
         annuls=0, team=0, superscript="4/1", notes="2nd-penalty Black cell visually shared across 3 rows (this + dishonest + publicity)."),
    dict(id="g3-dishonest", section="3rd Group", sort=28,
         offense_official="Dishonest fencing *", as_printed="t.121", articles=["t.121"],
         pen_first="Red", pen_second="Black (footnote 1, shared)", pen_third="",
         annuls=1, team=0, superscript="1", notes=""),
    dict(id="g3-publicity", section="3rd Group", sort=29,
         offense_official="Offense against publicity code", as_printed="Publicity Code", articles=["Publicity Code"],
         pen_first="Red", pen_second="Black (footnote 1, shared)", pen_third="",
         annuls=0, team=0, superscript="1", notes="Non-t. ref: Fencers' Publicity Code appendix in rules.txt."),
    dict(id="g3-spectator-disturbance", section="3rd Group", sort=30,
         offense_official="Any person not on strip disturbing order; smoking in the competition halls (including with electronic cigarettes)",
         as_printed="t.109; t.110; t.111; t.133; t.137.3/4; t.168",
         articles=["t.109", "t.110", "t.111", "t.133", "t.137.3", "t.137.4", "t.168"],
         pen_first="Warning (footnote 4)", pen_second="Black (footnote 3)", pen_third="",
         annuls=0, team=0, superscript="4/3", notes="Includes electronic cigarettes. Applies to non-fencers."),
    dict(id="g3-warming-up", section="3rd Group", sort=31,
         offense_official="Warming up or training without wearing conforming fencing clothing and equipment",
         as_printed="t.20.2", articles=["t.20.2"],
         pen_first="Warning", pen_second="Black", pen_third="",
         annuls=0, team=0, superscript="", notes=""),
    dict(id="g3-antisporting", section="3rd Group", sort=32,
         offense_official="Anti-sporting behavior", as_printed="t.121.2", articles=["t.121.2"],
         pen_first="Red", pen_second="Black", pen_third="",
         annuls=0, team=0, superscript="", notes=""),
    # ---- 4th group: Black at 1st ----
    dict(id="g4-electronic-comms", section="4th Group", sort=33,
         offense_official="Fencer equipped with electronic communication equipment permitting the fencer to receive communications during the bout",
         as_printed="t.64.6; t.73.1.g", articles=["t.64.6", "t.73.1.g"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="1/2", notes="Superscript 1/2 = footnotes 1 (exclusion competition) or 2 (exclusion tournament)."),
    dict(id="g4-falsified-marks", section="4th Group", sort=34,
         offense_official="Falsified weapon inspection marks, intentional modification of equipment",
         as_printed="t.73.1.c-e", articles=["t.73.1.c", "t.73.1.d", "t.73.1.e"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="", notes="Range c–e expanded to three refs."),
    dict(id="g4-manifest-cheating", section="4th Group", sort=35,
         offense_official="Manifest cheating with equipment", as_printed="t.73.1.f; m.5.5.d", articles=["t.73.1.f", "m.5.5.d"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="2", notes="m.5.5.d is a material-rules (m.) ref."),
    dict(id="g4-refusal-to-fence", section="4th Group", sort=36,
         offense_official="Refusal of a fencer to fence another competitor (individual or team) properly entered",
         as_printed="t.113", articles=["t.113"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="", notes=""),
    dict(id="g4-sportsmanship", section="4th Group", sort=37,
         offense_official="Offense against sportsmanship", as_printed="t.121.2; t.122; t.123; t.149.1",
         articles=["t.121.2", "t.122", "t.123", "t.149.1"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="1 or 2", notes=""),
    dict(id="g4-salute-refusal", section="4th Group", sort=38,
         offense_official="Refusal of fencer to salute opponent, the referee and the audience at the beginning or at the end of the bout",
         as_printed="t.122", articles=["t.122"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="", notes=""),
    dict(id="g4-collusion", section="4th Group", sort=39,
         offense_official="Profiting from collusion, favoring an opponent", as_printed="t.128; t.149.1", articles=["t.128", "t.149.1"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="1", notes=""),
    dict(id="g4-violent-actions", section="4th Group", sort=40,
         offense_official="Violent or vindictive actions", as_printed="t.149.1", articles=["t.149.1"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="1", notes=""),
    dict(id="g4-doping", section="4th Group", sort=41,
         offense_official="Doping", as_printed="o.107", articles=["o.107"],
         pen_first="Black", pen_second="", pen_third="",
         annuls=0, team=0, superscript="2", notes="o.107 is an organisation-rules (o.) ref."),
]

CARD_LEGEND = [
    ("Yellow Card", "Warning (valid for bout, whether one or several encounters). If a fencer commits an offense in the First Group after having been penalized with a Red Card, for whatever reason, the fencer receives a further Red Card."),
    ("Red Card", "Penalty Touch"),
    ("Black Card", "Exclusion from competition."),
    ("P-yellow", "P-yellow (warning)"),
    ("P-red", "P-red (penalty hit)"),
    ("P-black", "P-black (loss of the bout or match). In both individual and team competitions, fencers and team who have lost the bout/match following the award of a P-black card will be ranked in the final results of the competition as having lost the bout/match. They receive the corresponding points."),
]

FOOTNOTES = [
    ("*", "Annulment of any touch scored by the fencer at fault"),
    ("+", "Special Yellow Card for the whole team and valid for the whole team match. If, during the same team match, a fencer commits an offence of the 1st group the Referee penalizes with a Red Card each time."),
    ("1", "Exclusion from competition"),
    ("2", "Exclusion from tournament"),
    ("3", "Expulsion from venue"),
    ("4", "In serious cases, the referee may exclude/expel immediately"),
]

FIGURES = [
    # RELEVANT-ONLY set for the penalty reference (user decision 2026-09-29).
    # Weapon schematics (old Fig 8-16), jackets, gauge deliberately excluded.
    # Strips (1-2) and targets (4-6) cropped/rendered from page images at 200dpi
    # and visually verified; signals (3a-c) are the native raster artwork,
    # visually verified via contact sheet 2026-09-29.
    ("1", 1, "", "Strip for Semi-Finals and Finals (maximum height 50 cm)", "pdf p.23 (book p.8), crop 0-57%", "site/figures/fig-1.png", "t.18-t.22"),
    ("2", 2, "", "Standard Strip for all three weapons", "pdf p.24 (book p.9), crop 0-52%", "site/figures/fig-2.png", "t.18-t.22"),
    ("3a", 3, "a", "Referee signals and commands (part 1: on guard, play, halt, point in line, hits)", "pdf p.41 raster (build/fig-004.png)", "site/figures/fig-3a.png", "t.47-t.63"),
    ("3b", 3, "b", "Referee signals and commands (part 2: calls, positions, penalties)", "pdf p.42 raster (build/fig-005.png)", "site/figures/fig-3b.png", "t.47-t.63"),
    ("3c", 3, "c", "Referee signals and commands (part 3: technical touch, video review, cards, winner)", "pdf p.43 raster (build/fig-006.png)", "site/figures/fig-3c.png", "t.47-t.63"),
    ("4", 4, "", "Valid target in foil", "pdf p.49 raster (build/fig-007.png); blue = conductive target", "site/figures/fig-4.png", "t.53-t.56"),
    ("5", 5, "", "Valid target in épée", "pdf p.54 raster (build/fig-008.png); whole body is target", "site/figures/fig-5.png", "t.57-t.62"),
    ("6", 6, "", "Valid target in sabre", "pdf p.57 raster (build/fig-009.png); blue = mask, arms, trunk", "site/figures/fig-6.png", "sabre target"),
]

# Plain-language drafts. Keep summaries concise and tied to the chart; a parent/fencer
# read-through is still needed. one_liner: <= ~12 words; explainer: 1-2 short sentences.
PLAIN = {
    "presence": ("Absent when called to the strip.",
        "The referee calls the fencer or team member to the strip. Repeated failure to appear can lead to elimination."),
    "unwillingness": ("Passivity: one minute without a hit.",
        "Effective Oct. 1, 2026, the P-card sequence is P-red, then P-black. The November 2025 chart row below still shows the superseded sequence."),
    "g1-leaving-strip": ("Leaving the strip without permission.", ""),
    "g1-corps-a-corps": ("Body contact to avoid a touch.", ""),
    "g1-turning-back": ("Turning your back to your opponent.", ""),
    "g1-covering-target": ("Covering or substituting valid target.",
        "Valid target depends on the weapon; see the linked diagram."),
    "g1-electrical-equipment": ("Touching or holding electrical equipment.", ""),
    "g1-crossing-side": ("Leaving the side of the strip to avoid a touch.", ""),
    "g1-delaying": ("Delaying the bout.", ""),
    "g1-equipment-conforming": ("Equipment does not conform or required spares are missing.",
        "Includes faulty equipment and a missing spare weapon or body cord."),
    "g1-straighten-weapon": ("Placing a weapon on the strip to straighten it.", ""),
    "g1-dragging-point": ("Dragging a weapon point on the strip (foil, épée).", ""),
    "g1-sabre-guard": ("Illegal guard touch or crossing the feet in sabre.", ""),
    "g1-refusal-obey": ("Refusing to obey the referee.", ""),
    "g1-hair": ("Hair does not conform to the rules.",
        "See the cited rule for the requirements."),
    "g1-jostling": ("Jostling, disorderly fencing, early mask removal or undressing.",
        "The chart lists each offense under Group 1. Its asterisk follows ‘disorderly fencing’; check the rule text for when a touch is annulled."),
    "g1-abnormal-action": ("Abnormal action, brutal touch or deliberate fall.", ""),
    "g1-unjustified-appeal": ("Unjustified appeal of a decision on a point of fact.",
        "See the cited rules on appeals."),
    "g1-strip-enclosure": ("Entering the strip enclosure without permission.",
        "This is a team penalty: the Yellow applies to the whole team match. A later Group 1 offense by any team member draws Red."),
    "g2-nonweapon-arm": ("Using the non-weapon arm or hand.", ""),
    "g2-medical": ("Medical interruption not confirmed by a doctor.",
        "The doctor must confirm the medical reason for the interruption."),
    "g2-control-mark": ("Missing equipment control mark.", ""),
    "g2-dropping-weapon": ("Intentionally dropping a weapon during the phrase.", ""),
    "g2-name-colors": ("Missing name or required national colors.", ""),
    "g2-deliberate-off-target": ("Deliberate touch not on the opponent.", ""),
    "g2-dangerous-action": ("Dangerous action or a blow with the guard or pommel.", ""),
    "g3-disturbing-order": ("Fencer disturbing order on the strip.",
        "Immediate exclusion is possible in serious cases."),
    "g3-dishonest": ("Dishonest fencing.", ""),
    "g3-publicity": ("Offense against the publicity code.",
        "See the cited publicity code."),
    "g3-spectator-disturbance": ("Venue disturbance or smoking, including by spectators.",
        "The entry applies to people not on the strip and includes smoking or vaping in the competition hall. A warning may be followed by expulsion from the venue."),
    "g3-warming-up": ("Training without conforming fencing equipment.", ""),
    "g3-antisporting": ("Anti-sporting behavior.", ""),
    "g4-electronic-comms": ("Receiving electronic communication during a bout.",
        "A device that lets a fencer receive communication during a bout draws Black. See the chart note for the scope of exclusion."),
    "g4-falsified-marks": ("Falsified inspection marks or modified equipment.", ""),
    "g4-manifest-cheating": ("Manifest cheating with equipment.", ""),
    "g4-refusal-to-fence": ("Refusing to fence an entered competitor.",
        "The chart lists Black for refusing to fence an individual or team competitor properly entered in the event."),
    "g4-sportsmanship": ("Offense against sportsmanship.",
        "Black applies. See chart notes for the scope of exclusion."),
    "g4-salute-refusal": ("Refusing to salute at the start or end of a bout.",
        "The chart lists Black for refusing to salute the opponent, referee and audience."),
    "g4-collusion": ("Profiting from collusion or favoring an opponent.",
        "Black applies. See chart notes for the scope of exclusion."),
    "g4-violent-actions": ("Violent or vindictive action.", ""),
    "g4-doping": ("Doping.",
        "The chart lists Black. See the cited anti-doping rule."),
}

# figure keys linked per offense (subset of FIGURES above)
FIGURE_LINKS = {
    "g1-leaving-strip": ["1", "2"],
    "g1-crossing-side": ["1", "2"],
    "g1-strip-enclosure": ["1", "2"],
    "g1-covering-target": ["4", "5", "6"],
    "g1-sabre-guard": ["6"],
    "g2-deliberate-off-target": ["4", "5", "6"],
    "g1-refusal-obey": ["3a", "3b", "3c"],
    "g1-jostling": ["3a", "3b", "3c"],
    "g1-unjustified-appeal": ["3a", "3b", "3c"],
}

HEADING_RE = re.compile(r"^([tom])\.(\d[\d.]*)[a-z]?\s*$")
FOOTER_RE = re.compile(r"^USA Fencing Rules for Competition")


def parse_rules_articles(path):
    """Split rules.txt into {ref: body} keyed by article heading (t.119, o.107, m.5.5...).

    NOTE: must use split('\\n') after deleting form-feeds, NOT splitlines():
    pdftotext emits \\f page breaks (214 in this file) and splitlines() splits on
    \\f, phantom-inflating line numbers so source_lines no longer match grep/sed.
    Deleting \\f is safe: at page boundaries it sits on its own line (leaving an
    empty line, count unchanged); mid-word it rejoins words split across pages.
    """
    raw_text = Path(path).read_text(encoding="utf-8", errors="replace").replace("\x0c", "")
    assert "\x0c" not in raw_text
    lines = raw_text.split("\n")
    articles = {}
    order = []
    cur = None
    buf = []
    start_line = 0
    spans = {}

    def flush():
        if cur is not None:
            # strip footer/page-number lines
            body = [l for l in buf if not FOOTER_RE.match(l) and l.strip() != f"{cur}"]
            text = "\n".join(body).strip()
            # remove page-number-only lines
            text = re.sub(r"\n\s*\d+\s*\n", "\n", text)
            articles[cur] = text
            spans[cur] = (start_line, start_line + len(buf))

    for i, raw in enumerate(lines, start=1):
        line = raw.strip()
        m = HEADING_RE.match(line)
        if m and len(line) < 14:
            flush()
            cur = line
            order.append(cur)
            buf = []
            start_line = i
        elif cur is not None:
            buf.append(raw.rstrip())
    flush()
    return articles, spans, order


def base_ref(ref):
    """t.73.1.a -> t.73 ; t.137.3 -> t.137 ; o.107 -> o.107 ; m.5.5.d -> m.5 ; Publicity Code stays."""
    if ref == "Publicity Code":
        return "PUBLICITY"
    m = re.match(r"^([tom])\.(\d+)", ref)
    if not m:
        return None
    book, num = m.group(1), m.group(2)
    return f"{book}.{num}"


def main():
    DBDIR.mkdir(parents=True, exist_ok=True)
    SITE_DATA.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.executescript("""
        CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE offenses(id TEXT PRIMARY KEY, section TEXT, sort INTEGER,
            offense_official TEXT, as_printed TEXT, articles_json TEXT,
            pen_first TEXT, pen_second TEXT, pen_third TEXT,
            annuls_touch INTEGER, team_special INTEGER, superscript TEXT, notes TEXT);
        CREATE TABLE articles(ref TEXT PRIMARY KEY, base_ref TEXT, book TEXT,
            excerpt TEXT, verified INTEGER DEFAULT 0, source_lines TEXT);
        CREATE TABLE figures(key TEXT PRIMARY KEY, num INTEGER, part TEXT, caption TEXT,
            source TEXT, file TEXT, related TEXT);
        CREATE TABLE card_legend(card TEXT PRIMARY KEY, meaning TEXT);
        CREATE TABLE footnotes(key TEXT PRIMARY KEY, text TEXT);
        CREATE TABLE plain(offense_id TEXT PRIMARY KEY, one_liner TEXT, explainer TEXT, status TEXT);
    """)
    cur.execute("INSERT INTO meta VALUES('version','November 2025')");
    cur.execute("INSERT INTO meta VALUES('source','2025-11_USA_Fencing_Penalty_Chart.pdf + 2025-11_USA_Fencing_Rules (1).pdf')");
    cur.execute("INSERT INTO meta VALUES('transcription','pass1-visual-2026-09-29')");

    for o in OFFENSES:
        cur.execute(
            "INSERT INTO offenses VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (o["id"], o["section"], o["sort"], o["offense_official"], o["as_printed"],
             json.dumps(o["articles"]), o["pen_first"], o["pen_second"], o["pen_third"],
             o["annuls"], o["team"], o["superscript"], o["notes"]))

    articles_txt, spans, order = parse_rules_articles(BUILD / "rules.txt")

    # collect every distinct cited ref
    cited = {}
    for o in OFFENSES:
        for a in o["articles"]:
            cited.setdefault(a, []).append(o["id"])

    missing = []
    for ref in sorted(cited):
        base = base_ref(ref)
        excerpt, src = "", ""
        if base == "PUBLICITY":
            # Appendix D header (scope) + operative penalty clause. The chart's
            # Red -> Black matches "penalties as provided for in ... t.170/3rd group".
            lines = (BUILD / "rules.txt").read_text(encoding="utf-8", errors="replace").replace("\x0c", "").split("\n")
            head = lines[6934:6942]  # appendix title + adoption note (1-indexed 6935-6942)
            # find the operative penalty clause dynamically
            anchor = next(i for i, l in enumerate(lines) if "failure to observe the rules relating to an individual contract" in l)
            clause = lines[anchor - 2:anchor + 18]
            excerpt = "\n".join(head + ["[...]"] + clause)
            src = f"rules.txt:6935-6942+{anchor - 1}-{anchor + 18}"
        elif base and base in articles_txt:
            excerpt = articles_txt[base]
            s, e = spans[base]
            src = f"rules.txt:{s}-{e}"
        else:
            missing.append(ref)
        book = {"t": "technical", "o": "organisation", "m": "material"}.get(ref[0], "") if ref != "Publicity Code" else "publicity"
        cur.execute("INSERT INTO articles VALUES(?,?,?,?,?,?)",
                    (ref, base, book, excerpt, 0, src))

    for key, num, part, caption, source, f, related in FIGURES:
        cur.execute("INSERT INTO figures VALUES(?,?,?,?,?,?,?)", (key, num, part, caption, source, f, related))
    for card, meaning in CARD_LEGEND:
        cur.execute("INSERT INTO card_legend VALUES(?,?)", (card, meaning))
    for k, t in FOOTNOTES:
        cur.execute("INSERT INTO footnotes VALUES(?,?)", (k, t))
    for oid, (one, expl) in PLAIN.items():
        cur.execute("INSERT INTO plain VALUES(?,?,?,?)", (oid, one, expl, "draft"))
    con.commit()

    # ---- exports for the static site ----
    plain_rows = {r[0]: r for r in cur.execute("SELECT * FROM plain")}
    off_rows = cur.execute("SELECT * FROM offenses ORDER BY sort").fetchall()
    cols = [d[0] for d in cur.description]
    offenses_json = []
    for r in off_rows:
        d = dict(zip(cols, r))
        d["articles"] = json.loads(d["articles_json"])
        del d["articles_json"]
        p = plain_rows.get(d["id"])
        offense_source = next(o for o in OFFENSES if o["id"] == d["id"])
        d["one_liner"] = offense_source.get("plain_override", p[1] if p else "")
        d["explainer"] = p[2] if p else ""
        d["plain_status"] = p[3] if p else "missing"
        d["figure_refs"] = FIGURE_LINKS.get(d["id"], [])
        d["passivity"] = bool(offense_source.get("passivity", False))
        offenses_json.append(d)
    (SITE_DATA / "offenses.json").write_text(json.dumps(offenses_json, indent=2, ensure_ascii=False))
    art_rows = cur.execute("SELECT ref, base_ref, book, excerpt, verified, source_lines FROM articles").fetchall()
    (SITE_DATA / "articles.json").write_text(json.dumps(
        [dict(zip(["ref", "base_ref", "book", "excerpt", "verified", "source_lines"], r)) for r in art_rows],
        indent=2, ensure_ascii=False))
    fig_rows = cur.execute("SELECT * FROM figures ORDER BY num, part").fetchall()
    (SITE_DATA / "figures.json").write_text(json.dumps(
        [dict(zip(["key", "num", "part", "caption", "source", "file", "related"], r)) for r in fig_rows],
        indent=2, ensure_ascii=False))
    leg = cur.execute("SELECT * FROM card_legend").fetchall()
    foot = cur.execute("SELECT * FROM footnotes").fetchall()
    (SITE_DATA / "legend.json").write_text(json.dumps(
        {"cards": [dict(zip(["card", "meaning"], r)) for r in leg],
         "footnotes": [dict(zip(["key", "text"], r)) for r in foot]}, indent=2, ensure_ascii=False))

    n_off = cur.execute("SELECT COUNT(*) FROM offenses").fetchone()[0]
    n_art = cur.execute("SELECT COUNT(*) FROM articles").fetchone()[0]
    n_plain = cur.execute("SELECT COUNT(*) FROM plain").fetchone()[0]
    plain_missing = [o["id"] for o in OFFENSES if o["id"] not in PLAIN]
    empty_excerpts = cur.execute("SELECT ref FROM articles WHERE excerpt=''").fetchall()
    # ---- self-checks: pointers must match grep-visible headings ----
    raw_lines = (BUILD / "rules.txt").read_text(encoding="utf-8", errors="replace").replace("\x0c", "").split("\n")
    bad_ptr = []
    for ref, base, src in cur.execute("SELECT ref, base_ref, source_lines FROM articles"):
        if base == "PUBLICITY":
            continue
        try:
            start = int(src.split(":")[1].split("-")[0])
            if raw_lines[start - 1].strip() != base:
                bad_ptr.append((ref, src, raw_lines[start - 1].strip()[:40]))
        except Exception as e:
            bad_ptr.append((ref, src, f"parse-error {e}"))
    formfeed_left = cur.execute("SELECT COUNT(*) FROM articles WHERE excerpt LIKE '%' || CHAR(12) || '%'").fetchone()[0]
    passivity_in_source = "There is unwillingness to fight when there is one minute of fencing without a hit" in articles_txt.get("t.124", "")
    excerpt_spans_complete = all(articles_txt.get(base, "") == excerpt for _ref, base, excerpt in cur.execute("SELECT ref, base_ref, excerpt FROM articles") if base != "PUBLICITY")
    con.close()
    print(f"offenses={n_off} distinct_article_refs={n_art} plain_drafted={n_plain}")
    print(f"plain_missing={plain_missing}")
    print(f"missing_excerpts={missing}")
    print(f"empty_excerpts={[r[0] for r in empty_excerpts]}")
    print(f"bad_pointers={bad_ptr}")
    print(f"excerpts_with_formfeed={formfeed_left}")
    print(f"passivity_rule_found={passivity_in_source}")
    print(f"source_excerpt_match={excerpt_spans_complete}")
    assert not missing and not empty_excerpts and not bad_ptr and formfeed_left == 0 and not plain_missing and passivity_in_source and excerpt_spans_complete, "SELF-CHECK FAILED"


if __name__ == "__main__":
    main()
