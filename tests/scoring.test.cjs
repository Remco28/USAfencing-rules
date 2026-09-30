const assert = require('node:assert/strict');
const data = require('../site/scoring/data/cases.json');
const search = require('../site/search.js');
const entries = data.cases.map(c => ({...c,one_liner:c.title,offense_official:c.title,explainer:c.summary}));
const index = search.create(entries, {});
function hits(q,w='epee') { return search.rank(index,q).filter(h=>h.offense.weapons.includes(w)); }
const examples = [
 ["stepped off back", "rear-exit"],["both feet off", "boundary-touch"],["touch after fall", "fall"],["broken blade", "broken-blade"],["only one test failed", "intermittent-fault"],["light from beat", "epee-spurious-light"],["paint on guard", "epee-insulated-guard"],["torn strip", "epee-strip-torn"],["doubtful double", "epee-doubtful-double"],["4 4 double", "pool-four-all"],["extra minute", "overtime"],["after buzzer", "time-expired"],["back to middle", "restart-position"],["team relay", "team-relay"],["foil equipment test", "foil-equipment", "foil"],["permanent white light", "foil-equipment-exception", "foil"],["saber missing light", "sabre-equipment", "sabre"],["sabre guard insulation", "sabre-guard-insulation", "sabre"],["guard scored light", "sabre-guard-contact", "sabre"],["video review", "official-video"],["wrong pool score", "scoresheet-correction"],["foil bib", "foil-target", "foil"],["sabre hand", "sabre-target", "sabre"],["t.95.2", "epee-strip-torn"],
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
assert.equal(data.cases.length,33);
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
assert(data.cases.find(c=>c.id==='epee-double').caveat.includes('does not establish'));
console.log('New score/time, domestic procedure and cross-weapon exception checks passed.');
