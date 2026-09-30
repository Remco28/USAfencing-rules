(async function () {
  const results = [];
  function check(name, value) { if (!value) throw new Error(name); results.push(name); }
  function click(selector) { document.querySelector(selector).click(); }
  function search(text) { const field = document.querySelector('#search'); field.value = text; field.dispatchEvent(new Event('input', {bubbles:true})); }
  check('41 browse entries', document.querySelectorAll('#learn-sections .off').length === 41);
  const passivity = document.querySelector('#learn-sections #off-unwillingness');
  check('current two-step passivity', passivity.querySelectorAll('.esc .slot').length === 2 && passivity.querySelector('.esc').textContent.includes('P-red') && !passivity.querySelector('.esc').textContent.includes('P-yellow'));
  const team = Array.from(passivity.querySelectorAll('details')).find(d=>d.querySelector('summary').textContent === 'Team matches');
  check('simultaneous team red and second-occurrence black', team.textContent.includes('both teams') && team.textContent.includes('Second occurrence in the match') && !team.textContent.includes('two P-red'));
  check('historical disclosure before opening old excerpt', passivity.querySelector('details.verb summary').textContent.includes('Historical'));
  check('score exceptions retained', passivity.textContent.includes('14–14') && passivity.textContent.includes('44–44'));
  check('no repeated presence explainer', !document.querySelector('#learn-sections #off-presence .expl'));
  click('[data-view="lookup"]');
  if (!document.querySelector('#clear-filters').hidden) click('#clear-filters');
  if (document.querySelector('#filter-panel').hidden) click('#filter-toggle');
  search('Group 2');
  check('search Group 2', document.querySelectorAll('#lookup-results .off').length === 7);
  search('t.119');
  check('citation search', document.querySelectorAll('#lookup-results .off').length === 1);
  search('strap');
  check('search current mask update', document.querySelectorAll('#lookup-results .off').length === 1);
  search('grabbed my cord');
  check('everyday cord search', document.querySelector('#lookup-results .off').id === 'off-g1-electrical-equipment');
  search('missing spare cord');
  check('missing spare search', document.querySelector('#lookup-results .off').id === 'off-g1-equipment-conforming');
  search('touching body crod');
  check('typo search disclosed', document.querySelector('#lookup-results .off').id === 'off-g1-electrical-equipment' && !!document.querySelector('.related-heading'));
  search('');
  click('#group-filters [data-value="4th Group"]');
  check('group filter', document.querySelectorAll('#lookup-results .off').length === 9);
  click('#group-filters [data-value="All"]');
  click('#card-filters [data-value="P"]');
  check('P-card filter', document.querySelectorAll('#lookup-results .off').length === 1);
  click('#card-filters [data-value="All"]');
  click('[data-view="dispute"]');
  if (document.querySelector('[data-dispute-card="P"]').getAttribute('aria-pressed') !== 'true') click('[data-dispute-card="P"]');
  check('browse by P-card', document.querySelectorAll('#dispute-results .off').length === 1);
  click('[data-view="figures"]');
  check('eight diagrams', document.querySelectorAll('#fig-gallery .fig-card').length === 8);
  click('#fig-gallery .fig-card');
  check('diagram dialog opens', !document.querySelector('#lightbox').hidden);
  click('#lightbox-close');
  check('diagram dialog closes', document.querySelector('#lightbox').hidden);
  click('[data-view="about"]');
  check('historical P-yellow explained', document.querySelector('#legend-list').textContent.includes('removed'));
  for (const view of ['learn','lookup','dispute','figures','about']) {
    click('[data-view="'+view+'"]');
    check('no horizontal overflow in '+view+' at '+innerWidth, document.documentElement.scrollWidth <= innerWidth);
  }
  click('[data-view="learn"]');
  await navigator.serviceWorker.ready;
  const cache = await caches.open('fencing-penalties-v11');
  const cached = (await cache.keys()).map(r=>new URL(r.url).pathname);
  check('current update cached', cached.includes(new URL('data/updates.json', document.baseURI).pathname));
  check('all diagrams precached', cached.filter(p=>p.includes('/figures/')).length === 8);
  check('search engine cached', cached.includes(new URL('search.js', document.baseURI).pathname));
  check('favicon cached', cached.includes(new URL('favicon.svg', document.baseURI).pathname));
  return {passed:results.length, checks:results};
})();
