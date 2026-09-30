const assert = require('node:assert/strict');
const data = require('../site/scoring/data/cases.json');
const search = require('../site/search.js');
const entries = data.cases.map(c => ({...c,one_liner:c.title,offense_official:c.title,explainer:c.summary}));
const index = search.create(entries, {});
function hits(q,w='epee') { return search.rank(index,q).filter(h=>h.offense.weapons.includes(w)); }
const examples = [
 ["stepped off back", "rear-exit"],["both feet off", "boundary-touch"],["touch after fall", "fall"],["broken blade", "broken-blade"],["only one test failed", "intermittent-fault"],["light from beat", "epee-spurious-light"],["paint on guard", "epee-insulated-guard"],["torn strip", "epee-strip-torn"],["doubtful double", "epee-doubtful-double"],["4 4 double", "pool-four-all"],["extra minute", "overtime"],["after buzzer", "time-expired"],["back to middle", "restart-position"],["team relay", "team-relay"],["foil equipment test", "foil-equipment", "foil"],["permanent white light", "foil-equipment-exception", "foil"],["saber missing light", "sabre-equipment", "sabre"],["sabre guard insulation", "sabre-guard-insulation", "sabre"],["guard scored light", "sabre-guard-contact", "sabre"],["video review", "official-video"],["wrong pool score", "scoresheet-correction"],["foil bib", "foil-target", "foil"],["sabre hand", "sabre-target", "sabre"],["t.95.2", "epee-strip-torn"],
 ["14 14", "de-final-double"],["too close", "close-quarters"],["jostled opponent", "intentional-contact"],["knee on strip", "ducking"],["turned back", "turning-back"],["off hand push", "free-hand"],["grabbed cord", "grab-cord"],["jumped off avoid hit", "avoid-exit"],["forced off", "accidental-exit"],["pool time limit", "pool-ending"],["three periods", "de-format"],["veteran ten touches", "ten-touch-format"],["local format", "local-formats"],["y8 format", "y8-format"],["ask remaining time", "ask-time"],["test impossible", "impossible-tests"],["dropped weapon", "dropped-weapon"],["epee target", "epee-target"],["unregistered touch", "unregistered-touch"],["hit chair", "object-touch"],["passed inspection", "prebout-check"],["750 grams", "tip-test"],["foil mask in epee", "conductive-bib"],["lockout", "box-timing"],["grounded runoff", "grounding-runoff"],["point without hit", "penalty-touch"],["restart completed bout", "bout-finished"],["pool ranking", "pool-ranking"],["foil covering target", "foil-covered-target", "foil"],["whip over", "sabre-through-blade", "sabre"],["wrong relay order", "team-order"],["what is remise", "priority-glossary", "foil"],["foil bent arm", "foil-attack", "foil"],["sabre attack preparation", "sabre-attack", "sabre"],["point in line", "point-in-line", "foil"],["beat on forte", "blade-beat", "sabre"],["delayed riposte", "immediate-riposte", "foil"],["stop hit in time", "stop-hit", "sabre"],["simultaneous attacks", "simultaneous-attacks", "foil"],["injury pause", "medical-pause"],["excluded classification", "withdrawal-results"],["non combativity", "non-combativity"],
 ["started before fence","before-fence"],["qualifier fence off","qualifying-cutoff"],
 ["two hands weapon", "weapon-hand"],["equal retreat", "restore-distance"],["side judges", "judge-assistance"],["fuller analysis", "phrase-explanation"],["deliberate floor light", "intentional-false-signal"],
 ['stepped off side','side-exit'],['one metre','side-exit'],['out of bounds','side-exit'],
 ['fleche turned around','passing'],['ran past opponent','passing'],['hit after passing','passing'],
 ['hit floor not foot','floor-touch'],['grounded strip','floor-touch'],['floor','floor-touch'],
 ['reel disconnected','missing-light'],['plug came out','missing-light'],['missing light','missing-light'],
 ['bodycord unplugged','missing-light'],['double but one light','missing-light'],['broken clip','missing-light'],
 ['both lights','epee-double'],['after halt','halt'],['t.95.1','missing-light'],
 ['white light','foil-off-target','foil'],['two lights','foil-two-lights','foil'],
 ['two lights','sabre-two-lights','sabre'],['leg hit','sabre-off-target','sabre']
];
for (const [q,id,w] of examples) assert.equal(hits(q,w)[0]?.offense.id,id,q);
assert.equal(hits('t.95.9').length,0,'no invented subsection');
assert(hits('grounded strip','foil').every(h=>h.offense.id!=='floor-touch'),'épée ground rule cannot leak into foil');
assert(!hits('broken clip','sabre').some(h=>h.offense.id==='missing-light'),'épée body-cord exception cannot leak into sabre');
assert(hits('broken clip','sabre').every(h=>h.related),'a partial shared-word match remains disclosed');
assert.equal(hits('spaceship').length,0);
for (const w of ['epee','foil','sabre']) assert(hits('',w).length>=5);
assert.equal(data.cases.length,82);
assert(data.sources['t.95.1'].includes('safety device'));
assert(data.sources['t.173'].includes('by the fencer'));
assert(data.sources['t.174'].includes('Head Referee'));
const before = JSON.stringify(data); hits('touching body crod twice'); assert.equal(JSON.stringify(data),before);
console.log(`Scoring: ${examples.length} retrieval examples, weapon boundaries, exact citations and source prerequisites passed.`);

for(const [q,id,w] of [['paint on guard','epee-insulated-guard','foil'],['torn strip','epee-strip-torn','sabre'],['guard scored light','sabre-guard-contact','epee'],['permanent white light','foil-equipment-exception','sabre']]) {
  assert(!hits(q,w).some(h=>h.offense.id===id),`weapon-specific exception leaked: ${q}`);
}
assert(data.sources['t.38'].includes('Any double touch will not be counted'));
assert(data.sources['t.44'].includes('even a “coup lancé” is not valid'));
assert(data.sources['USA protest timing'].includes('unhooks'));
assert.equal(data.source_details['USA on-strip protest'].page,15);
assert(data.cases.find(c=>c.id==='overtime').conditions.some(x=>x.includes('different from foil/sabre priority')));
assert(data.cases.find(c=>c.id==='de-final-double').summary.includes('score stays 14–14'));
assert.equal(data.source_details['USA 14–14 competition example'].authority,'corroborating competition report');
console.log('New score/time, domestic procedure and cross-weapon exception checks passed.');

assert.equal(data.coverage.length,69);
for (const topic of data.coverage) for (const w of topic.weapons) {
  assert(topic.route || topic.case_ids.some(id=>data.cases.find(c=>c.id===id)?.weapons.includes(w)),`unmapped topic/weapon ${topic.id} ${w}`);
}
assert(data.coverage.some(t=>t.level==='partial' && t.weapons.includes('epee')),'no false complete-coverage claim');
assert(data.cases.find(c=>c.id==='non-combativity').conditions.includes('Individual DE: '+require('../site/data/updates.json').unwillingness.individual[0]),'completed adoption audit reused');
console.log('All inventory topic/weapon mappings and finishing-double/source distinctions passed.');

assert(hits('withdrawal result').slice(0,2).some(h=>h.offense.id==='withdrawal-results'),'withdrawal result is readily retrieved');
