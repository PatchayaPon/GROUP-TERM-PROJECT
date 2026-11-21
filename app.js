const API = '/api/portfolios';
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
const portfolioList = $('#portfolio-list');
const portfolioDisplay = $('#portfolio-display');
const portfolioForm = $('#profile-form');
const itemContainer = $('#portfolio-container');
const activeNote = $('#active-note');
const themeToggle = $('#theme-toggle');
let portfolios = [];
let activeId = null;
let editingId = null;

function id() {
  return crypto.randomUUID ? crypto.randomUUID() : 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}
function esc(value) { return String(value ?? ''); }
function normalizeItem(item) {
  const r = item.reflection || {};
  return {
    id: esc(item.id || id()), title: esc(item.title), type: esc(item.type), date: esc(item.date),
    role: esc(item.role), description: esc(item.description), skills: Array.isArray(item.skills) ? item.skills : [],
    reflection: {
      whatIDid: esc(r.whatIDid ?? r.did), whatILearned: esc(r.whatILearned ?? r.learned),
      challenge: esc(r.challenge), nextStep: esc(r.nextStep ?? r.steps)
    },
    evidence: Array.isArray(item.evidence) ? item.evidence : [],
    ...(item.challengeId ? {challengeId:item.challengeId} : {}),
    ...(item.hostGroup ? {hostGroup:item.hostGroup} : {}),
    ...(item.category ? {category:item.category} : {}),
    schemaVersion: '1.0'
  };
}
function normalizePortfolio(p) {
  return {...p, items:(p.items || []).map(normalizeItem)};
}
async function apiSave() {
  const response = await fetch(API, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(portfolios)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not save data');
}
async function load() {
  const response = await fetch(API);
  if (!response.ok) throw new Error('Cannot connect to server');
  portfolios = (await response.json()).map(normalizePortfolio);
  if (!portfolios.some(p => p.id === activeId)) activeId = portfolios[0]?.id || null;
  render();
}
function activePortfolio() { return portfolios.find(p => p.id === activeId) || null; }
function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function actionButton(label, cls, action, pid) {
  const b = node('button', cls, label); b.type='button'; b.dataset.action=action; b.dataset.id=pid; return b;
}
function render() {
  portfolioList.innerHTML = '';
  if (!portfolios.length) portfolioList.append(node('p','text-muted','No portfolios yet. Create one below.'));
  portfolios.forEach(p => {
    const col=node('div','col-md-6 col-lg-4');
    const card=node('div','card shadow-sm rounded-4 p-3 h-100');
    card.classList.add(p.id===activeId?'border-success':'border-0');
    card.append(node('h3','h5 fw-bold',p.displayName),node('p','text-muted small',`${p.items.length} item(s)${p.id===activeId?' · Selected':''}`));
    const actions=node('div','d-flex gap-2 flex-wrap');
    actions.append(actionButton('View','btn btn-sm btn-success','select',p.id),actionButton('Edit','btn btn-sm btn-outline-secondary','edit',p.id),actionButton('Delete','btn btn-sm btn-outline-danger','delete',p.id));
    card.append(actions); col.append(card); portfolioList.append(col);
  });
  const p=activePortfolio();
  $('#portfolio-name').textContent=p?.displayName || 'Student';
  $('#portfolio-enjoy').textContent=p?.whatIEnjoy || '';
  $('#portfolio-tried').textContent=p?.whatIveTried || '';
  $('#portfolio-curious').textContent=p?.whatImCuriousAbout || '';
  $('#items-heading').textContent=p ? `Portfolio Items — ${p.displayName}` : 'Portfolio Items';
  activeNote.textContent=p ? `New items will be saved to: ${p.displayName}` : 'Create a portfolio first, then add items to it.';
  portfolioDisplay.innerHTML='';
  if (!p) { portfolioDisplay.append(node('p','text-muted','Create a portfolio to begin.')); return; }
  if (!p.items.length) { portfolioDisplay.append(node('p','text-muted','This portfolio has no items yet.')); return; }
  p.items.forEach(item => {
    const card=node('article','card border-0 shadow-sm rounded-4 p-4 mb-3');
    card.append(node('h3','h5 fw-bold',item.title),node('p','',`Type: ${item.type} · Date: ${item.date}`),
      node('p','',`Role: ${item.role}`),node('p','',`Description: ${item.description}`),
      node('p','',`Skills: ${item.skills.join(', ')}`),
      node('p','',`What I did: ${item.reflection.whatIDid}`),
      node('p','',`What I learned: ${item.reflection.whatILearned}`),
      node('p','',`Challenge: ${item.reflection.challenge}`),
      node('p','',`Next steps: ${item.reflection.nextStep}`));
    const ev=node('div','','Evidence: ');
    item.evidence.forEach((url,i)=>{ if(i) ev.append(document.createTextNode(' · ')); const a=node('a','',url); a.href=url;a.target='_blank';a.rel='noopener noreferrer';ev.append(a); });
    card.append(ev);
    const tools=node('div','d-flex gap-2 flex-wrap mt-3');
    const copy=actionButton('Copy Item JSON','btn btn-outline-primary','copy-item',item.id);
    const del=actionButton('Delete Portfolio Item','btn btn-outline-danger','delete-item',item.id);
    tools.append(copy,del); card.append(tools); portfolioDisplay.append(card);
  });
}
function clearProfileErrors() { $$('.is-invalid',portfolioForm).forEach(x=>x.classList.remove('is-invalid')); $$('.small.text-danger',portfolioForm).forEach(x=>x.textContent=''); }
portfolioForm.addEventListener('submit',async e=>{
  e.preventDefault(); clearProfileErrors();
  const fields=[['#displayName','.error-display-name'],['#enjoy','.error-enjoy'],['#tried','.error-tried'],['#curious','.error-curious']];
  let valid=true;
  fields.forEach(([sel,err])=>{const input=$(sel);if(!input.value.trim()){input.classList.add('is-invalid');$(err).textContent='This field is required.';valid=false;}});
  if(!valid)return;
  const values={displayName:$('#displayName').value.trim(),whatIEnjoy:$('#enjoy').value.trim(),whatIveTried:$('#tried').value.trim(),whatImCuriousAbout:$('#curious').value.trim()};
  if(editingId){Object.assign(portfolios.find(p=>p.id===editingId),values);activeId=editingId;}
  else {const p={id:id(),...values,items:[]};portfolios.push(p);activeId=p.id;}
  try{await apiSave();editingId=null;portfolioForm.reset();$('#profile-form-title').textContent='Create your portfolio';$('#profile-submit').textContent='Create portfolio';$('#profile-cancel').classList.add('d-none');render();}
  catch(err){alert(err.message);}
});
$('#profile-cancel').addEventListener('click',()=>{editingId=null;portfolioForm.reset();clearProfileErrors();$('#profile-form-title').textContent='Create your portfolio';$('#profile-submit').textContent='Create portfolio';$('#profile-cancel').classList.add('d-none');});
portfolioList.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  const p=portfolios.find(x=>x.id===b.dataset.id);if(!p)return;
  if(b.dataset.action==='select'){activeId=p.id;render();}
  if(b.dataset.action==='edit'){
    editingId=p.id;activeId=p.id;
    $('#displayName').value=p.displayName;$('#enjoy').value=p.whatIEnjoy;$('#tried').value=p.whatIveTried;$('#curious').value=p.whatImCuriousAbout;
    $('#profile-form-title').textContent='Edit portfolio';$('#profile-submit').textContent='Save changes';$('#profile-cancel').classList.remove('d-none');
    portfolioForm.scrollIntoView({behavior:'smooth',block:'center'});render();
  }
  if(b.dataset.action==='delete' && confirm('Delete this portfolio and all its items?')){
    portfolios=portfolios.filter(x=>x.id!==p.id);if(activeId===p.id)activeId=portfolios[0]?.id||null;
    try{await apiSave();render();}catch(err){alert(err.message);}
  }
});
$('#add-portfolio').addEventListener('click',()=>{
  const first=$('.portfolio-form',itemContainer);const copy=first.cloneNode(true);
  copy.reset();$$('.is-invalid',copy).forEach(x=>x.classList.remove('is-invalid'));$$('.small.text-danger',copy).forEach(x=>x.textContent='');
  $$('.skills-container',copy).forEach(c=>{c.innerHTML='<div class="d-flex gap-2 mb-2 skill-item"><input class="form-control" name="skills" placeholder="e.g. HTML"><button type="button" class="btn btn-outline-danger delete-field">🗑️</button></div>';});
  $$('.evidence-container',copy).forEach(c=>{c.innerHTML='<div class="d-flex gap-2 mb-2 evidence-item"><input class="form-control" name="evidence" type="url" placeholder="https://example.com"><button type="button" class="btn btn-outline-danger delete-evidence">🗑️</button></div>';});
  itemContainer.append(copy);copy.scrollIntoView({behavior:'smooth',block:'center'});
});
itemContainer.addEventListener('click',e=>{
  const addSkill=e.target.closest('.add-skill');
  if(addSkill){const c=addSkill.closest('.portfolio-form').querySelector('.skills-container');const row=c.querySelector('.skill-item').cloneNode(true);$('input',row).value='';c.append(row);return;}
  const delSkill=e.target.closest('.delete-field');
  if(delSkill){const c=delSkill.closest('.skills-container');const rows=$$('.skill-item',c);if(rows.length>1)delSkill.closest('.skill-item').remove();else $('input',rows[0]).value='';return;}
  const addEv=e.target.closest('.add-evidence');
  if(addEv){const c=addEv.closest('.portfolio-form').querySelector('.evidence-container');const row=c.querySelector('.evidence-item').cloneNode(true);$('input',row).value='';c.append(row);return;}
  const delEv=e.target.closest('.delete-evidence');
  if(delEv){const c=delEv.closest('.evidence-container');const rows=$$('.evidence-item',c);if(rows.length>1)delEv.closest('.evidence-item').remove();else $('input',rows[0]).value='';return;}
  const delForm=e.target.closest('.delete-portfolio');
  if(delForm){const forms=$$('.portfolio-form',itemContainer);const form=delForm.closest('.portfolio-form');if(forms.length>1)form.remove();else{form.reset();$$('.small.text-danger',form).forEach(x=>x.textContent='');}}
});
function validUrl(s){try{const u=new URL(s);return ['http:','https:'].includes(u.protocol);}catch{return false;}}
function validateItemForm(form){
  $$('.is-invalid',form).forEach(x=>x.classList.remove('is-invalid'));$$('.small.text-danger',form).forEach(x=>x.textContent='');
  let ok=true;const required=['title','type','date','role','did','learned','challenge','steps'];
  required.forEach(name=>{const input=$(`[name="${name}"]`,form);if(!input.value.trim()){input.classList.add('is-invalid');ok=false;}});
  const skills=$$('[name="skills"]',form).map(x=>x.value.trim()).filter(Boolean);
  if(!skills.length){$('.error-skills',form).textContent='Add at least one skill.';ok=false;}
  const links=$$('[name="evidence"]',form).map(x=>x.value.trim()).filter(Boolean);
  if(!links.length || links.some(x=>!validUrl(x))){$('.error-evidence',form).textContent='Add at least one valid http/https evidence URL.';ok=false;}
  if(!ok){const status=$('.form-status',form);status.textContent='Please complete the highlighted fields.';status.className='form-status text-danger small';}
  return ok;
}
itemContainer.addEventListener('submit',async e=>{
  const form=e.target.closest('.portfolio-form');if(!form)return;e.preventDefault();
  const p=activePortfolio();const status=$('.form-status',form);
  if(!p){status.textContent='Create a portfolio first.';status.className='form-status text-danger small';return;}
  if(!validateItemForm(form))return;
  const item=normalizeItem({
    id:id(),title:$('[name="title"]',form).value.trim(),type:$('[name="type"]',form).value.trim(),
    date:$('[name="date"]',form).value,role:$('[name="role"]',form).value.trim(),
    description:$('[name="roleDescription"]',form).value.trim() || $('[name="role"]',form).value.trim(),
    skills:$$('[name="skills"]',form).map(x=>x.value.trim()).filter(Boolean),
    reflection:{whatIDid:$('[name="did"]',form).value.trim(),whatILearned:$('[name="learned"]',form).value.trim(),challenge:$('[name="challenge"]',form).value.trim(),nextStep:$('[name="steps"]',form).value.trim()},
    evidence:$$('[name="evidence"]',form).map(x=>x.value.trim()).filter(Boolean)
  });
  p.items.push(item);
  try{await apiSave();render();form.reset();status.textContent='Saved to server successfully.';status.className='form-status text-success small fw-bold';}
  catch(err){p.items.pop();status.textContent=err.message;status.className='form-status text-danger small';}
});
portfolioDisplay.addEventListener('click',async e=>{
  const copy=e.target.closest('[data-action="copy-item"]');
  if(copy){const p=activePortfolio();const item=p?.items.find(x=>x.id===copy.dataset.id);if(item){await navigator.clipboard.writeText(JSON.stringify(item,null,2));copy.textContent='Copied!';}return;}
  const b=e.target.closest('[data-action="delete-item"]');if(!b)return;
  const p=activePortfolio();if(!p)return;p.items=p.items.filter(x=>x.id!==b.dataset.id);
  try{await apiSave();render();}catch(err){alert(err.message);}
});
/* Exchange panel: JSON paste/import and export */
const exchange=node('section','card border-0 shadow-sm rounded-4 p-4 mt-4');
exchange.innerHTML=`<h2 class="h5 fw-bold">Portfolio Item Exchange</h2>
<p class="small text-muted">Paste a Portfolio Item JSON received from another group. Review and edit the Reflection before saving.</p>
<label class="form-label fw-bold" for="import-json">Import Portfolio Item JSON</label>
<textarea id="import-json" class="form-control mb-2" rows="6" placeholder='{"id":"...","title":"..."}'></textarea>
<label class="form-label" for="import-target">Save to Portfolio</label>
<select id="import-target" class="form-select mb-2"></select>
<button id="import-button" class="btn btn-success">Read JSON</button>
<div id="import-status" class="small mt-2" aria-live="polite"></div>
<div id="import-review" class="mt-3 d-none">
  <h3 class="h6 fw-bold">Review Reflection</h3>
  <label class="form-label" for="review-did">What I did</label><textarea id="review-did" class="form-control mb-2" rows="2"></textarea>
  <label class="form-label" for="review-learned">What I learned</label><textarea id="review-learned" class="form-control mb-2" rows="2"></textarea>
  <label class="form-label" for="review-challenge">Challenge</label><textarea id="review-challenge" class="form-control mb-2" rows="2"></textarea>
  <label class="form-label" for="review-next">Next step</label><textarea id="review-next" class="form-control mb-2" rows="2"></textarea>
  <button id="save-import-button" class="btn btn-primary">Save Imported Item to Server</button>
</div>
<hr><h3 class="h6 fw-bold">Export My Portfolio</h3>
<p class="small text-muted">Download only the selected Portfolio as my-portfolio.json.</p>
<button id="export-button" class="btn btn-outline-primary">Export my-portfolio.json</button>`;
$('#portfolio-display').parentElement.append(exchange);
function updateTargets(){
  const select=$('#import-target');select.innerHTML='';
  portfolios.forEach(p=>{const opt=node('option','',p.displayName);opt.value=p.id;select.append(opt);});
  if(activeId)select.value=activeId;
}
let pendingImport = null;
$('#import-button').addEventListener('click',()=>{
  const status=$('#import-status');let item;
  try{item=JSON.parse($('#import-json').value);}catch{status.textContent='Invalid JSON format. Please check your pasted text.';status.className='text-danger small mt-2';return;}
  if(!item || typeof item!=='object' || Array.isArray(item)){status.textContent='JSON must contain one Portfolio Item object.';status.className='text-danger small mt-2';return;}
  item=normalizeItem(item);
  const required=['id','title','type','date','role','description'];
  if(required.some(k=>!item[k]) || !Array.isArray(item.skills) || !item.skills.length ||
    !Array.isArray(item.evidence) || !item.evidence.length || item.evidence.some(x=>!validUrl(x))){
    status.textContent='Missing or invalid fields. Required: title/type/date/role/description, skills[], reflection object, and evidence URL[].';
    status.className='text-danger small mt-2';return;
  }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)){status.textContent='Date must use YYYY-MM-DD.';status.className='text-danger small mt-2';return;}
  pendingImport=item;
  $('#review-did').value=item.reflection.whatIDid;
  $('#review-learned').value=item.reflection.whatILearned;
  $('#review-challenge').value=item.reflection.challenge;
  $('#review-next').value=item.reflection.nextStep;
  $('#import-review').classList.remove('d-none');
  status.textContent='JSON is valid. Review or edit all four Reflection fields, then save.';
  status.className='text-success small mt-2';
});
$('#save-import-button').addEventListener('click',async()=>{
  const status=$('#import-status');
  if(!pendingImport)return;
  const target=portfolios.find(p=>p.id===$('#import-target').value);
  if(!target){status.textContent='Create or select a Portfolio first.';status.className='text-danger small mt-2';return;}
  if(target.items.some(x=>x.id===pendingImport.id)){status.textContent='This Item ID already exists in the selected Portfolio.';status.className='text-danger small mt-2';return;}
  const reflection={
    whatIDid:$('#review-did').value.trim(),whatILearned:$('#review-learned').value.trim(),
    challenge:$('#review-challenge').value.trim(),nextStep:$('#review-next').value.trim()
  };
  if(Object.values(reflection).some(x=>!x)){status.textContent='Complete all four Reflection fields before saving.';status.className='text-danger small mt-2';return;}
  pendingImport.reflection=reflection;target.items.push(pendingImport);activeId=target.id;
  try{await apiSave();render();pendingImport=null;$('#import-review').classList.add('d-none');$('#import-json').value='';status.textContent='Imported and saved to server. The item is shown in Portfolio Items.';status.className='text-success small mt-2';}
  catch(err){target.items.pop();status.textContent=err.message;status.className='text-danger small mt-2';}
});
$('#export-button').addEventListener('click',()=>{
  const p=activePortfolio();if(!p){alert('Select a Portfolio first.');return;}
  const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download='my-portfolio.json';a.click();URL.revokeObjectURL(url);
});
const originalRender=render;
render=function(){originalRender();updateTargets();};
function setTheme(theme){document.documentElement.setAttribute('data-bs-theme',theme);themeToggle.textContent=theme==='dark'?'☀️ Light mode':'🌙 Dark mode';localStorage.setItem('theme',theme);}
setTheme(localStorage.getItem('theme')||'light');
themeToggle.addEventListener('click',()=>setTheme(document.documentElement.getAttribute('data-bs-theme')==='dark'?'light':'dark'));
load().catch(err=>{console.error(err);alert('Cannot connect to the server. Start the app with npm start.');});
