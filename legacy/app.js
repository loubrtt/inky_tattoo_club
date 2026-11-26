const pages = ['accueil','clients','projets','finances','suivi','reglages'];
const labels = {accueil:'Vue d’ensemble',clients:'Clients',projets:'Projets & séances',finances:'Devis & paiements',suivi:'Suivi après-soin',reglages:'Réglages'};
const config = window.INKY_SUPABASE_CONFIG;
const authScreen = document.getElementById('authScreen');
const appShell = document.getElementById('appShell');
const authMessage = document.getElementById('authMessage');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const dialog = document.getElementById('clientDialog');
let db = null;
let currentUser = null;
let currentStudioId = null;
let currentRole = null;
let clients = [];

function setAuthMessage(message, type='') {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`.trim();
}
function toast(message){
  const el=document.getElementById('toast');
  el.textContent=message;el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>el.classList.remove('show'),2800);
}
function showPage(name){
  if(!pages.includes(name))return;
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));
  document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  document.getElementById('crumb').textContent=labels[name];
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>showPage(el.dataset.page)));
document.getElementById('dismissBanner').addEventListener('click',()=>document.querySelector('.demo-banner').remove());
document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{
  const action=el.dataset.action;
  if(action==='new-client') dialog.showModal();
  else toast('Ce module sera connecté dans une prochaine étape.');
}));

document.getElementById('closeClientDialog').addEventListener('click',()=>dialog.close());
document.getElementById('cancelClient').addEventListener('click',()=>dialog.close());
document.getElementById('clientSearch').addEventListener('input',e=>filterClients(e.target.value));
document.getElementById('logoutButton').addEventListener('click',async()=>{
  const {error}=await db.auth.signOut();
  if(error) toast(`Déconnexion impossible : ${error.message}`);
});

document.getElementById('resetPassword').addEventListener('click',async()=>{
  const email=document.getElementById('loginEmail').value.trim();
  if(!email){setAuthMessage('Saisis ton adresse e-mail, puis reclique sur « Mot de passe oublié ».','error');return;}
  const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
  setAuthMessage(error?`Impossible d’envoyer le lien : ${error.message}`:'Si cette adresse correspond à un compte, un e-mail de réinitialisation va être envoyé.',error?'error':'success');
});

loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  loginButton.disabled=true;loginButton.textContent='Connexion…';
  setAuthMessage('Vérification des identifiants…');
  const email=document.getElementById('loginEmail').value.trim();
  const password=document.getElementById('loginPassword').value;
  const {error}=await db.auth.signInWithPassword({email,password});
  loginButton.disabled=false;loginButton.textContent='Se connecter';
  if(error)setAuthMessage('Connexion refusée. Vérifie ton e-mail et ton mot de passe, puis réessaie.', 'error');
});

document.getElementById('clientForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!currentUser||!currentStudioId){toast('Session non disponible. Reconnecte-toi.');return;}
  const save=document.getElementById('saveClient');
  save.disabled=true;save.textContent='Enregistrement…';
  const form=new FormData(e.currentTarget);
  const payload={
    studio_id:currentStudioId,
    first_name:String(form.get('firstName')||'').trim(),
    last_name:String(form.get('lastName')||'').trim(),
    email:String(form.get('email')||'').trim()||null,
    project_summary:String(form.get('project')||'').trim()||null,
    created_by:currentUser.id
  };
  const {error}=await db.from('clients').insert(payload);
  save.disabled=false;save.textContent='Enregistrer la fiche';
  if(error){toast(`Fiche non enregistrée : ${error.message}`);return;}
  e.currentTarget.reset();dialog.close();
  await loadClients();showPage('clients');toast('Fiche de test enregistrée dans Supabase.');
});

function filterClients(query){
  const q=query.toLocaleLowerCase('fr');
  document.querySelectorAll('.client-row').forEach(row=>row.hidden=!row.dataset.search.includes(q));
}
function initials(first,last){return `${(first||'')[0]||''}${(last||'')[0]||''}`.toUpperCase();}
function renderClients(){
  const container=document.getElementById('clientRows');container.replaceChildren();
  if(!clients.length){const empty=document.createElement('div');empty.className='empty-clients';empty.textContent='Aucune fiche client dans ce studio pour le moment.';container.append(empty);}
  clients.forEach((client,index)=>{
    const row=document.createElement('div');row.className='client-row';
    row.dataset.search=`${client.first_name||''} ${client.last_name||''} ${client.email||''} ${client.project_summary||''}`.toLocaleLowerCase('fr');
    const name=document.createElement('div');name.className='client-name';
    const avatar=document.createElement('div');avatar.className=`avatar ${index%2?'lilac-avatar':'rose-avatar'}`;avatar.textContent=initials(client.first_name,client.last_name);
    const details=document.createElement('div');const strong=document.createElement('strong');strong.textContent=`${client.first_name} ${client.last_name}`;
    const small=document.createElement('small');small.textContent=client.email||'Aucun e-mail renseigné';details.append(strong,small);name.append(avatar,details);
    const project=document.createElement('span');project.textContent=client.project_summary||'À définir';
    const date=document.createElement('span');date.textContent=client.created_at?new Date(client.created_at).toLocaleDateString('fr-FR'):'—';
    const status=document.createElement('span');const dot=document.createElement('i');dot.className='state-dot';status.append(dot,document.createTextNode(' Fiche enregistrée'));
    const arrow=document.createElement('span');arrow.className='row-arrow';arrow.textContent='•';arrow.setAttribute('aria-hidden','true');
    row.append(name,project,date,status,arrow);container.append(row);
  });
  const count=String(clients.length);
  document.getElementById('clientNavCount').textContent=count;
  document.getElementById('dashboardClientCount').textContent=count;
  document.getElementById('clientResultCount').textContent=`${clients.length} fiche${clients.length>1?'s':''}`;
  filterClients(document.getElementById('clientSearch').value);
}
async function loadClients(){
  const {data,error}=await db.from('clients').select('id,first_name,last_name,email,project_summary,created_at').eq('studio_id',currentStudioId).is('deleted_at',null).order('created_at',{ascending:false});
  if(error){toast(`Lecture des fiches impossible : ${error.message}`);return;}
  clients=data||[];renderClients();
}
async function openStudioForUser(user){
  currentUser=user;
  const {data:membership,error:membershipError}=await db.from('studio_members').select('studio_id,role').eq('user_id',user.id).limit(1).maybeSingle();
  if(membershipError||!membership){
    await db.auth.signOut();
    authScreen.hidden=false;appShell.hidden=true;
    setAuthMessage('Aucun accès studio trouvé pour ce compte. Demande à un propriétaire du studio de vérifier ton invitation et ton rôle.','error');
    return;
  }
  currentStudioId=membership.studio_id;currentRole=membership.role;
  const {data:studio,error:studioError}=await db.from('studios').select('name').eq('id',currentStudioId).single();
  if(studioError){setAuthMessage('Le studio associé au compte n’a pas pu être chargé.','error');return;}
  authScreen.hidden=true;appShell.hidden=false;
  document.getElementById('profileName').textContent=user.email||'Membre INKY';
  document.getElementById('profileRole').textContent=`${currentRole} · ${studio.name}`;
  document.querySelector('.studio-label').textContent=studio.name.toLocaleUpperCase('fr');
  document.querySelector('.breadcrumb').firstChild.textContent=studio.name+' ';
  document.getElementById('profileInitials').textContent=initials(user.email||'I','');
  await loadClients();
}
async function handleSession(session){
  if(session?.user){await openStudioForUser(session.user);}
  else{currentUser=null;currentStudioId=null;currentRole=null;clients=[];appShell.hidden=true;authScreen.hidden=false;}
}

(async function init(){
  if(!window.supabase?.createClient||!config?.url||!config?.publishableKey){setAuthMessage('Configuration Supabase manquante. Vérifie supabase-config.js.','error');return;}
  db=window.supabase.createClient(config.url,config.publishableKey);
  const {data:{session},error}=await db.auth.getSession();
  if(error){setAuthMessage('Impossible de vérifier la session. Recharge la page.','error');return;}
  await handleSession(session);
  db.auth.onAuthStateChange((_event,nextSession)=>{setTimeout(()=>handleSession(nextSession),0);});
})();

if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
