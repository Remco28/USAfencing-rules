/* Offline reference retrieval. Scores rank entries; they never infer a penalty. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PenaltySearch = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STOP = new Set("a an and are as at be been by can did do does for from had has have how i if in is it me my of on or our that the their them there these they this to was were what when which while with would you your during fencing fencer fencers bout bouts time times twice once first second third result results will please".split(" "));
  var FORMS = { touching: "touch", touched: "touch", touches: "touch", grabbing: "grab", grabbed: "grab", holding: "hold", held: "hold", taking: "take", took: "take", leaving: "leave", left: "leave", missing: "missing", dropped: "drop", dropping: "drop", wearing: "wear", wore: "wear", removing: "remove", removed: "remove", forgot: "forget", forgotten: "forget", refusing: "refuse", refused: "refuse", refusal: "refuse", equipment: "equipment" };
  function normalize(text) {
    return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/bodycords?/g, "body cord").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function stem(word) {
    if (FORMS[word]) return FORMS[word];
    if (word.length > 5 && /ing$/.test(word)) return word.slice(0, -3).replace(/([a-z])\1$/, "$1");
    if (word.length > 4 && /ed$/.test(word)) return word.slice(0, -2).replace(/([a-z])\1$/, "$1");
    if (word.length > 4 && /ies$/.test(word)) return word.slice(0, -3) + "y";
    if (word.length > 3 && /s$/.test(word) && !/ss$/.test(word)) return word.slice(0, -1);
    return word;
  }
  function tokens(text) { return normalize(text).split(/\s+/).filter(function (w) { return w && !STOP.has(w); }).map(stem); }
  function phrase(text) { return tokens(text).join(" "); }
  function oneEdit(a, b) {
    if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length) {
      var differences = [];
      for (var n = 0; n < a.length; n++) if (a[n] !== b[n]) differences.push(n);
      return differences.length === 1 || (differences.length === 2 && differences[1] === differences[0] + 1 && a[differences[0]] === b[differences[1]] && a[differences[1]] === b[differences[0]]);
    }
    var short = a.length < b.length ? a : b, long = a.length < b.length ? b : a;
    var i = 0, j = 0, skipped = false;
    while (i < short.length && j < long.length) {
      if (short[i] === long[j]) { i++; j++; }
      else if (!skipped) { skipped = true; j++; }
      else return false;
    }
    return true;
  }
  function create(offenses, updates) {
    var frequency = {}, vocabulary = new Set();
    var rows = offenses.map(function (offense) {
      var update = updates[offense.id] || {}, weights = {}, phrases = [];
      function add(text, weight) {
        var words = tokens(text);
        phrases.push(words.join(" "));
        words.forEach(function (word) { weights[word] = Math.max(weights[word] || 0, weight); });
      }
      add(offense.one_liner, 6); add(offense.offense_official, 5); add(offense.explainer, 3);
      (offense.search_terms || []).forEach(function (term) { add(term, 6); });
      add(update.summary, 3);
      (update.individual || []).concat(update.team || [], update.notes || []).forEach(function (text) { add(text, 2); });
      (offense.effects || []).forEach(function (effect) { add(effect.title + " " + effect.text, 1); });
      Object.keys(weights).forEach(function (word) { frequency[word] = (frequency[word] || 0) + 1; vocabulary.add(word); });
      return { offense: offense, weights: weights, phrases: phrases };
    });
    return { rows: rows, frequency: frequency, vocabulary: vocabulary };
  }
  function rank(index, query) {
    query = String(query || "").trim();
    if (!query) return index.rows.map(function (row) { return { offense: row.offense, score: 0, related: false }; });
    var citations = query.toLowerCase().match(/\b[tom]\.\d+(?:\.\d+)*(?:\.?[a-z])?\b/g) || [];
    var remainder = query.replace(/\b[tom]\.\d+(?:\.\d+)*(?:\.?[a-z])?\b/gi, " ");
    var words = Array.from(new Set(tokens(remainder)));
    if (!words.length && !citations.length) return [];
    var queryPhrase = phrase(remainder);
    return index.rows.map(function (row) {
      if (!citations.every(function (ref) {
        return row.offense.articles.some(function (article) { return article.toLowerCase() === ref || (/^[tom]\.\d+$/.test(ref) && article.toLowerCase().startsWith(ref + ".")); });
      })) return null;
      var score = 0, found = 0, approximate = false, matched = [];
      words.forEach(function (word) {
        var chosen = word, weight = row.weights[word] || 0, factor = 1;
        if (!weight && !index.vocabulary.has(word)) {
          Object.keys(row.weights).forEach(function (candidate) {
            var prefix = word.length >= 3 && candidate.startsWith(word);
            var typo = !prefix && oneEdit(word, candidate);
            var candidateFactor = prefix ? 0.7 : 0.55;
            if ((prefix || typo) && row.weights[candidate] * candidateFactor > weight * factor) { chosen = candidate; weight = row.weights[candidate]; factor = candidateFactor; }
          });
        }
        if (weight) { found++; matched.push(chosen); approximate = approximate || factor < 1; score += weight * factor * Math.log(1 + index.rows.length / index.frequency[chosen]); }
      });
      var coverage = words.length ? found / words.length : 1;
      if (!citations.length && (!found || coverage < 0.5)) return null;
      if (queryPhrase && row.phrases.some(function (p) { return (" " + p + " ").includes(" " + queryPhrase + " "); })) score += 12;
      score *= coverage;
      var related = coverage < 1 || approximate;
      return { offense: row.offense, score: score, related: related, matched: matched };
    }).filter(Boolean).sort(function (a, b) { return Number(a.related) - Number(b.related) || b.score - a.score || a.offense.sort - b.offense.sort; });
  }
  return { create: create, rank: rank };
});
