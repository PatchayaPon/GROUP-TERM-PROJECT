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
async function api(path, method='GET', body) {
  const response = await fetch(API + path, {
    method, headers: body ? {'Content-Type':'application/json'} : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not save data');
  return result;
}
async function load() {
  portfolios = (await api('')).map(normalizePortfolio);
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
  try{
    if(editingId){await api('/'+encodeURIComponent(editingId),'PUT',values);activeId=editingId;}
    else{const created=await api('','POST',values);activeId=created.id;}
    await load();editingId=null;portfolioForm.reset();$('#profile-form-title').textContent='Create your portfolio';$('#profile-submit').textContent='Create portfolio';$('#profile-cancel').classList.add('d-none');
  }
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
    try{await api('/'+encodeURIComponent(p.id),'DELETE');await load();}catch(err){alert(err.message);}
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
  try{await api('/'+encodeURIComponent(p.id)+'/items','POST',item);await load();form.reset();status.textContent='Saved to server successfully.';status.className='form-status text-success small fw-bold';}
  catch(err){status.textContent=err.message;status.className='form-status text-danger small';}
});
portfolioDisplay.addEventListener('click',async e=>{
  const copy=e.target.closest('[data-action="copy-item"]');
  if(copy){const p=activePortfolio();const item=p?.items.find(x=>x.id===copy.dataset.id);if(item){const ok=await copyText(JSON.stringify(item,null,2));copy.textContent=ok?'Copied!':'Copy failed - use the Host panel textarea';}return;}
  const b=e.target.closest('[data-action="delete-item"]');if(!b)return;
  const p=activePortfolio();if(!p)return;
  try{await api('/'+encodeURIComponent(p.id)+'/items/'+encodeURIComponent(b.dataset.id),'DELETE');await load();}catch(err){alert(err.message);}
});
async function copyText(text, source){
  try{ if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;} }catch{}
  const t=source||document.createElement('textarea');
  if(!source){t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);}
  t.focus();t.select();
  let ok=false;try{ok=document.execCommand('copy');}catch{}
  if(!source)t.remove();
  return ok;
}
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

/* Host panel: generate a Portfolio Item JSON for a participant who completed a challenge */
const host=node('section','card border-0 shadow-sm rounded-4 p-4 mt-4');
host.innerHTML=`<h2 class="h5 fw-bold">Host Booth: Give Portfolio Item JSON</h2>
<p class="small text-muted">After a friend completes your challenge, generate their Portfolio Item JSON and let them copy it.</p>
<label class="form-label fw-bold" for="host-challenge">Challenge</label>
<select id="host-challenge" class="form-select mb-2"></select>
<p id="host-info" class="small text-muted"></p>
<label class="form-label fw-bold" for="host-name">Participant name</label>
<input id="host-name" class="form-control mb-2" maxlength="80" placeholder="e.g. Alex">
<button id="host-generate" class="btn btn-success mb-2" type="button">Generate JSON</button>
<div id="host-status" class="small" aria-live="polite"></div>
<textarea id="host-output" class="form-control mb-2 font-monospace" rows="10" readonly placeholder="Generated JSON appears here"></textarea>
<div class="d-flex gap-2 flex-wrap">
  <button id="host-copy" class="btn btn-outline-primary" type="button">Copy JSON</button>
  <button id="host-download" class="btn btn-outline-secondary" type="button">Download portfolio-item.json</button>
</div>`;
exchange.before(host);
const challenges=window.CHALLENGES||[];
challenges.forEach((c,i)=>{const o=node('option','',`${c.challengeId} - ${c.title}`);o.value=i;$('#host-challenge').append(o);});
function showChallengeInfo(){
  const c=challenges[$('#host-challenge').value];
  $('#host-info').textContent=c?`How to play: ${c.howToPlay} Success: ${c.successCriteria}`:'No challenge configured in challenges.js.';
}
$('#host-challenge').addEventListener('change',showChallengeInfo);showChallengeInfo();
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
$('#host-generate').addEventListener('click',()=>{
  const status=$('#host-status');const c=challenges[$('#host-challenge').value];
  const name=$('#host-name').value.trim();
  if(!c){status.textContent='No challenge configured.';status.className='small text-danger';return;}
  if(!name){status.textContent='Enter the participant name first.';status.className='small text-danger';return;}
  const item={
    id:`${c.challengeId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,
    title:c.title,type:'Challenge',date:today(),role:'Participant',
    description:`${name} completed the challenge "${c.title}" at the ${window.HOST_GROUP||'host'} booth. ${c.howToPlay}`,
    skills:c.skills,
    reflection:{
      whatIDid:`I completed "${c.title}" at the ${window.HOST_GROUP||'host'} booth.`,
      whatILearned:'(Edit this: what did you learn?)',
      challenge:'(Edit this: what was difficult?)',
      nextStep:'(Edit this: what will you try next?)'
    },
    evidence:[c.evidenceUrl],challengeId:c.challengeId,hostGroup:window.HOST_GROUP||'',category:c.category,schemaVersion:'1.0'
  };
  $('#host-output').value=JSON.stringify(item,null,2);
  status.textContent='JSON generated. Ask the participant to copy it and paste it into their own app.';status.className='small text-success';
});
$('#host-copy').addEventListener('click',async()=>{
  const out=$('#host-output');const status=$('#host-status');
  if(!out.value){status.textContent='Generate JSON first.';status.className='small text-danger';return;}
  const ok=await copyText(out.value,out);
  status.textContent=ok?'Copied to clipboard.':'Copy failed. The text is selected - press Ctrl+C.';status.className=ok?'small text-success':'small text-danger';
});
$('#host-download').addEventListener('click',()=>{
  const out=$('#host-output');if(!out.value)return;
  const url=URL.createObjectURL(new Blob([out.value],{type:'application/json'}));
  const a=node('a');a.href=url;a.download='portfolio-item.json';a.click();URL.revokeObjectURL(url);
});
function updateTargets(){
  const select=$('#import-target');select.innerHTML='';
  portfolios.forEach(p=>{const opt=node('option','',p.displayName);opt.value=p.id;select.append(opt);});
  if(activeId)select.value=activeId;
}
function isRealDate(v){
  if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
  const d=new Date(v+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v;
}
/* Strict check of a pasted Portfolio Item (no type coercion). Returns an error message or null. */
function validateImported(it){
  for(const k of ['id','title','type','date','role','description']){
    if(typeof it[k]!=='string'||!it[k].trim())return `Field "${k}" must be a non-empty text.`;
  }
  if(!isRealDate(it.date))return 'Field "date" must be a real date in YYYY-MM-DD format.';
  if(!Array.isArray(it.skills)||!it.skills.length||!it.skills.every(x=>typeof x==='string'&&x.trim()))return 'Field "skills" must be a non-empty array of text.';
  const r=it.reflection;
  if(!r||typeof r!=='object'||Array.isArray(r))return 'Field "reflection" must be an object.';
  for(const k of ['whatIDid','whatILearned','challenge','nextStep']){
    if(typeof r[k]!=='string')return `Field "reflection.${k}" must be text.`;
  }
  if(!Array.isArray(it.evidence)||!it.evidence.length||!it.evidence.every(x=>typeof x==='string'&&validUrl(x)))return 'Field "evidence" must be an array of at least one valid http/https URL.';
  for(const k of ['challengeId','hostGroup','category','schemaVersion']){
    if(it[k]!==undefined&&typeof it[k]!=='string')return `Field "${k}" must be text.`;
  }
  if(it.category!==undefined&&!['discover','mix','levelup'].includes(it.category))return 'Field "category" must be discover, mix or levelup.';
  if(it.schemaVersion!==undefined&&it.schemaVersion!=='1.0')return 'Unsupported schemaVersion (expected "1.0").';
  return null;
}
let pendingImport = null;
$('#import-button').addEventListener('click',()=>{
  const status=$('#import-status');let item;
  try{item=JSON.parse($('#import-json').value);}catch{status.textContent='Invalid JSON format. Please check your pasted text.';status.className='text-danger small mt-2';return;}
  if(!item || typeof item!=='object' || Array.isArray(item)){status.textContent='JSON must contain one Portfolio Item object.';status.className='text-danger small mt-2';return;}
  const problem=validateImported(item);
  if(problem){status.textContent=problem;status.className='text-danger small mt-2';return;}
  item=normalizeItem(item);
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
  pendingImport.reflection=reflection;activeId=target.id;
  try{await api('/'+encodeURIComponent(target.id)+'/items','POST',pendingImport);await load();pendingImport=null;$('#import-review').classList.add('d-none');$('#import-json').value='';status.textContent='Imported and saved to server. The item is shown in Portfolio Items.';status.className='text-success small mt-2';}
  catch(err){status.textContent=err.message;status.className='text-danger small mt-2';}
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
