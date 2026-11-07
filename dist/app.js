const byId = id => document.getElementById(id);
const twoDigits = value => String(value).padStart(2, '0');
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
function drawIcons() { window.lucide?.createIcons({attrs: {'aria-hidden':'true', 'stroke-width':1.7}}); }
let guide, stepIndex = 0, holdTimer;
let finished;
try { finished = new Set(JSON.parse(localStorage.getItem('surge-completed') || '[]')); } catch { finished = new Set(); }
const picker = byId('task');
const menu = byId('task-menu'), search = byId('task-search');
function closeMenu() {
  menu.hidden = true;
  picker.setAttribute('aria-expanded','false');
}
function matchesGuide(task, query) {
  const aliases = /\bPC\b/.test(task.title) ? 'Windows computer' : '';
  const words = [task.cat, task.title, task.desc, aliases, ...task.steps.flatMap(step =>
    [step.title, step.text, step.note, ...step.keys.map(key => controlMeta[key][0])])].join(' ').toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every(term => words.includes(term));
}
function listGuides() {
  const options = byId('task-options');
  options.replaceChildren();
  let category;
  for (const task of guides.filter(g => matchesGuide(g, search.value))) {
    if (category !== task.cat) {
      const heading = document.createElement('strong');
      heading.textContent = category = task.cat;
      options.append(heading);
    }
    const choice = document.createElement('button');
    choice.textContent = task.title;
    choice.setAttribute('aria-current',String(task.id === guide.id));
    choice.onclick = () => { openGuide(task.id); picker.focus(); };
    options.append(choice);
  }
  if (!options.children.length) options.textContent = 'No matching walkthroughs';
}
picker.onclick = () => {
  if (!menu.hidden) return closeMenu();
  menu.hidden = false; picker.setAttribute('aria-expanded','true');
  search.value = ''; listGuides(); search.focus();
};
search.oninput = listGuides;
menu.onkeydown = e => {
  if (e.key === 'Escape') {closeMenu(); picker.focus(); return;}
  const choices = [...menu.querySelectorAll('button')];
  if (e.key === 'Enter' && e.target === search) { e.preventDefault(); choices[0]?.click(); }
  if (choices.length && ['ArrowDown','ArrowUp'].includes(e.key)) {
    e.preventDefault();
    const next = choices.indexOf(document.activeElement) + (e.key === 'ArrowDown' ? 1 : -1);
    choices[Math.max(0,Math.min(choices.length-1,next))].focus();
  }
};
document.addEventListener('pointerdown', e => { if (!menu.contains(e.target) && !picker.contains(e.target)) closeMenu(); });
document.addEventListener('focusin', e => { if (!menu.contains(e.target) && e.target !== picker) closeMenu(); });
function openGuide(id) {
  guide = guides.find(item => item.id === id) || guides[0];
  closeMenu(); picker.textContent = guide.title;
  history.replaceState(null, '', '#' + guide.id);
  byId('category').textContent = guide.cat;
  byId('title').textContent = guide.title;
  byId('desc').textContent = guide.desc;
  showStep(0);
}
function locate(key) {
  const [name, view, detail] = controlMeta[key];
  modelApi.setView(view);
  modelApi.highlight([key], guide.steps[stepIndex]);
  byId('status-legend').textContent = key === 'leds' ? 'Channel indicators · see step instructions' : '';
  byId('focus-text').parentElement.classList.add('control-detail');
  byId('focus-text').textContent = name + ' · ' + detail;
}
function focusStep() {
  byId('focus-text').parentElement.classList.remove('control-detail');
  const step = guide.steps[stepIndex];
  modelApi.setView(step.view);
  modelApi.highlight(step.keys, step);
  byId('focus-text').textContent = twoDigits(stepIndex + 1) + ' / ' + step.title;
  byId('status-legend').textContent = !step.keys.includes('leds') ? '' : step.leds?.length ? 'Channel indicators · ' + step.leds.join(' + ') + (step.flash ? ' flashing' : ' solid') : 'Channel indicators · see step instructions';
}
function makeExtras(step) {
  const box = document.createElement('div');
  box.className = 'extra';
  if (step.keys.length) {
    const label = document.createElement('span');
    label.className = 'locate-label';
    label.textContent = 'Explore controls';
    box.append(label);
  }
  if (guide.id === 'first' && stepIndex === guide.steps.length-1) {
    const routes = document.createElement('div');
    routes.className = 'routes';
    for (const id of ['wired-x','bt-pc','dongle','wired-ns','bt-ns','bt-mobile','bt-mobile2']) {
      const task = guides.find(item => item.id === id);
      const link = document.createElement('button');
      link.textContent = task.title.replace('PC / Steam Deck','Windows / Steam Deck');
      link.onclick = () => { openGuide(id); byId('steps').querySelector('button').focus({preventScroll:true}); };
      routes.append(link);
    }
    box.append(routes);
  }
  for (const key of step.keys) {
    const chip = document.createElement('button');
    chip.className = 'chip'; chip.textContent = controlMeta[key][0];
    chip.title = 'Locate ' + chip.textContent; chip.onclick = () => locate(key); box.append(chip);
  }
  const note = step.note || (guide.id === 'bt-pc' ? 'PC Bluetooth supports X-input only.' : '');
  if (note) { const p = document.createElement('p'); p.textContent = note; box.append(p); }
  if (step.hold) {
    const play = document.createElement('button'), status = document.createElement('span');
    play.className = 'hold'; play.innerHTML = icon('timer') + ` Time a ${step.hold} s hold`;
    status.className = 'hold-status'; status.setAttribute('role','status');
    play.onclick = () => {
      const start = performance.now(); play.disabled = true;
      holdTimer = setInterval(() => {
        const left = Math.max(0, step.hold - (performance.now() - start) / 1000);
        status.textContent = left ? `Hold · ${left.toFixed(1)} s` : 'Release the buttons';
        if (!left) { clearInterval(holdTimer); play.disabled = false; }
      }, 50);
    };
    box.append(play, status);
  }
  return box;
}
function showStep(index, refocus = false) {
  clearInterval(holdTimer); stepIndex = index;
  const list = byId('steps'); list.replaceChildren();
  guide.steps.forEach((s, i) => {
    const item = document.createElement('li'), button = document.createElement('button');
    button.className = 'step-btn'; button.setAttribute('aria-current', i === index ? 'step' : 'false');
    button.innerHTML = `<span class="num">${twoDigits(i+1)}</span><span class="step-copy"><strong></strong><span></span></span>`;
    button.querySelector('strong').textContent = s.title; button.querySelector('.step-copy span').textContent = s.text;
    button.onclick = () => showStep(i, true); item.append(button);
    if (i === index) { item.className = 'current'; if (guide.id === 'first' || s.keys.length || s.note || s.hold || guide.id === 'bt-pc') item.append(makeExtras(s)); }
    list.append(item);
  });
  byId('counter').textContent = `STEP ${twoDigits(index+1)} / ${twoDigits(guide.steps.length)}`;
  byId('meter').style.width = (index+1)/guide.steps.length*100 + '%';
  byId('prev').disabled = !index;
  const last = index === guide.steps.length-1;
  byId('next').innerHTML = last ? (finished.has(guide.id) ? 'Completed ' : 'Finish guide ') + icon('check') : '<span>Next: '+guide.steps[index+1].title+'</span>'+icon('arrow-right');
  if (last && guide.id === 'first') byId('next').innerHTML = 'Browse connections '+icon('layers');
  focusStep(); drawIcons();
  const row = list.children[index];
  if (refocus) row.querySelector('button').focus({preventScroll:true});
  const bounds = list.getBoundingClientRect();
  const selected = row.getBoundingClientRect();
  if (!index) list.scrollTop = 0;
  else if (selected.top < bounds.top || selected.bottom > bounds.bottom) {
    list.scrollTop += selected.top - bounds.top - 10;
  }
}

byId('prev').onclick = () => { if (stepIndex) showStep(stepIndex-1); };
byId('next').onclick = () => {
  if (stepIndex+1 < guide.steps.length) { showStep(stepIndex+1); return; }
  if (guide.id === 'first') { picker.click(); search.value = 'Connect'; listGuides(); return; }
  finished.add(guide.id);
  try { localStorage.setItem('surge-completed',JSON.stringify([...finished])); } catch {}
  showStep(stepIndex); byId('focus-text').textContent = 'Walkthrough complete · '+guide.title;
};
for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => modelApi.setView(b.dataset.view);
byId('reset-view').onclick = focusStep;
window.addEventListener('control-selected', e => locate(e.detail));
for (const [key,[name]] of Object.entries(controlMeta)) {
  const b = document.createElement('button'); b.textContent = name;
  b.onclick = () => { byId('parts').close(); locate(key); }; byId('control-list').append(b);
}
byId('parts-open').onclick = () => byId('parts').showModal();
function renderManual() {
  const query = byId('query').value.trim().toLowerCase();
  const cards = byId('manual-cards'); cards.replaceChildren();
  for (const g of guides) {
    if (!matchesGuide(g, query)) continue;
    const card = document.createElement('details'); card.className = 'manual-card';
    const heading = document.createElement('summary');
    heading.innerHTML = `<small>${g.cat} · ${g.steps.length} steps</small><strong>${g.title}</strong><span>${g.desc}</span>`;
    const preview = document.createElement('span');
    preview.className = 'card-preview';
    preview.textContent = g.steps.slice(0, 2).map((s, i) => `${twoDigits(i+1)}  ${s.title}`).join('\n');
    heading.append(preview);
    const instructions = document.createElement('ol');
    for (const s of g.steps) {
      const li = document.createElement('li'), title = document.createElement('strong'); title.textContent = s.title;
      li.append(title,document.createTextNode([s.text,s.note].filter(Boolean).join(' '))); instructions.append(li);
    }
    const launch = document.createElement('button'); launch.className='launch'; launch.innerHTML='Follow in 3D '+icon('arrow-right');
    launch.onclick=()=>{ byId('library').close(); openGuide(g.id); };
    card.append(heading,instructions,launch); cards.append(card);
  }
  if (!cards.childElementCount) cards.textContent = 'No guide found. Try “pairing”, “turbo”, or “charge”.';
  drawIcons();
}
byId('manual-open').onclick = () => { renderManual(); byId('library').showModal(); };
byId('query').oninput = renderManual;
for (const d of document.querySelectorAll('dialog')) {
  d.querySelector('.close').onclick = () => d.close();
  d.onclick = e => { if (e.target===d && !d.matches(':hover')) d.close(); };
}
function photoSource(page) { return `manual/IMG_${page}.jpg`; }
for(let i=0;i<8;i++) {
  const b=document.createElement('button');b.textContent='Page '+(i+1);
  b.onclick=()=>{let img=byId('photo');if(!img){img=document.createElement('img');img.id='photo';byId('sources').after(img);}img.alt='Original manual page '+(i+1);img.src=photoSource(9090+i);};byId('sources').append(b);
}
const product=document.createElement('a');product.href='https://kreo-tech.com/products/surge-xb-wireless-gaming-controller';product.textContent='Kreo product page';product.target='_blank';product.rel='noopener';byId('sources').append(product);
document.addEventListener('keydown',e=>{if(e.key==='/'&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();byId('manual-open').click();byId('query').focus();}});
openGuide(location.hash.slice(1));
