const assert = require('node:assert/strict');
const data = require('../site/scoring/data/cases.json');
const search = require('../site/search.js');
const entries = data.cases.map(c => ({...c,one_liner:c.title,offense_official:c.title,explainer:c.summary}));
const index = search.create(entries, {});
function hits(q,w='epee') { return search.rank(index,q).filter(h=>h.offense.weapons.includes(w)); }
const examples = [
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
assert.equal(hits('t.95.2').length,0,'no invented subsection');
assert(hits('grounded strip','foil').every(h=>h.offense.id!=='floor-touch'),'épée ground rule cannot leak into foil');
assert.equal(hits('broken clip','sabre').length,0,'épée body-cord exception cannot leak into sabre');
assert.equal(hits('spaceship').length,0);
for (const w of ['epee','foil','sabre']) assert(hits('',w).length>=5);
assert.equal(data.cases.length,10);
assert(data.sources['t.95.1'].includes('safety device'));
assert(data.sources['t.173'].includes('by the fencer'));
assert(data.sources['t.174'].includes('Head Referee'));
const before = JSON.stringify(data); hits('touching body crod twice'); assert.equal(JSON.stringify(data),before);
console.log(`Scoring: ${examples.length} retrieval examples, weapon boundaries, exact citations and source prerequisites passed.`);
