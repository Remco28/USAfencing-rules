# Reviewed offline search

Search retrieves possible reference entries. It does not interpret a bout, infer
intent, count prior offenses, or choose a card for the situation described.
All displayed rules, consequences and penalties remain reviewed static content.

## Vocabulary and source review

`db/search_terms.json` is the authoring file. Every offense has a term list,
cited-reference basis and review note. The builder validates coverage and pointers,
stores it in SQLite `search_vocabulary`, then exports only `search_terms` on each
offense. Do not edit generated JSON or SQLite by hand.

The initial vocabulary was reviewed against entry titles, existing summaries and
linked rule text. Selected passages such as t.29.3, t.115.2, t.119, t.172 and t.20.2
were inspected for equipment names, actions and conditions. Existing verified
October updates supply mask safety, lesson and passivity terms. Cited references
describe the basis of the entry, not a claim that every everyday alias occurs
literally in the source. Body cord/cable is a category bridge to electrical
equipment. Touching an item is not automatically a violation of t.29.3: its
conditions still apply.

We intentionally do not index complete rule excerpts: the stored t.29.3 excerpt,
for example, also contains neighboring arm-use and target-covering clauses.
Blindly indexing it would blur separate offenses. Everyday descriptions are
retrieval aids, including ambiguous phrases such as “disconnected cord.”

## Matching behavior

- Accents, bodycord/body cord and common word forms are normalized.
- Filler words and references to fencing time/counts are ignored for retrieval;
  a query containing “twice” never causes the app to select Red.
- Exact citations constrain results. A base citation such as t.29 includes its
  cited subsections; t.29.3 does not silently become t.29.2 or t.119.
- Reviewed aliases and titles have higher weight than explanatory context.
  Rarer words and whole-phrase matches improve rank. Equal scores use source order.
- At least half the meaningful query words must match for non-citation queries.
  Partial matches appear under “Related situations,” rather than being hidden.
- Prefixes of at least three letters and one-edit typos of at least four letters
  can match. Typos include adjacent letter swaps. Known vocabulary words are never
  fuzzily expanded: “mask” cannot become “mark.” Approximate matches are disclosed
  as related. Citation identifiers never receive typo correction.
- Card/group/weapon filters remain strict, even if they hide a relevant result.
- Empty queries browse all filtered entries. Unknown or filler-only queries have
  no results, except an exact multiword phrase explicitly present in reviewed aliases
  (for example, scoring’s “fencing time”). That exception does not match context,
  partial phrases or typos. Search never falls back to returning every offense.

`site/search.js` is dependency-free browser JavaScript, also callable from Node.
The index is built once after data loads; search runs locally and makes no LLM,
API, model-download or analytics calls. The service worker caches the engine and
vocabulary with the app.

## Validation and maintenance

Run from the repository root:

```sh
python3 db/build_db.py
node tests/search.test.cjs
node --check site/search.js
node --check site/app.js
```

The initial set includes 36 expected first results plus ambiguity, unknown-query,
exact-citation and false-match checks. In particular, “cord” finds both handling
and faulty/missing equipment; “missing spare cord” does not elevate holding
equipment based on only one shared word. Tests confirm retrieval does not mutate
the reference data. These examples establish coverage, not universal accuracy.

For a reported missed search: identify the entry and relevant source, add the
smallest useful alias, add an expected-result example and a plausible false-match
check, rebuild and run checks. Do not repair a search by changing a rule.
For an official revision: review vocabulary only for changed entries, but rerun
all search examples. Penalty changes alone often need no vocabulary changes.

Human review uses `human_feedback/round-2026-10-search/index.html`.
Export before closing and place its ZIP beside the guide. Feedback can supply
new examples without requiring users to understand our matching implementation.

## Completed checks for this pass

- Database rebuild: 41 offenses, 66 reference records, no missing source excerpts.
- 36 expected first results passed, plus ambiguity, typo disclosure, exact-citation,
  false-match, unknown-query and reference-mutation checks.
- One-time Git comparison: every pre-existing exported offense field unchanged.
- 28 browser checks passed at 320px and 1280px, including input-to-result matching,
  card/group filters, related headings, existing rule content and cached engine.
- With the dedicated HTTP preview server stopped, a reload and “grabbed my cord”
  search still returned the electrical-equipment entry from offline assets.
- The search feedback page opens directly as a file with all four scenarios and
  the reusable local ZIP export controls. Human relevance feedback is still pending.

## Initial reviewed vocabulary

41 entries; 190 retrieval phrases.

### Fencer or team member absent when called.

Basis: t.119.

Terms: late; no show; missed call; not ready; absent when called; did not show up.

### Unwillingness to fight (passivity).

Basis: t.124.1, t.124.2.

Terms: not attacking; no touches; no hits; waiting without a touch; non combativity; p cards; passive; one minute without scoring.

### Leaving the strip without permission.

Basis: t.23.6.

Terms: leave piste; walk off strip; leave without permission.

### Body contact to avoid a touch.

Basis: t.25.2.

Terms: body contact; bumping to avoid a touch; collide to avoid being hit; corps a corps.

### Turning your back to your opponent.

Basis: t.27.2.

Terms: turn around; back to opponent; turn away.

### Covering or substituting valid target.

Basis: t.29.2, t.30.1, t.79, t.97.

Terms: cover target; hide target; cover lame; block valid target.

### Touching or holding electrical equipment.

Basis: t.29.3.

Terms: body cord; bodycord; cord; cable; electrical wire; grab cord; hold cord; touch cord; touch body cord; hold electrical equipment; grab cable.

### Leaving the side of the strip to avoid a touch.

Basis: t.35.3.

Terms: step off side; side boundary; leave side of piste; avoid hit by leaving side.

### Delaying the bout.

Basis: t.43.2.

Terms: stall; stalling; waste time; delay; prolong interruption.

### Equipment does not conform or required spares are missing.

Basis: t.71, t.72, t.73.1.a, t.117.

Terms: missing spare cord; forget spare weapon; broken body cord; faulty cord; disconnected cord; equipment failure; body cord; bodycord; cable; mask strap; secondary safety strap; missing backup weapon; missing spare body cord.

### Placing a weapon on the strip to straighten it.

Basis: t.76.2, t.90.2, t.96.5.

Terms: bend blade on floor; straighten blade on floor; straighten sword on strip.

### Dragging a weapon point on the strip (foil, épée).

Basis: t.76.2, t.90.2.

Terms: drag tip; point on floor; drag blade point.

### Illegal guard touch or crossing the feet in sabre.

Basis: t.96.3, t.101.5.

Terms: saber; cross feet; cross legs; hit with guard in sabre; forward crossover.

### Refusing to obey the referee.

Basis: t.108, t.112.

Terms: ignore referee; disobey referee; ignore ref instructions.

### Hair does not conform to the rules.

Basis: t.115.2.

Terms: ponytail; loose hair; hair covers target; hair hides name; hair not tied back.

### Jostling, disorderly fencing, early mask removal or undressing.

Basis: t.116, t.121.2, t.125, t.126.

Terms: remove mask early; mask off before halt; take mask off; undress on strip; change clothes on strip; jostle; disorderly fencing.

### Abnormal action, brutal touch or deliberate fall.

Basis: t.121.2.

Terms: deliberate fall; fall to avoid touch; brutal touch; irregular movement.

### Unjustified appeal of a decision on a point of fact.

Basis: t.172, t.173, t.174.

Terms: argue with referee; challenge referee decision; unjustified protest; appeal point of fact.

### Entering the strip enclosure without permission.

Basis: t.132.2.

Terms: enter piste enclosure; enter strip area; team enters without permission; team warning.

### Using the non-weapon arm or hand.

Basis: t.29.1, t.30.

Terms: free hand; non sword hand; unarmed hand; push with free hand; use other arm; block with other arm.

### Medical interruption not confirmed by a doctor.

Basis: t.45.3.

Terms: unjustified medical break; doctor rejects medical reason; injury break not confirmed.

### Missing equipment control mark.

Basis: t.73.1.a.

Terms: missing inspection sticker; missing control stamp; equipment check mark; missing weapon inspection mark.

### Intentionally dropping a weapon during the phrase.

Basis: t.56.11.

Terms: drop sword on purpose; drop weapon deliberately; let go of weapon intentionally.

### Missing name or required national colors.

Basis: t.74.

Terms: name on jacket; nationality on jacket; missing uniform name; national colors; national colours.

### Deliberate touch not on the opponent.

Basis: t.55.2.

Terms: hit floor deliberately; touch not on opponent; deliberate touch on something else.

### Dangerous action or a blow with the guard or pommel.

Basis: t.26.1, t.121.2, t.147.

Terms: dangerous fencing; hit with pommel; blow with guard; violent fencing action.

### Fencer disturbing order on the strip.

Basis: t.108.2, t.137.2.

Terms: disrupt bout; disrupt competition on strip; disturbing order.

### Dishonest fencing.

Basis: t.121.

Terms: dishonest fencing; dishonest behavior during fencing.

### Offense against the publicity code.

Basis: Publicity Code.

Terms: advertising; sponsor logo; publicity code; sponsorship.

### Venue disturbance or smoking, including by spectators.

Basis: t.109, t.110, t.111, t.133, t.137.3, t.137.4, t.168.

Terms: spectator; parent shouting; audience disruption; smoking; vaping; e cigarette; disturbance outside strip.

### Training without conforming fencing equipment.

Basis: t.20.2.

Terms: warmup; warm up; practice bout; training without equipment; lesson equipment; coach long pants; chest protector during lesson.

### Anti-sporting behavior.

Basis: t.121.2.

Terms: unsporting behavior; unsportsmanlike behavior; anti sporting behavior.

### Receiving electronic communication during a bout.

Basis: t.64.6, t.73.1.g.

Terms: earpiece; electronic coaching; receive messages; communication device; radio during bout.

### Falsified inspection marks or modified equipment.

Basis: t.73.1.c, t.73.1.d, t.73.1.e.

Terms: fake inspection stamp; forged control mark; altered inspection mark; modified equipment.

### Manifest cheating with equipment.

Basis: t.73.1.f, m.5.5.d.

Terms: equipment cheating; cheating device; fraudulent equipment.

### Refusing to fence an entered competitor.

Basis: t.113.

Terms: refuse opponent; will not fence opponent; refuse entered competitor.

### Offense against sportsmanship.

Basis: t.121.2, t.122, t.123, t.149.1.

Terms: breach sportsmanship; refuse handshake; unsportsmanlike conduct; refuse salute.

### Refusing to salute at the start or end of a bout.

Basis: t.122.

Terms: no salute; skip salute; refuse salute; did not salute.

### Profiting from collusion or favoring an opponent.

Basis: t.128, t.149.1.

Terms: fix bout; match fixing; agree to lose; give away touches; favor opponent; favour opponent.

### Violent or vindictive action.

Basis: t.149.1.

Terms: vindictive action; retaliation; violent action; attack opponent in anger.

### Doping.

Basis: o.107.

Terms: anti doping; prohibited substance; performance enhancing drugs; doping violation.
