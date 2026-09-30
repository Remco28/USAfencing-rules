(async function() {
  const data=await (await fetch('data/cases.json')).json();
  const settle=()=>new Promise(resolve=>setTimeout(resolve,45));
  let checked=0;
  for(const weapon of ['epee','foil','sabre']) {
    document.querySelector(`[data-weapon="${weapon}"]`).click();
    for(const entry of data.cases.filter(c=>c.weapons.includes(weapon))) {
      location.hash='/case/'+entry.id;await settle();
      const fail=message=>{throw new Error(weapon+' / '+entry.id+': '+message)};
      if(document.querySelector('h1')?.textContent!==entry.title)fail('detail title');
      if(document.querySelector('.answer')?.textContent!==entry.summary)fail('summary');
      const quotes=Array.from(document.querySelectorAll('blockquote p'));
      if(quotes.length!==entry.articles.length)fail('source count');
      entry.articles.forEach((ref,index)=>{if(quotes[index].textContent!==data.sources[ref])fail('source '+ref)});
      for(const link of document.querySelectorAll('.related-cases a[href^="#/case/"]')) {
        const other=data.cases.find(c=>link.hash==='#/case/'+c.id);
        if(!other?.weapons.includes(weapon))fail('cross-weapon related link');
      }
      for(const panel of document.querySelectorAll('details.panel'))panel.open=true;
      if(document.documentElement.scrollWidth>innerWidth)fail('expanded-panel horizontal overflow');
      checked++;
    }
  }
  location.hash='/';await settle();
  return {caseWeaponViews:checked,cases:data.cases.length,sourceExcerpts:Object.keys(data.sources).length,viewport:innerWidth};
})()
