const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const search = require(path.join(root,'site/search.js'));
const offenses = JSON.parse(fs.readFileSync('site/data/offenses.json'));
const updates = JSON.parse(fs.readFileSync('site/data/updates.json'));
const index = search.create(offenses, updates);
const cases = [
 ['cord', 'g1-electrical-equipment'],
 ['grabbed my cord', 'g1-electrical-equipment'],
 ['touching body cord while fencing twice', 'g1-electrical-equipment'],
 ['touching body crod', 'g1-electrical-equipment'],
 ['missing spare cord', 'g1-equipment-conforming'],
 ['broken bodycord', 'g1-equipment-conforming'],
 ['disconnected cord', 'g1-equipment-conforming'],
 ['forgot spare weapon', 'g1-equipment-conforming'],
 ['mask strap', 'g1-equipment-conforming'],
 ['loose hair', 'g1-hair'],
 ['ponytail', 'g1-hair'],
 ['took my mask off early', 'g1-jostling'],
 ['took mask off before halt', 'g1-jostling'],
 ['free hand', 'g2-nonweapon-arm'],
 ['drop sword on purpose', 'g2-dropping-weapon'],
 ['late', 'presence'],
 ['no show', 'presence'],
 ['not attacking', 'unwillingness'],
 ['one minute without scoring', 'unwillingness'],
 ['step off side', 'g1-crossing-side'],
 ['turn around', 'g1-turning-back'],
 ['parent shouting', 'g3-spectator-disturbance'],
 ['vaping', 'g3-spectator-disturbance'],
 ['warmup', 'g3-warming-up'],
 ['missing inspection sticker', 'g2-control-mark'],
 ['name on jacket', 'g2-name-colors'],
 ['earpiece', 'g4-electronic-comms'],
 ['give away touches', 'g4-collusion'],
 ['agree to lose', 'g4-collusion'],
 ['no salute', 'g4-salute-refusal'],
 ['prohibited substance', 'g4-doping'],
 ['corps à corps', 'g1-corps-a-corps'],
 ['touching electrical equipmnt', 'g1-electrical-equipment'],
 ['t.119', 'presence'],
 ['T.119', 'presence'],
 ['t.29.3', 'g1-electrical-equipment']
];
for (const [query, wanted] of cases) {
 const matches=search.rank(index, query);
 assert.equal(matches[0]?.offense.id, wanted, `${query}: ${matches.slice(0,4).map(m=>m.offense.id).join(', ')}`);
}
const cord=search.rank(index,'cord');
assert(cord.some(m=>m.offense.id==='g1-equipment-conforming'));
assert(!search.rank(index,'mask').some(m=>m.offense.id==='g2-control-mark'), 'do not confuse mask with mark');
assert(!search.rank(index,'missing spare cord').some(m=>m.offense.id==='g1-electrical-equipment'), 'one shared word is insufficient');
for(const query of ['t.119.9','t.1190','t.999 mask','zzzzzz','pizza banana','the and please']) assert.equal(search.rank(index,query).length,0,query);
assert(search.rank(index,'touching body crod')[0].related, 'typos disclosed as related');
assert(search.rank(index,'cord zzzzzzz').every(m=>m.related), 'partial descriptions disclosed');
assert.equal(search.rank(index,'').length,41);
const snapshot=JSON.stringify(offenses); search.rank(index,'touching body cord twice'); assert.equal(JSON.stringify(offenses),snapshot);
const start=performance.now();for(let n=0;n<100;n++)search.rank(index,'touching body crod');
console.log(JSON.stringify({exampleSearches:cases.length,negativeAndIntegrityChecks:'passed',averageMsPerSearch:(performance.now()-start)/100}));

const reviewedPhraseIndex=search.create([
 {id:'reviewed',sort:1,articles:[],search_terms:['fencing time']},
 {id:'context-only',sort:2,articles:[],one_liner:'fencing time'}
],{});
assert.deepEqual(search.rank(reviewedPhraseIndex,'FENCING TIME').map(h=>h.offense.id),['reviewed']);
for(const q of ['fencing','time','fencing times','the and please']) assert.equal(search.rank(reviewedPhraseIndex,q).length,0);
assert.equal(search.rank(index,'fencing time').length,0,'phrase does not invent a penalty match');
console.log('Only explicitly reviewed all-filler phrases match; context and generic filler do not.');
