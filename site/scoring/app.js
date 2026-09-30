/* Bounded, source-backed reference retrieval. No automated rulings. */
(function () {
  "use strict";
  var data, index, weapon = "epee", category = "All", query = "", homeScroll = 0, lastRoute = "", facts = {}, diagramStep = 0, filtersOpen = false;
  var labels = { epee: "Épée", foil: "Foil", sabre: "Sabre" };
  var screen = document.getElementById("screen"), input = document.getElementById("search");
  try { var saved = localStorage.getItem("fencing-scoring-weapon"); if (labels[saved]) weapon = saved; } catch (_) {}
  function esc(value) { return String(value || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ruleLink(ref) { var d = (data.source_details || {})[ref]; return '<a class="rule-link" href="' + esc(d ? d.url : data.official_url + '#search=' + encodeURIComponent(ref)) + '" target="_blank" rel="noopener noreferrer">' + esc(ref) + ' · official PDF ↗</a>'; }
  function excerpts(refs) { return '<p class="muted">Selected verbatim excerpts from the pinned official documents. Read the full source for context.</p>' + refs.map(function (ref) { var d = (data.source_details || {})[ref]; return '<div class="source-label">' + ruleLink(ref) + '</div><p class="muted">' + esc(d ? d.title + (d.page ? ' · PDF page ' + d.page : '') : 'USA Fencing Rules for Competition · November 2025') + '</p>' + (d && d.context_note ? '<p class="muted">' + esc(d.context_note) + '</p>' : '') + '<blockquote><p>' + esc(data.sources[ref]) + '</p></blockquote>'; }).join(""); }
  function sourcePanel(refs) { return '<details class="panel"><summary>Rule wording & sources</summary><div>' + excerpts(refs) + '</div></details>'; }
  function syncControls() {
    document.querySelectorAll("[data-weapon]").forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.weapon === weapon)); });
    document.getElementById("clear-search").hidden = !query;
  }
  function route() { return location.hash.replace(/^#\/?/, ""); }
  function results() {
    var available = data.cases.filter(function (c) { return c.weapons.includes(weapon); });
    var count = available.length;
    var ranked = PenaltySearch.rank(index, query).filter(function (hit) { return hit.offense.weapons.includes(weapon) && (category === "All" || hit.offense.category === category); });
    var categories = ["All", "Strip & movement", "Equipment & lights", "Target & scoring", "Score & time", "Review & records"].filter(function (name) { return name === "All" || available.some(function (c) { return c.category === name; }); });
    screen.innerHTML = '<p class="eyebrow">USA Fencing · ' + labels[weapon] + '</p><div class="browse-intro"><h1>Understand the touch.</h1><p class="intro-copy">Find the rule behind what happened.</p><p class="scope">Unofficial reference · Check the conditions.</p></div><details class="filter-panel" id="category-filter"' + (filtersOpen ? ' open' : '') + '><summary>Filter situations <span>' + esc(category === 'All' ? 'All categories' : category) + '</span></summary><div class="categories" role="group" aria-label="Situation category">' + categories.map(function (c) { return '<button type="button" data-category="' + esc(c) + '" aria-pressed="' + (c === category) + '">' + esc(c) + '</button>'; }).join("") + '</div></details><p class="status" role="status" aria-live="polite">' + ranked.length + ' situation' + (ranked.length === 1 ? "" : "s") + (query ? ' for “' + esc(query) + '”' : '') + '</p>' + (ranked.length ? '<div class="results">' + ranked.map(function (hit) {
      var c = hit.offense;
      return '<a class="case-card" href="#/case/' + c.id + '"><span class="tag">' + esc(c.category) + '</span>' + (hit.related ? '<span class="related">Related situation · check the conditions</span>' : '') + '<h2>' + esc(c.title) + '</h2><p>' + esc(c.summary) + '</p><span class="refs">' + esc(c.articles.slice(0, 3).join(' · ')) + ' <span aria-hidden="true">→</span></span></a>';
    }).join("") + '</div>' : '<div class="empty"><h2>No matching situation in this collection</h2><p>Try a shorter description, check your selected weapon, or clear the category. A missing result does not mean there is no rule.</p><button class="button" type="button" data-reset>Show all ' + labels[weapon] + ' situations</button><p style="margin-top:15px">' + ruleLink('') + '</p></div>');
  }
  function diagram(c) {
    if (c.diagram === "boundary") return '<details class="panel"><summary>Picture the side-exit rule</summary><div class="diagram"><svg viewBox="0 0 500 190" role="img" aria-label="Illustrative strip end: a side exit near the rear line and a required one-meter retreat may leave both feet behind that line."><rect x="110" y="25" width="370" height="90" fill="#d8e6f2"/><path d="M150 25v90" stroke="#195a99" stroke-width="3"/><text x="115" y="145" font-size="14" fill="#172b40">Rear line</text><path d="M190 125h-100m0 0 12-7m-12 7 12 7" stroke="#195a99" stroke-width="2" fill="none"/><text x="60" y="175" font-size="14" fill="#172b40">Required retreat: 1 meter</text><circle cx="185" cy="15" r="7" fill="#102b48"/><circle cx="200" cy="15" r="7" fill="#102b48"/><circle cx="80" cy="75" r="7" fill="#78501a"/><circle cx="95" cy="75" r="7" fill="#78501a"/><text x="218" y="18" font-size="13" fill="#172b40">Side exit</text><text x="12" y="55" font-size="13" fill="#172b40">Both feet</text><text x="12" y="97" font-size="13" fill="#172b40">behind line</text></svg><p class="diagram-caption">Illustration only, not to scale. Check the actual exit point, attack start and correct on-guard distance. An accidental exit has an exception.</p></div></details>';
    if (c.diagram === "passing") return '<details class="panel"><summary>Walk through the passing example</summary><div class="diagram"><div id="passing-picture"></div><div class="diagram-controls" role="group" aria-label="Passing example stage">' + ['Approach','Passing','After passing'].map(function (s, i) { return '<button type="button" data-step="' + i + '" aria-pressed="' + (i === diagramStep) + '">' + s + '</button>'; }).join('') + '</div><p id="diagram-caption" class="diagram-caption" role="status"></p><p class="muted">A = the fencer going past. B = the fencer being passed. Illustration assumes no other fault; foil and sabre conventions still apply.</p></div></details>';
    return "";
  }
  function updateDiagram() {
    var root = document.getElementById('passing-picture'); if (!root) return;
    var x = [130,250,370][diagramStep];
    root.innerHTML = '<svg viewBox="0 0 500 130" role="img" aria-label="' + ['A approaches B','A passes B','A has gone past B'][diagramStep] + '"><rect x="20" y="40" width="460" height="55" rx="4" fill="#d8e6f2"/><circle cx="' + x + '" cy="65" r="18" fill="#102b48"/><text x="' + (x - 5) + '" y="70" fill="white" font-size="15">A</text><circle cx="275" cy="' + (diagramStep === 1 ? 28 : 65) + '" r="18" fill="#195a99"/><text x="270" y="' + (diagramStep === 1 ? 33 : 70) + '" fill="white" font-size="15">B</text><path d="M45 110h65m0 0-9-5m9 5-9 5" stroke="#102b48" stroke-width="2"/><text x="125" y="116" font-size="13" fill="#172b40">A’s direction of movement</text></svg>';
    document.getElementById('diagram-caption').textContent = ['Before passing, ordinary validity rules apply. The diagram does not establish when a touch occurred.', 'A touch made immediately as A passes B can be valid. The referee calls Halt once A goes completely past B.', 'A’s touch made after passing is annulled. B may make an immediate touch, even while turning. A new action after Halt is not allowed.'][diagramStep];
    document.querySelectorAll('[data-step]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.step) === diagramStep)); });
  }
  function related(c) {
    var cases = (c.related_cases || []).map(function (id) { return data.cases.find(function (other) { return other.id === id && other.weapons.includes(weapon); }); }).filter(Boolean);
    var companion = c.companion_links || [];
    return cases.length || companion.length ? '<section class="panel related-cases"><h2>Check a nearby situation</h2><ul>' + cases.map(function (other) { return '<li><a href="#/case/' + esc(other.id) + '">' + esc(other.title) + '</a></li>'; }).join('') + companion.map(function(link) { return '<li><a href="' + esc(link.href) + '">' + esc(link.title) + ' ↗</a></li>'; }).join('') + '</ul></section>' : '';
  }
  function detail(c) {
    if (!c.weapons.includes(weapon)) {
      screen.innerHTML = '<a class="back" href="#/">← Back to situations</a><div class="empty"><h1>This entry covers ' + c.weapons.map(function (w) { return labels[w]; }).join(', ') + '</h1><p>You currently have ' + labels[weapon] + ' selected. Change the weapon to read this entry in its intended context.</p>' + c.weapons.map(function (w) { return '<button class="button" type="button" data-switch="' + w + '">Read for ' + labels[w] + '</button>'; }).join(' ') + '</div>'; return;
    }
    screen.innerHTML = '<a class="back" href="#/">← Back to situations</a><p class="eyebrow">' + labels[weapon] + ' · ' + esc(c.category) + '</p><h1>' + esc(c.title) + '</h1><div class="answer">' + esc(c.summary) + '</div><div class="detail-grid"><div><section class="panel"><h2>What the rule depends on</h2><ul>' + c.conditions.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' + (c.caveat ? '<p class="caveat">' + esc(c.caveat) + '</p>' : '') + '</section>' + diagram(c) + sourcePanel(c.articles) + related(c) + '</div><aside><details class="panel"><summary>Sort out the facts</summary><div><p class="muted">Optional notes for this visit. Mark what is established or still unclear. These choices do not decide a touch or recommend an appeal.</p>' + c.questions.map(function (q, i) { var key = c.id + '-' + i; return '<label class="question"><span>' + esc(q) + '</span><select data-fact="' + key + '"><option value="">Not recorded</option><option value="known">Established / I know the answer</option><option value="unclear">Still unclear</option><option value="na">Does not apply</option></select></label>'; }).join('') + '<p id="fact-status" class="muted" role="status"></p><button type="button" class="button" data-clear-facts="' + c.id + '">Clear notes</button></div></details><section class="panel"><p class="eyebrow">At the strip</p><h2>Before seeking review</h2><p>Distinguish what the referee observed from how a particular rule was applied. Equipment testing has its own timing and preservation requirements.</p><a href="#/review">Who can ask, when, and who reviews →</a></section><p class="muted">Unofficial explanation. Official rules and the event’s officials control the decision.</p></aside></div>';
    document.querySelectorAll('[data-fact]').forEach(function (s) { s.value = facts[s.dataset.fact] || ''; });
    updateFactStatus(); updateDiagram();
  }
  function updateFactStatus() {
    var selects = Array.from(document.querySelectorAll('[data-fact]')), status = document.getElementById('fact-status');
    if (status) status.textContent = selects.filter(function (s) { return s.value === 'unclear'; }).length + ' unclear · ' + selects.filter(function (s) { return !s.value; }).length + ' not recorded. Notes stay only in this open page.';
  }
  function review() {
    screen.innerHTML = "<p class=\"eyebrow\">USA Fencing \u00b7 procedure</p><h1>Understand the route for review.</h1><p class=\"review-intro\">Choose the question you actually have. A coach, parent or teammate can help find the rule; the eligible fencer or captain makes the formal request. This guide cannot determine whether a protest is justified.</p><div class=\"review-grid\">\n<section class=\"panel\"><h2>Ask for an explanation</h2><p>Ask courteously which facts the referee found and which rule they applied. A different view of the action does not itself establish a rule error.</p><p>Under t.172, an ordinary appeal cannot challenge a point of fact: what the referee observed, including touch validity or their analysis of priority. Official video has its own route.</p></section>\n<section class=\"panel\"><h2>Request equipment tests</h2><p>Ask immediately after the stop, preserve the equipment, and let the referee supervise testing. Changing or unplugging equipment prematurely can lose the right to annulment. Restarting fencing ends a claim to cancel the preceding touch under t.56.</p><p>A fault can support annulment under the applicable weapon rules. It does not award an unregistered touch.</p></section>\n<section class=\"panel\"><h2>Protest application of a rule</h2><p>If a definite rule was misunderstood or applied contrary to its wording, t.172 allows a rule-application appeal. In individual events, <strong>the fencer</strong> asks; in teams, <strong>the fencer or team captain</strong> may ask. Speak courteously to the referee immediately, before a decision about a subsequent touch (t.173).</p><p><strong>Domestic procedure:</strong> the 2026\u201327 Operations Manual says the Head Referee first determines whether an on-strip protest is valid and reviewable. For a reviewable protest, the full Bout Committee convenes at the strip; its appellate decision is final.</p><p><strong>Stay hooked up and raise it immediately.</strong> The manual ends the opportunity once the fencer unhooks or fences an additional touch.</p><p class=\"muted\">The November rulebook t.174 names the Head Referee as the authority to settle the appeal; the newer domestic manual describes the Bout Committee route. Ask the Head Referee to identify the applicable event procedure. Do not assume that finding a clause establishes a right to overturn the call.</p><p class=\"caveat\">t.172 and t.174 provide penalties for challenges to points of fact or appeals deemed unjustified.</p></section>\n<section class=\"panel\"><h2>Use official video, if provided</h2><p>Only the fencer on the strip may request official video review (t.60). The technical rules provide one possible request per pool bout, two per individual DE bout, and one per team relay bout. A successful request is retained (t.61).</p><p>A personal phone recording does not establish a right to official video review. Availability depends on the event. Ask the referee about its procedure; official video decisions have their own finality rules in t.62.</p></section>\n<section class=\"panel\"><h2>Correct the recorded score</h2><p>A wrong scoresheet is different from disagreeing with a touch decision. Contact the Bout Committee during the pool or the regular review period before DE. The 2026\u201327 Athlete Handbook describes agreement between the fencers, the bout-by-bout listing, and consultation with the referee.</p><p>If agreement cannot be reached, the recorded score stands. Both fencers must be present for the referee to change a scoresheet before it is submitted. The review period is not extended for deliberations.</p><p>In this scoresheet procedure, fencer or spectator videos and photos are not valid score documents. That restriction is specific to recorded-score correction.</p></section>\n<section class=\"panel\"><h2>Other event decisions</h2><p>t.175 directs written complaints unrelated to a referee\u2019s decision to the Bout Committee. The manual separately provides a Jury of Appeal route for Bout Committee decisions made outside its appellate role. That is not a further appeal of its on-strip appellate decision.</p><p>Ask the event which procedure and deadline apply before proceeding.</p></section></div>" + sourcePanel(["t.172.1", "t.172.2", "t.173", "t.174", "t.175", "t.56.2", "t.56.3", "t.56.4", "USA on-strip protest", "USA protest timing", "USA appellate decision", "USA scoresheet correction", "USA scoresheet evidence", "USA scoresheet deadline"]);
  }
  function coverage() {
    var topics = data.coverage.filter(function(t) { return t.weapons.includes(weapon); });
    var partial = topics.filter(function(t) { return t.level === 'partial'; });
    screen.innerHTML = '<a class="back" href="#/about">← About this guide</a><p class="eyebrow">' + labels[weapon] + ' · scope</p><h1>What this guide covers.</h1><p class="intro-copy">This maps our practical topic inventory to published explanations. It is not a claim to cover every rule or certify every interpretation.</p><div class="answer">' + topics.length + ' inventory topics apply to ' + labels[weapon] + '. ' + partial.length + ' have explicit partial-coverage limits.</div><p>“Bounded” means a cited explanation covers a defined situation and its stated conditions. “Partial” means the topic also has limits we have not resolved or modeled.</p>' + topics.map(function(t) {
      var cases = t.case_ids.map(function(id) { return data.cases.find(function(c) { return c.id === id && c.weapons.includes(weapon); }); }).filter(Boolean);
      return '<section class="panel coverage-topic" data-coverage="' + esc(t.level) + '"><p class="eyebrow">' + (t.level === 'partial' ? 'Partial coverage' : 'Bounded explanation') + '</p><h2>' + esc(t.title) + '</h2><p class="muted">' + esc(t.note) + '</p><ul>' + cases.map(function(c) { return '<li><a href="#/case/' + c.id + '">' + esc(c.title) + '</a></li>'; }).join('') + (t.route ? '<li><a href="#/' + t.route + '">Review procedure</a></li>' : '') + '</ul></section>';
    }).join('');
  }
  function about() {
    screen.innerHTML = '<p class="eyebrow">Companion to the penalty guide</p><h1>A reference for understanding scoring.</h1><section class="panel"><h2>Scope and sources</h2><p><a href="#/coverage">See coverage and remaining limits for your weapon →</a></p><p>This unofficial collection has ' + data.cases.length + ' situations: ' + data.cases.filter(function(c){return c.weapons.includes('epee');}).length + ' for épée, ' + data.cases.filter(function(c){return c.weapons.includes('foil');}).length + ' for foil and ' + data.cases.filter(function(c){return c.weapons.includes('sabre');}).length + ' for sabre. Shared situations count for each applicable weapon. It covers common movement, equipment, score/time and review questions. Written conventions are explained with their conditions; the guide does not judge borderline action videos or certify every possible situation.</p><p>Explanations and selected source excerpts use the <strong>November 2025 USA Fencing Rules for Competition</strong>, the <strong>2026–27 Athlete Handbook and Operations Manual</strong>, and official domestic sabre guidance. Each cited document is identified with its edition and a link. These entries were audited September 30, 2026. The companion shares the repository’s preserved sources and October-update audit; it does not assume every newer FIE rule automatically applies domestically.</p><p><a href="' + esc(data.official_url) + '" target="_blank" rel="noopener noreferrer">Official USA Fencing rulebook ↗</a> · <a href="https://www.usafencing.org/rules-compliance" target="_blank" rel="noopener noreferrer">Current official resources ↗</a></p></section><section class="panel"><h2>Search finds explanations</h2><p>Reviewed everyday terms and modest typo matching help retrieve entries. Related matches are labeled. Search does not establish what happened, predict a referee’s decision or recommend an appeal. Weapon and category selections strictly limit results.</p><p>If something is missing, try a shorter phrase or the official rulebook. No result does not mean no rule exists.</p></section><section class="panel"><h2>Works at the strip</h2><p>After a complete online visit, this guide and its excerpts work offline. Source PDF links need a connection. There are no accounts, model calls or analytics. The weapon choice is saved in this browser; optional fact notes remain only in the current page and are lost when it closes or reloads.</p><p><a href="../">Open the fencing penalty guide →</a></p></section>';
  }
  function render() {
    if (!data) return;
    var current = route();
    syncControls();
    document.querySelectorAll('[data-nav]').forEach(function (a) { if ((a.dataset.nav === 'home' && !current) || a.dataset.nav === current) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    if (!current) results();
    else if (current === 'review') review();
    else if (current === 'about') about();
    else if (current === 'coverage') coverage();
    else {
      var c = data.cases.find(function (s) { return current === 'case/' + s.id; });
      if (c) detail(c); else screen.innerHTML = '<div class="empty"><h1>Situation not found</h1><a href="#/">Browse the current collection</a></div>';
    }
    document.title = (screen.querySelector('h1') ? screen.querySelector('h1').textContent : 'Fencing scoring') + ' · Fencing Scoring';
    if (current !== lastRoute) {
      window.scrollTo({top: !current ? homeScroll : 0, behavior:'instant'});
      if (current) document.getElementById('content').focus({preventScroll:true});
    }
    lastRoute = current;
  }
  function setWeapon(w) {
    weapon = w; category = 'All'; homeScroll = 0;
    try { localStorage.setItem('fencing-scoring-weapon', w); } catch (_) {}
    render();
  }
  function search() {
    query = input.value; homeScroll = 0;
    if (route()) location.hash = '/'; else render();
    window.scrollTo({top:0,behavior:'instant'});
  }
  input.addEventListener('input', search);
  document.getElementById('search-form').addEventListener('submit', function (e) { e.preventDefault(); search(); });
  document.getElementById('clear-search').addEventListener('click', function () { input.value = ''; search(); input.focus(); });
  document.addEventListener('click', function (e) {
    var w = e.target.closest('[data-weapon], [data-switch]'); if (w) setWeapon(w.dataset.weapon || w.dataset.switch);
    var categoryButton = e.target.closest('[data-category]'); if (categoryButton) { category = categoryButton.dataset.category; render(); }
    if (e.target.closest('[data-reset]')) { query = ''; input.value = ''; category = 'All'; render(); }
    if (e.target.closest('.case-card')) homeScroll = window.scrollY;
    var step = e.target.closest('[data-step]'); if (step) { diagramStep = Number(step.dataset.step); updateDiagram(); }
    var clear = e.target.closest('[data-clear-facts]'); if (clear) { Object.keys(facts).filter(function (k) { return k.startsWith(clear.dataset.clearFacts + '-'); }).forEach(function (k) { delete facts[k]; }); document.querySelectorAll('[data-fact]').forEach(function (s) { s.value=''; }); updateFactStatus(); }
  });
  document.addEventListener('toggle', function(e) { if(e.target.id === 'category-filter') filtersOpen = e.target.open; }, true);
  document.addEventListener('change', function (e) { if (e.target.dataset.fact) { facts[e.target.dataset.fact] = e.target.value; updateFactStatus(); } });
  window.addEventListener('hashchange', render);
  var hadController = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (!hadController || document.getElementById('guide-update')) return;
    var notice = document.createElement('div'); notice.id = 'guide-update'; notice.className = 'guide-update'; notice.setAttribute('role','status');
    notice.innerHTML = '<span>Updated guide available</span><button type="button">Reload guide</button>';
    notice.querySelector('button').addEventListener('click', function() { location.reload(); });
    document.body.appendChild(notice);
  });
  fetch('data/cases.json').then(function (r) { if (!r.ok) throw new Error('Reference unavailable'); return r.json(); }).then(function (d) {
    data = d;
    var entries = data.cases.map(function (c) { return Object.assign({},c,{one_liner:c.title,offense_official:c.title,explainer:c.summary}); });
    index = PenaltySearch.create(entries, {});
    document.getElementById('loading').hidden = true;
    render();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', {scope:'./'}).catch(function () {});
  }).catch(function () { document.getElementById('loading').innerHTML = 'The scoring reference could not load. <a href="">Try again</a>, or <a href="https://www.usafencing.org/rules-compliance">open the official rules</a>.'; });
})();
