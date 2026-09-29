/* USA Fencing penalty reference. Static app; data is exported from db/penalties.sqlite. */
(function () {
  "use strict";

  var DATA = { offenses: [], articles: {}, figures: [], legend: null, updates: {} };
  var LEARN_SECTIONS = [
    { title: "Calls and passivity", sub: "Being present when called; actively fencing.", ids: ["presence", "unwillingness"] },
    { title: "Group 1 · Usually a warning first", sub: "A Yellow warning, then Red penalty touches for later offenses in this group. Check the entry for exceptions.", ids: ["g1-leaving-strip", "g1-corps-a-corps", "g1-turning-back", "g1-covering-target", "g1-electrical-equipment", "g1-crossing-side", "g1-delaying", "g1-equipment-conforming", "g1-straighten-weapon", "g1-dragging-point", "g1-sabre-guard", "g1-refusal-obey", "g1-hair", "g1-jostling", "g1-abnormal-action", "g1-unjustified-appeal", "g1-strip-enclosure"] },
    { title: "Group 2 · Penalty touches", sub: "Red penalty touches from the first offense; a prior Group 1 warning is not needed.", ids: ["g2-nonweapon-arm", "g2-medical", "g2-control-mark", "g2-dropping-weapon", "g2-name-colors", "g2-deliberate-off-target", "g2-dangerous-action"] },
    { title: "Group 3 · Conduct and venue rules", sub: "Misconduct and disruption. Repetition can lead to exclusion; some entries allow it immediately.", ids: ["g3-disturbing-order", "g3-dishonest", "g3-publicity", "g3-spectator-disturbance", "g3-warming-up", "g3-antisporting"] },
    { title: "Group 4 · Immediate exclusion", sub: "Can bring immediate exclusion from the competition.", ids: ["g4-electronic-comms", "g4-falsified-marks", "g4-manifest-cheating", "g4-refusal-to-fence", "g4-sportsmanship", "g4-salute-refusal", "g4-collusion", "g4-violent-actions", "g4-doping"] }
  ];
  var GROUP_ORDER = ["preamble", "1st Group", "2nd Group", "3rd Group", "4th Group"];
  var GROUP_SHORT = { preamble: "Calls & passivity", "1st Group": "Group 1", "2nd Group": "Group 2", "3rd Group": "Group 3", "4th Group": "Group 4" };
  var SEARCH_INDEX = null;
  var LOOKUP_MATCHES = {};
  var lookupState = { q: "", group: "All", card: "All", weapon: "All" };
  var disputeFam = null;
  var lastFocus = null;
  var currentView = null;
  var viewScroll = {};

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function norm(value) {
    return (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function sortByChart(list) {
    var order = {};
    GROUP_ORDER.forEach(function (group, index) { order[group] = index; });
    return list.sort(function (a, b) { return (order[a.section] - order[b.section]) || (a.sort - b.sort); });
  }
  function chipClass(text) {
    if (!text) return "none";
    if (text.indexOf("P-yellow") !== -1) return "p-yellow";
    if (text.indexOf("P-red") !== -1) return "p-red";
    if (text.indexOf("P-black") !== -1) return "p-black";
    if (text.indexOf("Yellow") !== -1) return "yellow";
    if (text.indexOf("Red") !== -1) return "red";
    if (text.indexOf("Black") !== -1 || text.indexOf("Elimination") !== -1) return "black";
    if (text.indexOf("Warning") !== -1) return "warn";
    return "neutral";
  }
  function families(offense) {
    var found = {};
    [offense.pen_first, offense.pen_second, offense.pen_third].forEach(function (text) {
      if (!text) return;
      if (text.indexOf("P-") !== -1) {
        found.P = true;
        return;
      }
      if (text.indexOf("Yellow") !== -1 || text.indexOf("Warning") !== -1) found.Y = true;
      if (text.indexOf("Red") !== -1) found.R = true;
      if (text.indexOf("Black") !== -1 || text.indexOf("Elimination") !== -1) found.B = true;
    });
    return found;
  }
  function weapons(offense) {
    var text = norm([offense.offense_official, offense.one_liner, offense.explainer].join(" "));
    var found = [];
    if (text.indexOf("foil") !== -1 || text.indexOf("(f,e)") !== -1 || /(^|[^a-z])f,e([^a-z]|$)/.test(text)) found.push("Foil");
    if (text.indexOf("epee") !== -1 || text.indexOf("(f,e)") !== -1 || /(^|[^a-z])f,e([^a-z]|$)/.test(text)) found.push("Épée");
    if (text.indexOf("sabre") !== -1) found.push("Sabre");
    return found;
  }
  function appliesToWeapon(offense, weapon) {
    var specific = weapons(offense);
    return !specific.length || specific.indexOf(weapon) !== -1;
  }
  function setLookupFilter(name, value) {
    lookupState[name] = value;
    renderFilterChips();
    renderLookup();
    var button = document.querySelector('[data-filter="' + name + '"][data-value="' + value + '"]');
    if (button) button.focus();
  }
  function groupClass(section) {
    if (section === "preamble") return "g-preamble";
    var match = section.match(/^(\d)/);
    return match ? "g-" + match[1] : "";
  }
  function slotChip(label, text) {
    var wrap = el("div", "slot");
    wrap.appendChild(el("span", "lbl", label));
    var concise = (text || "—").replace(/^(?:1st|2nd|3rd) (?:call|time):\s*/i, "").replace(/\s*\(footnote[^)]*\)/gi, "").replace(/\s*\(≥3rd\)/g, "");
    wrap.appendChild(el("div", "chip " + chipClass(text || ""), concise));
    return wrap;
  }
  function makeFigureButton(fig) {
    var button = el("button", "fig-card");
    button.type = "button";
    button.setAttribute("aria-label", "View figure " + fig.key + ": " + fig.caption);
    var img = document.createElement("img");
    img.loading = "lazy";
    img.src = fig.file.replace(/^site\//, "");
    img.alt = fig.caption;
    button.appendChild(img);
    var caption = el("span", null);
    caption.appendChild(el("strong", null, "Fig " + fig.key));
    caption.appendChild(document.createTextNode(fig.caption));
    button.appendChild(caption);
    button.addEventListener("click", function () { openLightbox(fig, button); });
    return button;
  }
  function addUpdateSources(host, update) {
    var sources = el("div", "update-sources");
    update.sources.forEach(function (source) {
      var link = el("a", "inline-link", source.label + " ↗");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      sources.appendChild(link);
    });
    host.appendChild(sources);
  }
  function offenseCard(offense) {
    var update = DATA.updates[offense.id];
    var card = el("article", "off " + groupClass(offense.section));
    card.id = "off-" + offense.id;

    var top = el("div", "off-top");
    top.appendChild(el("span", "grp", offense.section === "preamble" ? "Calls & passivity" : offense.section.replace(/^(\d)(?:st|nd|rd|th) Group$/, "Group $1")));
    weapons(offense).forEach(function (weapon) { top.appendChild(el("span", "badge", weapon)); });
    card.appendChild(top);

    card.appendChild(el("h3", null, offense.one_liner || offense.offense_official));
    if (offense.explainer && offense.id !== "presence" && offense.id !== "unwillingness") card.appendChild(el("p", "expl", offense.explainer));

    if (offense.passivity) {
      var passivity = el("div", "passivity-detail");
      passivity.appendChild(el("p", "eyebrow", "Passivity · t.124"));
      passivity.appendChild(el("p", "passivity-summary", update.summary));
      passivity.appendChild(el("p", null, "Current from Oct. 1, 2026 · P-yellow removed."));
      [["Individual direct elimination (knockout bouts)", update.individual], ["Team matches", update.team]].forEach(function (section) {
        var detail = document.createElement("details");
        detail.appendChild(el("summary", null, section[0]));
        var steps = document.createElement("ol");
        section[1].forEach(function (step) { steps.appendChild(el("li", null, step)); });
        detail.appendChild(steps);
        passivity.appendChild(detail);
      });
      var timing = document.createElement("details");
      timing.appendChild(el("summary", null, "Timing, tied scores and P-card history"));
      update.notes.forEach(function (note) { timing.appendChild(el("p", null, note)); });
      passivity.appendChild(timing);
      addUpdateSources(passivity, update);
      card.appendChild(passivity);
      var pCardEscalation = el("div", "esc two-step");
      pCardEscalation.setAttribute("aria-label", "Passivity penalty by occurrence");
      pCardEscalation.appendChild(slotChip("First occurrence", "P-red"));
      pCardEscalation.appendChild(el("span", "esc-arrow", "→"));
      pCardEscalation.appendChild(slotChip("Second occurrence", "P-black"));
      card.appendChild(pCardEscalation);
    } else {
      var escalation = el("div", "esc");
      var penaltySteps = [offense.pen_first, offense.pen_second, offense.pen_third].filter(Boolean).length;
      escalation.classList.add("esc-" + penaltySteps);
      var progression = offense.id === "presence" ? "call" : "offense";
      escalation.setAttribute("aria-label", "Penalty by " + progression + " count");
      escalation.appendChild(slotChip("First " + progression, offense.pen_first));
      if (offense.pen_second) {
        escalation.appendChild(el("span", "esc-arrow", "→"));
        escalation.appendChild(slotChip("Second " + progression, offense.pen_second));
      }
      if (offense.pen_third) {
        escalation.appendChild(el("span", "esc-arrow", "→"));
        escalation.appendChild(slotChip((offense.id === "presence" ? "Third call" : "Third or later offense"), offense.pen_third));
      }
      card.appendChild(escalation);
    }

    if (offense.effects && offense.effects.length) {
      var effects = el("div", "entry-effects");
      offense.effects.forEach(function (effect) {
        var paragraph = el("p", "entry-effect");
        paragraph.appendChild(el("strong", null, effect.title + ". "));
        paragraph.appendChild(document.createTextNode(effect.text));
        effects.appendChild(paragraph);
      });
      card.appendChild(effects);
    }

    if (update && !offense.passivity) {
      var updatePanel = el("div", "passivity-detail");
      updatePanel.appendChild(el("p", null, update.summary));
      addUpdateSources(updatePanel, update);
      card.appendChild(updatePanel);
    }

    if (offense.articles && offense.articles.length) {
      var refs = el("div", "arts");
      offense.articles.forEach(function (article) { refs.appendChild(el("span", "art", article)); });
      card.appendChild(refs);
    }

    var details = document.createElement("details");
    details.className = "verb";
    var summary = document.createElement("summary");
    summary.textContent = update ? "Historical rule text · November 2025" : "Rule wording and sources";
    details.appendChild(summary);
    details.appendChild(el("p", "off-name", "Official offense: " + offense.offense_official.replace(/\s*[+*]/g, "")));
    if (update) details.appendChild(el("p", "src", "These excerpts predate the October 2026 update. Use the current guidance and official sources above for the changed rule."));
    var excerptGroups = {};
    (offense.articles || []).forEach(function (ref) {
      var info = DATA.articles[ref];
      var key = info ? info.base_ref : ref;
      if (!excerptGroups[key]) excerptGroups[key] = { refs: [], info: info };
      excerptGroups[key].refs.push(ref);
    });
    Object.keys(excerptGroups).forEach(function (key) {
      var group = excerptGroups[key];
      var info = group.info;
      var block = el("div", "verb-block");
      block.appendChild(el("h4", null, group.refs.join(" · ")));
      if (info && info.excerpt) {
        block.appendChild(el("pre", null, info.excerpt));
        block.appendChild(el("div", "src", offense.passivity ? "Historical source: November 2025 USA Fencing Rules. Use the current guidance above for passivity." : "Source: November 2025 USA Fencing Rules."));
      } else {
        block.appendChild(el("p", null, "No excerpt available. Check the official rulebook for " + group.refs.join(", ") + "."));
      }
      details.appendChild(block);
    });
    card.appendChild(details);

    if (offense.figure_refs && offense.figure_refs.length) {
      var figures = el("div", "fig-row");
      offense.figure_refs.forEach(function (key) {
        var fig = DATA.figures.filter(function (item) { return item.key === key; })[0];
        if (!fig) return;
        var button = el("button", null);
        button.type = "button";
        button.setAttribute("aria-label", "View figure " + fig.key + ": " + fig.caption);
        var img = document.createElement("img");
        img.loading = "lazy";
        img.src = fig.file.replace(/^site\//, "");
        img.alt = fig.caption;
        button.appendChild(img);
        button.appendChild(el("span", null, "Fig " + fig.key + " · " + fig.caption));
        button.addEventListener("click", function () { openLightbox(fig, button); });
        figures.appendChild(button);
      });
      if (figures.children.length) card.appendChild(figures);
    }
    return card;
  }

  function renderLearn() {
    var host = document.getElementById("learn-sections");
    host.innerHTML = "";
    var byId = {};
    DATA.offenses.forEach(function (offense) { byId[offense.id] = offense; });
    var jumps = document.getElementById("section-jumps");
    jumps.innerHTML = "";
    LEARN_SECTIONS.forEach(function (section, index) {
      var wrap = el("section", "learn-section");
      wrap.id = "browse-category-" + index;
      var jump = el("button", "fchip", ["Calls & passivity", "Group 1 · Warnings", "Group 2 · Penalty touches", "Group 3 · Conduct", "Group 4 · Exclusion"][index]);
      jump.type = "button";
      jump.addEventListener("click", function () {
        wrap.scrollIntoView({ block: "start", behavior: "instant" });
        var heading = wrap.querySelector("h3");
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      });
      jumps.appendChild(jump);
      var heading = el("div", "section-heading");
      var title = el("div");
      title.appendChild(el("h3", null, section.title));
      title.appendChild(el("p", null, section.sub));
      heading.appendChild(title);
      wrap.appendChild(heading);
      var list = el("div", "learn-list");
      section.ids.forEach(function (id) { if (byId[id]) list.appendChild(offenseCard(byId[id])); });
      wrap.appendChild(list);
      host.appendChild(wrap);
    });
    var shortcutHost = document.getElementById("card-key");
    shortcutHost.innerHTML = "";
    [
      { fam: "Y", cls: "y", label: "Yellow", meaning: "Warning" },
      { fam: "R", cls: "r", label: "Red", meaning: "Penalty touch" },      { fam: "B", cls: "b", label: "Black", meaning: "Exclusion" },
      { fam: "P", cls: "p", label: "Passivity · P-cards", meaning: "P-red → P-black" }
    ].forEach(function (item) {
      var button = el("button", "key-item");
      button.type = "button";
      button.appendChild(el("span", "key-top"));
      button.querySelector(".key-top").appendChild(el("span", "dot " + item.cls));
      button.querySelector(".key-top").appendChild(el("strong", null, item.label));
      button.appendChild(el("small", null, item.meaning));
      button.addEventListener("click", function () { show("dispute"); selectCard(item.fam); });
      shortcutHost.appendChild(button);
    });
  }

  function matchesCard(offense, family) {
    var found = families(offense);
    if (family === "P") return found.P;
    if (family === "Y") return found.Y;
    if (family === "R") return found.R;
    if (family === "B") return found.B;
    return true;
  }
  function filterOffenses() {
    var query = norm(lookupState.q).trim();
    var groupQuery = query.match(/\bgroup\s*([1-4])\b/);
    if (groupQuery) query = query.replace(groupQuery[0], "").trim();
    var candidates = sortByChart(DATA.offenses.filter(function (offense) {
      if (groupQuery && offense.section !== GROUP_ORDER[Number(groupQuery[1])]) return false;
      if (lookupState.group !== "All" && offense.section !== lookupState.group) return false;
      if (lookupState.card !== "All" && !matchesCard(offense, lookupState.card)) return false;
      return lookupState.weapon === "All" || appliesToWeapon(offense, lookupState.weapon);
    }));
    LOOKUP_MATCHES = {};
    if (!query) return candidates;
    var allowed = new Set(candidates.map(function (offense) { return offense.id; }));
    return PenaltySearch.rank(SEARCH_INDEX, query).filter(function (match) { return allowed.has(match.offense.id); }).map(function (match) {
      LOOKUP_MATCHES[match.offense.id] = match;
      return match.offense;
    });
  }

  function renderLookup() {
    var host = document.getElementById("lookup-results");
    host.innerHTML = "";
    var list = filterOffenses();
    document.getElementById("result-count").textContent = list.length + " of " + DATA.offenses.length + " entries";
    if (!list.length) {
      host.appendChild(el("p", "empty-state", "No matching penalties. Try a shorter search or clear one of the filters."));
      return;
    }
    var cards = el("div", "learn-list");
    var relatedHeading = false;
    list.forEach(function (offense) {
      var match = LOOKUP_MATCHES[offense.id];
      if (match && match.related && !relatedHeading) {
        var heading = el("div", "related-heading");
        heading.appendChild(el("h2", null, "Related situations"));
        heading.appendChild(el("p", null, "Some words differ or only part of your description matches. Check the entry’s conditions."));
        cards.appendChild(heading);
        relatedHeading = true;
      }
      cards.appendChild(offenseCard(offense));
    });
    host.appendChild(cards);
  }
  function renderFilterStatus() {
    var active = [];
    if (lookupState.group !== "All") active.push(GROUP_SHORT[lookupState.group]);
    if (lookupState.card !== "All") active.push({ Y: "Yellow", R: "Red", B: "Black", P: "P-cards" }[lookupState.card]);
    if (lookupState.weapon !== "All") active.push(lookupState.weapon);
    document.getElementById("filter-toggle").textContent = active.length ? "Filters (" + active.length + ")" : "Filters";
    var summary = document.getElementById("active-filters");
    summary.textContent = active.join(" · ");
    summary.hidden = !active.length;
    document.getElementById("clear-filters").hidden = !active.length;
  }
  function renderFilterChips() {
    renderFilterStatus();
    var groups = document.getElementById("group-filters");
    groups.innerHTML = "";
    ["All"].concat(GROUP_ORDER).forEach(function (group) {
      var button = el("button", "fchip", group === "All" ? "All penalty groups" : GROUP_SHORT[group]);
      button.type = "button";
      button.dataset.filter = "group";
      button.dataset.value = group;
      button.setAttribute("aria-pressed", lookupState.group === group ? "true" : "false");
      button.addEventListener("click", function () { setLookupFilter("group", group); });
      groups.appendChild(button);
    });
    var cards = document.getElementById("card-filters");
    cards.innerHTML = "";
    [["All", "Any card"], ["Y", "Yellow"], ["R", "Red"], ["B", "Black"], ["P", "P-cards"]].forEach(function (item) {
      var button = el("button", "fchip", item[1]);
      button.type = "button";
      button.dataset.filter = "card";
      button.dataset.value = item[0];
      button.setAttribute("aria-pressed", lookupState.card === item[0] ? "true" : "false");
      button.addEventListener("click", function () { setLookupFilter("card", item[0]); });
      cards.appendChild(button);
    });
    var weaponHost = document.getElementById("weapon-filters");
    weaponHost.innerHTML = "";
    [["All", "All weapons"], ["Foil", "Foil"], ["Épée", "Épée"], ["Sabre", "Sabre"]].forEach(function (item) {
      var button = el("button", "fchip", item[1]);
      button.type = "button";
      button.dataset.filter = "weapon";
      button.dataset.value = item[0];
      button.setAttribute("aria-pressed", lookupState.weapon === item[0] ? "true" : "false");
      button.addEventListener("click", function () { setLookupFilter("weapon", item[0]); });
      weaponHost.appendChild(button);
    });
  }

  var DISPUTE_CARDS = [
    { fam: "Y", cls: "dy", label: "Yellow card", sub: "Warning" },
    { fam: "R", cls: "dr", label: "Red card", sub: "Penalty touch" },
    { fam: "B", cls: "db", label: "Black card", sub: "Exclusion" },
    { fam: "P", cls: "dp", label: "Passivity · P-cards", sub: "P-red → P-black · t.124" }
  ];
  function selectCard(family) {
    disputeFam = family;
    renderDisputeButtons();
    renderDisputeResults();
    if (family) {
      var button = document.querySelector('[data-dispute-card="' + family + '"]');
      if (button) button.focus();
    }
  }
  function renderDisputeButtons() {
    var host = document.getElementById("dispute-cards");
    host.innerHTML = "";
    DISPUTE_CARDS.forEach(function (item) {
      var button = el("button", "dispute-btn " + item.cls + (disputeFam === item.fam ? " active" : ""));
      button.type = "button";
      button.dataset.disputeCard = item.fam;
      button.appendChild(el("span", null, item.label));
      button.appendChild(el("small", null, item.sub));
      button.setAttribute("aria-pressed", disputeFam === item.fam ? "true" : "false");
      button.addEventListener("click", function () {
        var family = disputeFam === item.fam ? null : item.fam;
        disputeFam = family;
        renderDisputeButtons();
        renderDisputeResults();
        if (family) {
          var selected = document.querySelector('[data-dispute-card="' + family + '"]');
          if (selected) selected.focus();
        }
      });
      host.appendChild(button);
    });
  }
  function renderDisputeResults() {
    var host = document.getElementById("dispute-results");
    host.innerHTML = "";
    if (!disputeFam) {
      host.appendChild(el("p", "dispute-note", "Select a card to see the situations that can lead to it. Passivity has its own P-red → P-black sequence; see the updated t.124 guide."));
      return;
    }
    var list = sortByChart(DATA.offenses.filter(function (offense) { return matchesCard(offense, disputeFam); }));
    if (!list.length) {
      host.appendChild(el("p", "empty-state", "No matching penalties."));
      return;
    }
    var selected = DISPUTE_CARDS.filter(function (item) { return item.fam === disputeFam; })[0];
    host.appendChild(el("h2", "dispute-results-title", selected.label + " · " + list.length + " situations"));
    var refine = el("button", "filter-toggle", "Search these situations");
    refine.type = "button";
    refine.addEventListener("click", function () {
      lookupState = { q: "", group: "All", card: disputeFam, weapon: "All" };
      document.getElementById("search").value = "";
      renderFilterChips();
      renderLookup();
      viewScroll.lookup = 0;
      show("lookup");
      document.getElementById("search").focus({ preventScroll: true });
    });
    host.appendChild(refine);
    var cards = el("div", "learn-list");
    list.forEach(function (offense) { cards.appendChild(offenseCard(offense)); });
    host.appendChild(cards);
  }

  function openLightbox(fig, trigger) {
    var lightbox = document.getElementById("lightbox");
    lastFocus = trigger || document.activeElement;
    var image = document.getElementById("lightbox-img");
    image.src = fig.file.replace(/^site\//, "");
    image.alt = fig.caption;
    document.getElementById("lightbox-cap").textContent = "Fig " + fig.key + " · " + fig.caption + " Guidance only; the written rule takes precedence.";
    lightbox.hidden = false;
    document.getElementById("lightbox-close").focus();
  }
  function closeLightbox() {
    var lightbox = document.getElementById("lightbox");
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }
  function renderFigures() {
    var host = document.getElementById("fig-gallery");
    host.innerHTML = "";
    DATA.figures.forEach(function (fig) { host.appendChild(makeFigureButton(fig)); });
  }
  function renderAbout() {
    var legendHost = document.getElementById("legend-list");
    if (!DATA.legend) return;
    legendHost.innerHTML = "";
    var cardSummaries = {
      "Yellow Card": "A warning that lasts for the bout. After a Red card for any reason, another Group 1 offense brings Red instead of Yellow.",
      "Red Card": "Penalty touch for the opponent.",
      "Black Card": "Exclusion from an event, a tournament, or the venue. Each entry explains the scope that applies.",
      "P-yellow": "Old warning card for passivity; removed from USA Fencing events on Oct. 1, 2026.",
      "P-red": "Penalty hit for unwillingness to fight.",
      "P-black": "Loss of the bout or team match for passivity. The loser keeps the corresponding placing and points; this is different from exclusion for misconduct."
    };
    DATA.legend.cards.forEach(function (item) {
      var row = el("div", "legend-row");
      row.appendChild(el("div", "chip " + chipClass(item.card), item.card));
      var copy = el("div", "legend-copy");
      copy.appendChild(el("p", null, cardSummaries[item.card] || item.meaning));
      var detail = document.createElement("details");
      detail.appendChild(el("summary", null, item.card.indexOf("P-") === 0 ? "Earlier official definition" : "Official definition"));
      detail.appendChild(el("p", null, item.meaning));
      copy.appendChild(detail);
      row.appendChild(copy);
      legendHost.appendChild(row);
    });
    var footnoteHost = document.getElementById("footnote-list");
    footnoteHost.innerHTML = "";
    [
      ["Touch cancelled", "A touch scored by the fencer committing the offense does not count."],
      ["Team warning", "A Yellow warning applies to the whole match. Any teammate committing a later Group 1 offense receives Red."],
      ["Event exclusion", "The fencer cannot continue in this competition."],
      ["Tournament exclusion", "The person cannot take part in other events at the tournament."],
      ["Venue removal", "The person must leave the competition venue."],
      ["Immediate action", "For some serious offenses, the referee can exclude or expel immediately. The entry tells you when this exception applies."]
    ].forEach(function (item) {
      var row = el("div", "consequence-definition");
      row.appendChild(el("h3", null, item[0]));
      row.appendChild(el("p", null, item[1]));
      footnoteHost.appendChild(row);
    });
  }

  function show(view) {
    if (currentView && currentView !== view) viewScroll[currentView] = window.scrollY;
    currentView = view;
    ["learn", "lookup", "dispute", "figures", "about"].forEach(function (name) {
      document.getElementById("view-" + name).hidden = (name !== view);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (tab) {
      var active = tab.getAttribute("data-view") === view;
      tab.classList.toggle("active", active);
      if (active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    if (location.hash !== "#/" + view) history.replaceState(null, "", "#/" + view);
    window.scrollTo({ top: viewScroll[view] || 0, behavior: "instant" });
  }
  function showDataError(err) {
    var main = document.getElementById("main");
    main.innerHTML = "";
    var panel = el("div", "empty-state");
    panel.appendChild(el("h1", null, "The reference could not load"));
    panel.appendChild(el("p", null, "Serve the site over HTTP rather than opening index.html directly. For a local preview, run python3 -m http.server from the site folder."));
    main.appendChild(panel);
    if (window.console) console.error(err);
  }
  function init() {
    Promise.all([
      fetch("data/offenses.json").then(function (response) { if (!response.ok) throw new Error("Could not load penalty data"); return response.json(); }),
      fetch("data/articles.json").then(function (response) { if (!response.ok) throw new Error("Could not load rule excerpts"); return response.json(); }),
      fetch("data/figures.json").then(function (response) { if (!response.ok) throw new Error("Could not load diagrams"); return response.json(); }),
      fetch("data/legend.json").then(function (response) { if (!response.ok) throw new Error("Could not load card legend"); return response.json(); }),
      fetch("data/updates.json").then(function (response) { if (!response.ok) throw new Error("Could not load rule updates"); return response.json(); })
    ]).then(function (parts) {
      DATA.offenses = parts[0];
      parts[1].forEach(function (article) { DATA.articles[article.ref] = article; });
      DATA.figures = parts[2];
      DATA.legend = parts[3];
      DATA.updates = parts[4];
      SEARCH_INDEX = PenaltySearch.create(DATA.offenses, DATA.updates);
      renderLearn();
      renderFilterChips();
      renderLookup();
      renderDisputeButtons();
      renderDisputeResults();
      renderFigures();
      renderAbout();

      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (tab) {
        tab.addEventListener("click", function () { show(tab.getAttribute("data-view")); });
      });
      window.addEventListener("hashchange", function () {
        var view = (location.hash || "").replace("#/", "");
        if (["learn", "lookup", "dispute", "figures", "about"].indexOf(view) !== -1) show(view);
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-open-view]"), function (button) {
        button.addEventListener("click", function () { show(button.getAttribute("data-open-view")); });
      });
      var start = (location.hash || "").replace("#/", "") || "learn";
      show(["learn", "lookup", "dispute", "figures", "about"].indexOf(start) !== -1 ? start : "learn");
      document.getElementById("filter-toggle").addEventListener("click", function () {
        var panel = document.getElementById("filter-panel");
        panel.hidden = !panel.hidden;
        this.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
        if (!panel.hidden) {
          var bar = document.querySelector(".search-wrap");
          var top = document.querySelector(".app-header").getBoundingClientRect().bottom + bar.offsetHeight + 8;
          var panelTop = panel.getBoundingClientRect().top;
          if (panelTop < top || panelTop > window.innerHeight - 80) window.scrollBy({ top: panelTop - top, behavior: "instant" });
        }
      });
      document.getElementById("clear-filters").addEventListener("click", function () {
        lookupState.group = lookupState.card = lookupState.weapon = "All";
        renderFilterChips();
        renderLookup();
        document.getElementById("filter-toggle").focus();
      });
      document.getElementById("search").addEventListener("input", function (event) {
        lookupState.q = event.target.value;
        renderLookup();
      });
      document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
      document.getElementById("lightbox").addEventListener("click", function (event) { if (event.target.id === "lightbox") closeLightbox(); });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeLightbox();
        if (event.key === "Tab" && !document.getElementById("lightbox").hidden) {
          event.preventDefault();
          document.getElementById("lightbox-close").focus();
        }
      });
    }).catch(showDataError);

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
