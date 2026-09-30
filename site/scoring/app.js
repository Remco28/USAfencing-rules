/* Bounded, source-backed reference retrieval. No automated rulings. */
(function () {
  "use strict";
  var data, index, weapon = "epee", category = "All", query = "", homeScroll = 0, lastRoute = "", facts = {}, diagramStep = 0;
  var labels = { epee: "Épée", foil: "Foil", sabre: "Sabre" };
  var screen = document.getElementById("screen"), input = document.getElementById("search");
  try { var saved = localStorage.getItem("fencing-scoring-weapon"); if (labels[saved]) weapon = saved; } catch (_) {}
  function esc(value) { return String(value || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ruleLink(ref) { return '<a class="rule-link" href="' + esc(data.official_url) + '#search=' + encodeURIComponent(ref) + '" target="_blank" rel="noopener noreferrer">' + esc(ref) + ' · official PDF ↗</a>'; }
  function excerpts(refs) { return '<p class="muted">USA Fencing Rules for Competition · November 2025. Selected verbatim excerpts; use the full article for context.</p>' + refs.map(function (ref) { return '<div class="source-label">' + ruleLink(ref) + '</div><blockquote><p>' + esc(data.sources[ref]) + '</p></blockquote>'; }).join(""); }
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
    var categories = ["All", "Strip & movement", "Equipment & lights", "Target & scoring"].filter(function (name) { return name === "All" || available.some(function (c) { return c.category === name; }); });
    screen.innerHTML = '<p class="eyebrow">USA Fencing · ' + labels[weapon] + '</p><h1>Understand the touch.</h1><p class="intro-copy">Find the rule behind what happened.</p><p class="scope">Unofficial reference · A focused first collection.</p><div class="categories" role="group" aria-label="Situation category">' + categories.map(function (c) { return '<button type="button" data-category="' + esc(c) + '" aria-pressed="' + (c === category) + '">' + esc(c) + '</button>'; }).join("") + '</div><p class="status" role="status" aria-live="polite">' + ranked.length + ' situation' + (ranked.length === 1 ? "" : "s") + (query ? ' for “' + esc(query) + '”' : '') + '</p>' + (ranked.length ? '<div class="results">' + ranked.map(function (hit) {
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
  function detail(c) {
    if (!c.weapons.includes(weapon)) {
      screen.innerHTML = '<a class="back" href="#/">← Back to situations</a><div class="empty"><h1>This entry covers ' + c.weapons.map(function (w) { return labels[w]; }).join(', ') + '</h1><p>You currently have ' + labels[weapon] + ' selected. Change the weapon to read this entry in its intended context.</p>' + c.weapons.map(function (w) { return '<button class="button" type="button" data-switch="' + w + '">Read for ' + labels[w] + '</button>'; }).join(' ') + '</div>'; return;
    }
    screen.innerHTML = '<a class="back" href="#/">← Back to situations</a><p class="eyebrow">' + labels[weapon] + ' · ' + esc(c.category) + '</p><h1>' + esc(c.title) + '</h1><div class="answer">' + esc(c.summary) + '</div><div class="detail-grid"><div><section class="panel"><h2>What the rule depends on</h2><ul>' + c.conditions.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' + (c.caveat ? '<p class="caveat">' + esc(c.caveat) + '</p>' : '') + '</section>' + diagram(c) + sourcePanel(c.articles) + '</div><aside><details class="panel"><summary>Sort out the facts</summary><div><p class="muted">Optional notes for this visit. Mark what is established or still unclear. These choices do not decide a touch or recommend an appeal.</p>' + c.questions.map(function (q, i) { var key = c.id + '-' + i; return '<label class="question"><span>' + esc(q) + '</span><select data-fact="' + key + '"><option value="">Not recorded</option><option value="known">Established / I know the answer</option><option value="unclear">Still unclear</option><option value="na">Does not apply</option></select></label>'; }).join('') + '<p id="fact-status" class="muted" role="status"></p><button type="button" class="button" data-clear-facts="' + c.id + '">Clear notes</button></div></details><section class="panel"><p class="eyebrow">At the strip</p><h2>Before seeking review</h2><p>Distinguish what the referee observed from how a particular rule was applied. Equipment testing has its own timing and preservation requirements.</p><a href="#/review">Who can ask, when, and who reviews →</a></section><p class="muted">Unofficial explanation. Official rules and the event’s officials control the decision.</p></aside></div>';
    document.querySelectorAll('[data-fact]').forEach(function (s) { s.value = facts[s.dataset.fact] || ''; });
    updateFactStatus(); updateDiagram();
  }
  function updateFactStatus() {
    var selects = Array.from(document.querySelectorAll('[data-fact]')), status = document.getElementById('fact-status');
    if (status) status.textContent = selects.filter(function (s) { return s.value === 'unclear'; }).length + ' unclear · ' + selects.filter(function (s) { return !s.value; }).length + ' not recorded. Notes stay only in this open page.';
  }
  function review() {
    screen.innerHTML = '<p class="eyebrow">USA Fencing · procedure</p><h1>Understand the route for review.</h1><p class="review-intro">A coach, parent or teammate can help find the rule. The rulebook specifies who may make an appeal. Looking up a situation does not establish that an appeal is justified.</p><div class="review-grid"><section class="panel"><h2><span class="step">1</span>What is being questioned?</h2><p><strong>A point of fact:</strong> what the referee observed or how they analyzed the action. This includes validity and priority, and whether a fencer left the strip. t.172 does not permit an ordinary appeal against that decision.</p><p><strong>A definite rule:</strong> if the referee misunderstands it or applies it contrary to the rules, t.172 permits an appeal on that matter.</p><p class="muted">A useful clarification: “Which rule applies to the facts you found?” A different view of the action does not by itself establish a rule error.</p></section><section class="panel"><h2><span class="step">2</span>Who asks, and when?</h2><p>In an individual event, <strong>the fencer</strong> makes the appeal. In a team event, <strong>the fencer or team captain</strong> may do so.</p><p>It is made verbally and courteously to the referee, immediately and before any decision about a subsequent touch. See t.173.</p><p>For equipment testing, preserve the setup and ask for referee-supervised tests immediately after the stop. t.56 has stricter limits: restarting fencing ends the claim to annul the preceding touch.</p></section><section class="panel"><h2><span class="step">3</span>Who reviews?</h2><p>If the referee maintains their interpretation, <strong>the Head Referee</strong> settles the appeal under t.174. The event can help locate that official.</p><p>t.175 sends other written complaints and protests, concerning matters other than a referee’s decision, to the Bout Committee.</p><p class="caveat">t.172 and t.174 provide penalties for challenges to points of fact or appeals deemed unjustified. This guide cannot determine whether your appeal is justified.</p></section><section class="panel"><h2>What about video?</h2><p>Official video-refereeing appeals are a separate exception, under t.60–63 and o.105. Those technical rules apply at USA Fencing tournaments where video refereeing is in use.</p><p>This first collection does not cover the full video-review procedure. A personal phone recording does not itself establish a right to official video review.</p><p><a href="' + esc(data.official_url) + '#search=t.60" target="_blank" rel="noopener noreferrer">Read the official video procedure ↗</a></p></section></div><div style="margin-top:20px">' + sourcePanel(['t.172.1','t.172.2','t.173','t.174','t.175','t.56.2','t.56.3','t.56.4']) + '</div>';
  }
  function about() {
    screen.innerHTML = '<p class="eyebrow">Companion to the penalty guide</p><h1>A reference for understanding scoring.</h1><section class="panel"><h2>Scope and sources</h2><p>This unofficial first collection has 10 situations: six for épée, five for foil and five for sabre, with shared situations counted for each applicable weapon. Épée equipment questions receive the most detail. It is not a complete guide to priority, final scores, time limits or video review.</p><p>Explanations and selected source excerpts use the <strong>November 2025 USA Fencing Rules for Competition</strong>. These entries were audited September 30, 2026. The companion shares the repository’s preserved sources and October-update audit; it does not assume every newer FIE rule automatically applies domestically.</p><p><a href="' + esc(data.official_url) + '" target="_blank" rel="noopener noreferrer">Official USA Fencing rulebook ↗</a> · <a href="https://www.usafencing.org/rules-compliance" target="_blank" rel="noopener noreferrer">Current official resources ↗</a></p></section><section class="panel"><h2>Search finds explanations</h2><p>Reviewed everyday terms and modest typo matching help retrieve entries. Related matches are labeled. Search does not establish what happened, predict a referee’s decision or recommend an appeal. Weapon and category selections strictly limit results.</p><p>If something is missing, try a shorter phrase or the official rulebook. No result does not mean no rule exists.</p></section><section class="panel"><h2>Works at the strip</h2><p>After a complete online visit, this guide and its excerpts work offline. Source PDF links need a connection. There are no accounts, model calls or analytics. The weapon choice is saved in this browser; optional fact notes remain only in the current page and are lost when it closes or reloads.</p><p><a href="../">Open the fencing penalty guide →</a></p></section>';
  }
  function render() {
    if (!data) return;
    var current = route();
    syncControls();
    document.querySelectorAll('[data-nav]').forEach(function (a) { if ((a.dataset.nav === 'home' && !current) || a.dataset.nav === current) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    if (!current) results();
    else if (current === 'review') review();
    else if (current === 'about') about();
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
  document.getElementById('focus-search').addEventListener('click', function () { homeScroll=0; location.hash='/'; window.scrollTo({top:0,behavior:'instant'}); input.focus(); });
  document.addEventListener('click', function (e) {
    var w = e.target.closest('[data-weapon], [data-switch]'); if (w) setWeapon(w.dataset.weapon || w.dataset.switch);
    var categoryButton = e.target.closest('[data-category]'); if (categoryButton) { category = categoryButton.dataset.category; render(); }
    if (e.target.closest('[data-reset]')) { query = ''; input.value = ''; category = 'All'; render(); }
    if (e.target.closest('.case-card')) homeScroll = window.scrollY;
    var step = e.target.closest('[data-step]'); if (step) { diagramStep = Number(step.dataset.step); updateDiagram(); }
    var clear = e.target.closest('[data-clear-facts]'); if (clear) { Object.keys(facts).filter(function (k) { return k.startsWith(clear.dataset.clearFacts + '-'); }).forEach(function (k) { delete facts[k]; }); document.querySelectorAll('[data-fact]').forEach(function (s) { s.value=''; }); updateFactStatus(); }
  });
  document.addEventListener('change', function (e) { if (e.target.dataset.fact) { facts[e.target.dataset.fact] = e.target.value; updateFactStatus(); } });
  window.addEventListener('hashchange', render);
  fetch('data/cases.json').then(function (r) { if (!r.ok) throw new Error('Reference unavailable'); return r.json(); }).then(function (d) {
    data = d;
    var entries = data.cases.map(function (c) { return Object.assign({},c,{one_liner:c.title,offense_official:c.title,explainer:c.summary}); });
    index = PenaltySearch.create(entries, {});
    document.getElementById('loading').hidden = true;
    render();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', {scope:'./'}).catch(function () {});
  }).catch(function () { document.getElementById('loading').innerHTML = 'The scoring reference could not load. <a href="">Try again</a>, or <a href="https://www.usafencing.org/rules-compliance">open the official rules</a>.'; });
})();
