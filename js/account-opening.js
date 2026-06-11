/**
 * paype.cc Account Opening — EXACT BLOOM QUESTIONNAIRE REPLICA.
 * Same 3-option owner card, same stakeholder arrays, same flow, same text.
 * Full-screen. Client-side only; sessionStorage persistence.
 */
(function(){
'use strict';

var appEl = document.getElementById('fmApp') || document.getElementById('aoApp');
if (!appEl) return;
var MODE = appEl.id === 'aoApp' ? 'full' : 'forme';

// ── STATE ─────────────────────────────────────────────────────
function loadState(){
  try { var s = sessionStorage.getItem('paype_bloom'); if (s) return JSON.parse(s); } catch(e){}
  return {
    step:0,
    respondentType:null, firstName:'', middleName:'', lastName:'', respondentEmail:'', respondentPhone:'',
    entityType:null, entityName:'', registrationNumber:'', jurisdiction:null,
    dateOfFormation:'', managementCountry:null, tinStatus:'has_tin', tinExplanation:'', _tinNoReason:'',
    shareholders:[], officers:[], beneficialOwners:[], _controllingPersons:[], otherUsers:[],
    industry:null, businessDescription:'', staffSize:null, monthlyVolume:null,
    primarySourceType:null, primarySourceIndustry:null, primarySourceCountry:null, primarySourceDesc:'',
    secondarySourceType:null, secondarySourceIndustry:null, secondarySourceCountry:null, secondarySourceDesc:'', hasSecondarySource:false,
    isPEP:false, pepDetails:'', highRiskFlags:[],
    hasSanctionsExposure:false, sanctionsDetails:'', hasCriminalHistory:false, criminalDetails:'',
    usState:null, submitted:false,
    _showAdvanced:false, _activeStab:'shareholders', _publiclyListed:false, _listingMarket:'',
    _mgmtRegNum:'', _tinNumber:'', _phoneCode:'+1', _entAddrStreet:'', _entAddrCity:'', _entAddrState:'', _entAddrZip:'', _entAddrCountry:'', _respAddr1:'', _respAddr2:'', _respAddr3:'', _respCity:'', _respState:'', _respZip:'', _respDocType:'', _respDocNumber:'', _respDocIssuer:'', _respDocCountry:'', _respDocIssueDate:'', _respDocExpiryDate:'', _revenue1:'', _revenue2:'', _assets1:'', _assets2:'', _liabilities1:'', _liabilities2:'', _finLicensed:false, _finLicenses:[], _leiCode:'', _respDOB:'', _respNationality:'', _respCountry:'', _respPepStatus:'not_pep', _ownerFirstName:'', _ownerMiddleName:'', _ownerLastName:'', _ownerEmail:'', _redomiciled:false, _redomDate:'', _redomCountry:'', _redomRegNum:''
  };
}
var state = loadState();
function saveState(){ try { sessionStorage.setItem('paype_bloom', JSON.stringify(state)); } catch(e){} }

var timerStart=null, timerInterval=null, elapsedSec=0;

// ── LEADERBOARD ──────────────────────────────────────────────
var LB=[{name:'lime_ninja_phoenix',time:187,daysAgo:2},{name:'cyan_wizard_dragon',time:201,daysAgo:5},{name:'ink_samurai_griffin',time:224,daysAgo:1},{name:'mint_phantom_cobra',time:241,daysAgo:8},{name:'gold_ronin_hydra',time:259,daysAgo:3},{name:'lime_spectre_falcon',time:278,daysAgo:12},{name:'cyan_ghost_panther',time:295,daysAgo:6}];

// ── DATA ─────────────────────────────────────────────────────
var ENTITY_TYPES=[{id:'commercial',label:'Commercial',icon:'🏢',desc:'Trading, e-commerce, services, manufacturing'},{id:'holding',label:'Holding / Private Investment / Family Office',icon:'💼',desc:'Investment holding, family wealth'},{id:'financial',label:'Financial / Fund',icon:'💰',desc:'Funds, asset management, financial services'},{id:'trust',label:'Trust / Foundation',icon:'🏛️',desc:'Trust, foundation, or estate structure'},{id:'partnership_biz',label:'Partnership (Business)',icon:'🤝',desc:'General or limited business partnership'},{id:'partnership_inv',label:'Partnership (Investment)',icon:'📊',desc:'Investment partnership'},{id:'estate',label:'Estate',icon:'⚖️',desc:'Deceased estate or succession'},{id:'nonprofit',label:'Non-Profit',icon:'🌱',desc:'Charity, NGO, social enterprise'},{id:'statutory',label:'Statutory Body',icon:'🏛️',desc:'Government or statutory authority'}];

var INDUSTRIES=[{id:'tech',label:'Technology / Software / SaaS'},{id:'financial_svcs',label:'Financial Services'},{id:'crypto',label:'Crypto / Web3 / Blockchain'},{id:'ecommerce',label:'E-Commerce / Retail'},{id:'consulting',label:'Consulting / Professional Services'},{id:'realestate',label:'Real Estate / Property'},{id:'manufacturing',label:'Manufacturing'},{id:'trade',label:'Import / Export / Trade'},{id:'media',label:'Media / Entertainment'},{id:'gambling',label:'Gambling / Online Gaming'},{id:'adult',label:'Adult Content'},{id:'arms',label:'Arms / Defence'},{id:'fx',label:'FX Brokerage'},{id:'affiliate',label:'Affiliate Marketing'},{id:'nutra',label:'Nutraceuticals / Supplements'},{id:'ngo',label:'Non-Profit / NGO'},{id:'other',label:'Other'}];

var OFFICER_ROLES_COMMERCIAL=['Director','Secretary','Chief Executive Officer','Chief Financial Officer','Chief Legal Officer','Treasurer'];
var OFFICER_ROLES_TRUST=['Trustee','Protector','Settlor/Founder','Council Member'];

function getOfficerRoles(){
  var et=ENTITY_TYPES.find(function(e){return e.id===state.entityType;});
  if (et&&(et.id==='trust'||et.id==='estate')) return OFFICER_ROLES_TRUST;
  return OFFICER_ROLES_COMMERCIAL;
}

var STAFF_BANDS=[{id:'1',label:'Just me'},{id:'2-10',label:'2–10'},{id:'11-50',label:'11–50'},{id:'51-250',label:'51–250'},{id:'251+',label:'251+'}];
var VOLUME_BANDS=[{id:'under10k',label:'Under $10K / month',tier:'Melody'},{id:'10k-50k',label:'$10K–$50K / month',tier:'Melody → Big Band'},{id:'50k-250k',label:'$50K–$250K / month',tier:'Big Band'},{id:'250k-1m',label:'$250K–$1M / month',tier:'Big Band → Orchestra'},{id:'over1m',label:'$1M+ / month',tier:'Orchestra'}];

// BLOOM-exact source-of-funds with industry interdependencies
var SOURCE_TYPES=[
  {id:'salary',label:'Salary / Employment income',icon:'💼',desc:'Regular income from employment, including bonuses and commissions.',entityOk:false,industries:['tech','consulting','financial_svcs','realestate','manufacturing','trade','media','ecommerce','ngo','other']},
  {id:'business',label:'Business revenue / Trading',icon:'🏢',desc:'Income generated from business operations, sales of goods or services.',entityOk:true,industries:['tech','consulting','financial_svcs','realestate','manufacturing','trade','media','ecommerce','crypto','gambling','adult','arms','fx','affiliate','nutra','ngo','other']},
  {id:'investment',label:'Investment income / Dividends',icon:'📈',desc:'Returns from investments including stocks, bonds, funds, and dividends.',entityOk:true,industries:['financial_svcs','crypto','realestate','other']},
  {id:'savings',label:'Personal savings',icon:'🏦',desc:'Accumulated personal savings from previous employment or business activities.',entityOk:false,industries:['tech','consulting','financial_svcs','realestate','manufacturing','trade','media','ecommerce','ngo','other']},
  {id:'inheritance',label:'Inheritance / Gift',icon:'🎁',desc:'Funds received through inheritance, bequest, or as a gift from family members.',entityOk:false,industries:['tech','consulting','financial_svcs','realestate','manufacturing','trade','media','ecommerce','ngo','other']},
  {id:'sale_assets',label:'Sale of assets / Property',icon:'🏠',desc:'Proceeds from the sale of real estate, vehicles, art, or other valuable assets.',entityOk:true,industries:['realestate','financial_svcs','other']},
  {id:'crypto_trading',label:'Cryptocurrency trading',icon:'₿',desc:'Profits from buying and selling cryptocurrencies on exchanges.',entityOk:true,enforceIndustry:'crypto',industries:['crypto']},
  {id:'crypto_mining',label:'Crypto mining / Staking rewards',icon:'⛏️',desc:'Income from cryptocurrency mining operations or staking rewards.',entityOk:true,enforceIndustry:'crypto',industries:['crypto']},
  {id:'ico',label:'ICO / Token sale proceeds',icon:'🪙',desc:'Funds raised through Initial Coin Offerings or token generation events.',entityOk:true,enforceIndustry:'crypto',industries:['crypto']},
  {id:'pension',label:'Pension / Retirement',icon:'👴',desc:'Income from pension schemes, retirement funds, or social security.',entityOk:false,industries:['tech','consulting','financial_svcs','realestate','manufacturing','trade','media','ecommerce','ngo','other']},
  {id:'other_source',label:'Other',icon:'📋',desc:'Any other legitimate source of funds not listed above. Please describe in detail.',entityOk:true,industries:['tech','consulting','financial_svcs','realestate','manufacturing','trade','media','ecommerce','crypto','gambling','adult','arms','fx','affiliate','nutra','ngo','other']}
];

var HIGH_RISK_FLAGS=[{id:'crypto_exchange',label:'Crypto exchange / brokerage',surcharge:true},{id:'gambling',label:'Online gambling / gaming',surcharge:true},{id:'adult',label:'Adult content / entertainment',surcharge:true},{id:'arms',label:'Arms / defence',surcharge:true},{id:'fx',label:'FX brokerage',surcharge:true},{id:'affiliate',label:'Affiliate marketing',surcharge:true},{id:'nutra',label:'Nutraceuticals / supplements',surcharge:true},{id:'third_party',label:'Handle third-party client funds'},{id:'msb_activity',label:'Money transmission / MSB activity'}];
var PHONE_CODES=[{code:"+1",label:"+1 US/CA"},{code:"+44",label:"+44 UK"},{code:"+49",label:"+49 DE"},{code:"+33",label:"+33 FR"},{code:"+39",label:"+39 IT"},{code:"+34",label:"+34 ES"},{code:"+31",label:"+31 NL"},{code:"+46",label:"+46 SE"},{code:"+47",label:"+47 NO"},{code:"+45",label:"+45 DK"},{code:"+358",label:"+358 FI"},{code:"+41",label:"+41 CH"},{code:"+353",label:"+353 IE"},{code:"+351",label:"+351 PT"},{code:"+48",label:"+48 PL"},{code:"+7",label:"+7 RU"},{code:"+86",label:"+86 CN"},{code:"+81",label:"+81 JP"},{code:"+82",label:"+82 KR"},{code:"+91",label:"+91 IN"},{code:"+55",label:"+55 BR"},{code:"+52",label:"+52 MX"},{code:"+61",label:"+61 AU"},{code:"+64",label:"+64 NZ"},{code:"+65",label:"+65 SG"},{code:"+852",label:"+852 HK"},{code:"+971",label:"+971 AE"},{code:"+972",label:"+972 IL"},{code:"+27",label:"+27 ZA"},{code:"+234",label:"+234 NG"},{code:"+254",label:"+254 KE"},{code:"+20",label:"+20 EG"},{code:"+66",label:"+66 TH"},{code:"+84",label:"+84 VN"},{code:"+60",label:"+60 MY"},{code:"+56",label:"+56 CL"},{code:"+57",label:"+57 CO"},{code:"+507",label:"+507 PA"},{code:"+506",label:"+506 CR"},{code:"+356",label:"+356 MT"},{code:"+357",label:"+357 CY"},{code:"+352",label:"+352 LU"},{code:"+230",label:"+230 MU"},{code:"+248",label:"+248 SC"}];

var COUNTRIES=[{code:'US',name:'United States',risk:0,us:true},{code:'GB',name:'United Kingdom',risk:0},{code:'DE',name:'Germany',risk:0,eu:true},{code:'FR',name:'France',risk:0,eu:true},{code:'IT',name:'Italy',risk:0,eu:true},{code:'ES',name:'Spain',risk:0,eu:true},{code:'NL',name:'Netherlands',risk:0,eu:true},{code:'BE',name:'Belgium',risk:0,eu:true},{code:'AT',name:'Austria',risk:0,eu:true},{code:'IE',name:'Ireland',risk:0,eu:true},{code:'PT',name:'Portugal',risk:0,eu:true},{code:'PL',name:'Poland',risk:0,eu:true},{code:'SE',name:'Sweden',risk:0,eu:true},{code:'DK',name:'Denmark',risk:0,eu:true},{code:'FI',name:'Finland',risk:0,eu:true},{code:'NO',name:'Norway',risk:0},{code:'CH',name:'Switzerland',risk:0},{code:'CA',name:'Canada',risk:0,eu:true},{code:'AU',name:'Australia',risk:0,eu:true},{code:'NZ',name:'New Zealand',risk:0,eu:true},{code:'JP',name:'Japan',risk:0},{code:'KR',name:'South Korea',risk:0},{code:'SG',name:'Singapore',risk:0},{code:'HK',name:'Hong Kong',risk:0},{code:'AE',name:'United Arab Emirates',risk:0},{code:'IL',name:'Israel',risk:0},{code:'IN',name:'India',risk:1},{code:'BR',name:'Brazil',risk:1},{code:'MX',name:'Mexico',risk:1},{code:'ZA',name:'South Africa',risk:1},{code:'TR',name:'Turkey',risk:1},{code:'CN',name:'China',risk:1},{code:'TW',name:'Taiwan',risk:0},{code:'TH',name:'Thailand',risk:1},{code:'VN',name:'Vietnam',risk:1},{code:'RU',name:'Russia',risk:3},{code:'IR',name:'Iran',risk:3},{code:'KP',name:'North Korea',risk:3},{code:'CU',name:'Cuba',risk:3},{code:'SY',name:'Syria',risk:3},{code:'VE',name:'Venezuela',risk:3},{code:'MM',name:'Myanmar',risk:3},{code:'BY',name:'Belarus',risk:3},{code:'AF',name:'Afghanistan',risk:3},{code:'SO',name:'Somalia',risk:3},{code:'LY',name:'Libya',risk:3},{code:'YE',name:'Yemen',risk:3},{code:'PA',name:'Panama',risk:1},{code:'KY',name:'Cayman Islands',risk:1},{code:'VG',name:'British Virgin Islands',risk:1},{code:'BM',name:'Bermuda',risk:0},{code:'MT',name:'Malta',risk:0,eu:true},{code:'CY',name:'Cyprus',risk:0,eu:true},{code:'LU',name:'Luxembourg',risk:0,eu:true},{code:'LI',name:'Liechtenstein',risk:0},{code:'MC',name:'Monaco',risk:0},{code:'MU',name:'Mauritius',risk:0},{code:'SC',name:'Seychelles',risk:0}];

// ── STEPS ─────────────────────────────────────────────────────
function getSteps(){
  if (MODE==='forme') return [
    {id:'owner',title:'Who owns the funds?',icon:'👤'},{id:'jurisdiction',title:'Where are you based?',icon:'🌍'},
    {id:'industry',title:'What industry?',icon:'🏭'},{id:'volume',title:'Expected volume?',icon:'📊'},
    {id:'risk',title:'Risk declarations',icon:'⚠️'},{id:'result',title:'Your assessment',icon:'📋'}
  ];
  // ── BLOOM 7-STEP FLOW ──────────────────────────────────────
  // 1: YOUR IDENTITY — respondent + entity details + jurisdiction
  // 2: ACCOUNT OWNER — who owns the account
  // 3: SOURCE OF FUNDS — funds + business + risk
  // 4: PEOPLE — officers, BOs, controlling persons, shareholders, authorized users
  // 5: REQUIRED DOCUMENTS
  // 6: SUMMARY
  // 7: SIGNATURE
  return [
    {id:'identity',title:'Your Identity',icon:'🪪'},
    {id:'owner',title:'Account Owner',icon:'👤'},
    {id:'funds',title:'Source of Funds',icon:'💰'},
    {id:'people',title:'People',icon:'👥'},
    {id:'documents',title:'Required Documents',icon:'📄'},
    {id:'review',title:'Summary',icon:'✅'},
    {id:'signature',title:'Signature',icon:'✍️'}
  ];
}

function renderIDBlock(prefix){
  var h='<div class="bloom-id-block" style="border:2px solid var(--color-border);padding:14px;margin-top:12px;background:var(--color-bg-secondary)">';
  h+='<strong style="display:block;margin-bottom:10px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em">Identification Document</strong>';
  h+='<div class="field-group"><label class="field-label">ID Type</label><select class="field-input bloom-inp-idtype" id="'+prefix+'IdType"><option value="">Select ID type…</option><option value="passport">Passport</option><option value="national_id">National ID Card</option><option value="driving_licence">Driving Licence</option><option value="residence_permit">Residence Permit</option><option value="other">Other</option></select></div>';
  h+='<div class="field-group bloom-id-other-wrap" style="display:none;margin-top:8px"><label class="field-label">Specify ID type</label><input class="field-input bloom-inp-idother" id="'+prefix+'IdOther" type="text" placeholder="e.g., Refugee travel document, Military ID"></div>';
  h+='<div class="field-group" style="margin-top:8px"><label class="field-label">ID Issuance Country</label>'+renderCountrySelect(prefix+'IdCountry','','Type country…')+'</div>';
  h+='<div class="bloom-name-row" style="margin-top:8px"><div class="field-group" style="flex:1"><label class="field-label">ID Number</label><input class="field-input bloom-inp-idnum" id="'+prefix+'IdNum" type="text" placeholder="Document number"></div><div class="field-group" style="flex:1"><label class="field-label">Expiration Date</label><input class="field-input bloom-inp-idexp" id="'+prefix+'IdExp" type="date" min="'+new Date().toISOString().split('T')[0]+'" onchange="var sub=document.getElementById(\''+prefix+'IdExpSub\');if(sub)sub.textContent=this.value?new Date(this.value+\'T00:00:00\').toLocaleDateString(\'en-US\',{day:\'numeric\',month:\'short\',year:\'numeric\'}):\'\'"><span class="date-sub" id="'+prefix+'IdExpSub"></span></div></div>';
  h+='</div>';
  return h;
}

function renderPhoneRow(prefix){
  var h='<div class="phone-input-row"><select class="field-input" id="'+prefix+'PhoneCode" style="width:140px;flex-shrink:0;font-size:0.8rem">';
  PHONE_CODES.forEach(function(pc){var sel=(state._phoneCode||'+1')===pc.code?' selected':'';h+='<option value="'+pc.code+'"'+sel+'>'+pc.label+'</option>';});
  h+='</select><input class="field-input bloom-inp-phone" id="'+prefix+'PhoneNumber" type="tel" placeholder="555 000 0000" style="flex:1"></div>';
  return h;
}
function renderIDBlockModal(){
  return '<div class="bloom-id-block" style="border:2px solid var(--color-border);padding:14px;margin-top:12px;background:var(--color-bg-secondary)"><strong style="display:block;margin-bottom:10px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em">Identification Document</strong><div class="field-group"><label class="field-label">ID Type</label><select class="field-input" id="modalIdType"><option value="">Select ID type…</option><option value="passport">Passport</option><option value="national_id">National ID Card</option><option value="driving_licence">Driving Licence</option><option value="residence_permit">Residence Permit</option><option value="other">Other</option></select></div><div class="field-group" id="modalIdOtherWrap" style="display:none;margin-top:8px"><label class="field-label">Specify ID type</label><input class="field-input" id="modalIdOther" type="text" placeholder="e.g., Refugee travel document"></div><div class="field-group" style="margin-top:8px"><label class="field-label">ID Issuance Country</label><input class="field-input" id="modalIdCountry" type="text" placeholder="e.g., United Kingdom"></div><div class="bloom-name-row" style="margin-top:8px"><div class="field-group" style="flex:1"><label class="field-label">ID Number</label><input class="field-input" id="modalIdNum" type="text" placeholder="Document number"></div><div class="field-group" style="flex:1"><label class="field-label">Expiration Date</label><input class="field-input" id="modalIdExp" type="date" onchange="var sub=document.getElementById(\'modalIdExpSub\');if(sub)sub.textContent=this.value?new Date(this.value+\'T00:00:00\').toLocaleDateString(\'en-US\',{day:\'numeric\',month:\'short\',year:\'numeric\'}):\'\'"><span class="date-sub" id="modalIdExpSub"></span></div></div></div>';
}

// ── BLOOM MODAL SYSTEM ────────────────────────────────────────
function showModal(title,bodyHTML,onSave){
  var overlay=document.createElement('div');overlay.className='bloom-modal-overlay';overlay.id='bloomModalOverlay';
  overlay.innerHTML='<div class="bloom-modal"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3>'+title+'</h3><button style="background:none;border:none;font-size:1.5rem;cursor:pointer;line-height:1" onclick="closeModal()">×</button></div><div id="bloomModalBody">'+bodyHTML+'</div><div class="bloom-modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-lime" id="bloomModalSave">Save</button></div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',function(e){if(e.target===overlay)closeModal();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});
  var sb=document.getElementById('bloomModalSave');if(sb&&onSave)sb.addEventListener('click',function(){onSave();closeModal();});
}
function closeModal(){var o=document.getElementById('bloomModalOverlay');if(o)o.remove();}

// ── RENDER ────────────────────────────────────────────────────
function render(){
  var steps=getSteps(); var visible=steps.filter(function(s){return !s.cond||s.cond();});
  if (!visible.length) return;
  var idx=Math.min(state.step,visible.length-1); var step=visible[idx]; saveState();

  if (MODE==='full' && step.id!=='review') startTimer();

  var html='';
  if (MODE==='full' && step.id!=='review'){
    html+='<div class="pixel-hud"><div class="pixel-timer-wrap"><span class="pixel-timer-label">⏱ SPEEDRUN</span><span class="pixel-timer" id="pixelTimer">00:00</span></div><div class="pixel-challenge">Beat <strong>03:07</strong> → get <strong style="color:#FFD700">$10</strong> · Don\'t beat it → still get <strong style="color:#FFD700">$5</strong> 🎉</div></div>';
  }

  var dataSteps=visible.filter(function(x){return ['result'].indexOf(x.id)===-1;});
  html+='<div class="fm-dots">'; dataSteps.forEach(function(s,i){var status=getTabStatus(s.id);var cls=i<idx?'fm-dot--done':i===idx?'fm-dot--active':'';if(status==='warn'&&i>idx)cls='fm-dot--warn';if(status==='warn'&&i<idx)cls='fm-dot--done fm-dot--done-warn'; html+='<button class="fm-dot '+cls+'" onclick="event.preventDefault();state.step='+i+';render();window.scrollTo(0,0);" style="cursor:pointer;border:none;background:none;padding:0;font:inherit" title="Go to: '+s.title+'"><span class="fm-dot-num">'+(i+1)+'</span><span class="fm-dot-label">'+s.title+'</span></button>';}); html+='</div>';

  if (step.id!=='result' && step.id!=='review'){
    var pct=Math.round((idx/dataSteps.length)*100);
    html+='<div class="fm-progress"><div class="fm-progress-bar" style="width:'+pct+'%"></div></div><div class="fm-progress-text">'+(MODE==='full'?'Section ':'Question ')+(idx+1)+' of '+dataSteps.length+'</div>';
  }

  html+='<h2>'+step.title+'</h2>';
  html+=renderStepContent(step.id);
  if (step.id!=='result' && step.id!=='review'){
    html+='<div class="fm-nav">';
    if (idx>0) html+='<button class="btn btn-secondary" id="fmPrevBtn">← Back</button>'; else html+='<span></span>';
    html+='<button class="btn btn-lime" id="fmNextBtn">'+(idx<dataSteps.length-1?'Next →':'Continue →')+'</button>';
    html+='</div>';
  }
  appEl.innerHTML='<div class="fm-wizard">'+html+'</div>';
  bindEvents();
}

// ── STEP CONTENT ──────────────────────────────────────────────
function renderStepContent(id){
  switch(id){
    case 'identity': return renderIdentity();
    case 'owner': return renderOwnerStep();
    case 'funds': return renderFundsAndBusiness();
    case 'people': return renderPeopleStep();
    case 'documents': return renderDocuments();
    case 'review': return renderReview();
    case 'signature': return renderSignatureStep();
    // For Me mode
    case 'jurisdiction': return renderCountrySearch();
    case 'industry': return renderCardList(INDUSTRIES,'industry','ind');
    case 'volume': return renderCardList(VOLUME_BANDS,'monthlyVolume','vol');
    case 'risk': return renderRiskDeclarations();
    case 'result': return renderResult();
    default: return '';
  }
}

// ── STEP 1: YOUR IDENTITY ──────────────────────────────────────
function renderIdentity(){
  var h='';
  h+='<h3>👤 Who is completing this form?</h3>';
  h+=renderRespondentStep();
  h+='<hr class="section-rule" style="margin:24px 0">';
  if (state.respondentType==='entity'){
    h+='<h3>🏢 Entity details</h3>';
    h+=renderEntityBasic();
    h+='<div style="margin-top:16px"><h3>🌍 Jurisdiction</h3>';
    h+=renderCountrySearch();
    var c=COUNTRIES.find(function(x){return x.code===state.jurisdiction;});
    if (c&&c.us){h+='<div style="margin-top:16px"><h3>📍 US state</h3>';h+=renderUSStates();}
    h+='</div>';
  } else {
    h+='<h3>🌍 Country of residence</h3>';
    h+=renderCountrySearch();
    var c2=COUNTRIES.find(function(x){return x.code===state.jurisdiction;});
    if (c2&&c2.us){h+='<div style="margin-top:16px"><h3>📍 US state</h3>';h+=renderUSStates();}
  }
  return h;
}

// ── STEP 3: SOURCE OF FUNDS + BUSINESS + RISK ──────────────────
function renderFundsAndBusiness(){
  var h='';
  h+='<h3>💰 Source of funds</h3>';
  h+=renderSourcesOfFunds();
  h+='<hr class="section-rule" style="margin:24px 0">';
  if (state.respondentType==='entity'){
    h+='<h3>🏭 Business profile</h3>';
    h+=renderBusiness();
    h+='<hr class="section-rule" style="margin:24px 0">';
  }
  h+='<h3>⚠️ Risk declarations</h3>';
  h+=renderRiskDeclarations();
  return h;
}

// ── STEP 4: PEOPLE — 5 tabs ────────────────────────────────────
function renderPeopleStep(){
  var h='';var tab=state._activeStab||'officers_ctrl';
  var mergedOfficers=[].concat(state.officers,(state._controllingPersons||[]).map(function(p){p._isCtrl=true;return p;}));
  var tabs=[
    {id:'officers_ctrl',label:'Officers & Controlling Persons',arr:mergedOfficers,icon:'📋'},
    {id:'shareholders',label:'Shareholders',arr:state.shareholders,icon:'📊'},
    {id:'beneficialOwners',label:'Beneficial Owners',arr:state.beneficialOwners,icon:'🔑'},
    {id:'account_users',label:'Account Users',arr:state.otherUsers,icon:'👥'}
  ];
  h+='<div class="bloom-tabs">';
  tabs.forEach(function(t){h+='<button class="bloom-tab'+(tab===t.id?' active':'')+'" data-tab="'+t.id+'">'+t.icon+' '+t.label+' ('+t.arr.length+')</button>';});
  h+='</div>';
  var active=tabs.find(function(t){return t.id===tab;})||tabs[0];var list=active.arr;

  if (tab==='officers_ctrl'){var offCount=state.officers.length;var ctrlCount=(state._controllingPersons||[]).length;h+=renderStatusBadge(offCount>0,'At least one officer required ('+offCount+' added)'+(ctrlCount>0?' · '+ctrlCount+' controlling person(s)':''));}
  if (tab==='shareholders'){var shTot=list.reduce(function(s,p){return s+(parseInt(p.percentage)||0);},0);h+=renderStatusBadge(shTot>=75,'Shareholders ≥75% — currently '+shTot+'%');
  var hiStake=list.filter(function(p){return parseInt(p.percentage||0)>=25;});
  if (hiStake.length>0) {
    var v50list=hiStake.filter(function(p){return parseInt(p.percentage||0)>=50;});
    h+='<div class="bloom-context-banner" style="margin-top:8px;border-left-color:#E67E22">';
    h+='<strong>⚠️ Verification required:</strong> '+hiStake.length+' stakeholder(s) with ≥25% ownership';
    if(v50list.length>0) h+=' (including '+v50list.length+' with ≥50% — enhanced due diligence)';
    h+='. Identity documents must be provided for each.</div>';
  }}
  if (tab==='beneficialOwners'){var boTot=list.reduce(function(s,p){return s+(parseInt(p.percentage)||0);},0);h+=renderStatusBadge(state._publiclyListed||boTot>=75,'BOs — '+(state._publiclyListed?'Publicly listed — optional':'currently '+boTot+'%'));
  var hiBO=list.filter(function(p){return parseInt(p.percentage||0)>=25;});
  if (hiBO.length>0) {
    var v50bo=hiBO.filter(function(p){return parseInt(p.percentage||0)>=50;});
    h+='<div class="bloom-context-banner" style="margin-top:8px;border-left-color:#E02020">';
    h+='<strong>🔴 Enhanced Due Diligence:</strong> '+hiBO.length+' beneficial owner(s) with ≥25%';
    if(v50bo.length>0) h+=' (including '+v50bo.length+' with ≥50%)';
    h+='. Certified ID + proof of address + source of wealth required.</div>';
  }}
  if (tab==='account_users') h+=renderStatusBadge(true,'Optional — add users who need account access');

  if (list.length>0){list.forEach(function(p,i){
    h+='<div class="bloom-person-row"><span class="bloom-person-name">'+(p.name||'Unnamed')+'</span>';
    if (p.role) h+='<span class="bloom-person-role">'+p.role+'</span>';
    if (p.percentage) h+='<span class="bloom-person-pct">'+p.percentage+'%</span>';
    if (tab==='account_users'){h+='<span class="bloom-person-role">'+({view_only:'👁 View Only',draft:'✏️ Draft',poa:'⚡ PoA'})[p.role]+'</span>';}
if (tab==='officers_ctrl'&&p._isCtrl)h+='<span class="bloom-person-role" style="background:rgba(0,223,255,0.15);color:var(--paype-cyan)">Controlling</span>';
    if (p.type==='entity') h+='<span class="bloom-person-type-badge">Entity</span>';
    if (p.pepStatus==='is_pep') h+='<span style="color:#E02020;font-size:0.65rem">PEP</span>';
    h+='<button class="bloom-person-remove" data-idx="'+i+'" data-tab="'+tab+'">✕</button></div>';
  });}else{h+='<p class="bloom-empty-state">No '+active.label.toLowerCase()+' added</p>';}

  // Add form depending on tab
  if (tab==='account_users'){
    var allPpl3=[];['shareholders','officers','beneficialOwners'].forEach(function(sec){(state[sec]||[]).forEach(function(p){if(!allPpl3.some(function(x){return x.name===p.name;}))allPpl3.push(p);});});
    var respName=[state.firstName,state.lastName].filter(Boolean).join(' ');
    if(respName&&state.respondentType!=='other_person'&&!allPpl3.some(function(x){return x.name===respName;}))allPpl3.unshift({name:respName,type:'person',role:'Respondent'});
    h+='<div class="bloom-add-form" style="margin-top:12px;text-align:center">';
    h+='<p class="fm-hint" style="margin-bottom:16px">All account users are added via modal — no inline form needed.</p>';
    h+='<div style="display:flex;gap:12px"><button class="btn btn-secondary" id="browseAcctUsersBtn" style="flex:1">📋 Browse People ('+allPpl3.length+')</button><button class="btn btn-lime" id="createNewAcctUserBtn" style="flex:1">➕ New Account User</button></div>';
    h+='</div>';
  } else if (tab==='officers_ctrl'){
    var allPeople=[];['shareholders','officers','beneficialOwners'].forEach(function(sec){(state[sec]||[]).forEach(function(p){if(!allPeople.some(function(x){return x.name===p.name;}))allPeople.push(p);});});
    var respName=[state.firstName,state.lastName].filter(Boolean).join(' ');
    if(respName&&state.respondentType!=='other_person'&&!allPeople.some(function(x){return x.name===respName;}))allPeople.unshift({name:respName,type:'person',role:'Respondent'});
    h+='<div class="bloom-add-form" style="margin-top:12px;text-align:center">';
    h+='<p class="fm-hint" style="margin-bottom:16px">All officers & controlling persons are added via modal.</p>';
    h+='<div style="display:flex;gap:12px"><button class="btn btn-secondary" id="browsePeopleBtn" style="flex:1">📋 Browse People ('+allPeople.length+')</button><button class="btn btn-lime" id="createNewPersonBtn" style="flex:1">➕ New Officer / Ctrl Person</button></div>';
    h+='</div>';
    return h;
  }
  if (tab==='shareholders'||tab==='beneficialOwners') {
    var s=tab==='officers'?'Officer':tab==='beneficialOwners'?'Beneficial Owner':'Shareholder';
    var allPeople=[];['shareholders','officers','beneficialOwners'].forEach(function(sec){(state[sec]||[]).forEach(function(p){if(!allPeople.some(function(x){return x.name===p.name;}))allPeople.push(p);});});
    h+='<div class="bloom-add-form" style="margin-top:12px"><strong style="display:block;margin-bottom:8px">Add '+s+'</strong>';
    // BLOOM IDENTITY: "Browse People" button opens full modal
    h+='<div class="bloom-name-row" style="margin-bottom:12px"><button class="btn btn-secondary" id="browsePeopleBtn" style="flex:1">📋 Browse People'+(allPeople.length>0?' ('+allPeople.length+')':'')+'</button><button class="btn btn-secondary" id="createNewPersonBtn" style="flex:1">➕ New '+s+'</button></div>';
    if (tab==='beneficialOwners') h+='<p class="bloom-warning-text">⚠️ Only individuals. Entities cannot be beneficial owners.</p>';
    // Shareholder type selector (person vs entity) — entity needs different fields
    if (tab==='shareholders') h+='<div class="field-group"><label class="field-label">Type</label><select class="field-input bloom-inp-type" id="shareholderTypeSel" onchange="var entFields=document.getElementById(\'entityFields\');var persFields=document.getElementById(\'personFields\');if(this.value===\'entity\'){entFields.style.display=\'\';persFields.style.display=\'none\'}else{entFields.style.display=\'none\';persFields.style.display=\'\'}"><option value="person">🧑 Person</option><option value="entity">🏢 Entity</option></select></div>';

    // Person fields (default visible)
    h+='<div id="personFields">';
    h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">First name</label><input class="field-input bloom-inp-fn" type="text" placeholder="First"></div><div class="field-group" style="flex:1"><label class="field-label">Middle</label><input class="field-input bloom-inp-mn" type="text" placeholder="Middle"></div><div class="field-group" style="flex:1"><label class="field-label">Last name</label><input class="field-input bloom-inp-ln" type="text" placeholder="Last"></div></div>';
    h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Email</label><input class="field-input bloom-inp-email" type="email" placeholder="email@example.com"></div><div class="field-group" style="flex:1"><label class="field-label">Phone</label>'+renderPhoneRow('sh')+'</div></div>';
    h+='<div class="field-group"><label class="field-label">Country of residence</label>'+renderCountrySelect('personResidence','','Type country of residence…')+'</div>'+renderIDBlock('sh')+'';
    h+='<div class="field-group"><label class="field-label">PEP Status</label><select class="field-input bloom-inp-pep"><option value="not_pep">Not a PEP</option><option value="is_pep">Yes, PEP</option><option value="family_member">Yes, family member of PEP</option></select></div>';
    h+='<div class="field-group bloom-pep-extra" style="display:none"><label class="field-label">PEP details</label><input class="field-input bloom-inp-pep-details" type="text" placeholder="e.g., Minister of Finance, Country"></div>';
    h+='<div class="field-group bloom-pep-extra" style="display:none"><label class="field-label">Years</label><input class="field-input bloom-inp-pep-years" type="number" min="1" style="width:100px"></div>';
    h+='</div>'; // end personFields

    // Entity fields (hidden by default, shown when type=entity)
    if (tab==='shareholders'){
      var repPeople=[].concat(state.officers,state.shareholders.filter(function(p){return p.type==='person';}),state.beneficialOwners);
      repPeople=repPeople.filter(function(p,i,a){return a.findIndex(function(x){return x.name===p.name;})===i;});
      h+='<div id="entityFields" style="display:none">';
      h+='<div class="field-group"><label class="field-label">Entity legal name</label><input class="field-input bloom-inp-ent-name" type="text" placeholder="Registered legal name"></div>';
      h+='<div class="field-group"><label class="field-label">Registration number</label><input class="field-input bloom-inp-ent-reg" type="text" placeholder="Company registration #"></div>';
      h+='<div class="field-group"><label class="field-label">Jurisdiction</label>'+renderCountrySelect('entJurisdictionSelect','','Type country…')+'</div>';
      h+='<div class="field-group"><label class="field-label">Designated representative <span style="color:#E02020">* required</span></label><select class="field-input bloom-inp-ent-rep"><option value="">Select representative…</option>';
      repPeople.forEach(function(rp){h+='<option value="'+esc(rp.name)+'">'+esc(rp.name)+(rp.role?' ('+rp.role+')':'')+'</option>';});
      h+='<option value="__new_rep__">+ Create new representative</option></select></div>';
      h+='</div>'; // end entityFields
    }

    // Role (officers_ctrl tab)
    if (tab==='officers_ctrl'){h+='<div class="field-group"><label class="field-label">Role</label><select class="field-input bloom-inp-role">';getOfficerRoles().forEach(function(r){h+='<option>'+r+'</option>';});h+='<option value="__ctrl__">⚡ Controlling Person</option></select></div>';}
    if (tab==='shareholders'||tab==='beneficialOwners') h+='<div class="field-group"><label class="field-label">Ownership %</label><input class="field-input bloom-inp-pct" type="number" min="10" max="100" placeholder="10-100%"></div>';
    // Email + phone for ALL person types (not entity shareholders)
    if (tab!=='shareholders'){
      h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Email</label><input class="field-input bloom-inp-email" type="email" placeholder="email@example.com"></div><div class="field-group" style="flex:1"><label class="field-label">Phone</label>'+renderPhoneRow('sh')+'</div></div>';
      h+='<div class="field-group"><label class="field-label">Country of residence</label>'+renderCountrySelect('personResidence','','Type country of residence…')+'</div>'+renderIDBlock('sh')+'';
      h+='<div class="field-group"><label class="field-label">PEP Status</label><select class="field-input bloom-inp-pep"><option value="not_pep">Not a PEP</option><option value="is_pep">Yes, PEP</option><option value="family_member">Yes, family member of PEP</option></select></div>';
      h+='<div class="field-group bloom-pep-extra" style="display:none"><label class="field-label">PEP details</label><input class="field-input bloom-inp-pep-details" type="text" placeholder="e.g., Minister of Finance, Country"></div>';
      h+='<div class="field-group bloom-pep-extra" style="display:none"><label class="field-label">Years</label><input class="field-input bloom-inp-pep-years" type="number" min="1" style="width:100px"></div>';
    }
  }
  return h;
}

// ── STEP 7: SIGNATURE ──────────────────────────────────────────
function renderSignatureStep(){
  var respondent=[state.firstName,state.lastName].filter(Boolean).join(' ')||'the account holder';
  var h='<h2>✍️ Sign your application</h2>';
  h+='<p class="fm-hint">Review the agreement below, then sign to submit your application.</p>';

  // Legal agreement
  h+='<div class="bloom-contract-section" style="margin-top:20px;padding:20px;border:3px solid var(--paype-ink);background:var(--color-bg-secondary)">';
  h+='<h3>📜 Account Opening Agreement</h3>';
  h+='<div style="max-height:160px;overflow-y:auto;padding:12px;background:var(--color-bg-primary);border:1px solid var(--color-border);font-size:0.78rem;line-height:1.6;color:var(--color-text-secondary);margin-bottom:16px">';
  h+='<p><strong>By signing, you confirm:</strong></p><ol style="padding-left:18px;margin:8px 0">';
  h+='<li>All information provided is true, complete, and accurate.</li>';
  h+='<li>You are the named respondent or are duly authorised to act on behalf of the owner/entity.</li>';
  h+='<li>You understand paype.cc is a FinCEN-registered MSB, not a bank, and balances are not FDIC-insured.</li>';
  h+='<li>You have read and agree to the <a href="/legal/terms/" target="_blank">Terms of Service</a>, <a href="/legal/privacy/" target="_blank">Privacy Policy</a>, and <a href="/legal/sailor-beware/" target="_blank">Sailor Beware risk disclosure</a>.</li>';
  h+='<li>You consent to identity verification, sanctions screening, and ongoing transaction monitoring.</li>';
  h+='<li>False or misleading information may result in account closure and reporting to authorities.</li>';
  h+='</ol></div>';

  // Acceptance + sign
  h+='<label class="bloom-check-label" style="margin-bottom:12px;display:flex;align-items:flex-start;gap:10px;cursor:pointer"><input type="checkbox" id="contractAcceptCheck" style="margin-top:2px;width:18px;height:18px;accent-color:var(--paype-lime);flex-shrink:0" onchange="document.getElementById(\'signContractBtn\').style.display=this.checked?\'\':\'none\'"><span>I have read, understood, and agree to the Account Opening Agreement.</span></label>';
  h+='<div id="signContractBtn" style="display:none"><button class="btn btn-lime btn-xl" style="width:100%;justify-content:center" onclick="event.preventDefault();showSignatureModal()">✍️ Sign &amp; Submit Application</button></div></div>';

  return h;
}

// ── RESPONDENT IDENTITY (BLOOM Page 0) ────────────────────────
function renderRespondentStep(){
  var h='';
  h+='<p class="bloom-explain">First, we need to know who is completing this form. This is <strong>your</strong> identity — the person filling out the questionnaire.</p>';

  // NamedCoin NFT import (BLOOM Powerbox pattern)
  h+='<div class="bloom-nft-import">';
  h+='<div style="display:flex;align-items:center;gap:12px">';
  h+='<div style="width:48px;height:48px;background:var(--paype-lime);border-radius:50% !important;display:flex;align-items:center;justify-content:center;font-size:1.5rem">🆔</div>';
  h+='<div><strong style="display:block">Import identity from NamedCoin NFT</strong><span style="font-size:0.8rem;color:var(--color-text-muted)">Pull your verified KYC data from the NamedCoin registry. One click, no typing.</span></div>';
  h+='</div>';
  h+='<button class="btn btn-secondary" id="namedcoinImportBtn" style="margin-top:10px">🔍 Search NamedCoin registry</button>';
  h+='<p id="nftImportStatus" style="font-size:0.8rem;color:var(--color-text-muted);margin-top:8px;display:none"></p>';
  h+='</div>';

  h+='<div class="bloom-section-divider"><span>or enter manually</span></div>';

  // Manual identity entry (BLOOM exact fields)
  h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">First name *</label><input class="field-input" id="firstName" type="text" placeholder="First name" value="'+esc(state.firstName)+'"></div><div class="field-group" style="flex:1"><label class="field-label">Middle name</label><input class="field-input" id="middleName" type="text" placeholder="Middle (optional)" value="'+esc(state.middleName)+'"></div><div class="field-group" style="flex:1"><label class="field-label">Last name *</label><input class="field-input" id="lastName" type="text" placeholder="Last name" value="'+esc(state.lastName)+'"></div></div>';
  var maxDOB=new Date();maxDOB.setFullYear(maxDOB.getFullYear()-18);var maxDOBStr=maxDOB.toISOString().split('T')[0];
  h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Email address *</label><input class="field-input" id="respEmail" type="email" placeholder="your@email.com" value="'+esc(state.respondentEmail)+'"></div><div class="field-group" style="flex:1"><label class="field-label">Date of birth (must be 18+)</label><input class="field-input" id="respDOB" type="date" max="'+maxDOBStr+'" value="'+esc(state._respDOB||'')+'" onchange="var sub=document.getElementById(\'respDOBSub\');if(sub)sub.textContent=this.value?new Date(this.value+\'T00:00:00\').toLocaleDateString(\'en-US\',{day:\'numeric\',month:\'short\',year:\'numeric\'}):\'\'"><span class="date-sub" id="respDOBSub">'+(state._respDOB?new Date(state._respDOB+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}):'')+'</span></div></div>';
  // BLOOM: Address fields (Address Line 1-3, City, State, ZIP, Country)
  h+='<div class="field-group" style="margin-top:8px"><label class="field-label">Address Line 1</label><input class="field-input" id="respAddr1" type="text" placeholder="Street address" value="'+esc(state._respAddr1||'')+'"></div>';
  h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Address Line 2</label><input class="field-input" id="respAddr2" type="text" placeholder="Apt, Suite, Floor (optional)" value="'+esc(state._respAddr2||'')+'"></div><div class="field-group" style="flex:1"><label class="field-label">Address Line 3</label><input class="field-input" id="respAddr3" type="text" placeholder="(optional)" value="'+esc(state._respAddr3||'')+'"></div></div>';
  h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">City / Town</label><input class="field-input" id="respCity" type="text" placeholder="City" value="'+esc(state._respCity||'')+'"></div><div class="field-group" style="flex:1"><label class="field-label">State / Province</label><input class="field-input" id="respState" type="text" placeholder="State" value="'+esc(state._respState||'')+'"></div><div class="field-group" style="flex:1"><label class="field-label">ZIP / Postal Code</label><input class="field-input" id="respZip" type="text" placeholder="ZIP" value="'+esc(state._respZip||'')+'"></div></div>';
  h+='<div class="field-group"><label class="field-label">Phone number</label><div class="phone-input-row"><select class="field-input" id="respPhoneCode" style="width:120px;flex-shrink:0">';
  PHONE_CODES=[{code:'+1',label:'+1 US/CA'},{code:'+44',label:'+44 UK'},{code:'+49',label:'+49 DE'},{code:'+33',label:'+33 FR'},{code:'+39',label:'+39 IT'},{code:'+34',label:'+34 ES'},{code:'+31',label:'+31 NL'},{code:'+46',label:'+46 SE'},{code:'+47',label:'+47 NO'},{code:'+45',label:'+45 DK'},{code:'+358',label:'+358 FI'},{code:'+41',label:'+41 CH'},{code:'+353',label:'+353 IE'},{code:'+351',label:'+351 PT'},{code:'+48',label:'+48 PL'},{code:'+7',label:'+7 RU'},{code:'+86',label:'+86 CN'},{code:'+81',label:'+81 JP'},{code:'+82',label:'+82 KR'},{code:'+91',label:'+91 IN'},{code:'+55',label:'+55 BR'},{code:'+52',label:'+52 MX'},{code:'+61',label:'+61 AU'},{code:'+64',label:'+64 NZ'},{code:'+65',label:'+65 SG'},{code:'+852',label:'+852 HK'},{code:'+971',label:'+971 AE'},{code:'+972',label:'+972 IL'},{code:'+27',label:'+27 ZA'},{code:'+234',label:'+234 NG'},{code:'+254',label:'+254 KE'},{code:'+20',label:'+20 EG'},{code:'+66',label:'+66 TH'},{code:'+84',label:'+84 VN'},{code:'+60',label:'+60 MY'},{code:'+56',label:'+56 CL'},{code:'+57',label:'+57 CO'},{code:'+507',label:'+507 PA'},{code:'+506',label:'+506 CR'},{code:'+356',label:'+356 MT'},{code:'+357',label:'+357 CY'},{code:'+352',label:'+352 LU'},{code:'+230',label:'+230 MU'},{code:'+248',label:'+248 SC'}];
  PHONE_CODES.forEach(function(pc){var sel=(state._phoneCode||'+1')===pc.code?' selected':'';h+='<option value="'+pc.code+'"'+sel+'>'+pc.label+'</option>';});
  h+='</select><input class="field-input" id="respPhone" type="tel" placeholder="555 000 0000" value="'+esc(state.respondentPhone)+'" style="flex:1"></div></div>';

  h+='<div class="field-group" style="margin-top:12px"><label class="field-label">Country of residence</label>'+renderCountrySelect('respCountrySelect',state._respCountry||'','Type country of residence…')+'</div>';

  // BLOOM: Identification Document for respondent
  h+='<div class="bloom-id-block" style="border:2px solid var(--color-border);padding:14px;margin-top:16px;background:var(--color-bg-secondary)">';
  h+='<strong style="display:block;margin-bottom:10px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em">Your Identification Document</strong>';
  h+='<div class="field-group"><label class="field-label">Document Type</label><select class="field-input" id="respDocType"><option value=""'+(state._respDocType?'':' selected')+'>Select type…</option><option value="passport"'+(state._respDocType==='passport'?' selected':'')+'>Passport</option><option value="national_id"'+(state._respDocType==='national_id'?' selected':'')+'>National ID Card</option><option value="driving_licence"'+(state._respDocType==='driving_licence'?' selected':'')+'>Driving Licence</option><option value="residence_permit"'+(state._respDocType==='residence_permit'?' selected':'')+'>Residence Permit</option><option value="other"'+(state._respDocType==='other'?' selected':'')+'>Other</option></select></div>';
  h+='<div class="field-group" style="margin-top:8px"><label class="field-label">Document Number</label><input class="field-input" id="respDocNumber" type="text" placeholder="Document number" value="'+esc(state._respDocNumber||'')+'"></div>';
  h+='<div class="field-group" style="margin-top:8px"><label class="field-label">Issuing Authority</label><input class="field-input" id="respDocIssuer" type="text" placeholder="e.g., UK Passport Office" value="'+esc(state._respDocIssuer||'')+'"></div>';
  h+='<div class="field-group" style="margin-top:8px"><label class="field-label">Issuing Country</label>'+renderCountrySelect('respDocCountry',state._respDocCountry||'','Type country…')+'</div>';
  h+='<div class="bloom-name-row" style="margin-top:8px"><div class="field-group" style="flex:1"><label class="field-label">Issue Date</label><input class="field-input" id="respDocIssueDate" type="date" max="'+new Date().toISOString().split('T')[0]+'" value="'+esc(state._respDocIssueDate||'')+'" onchange="var sub=document.getElementById(\'respDocIssueSub\');if(sub)sub.textContent=this.value?new Date(this.value+\'T00:00:00\').toLocaleDateString(\'en-US\',{day:\'numeric\',month:\'short\',year:\'numeric\'}):\'\'"><span class="date-sub" id="respDocIssueSub">'+(state._respDocIssueDate?new Date(state._respDocIssueDate+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}):'')+'</span></div><div class="field-group" style="flex:1"><label class="field-label">Expiry Date</label><input class="field-input" id="respDocExpiryDate" type="date" min="'+new Date().toISOString().split('T')[0]+'" value="'+esc(state._respDocExpiryDate||'')+'" onchange="var sub=document.getElementById(\'respDocExpSub\');if(sub)sub.textContent=this.value?new Date(this.value+\'T00:00:00\').toLocaleDateString(\'en-US\',{day:\'numeric\',month:\'short\',year:\'numeric\'}):\'\'"><span class="date-sub" id="respDocExpSub">'+(state._respDocExpiryDate?new Date(state._respDocExpiryDate+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}):'')+'</span></div></div>';
  h+='</div>';

  // PEP status (BLOOM: required for respondent)
  h+='<div class="field-group" style="margin-top:12px"><label class="field-label">PEP Status</label><select class="field-input" id="respPepStatus"><option value="not_pep"'+(state._respPepStatus==='not_pep'||!state._respPepStatus?' selected':'')+'>Not a PEP</option><option value="is_pep"'+(state._respPepStatus==='is_pep'?' selected':'')+'>Yes, I am a Politically Exposed Person</option><option value="family_member"'+(state._respPepStatus==='family_member'?' selected':'')+'>Yes, I am a family member of a PEP</option></select></div>';

  return h;
}

// ── EXACT BLOOM 3-OPTION OWNER CARD ──────────────────────────
function renderOwnerStep(){
  var h='';
  h+='<p class="bloom-explain">The owner is the person or entity who legally owns the funds in the account. In most cases, <strong>you (the respondent) are also the owner</strong> of your own funds.</p>';
  h+='<p class="bloom-explain">paype.cc requires clear identification of the lawful owner of all funds to ensure compliance with FinCEN regulations and proper account setup.</p>';
  h+='<p class="bloom-explain" style="font-weight:700;margin-top:16px">The lawful Owner of this account is:</p>';

  // BLOOM: Only "Me" visible by default. Advanced toggle reveals entity + PoA
  var respName=[state.firstName,state.lastName].filter(Boolean).join(' ')||'';
  h+='<div class="bloom-owner-row">';
  h+='<label class="bloom-owner-card'+(state.respondentType==='me'||!state.respondentType?' selected':'')+'"><input type="radio" name="ownerType" value="me" style="display:none" '+(state.respondentType==='me'||!state.respondentType?'checked':'')+'><span class="bloom-owner-icon">😊</span><div><span class="bloom-owner-title">Me, the respondent'+(respName?' — <span style="color:#157A30">'+esc(respName)+'</span>':'')+'</span><p class="bloom-owner-desc">Standard case: You own the funds in your account.</p></div></label>';
  h+='</div>';

  // Advanced options toggle — Entity + PoA hidden by default (BLOOM exact)
  h+='<button class="bloom-advanced-toggle" id="bloomAdvancedToggle"><span>⚙️ Advanced Options</span><span>'+(state._showAdvanced?'▴':'▾')+'</span></button>';
  h+='<p style="font-size:0.7rem;color:var(--color-text-muted);margin:4px 0 8px">Only use these if you are completing this form on behalf of another person or entity.</p>';

  if (state._showAdvanced || state.respondentType==='entity' || state.respondentType==='other_person') {
    h+='<div class="bloom-owner-row">';
    h+='<label class="bloom-owner-card'+(state.respondentType==='entity'?' selected':'')+'"><input type="radio" name="ownerType" value="entity" style="display:none" '+(state.respondentType==='entity'?'checked':'')+'><span class="bloom-owner-icon">🏢</span><div><span class="bloom-owner-title">Legal Entity</span><p class="bloom-owner-desc">A Business that I represent</p></div></label>';
    h+='<label class="bloom-owner-card'+(state.respondentType==='other_person'?' selected':'')+'"><input type="radio" name="ownerType" value="other_person" style="display:none" '+(state.respondentType==='other_person'?'checked':'')+'><span class="bloom-owner-icon">👥</span><div><span class="bloom-owner-title">Another person (PoA)</span><p class="bloom-owner-desc">Power of Attorney — acting as a representative for another individual.</p></div></label>';
    h+='</div>';
  }

  

  if (state.respondentType==='entity'){
    h+='<div style="margin-top:20px"><p class="fm-hint">Select the type of legal entity:</p><div class="fm-cards">';
    ENTITY_TYPES.forEach(function(et){var sel=state.entityType===et.id?' selected':''; h+='<button class="fm-card'+sel+'" data-et="'+et.id+'"><span class="fm-card-icon">'+et.icon+'</span><span class="fm-card-title">'+et.label+'</span><span class="fm-card-sub">'+et.desc+'</span></button>';});
    h+='</div></div>';
  }

  // Conditional: show name fields only for "other person" (PoA) — respondent already entered their own name in Page 0
  if (state.respondentType==='other_person'){
    h+='<div style="margin-top:20px"><p class="fm-hint">Enter the details of the person you are acting on behalf of:</p>';
    h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Owner\'s first name</label><input class="field-input" id="ownerFirstName" type="text" placeholder="First" value="'+esc(state._ownerFirstName||'')+'"></div><div class="field-group" style="flex:1"><label class="field-label">Middle name</label><input class="field-input" id="ownerMiddleName" type="text" placeholder="Middle" value="'+esc(state._ownerMiddleName||'')+'"></div><div class="field-group" style="flex:1"><label class="field-label">Owner\'s last name</label><input class="field-input" id="ownerLastName" type="text" placeholder="Last" value="'+esc(state._ownerLastName||'')+'"></div></div>';
    h+='<div class="field-group"><label class="field-label">Owner\'s email</label><input class="field-input" id="ownerEmail" type="email" placeholder="owner@email.com" value="'+esc(state._ownerEmail||'')+'"></div></div>';
  }
  // For "me" — no extra fields (respondent IS the owner, data already in Page 0)
  // For "entity" — entity details are on the next step (entity_basic)
  return h;
}

// ── ENTITY BASIC ──────────────────────────────────────────────
function renderEntityBasic(){
  var entityName=state.entityName||'your company';
  var mgmtCountryName=(COUNTRIES.find(function(c){return c.code===state.managementCountry;})||{}).name||'';
  var jurisCountryName=(COUNTRIES.find(function(c){return c.code===state.jurisdiction;})||{}).name||'';
  var sameCountry=state.managementCountry===state.jurisdiction;
  var tinLen=(state.tinExplanation||'').length;

  var h='';
  // Entity name banner
  if (state.entityName){
    h+='<div class="bloom-context-banner"><strong>Editing Entity:</strong> '+esc(state.entityName)+'</div>';
  }

  h+='<p class="bloom-explain">We need to understand in which jurisdictions <strong>'+esc(entityName)+'</strong> is active and where it\'s primarily controlled from.</p>';

  // Full legal name
  h+='<div class="field-group"><label class="field-label">Full legal entity name</label><input class="field-input field-input--lg" id="entityName" type="text" placeholder="As registered" value="'+esc(state.entityName)+'"></div>';
  h+='<div class="field-group"><label class="field-label">Registration / Company number</label><input class="field-input field-input--lg" id="regNum" type="text" placeholder="e.g., 12345678" value="'+esc(state.registrationNumber)+'"></div>';
  h+='<div class="field-group"><label class="field-label">Legal Entity Identifier (LEI) — optional</label><input class="field-input field-input--lg" id="leiCode" type="text" placeholder="e.g., 549300VIRTXBZNETJ096" value="'+esc(state._leiCode||'')+'"></div>';
  h+='<div class="field-group"><label class="field-label">Date of formation / incorporation</label><input class="field-input field-input--lg" id="incDate" type="date" max="'+new Date().toISOString().split('T')[0]+'" value="'+esc(state.dateOfFormation)+'" onchange="document.getElementById(\'incDateSub\').textContent=this.value?new Date(this.value+\'T00:00:00\').toLocaleDateString(\'en-US\',{day:\'numeric\',month:\'short\',year:\'numeric\'}):\'\'"><span class="date-sub" id="incDateSub">'+(state.dateOfFormation?new Date(state.dateOfFormation+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}):'')+'</span><span class="date-sub" style="color:#E02020;display:none" id="incDateErr">⚠ Date cannot be in the future</span></div>';

  // Jurisdiction of formation (BLOOM: in entity_basic, not separate step)
  h+='<div class="field-group"><label class="field-label">Jurisdiction of formation</label>'+renderCountrySelect('entityJurisdictionSelect',state.jurisdiction,'Type country name or ISO code…')+'</div>';

  // BLOOM: Re-domiciliation
  h+='<div class="bloom-check-box"><label class="bloom-check-label"><input type="checkbox" id="redomiciledCheck"'+(state._redomiciled?' checked':'')+'> Entity has since re-domiciled to another jurisdiction?</label>';
  if (state._redomiciled){
    h+='<div class="bloom-name-row" style="margin-top:8px"><div class="field-group" style="flex:1"><label class="field-label">Re-domiciliation date</label><input class="field-input" id="redomDate" type="date" value="'+esc(state._redomDate||'')+'" onchange="var sub=document.getElementById(\'redomDateSub\');if(sub)sub.textContent=this.value?new Date(this.value+\'T00:00:00\').toLocaleDateString(\'en-US\',{day:\'numeric\',month:\'short\',year:\'numeric\'}):\'\'"><span class="date-sub" id="redomDateSub">'+(state._redomDate?new Date(state._redomDate+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}):'')+'</span></div><div class="field-group" style="flex:1"><label class="field-label">Re-domiciliation country</label>'+renderCountrySelect('redomCountrySelect',state._redomCountry,'Select country…')+'</div></div>';
    h+='<div class="field-group"><label class="field-label">Registration number in new jurisdiction</label><input class="field-input" id="redomRegNum" type="text" placeholder="Registration number in re-domiciled country" value="'+esc(state._redomRegNum||'')+'"></div>';
  }
  h+='</div>';

  // BLOOM: Registered Address
  h+='<div class="bloom-entity-section"><h3>Registered Address</h3>';
  h+='<div class="field-group"><label class="field-label">Street</label><input class="field-input" id="entAddrStreet" type="text" placeholder="Registered street address" value="'+esc(state._entAddrStreet||'')+'"></div>';
  h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">City</label><input class="field-input" id="entAddrCity" type="text" placeholder="City" value="'+esc(state._entAddrCity||'')+'"></div><div class="field-group" style="flex:1"><label class="field-label">State / Province</label><input class="field-input" id="entAddrState" type="text" placeholder="State" value="'+esc(state._entAddrState||'')+'"></div><div class="field-group" style="flex:1"><label class="field-label">Postal Code</label><input class="field-input" id="entAddrZip" type="text" placeholder="ZIP" value="'+esc(state._entAddrZip||'')+'"></div></div>';
  h+='<div class="field-group"><label class="field-label">Country</label>'+renderCountrySelect('entAddrCountry',state._entAddrCountry||'','Type country…')+'</div>';
  h+='</div>';

  // Effective Management Question (BLOOM exact)
  h+='<div class="bloom-entity-section"><h3>Effective Management Question</h3>';
  h+='<div class="field-group"><label class="field-label">Where are your entity\'s key management decisions made?</label>';
  h+=renderCountrySelect('mgmtCountrySelect',state.managementCountry,'Type management country…')+'</div></div>';

  // Registration number + TIN in management country
  if (state.managementCountry){
    h+='<div class="bloom-entity-section">';
    h+='<h3>Registration & Tax in '+esc(mgmtCountryName||state.managementCountry)+'</h3>';

    // Registration number
    h+='<div class="field-group"><label class="field-label">Registration number in '+esc(mgmtCountryName||state.managementCountry)+'</label>';
    if (sameCountry){
      h+='<input class="field-input field-input--lg" type="text" value="'+esc(state.registrationNumber)+'" readonly style="background:#f0f0f0">';
      h+='<p class="bloom-explain" style="font-size:0.75rem">Same as jurisdiction of formation — auto-filled</p>';
    } else {
      h+='<input class="field-input field-input--lg" id="mgmtRegNum" type="text" placeholder="Enter registration number in '+esc(mgmtCountryName||'management country')+'" value="'+esc(state._mgmtRegNum||'')+'">';
    }
    h+='</div>';

    // TIN Status — question BEFORE number, defaults to "has TIN"
    h+='<div class="bloom-tin-section">';
    h+='<p class="field-label">Do you have a Tax Identification Number (TIN) in '+esc(mgmtCountryName||state.managementCountry)+'?</p>';
    h+='<div class="bloom-owner-row">';
    h+='<label class="bloom-owner-card'+(state.tinStatus==='has_tin'?' selected':'')+'"><input type="radio" name="tinStatus" value="has_tin" style="display:none"'+(state.tinStatus==='has_tin'?' checked':'')+'><div><span class="bloom-owner-title">✅ I have a TIN in '+esc(mgmtCountryName||state.managementCountry)+'</span></div></label>';
    h+='<label class="bloom-owner-card'+(state.tinStatus==='no_tin'?' selected':'')+'"><input type="radio" name="tinStatus" value="no_tin" style="display:none"'+(state.tinStatus==='no_tin'?' checked':'')+'><div><span class="bloom-owner-title">❌ I do not have a TIN</span></div></label>';
    h+='</div>';

    // TIN number (shown when "has TIN")
    if (state.tinStatus==='has_tin'){
      h+='<div class="field-group" style="margin-top:12px"><label class="field-label">TIN number</label><input class="field-input field-input--lg" id="tinNumber" type="text" placeholder="Enter your TIN for '+esc(mgmtCountryName||state.managementCountry)+'" value="'+esc(state._tinNumber||'')+'"></div>';
    }

    // No TIN — specific options
    if (state.tinStatus==='no_tin'){
      h+='<div class="field-group" style="margin-top:12px"><label class="field-label">Why do you not have a TIN?</label>';
      h+='<select class="field-input field-input--lg" id="tinNoReason"><option value="">Select reason…</option>';
      h+='<option value="startup"'+(state._tinNoReason==='startup'?' selected':'')+'>🚀 The company is a startup (less than 2 years old)</option>';
      h+='<option value="no_tin_country"'+(state._tinNoReason==='no_tin_country'?' selected':'')+'>🏛️ The country of effective management doesn\'t issue TINs</option>';
      h+='<option value="other"'+(state._tinNoReason==='other'?' selected':'')+'>📋 Other — please explain</option>';
      h+='</select></div>';
      if (state._tinNoReason==='other'){
        h+='<div class="field-group" style="margin-top:8px"><label class="field-label">Please explain</label><textarea class="field-input" id="tinExplain" rows="3" placeholder="Explain why you do not have a TIN for this jurisdiction" minlength="50" maxlength="500">'+esc(state.tinExplanation)+'</textarea>';
        h+='<p class="bloom-char-count'+(tinLen>=50&&tinLen<=500?' valid':'')+'">'+tinLen+'/500 '+(tinLen>=50?'✓':'('+(50-tinLen)+' more characters needed)')+'</p></div>';
      }
    }
    h+='</div></div>';
  }

  return h;
}

// ── BLOOM-STYLE SEARCHABLE COUNTRY SELECTOR ──────────────────
function renderCountrySelect(id,selected,placeholder){
  var selName='';
  if (selected){var c=COUNTRIES.find(function(x){return x.code===selected;});if(c)selName=c.name+' ('+c.code+')';}
  var h='<div class="country-select-wrap">';
  h+='<input type="text" class="field-input field-input--lg country-search-input" id="'+id+'_search" placeholder="'+placeholder+'" autocomplete="off" value="'+esc(selName)+'" data-target="'+id+'">';
  h+='<div class="country-dropdown" id="'+id+'_dropdown" style="display:none">';
  COUNTRIES.forEach(function(c){
    if (c.risk>=3) return;
    var flagMap={US:'🇺🇸',GB:'🇬🇧',DE:'🇩🇪',FR:'🇫🇷',IT:'🇮🇹',ES:'🇪🇸',NL:'🇳🇱',CH:'🇨🇭',CA:'🇨🇦',AU:'🇦🇺',NZ:'🇳🇿',JP:'🇯🇵',SG:'🇸🇬',HK:'🇭🇰',AE:'🇦🇪',IL:'🇮🇱',IN:'🇮🇳',BR:'🇧🇷',ZA:'🇿🇦',TR:'🇹🇷',CN:'🇨🇳',TH:'🇹🇭',RU:'🇷🇺',MT:'🇲🇹',CY:'🇨🇾',LU:'🇱🇺',MU:'🇲🇺',SC:'🇸🇨',PA:'🇵🇦',KY:'🇰🇾',BM:'🇧🇲',MC:'🇲🇨',BE:'🇧🇪',AT:'🇦🇹',IE:'🇮🇪',PT:'🇵🇹',PL:'🇵🇱',SE:'🇸🇪',DK:'🇩🇰',FI:'🇫🇮',NO:'🇳🇴',KR:'🇰🇷',MX:'🇲🇽',TW:'🇹🇼',VN:'🇻🇳',IR:'🇮🇷',KP:'🇰🇵',CU:'🇨🇺',SY:'🇸🇾',VE:'🇻🇪',MM:'🇲🇲',BY:'🇧🇾',AF:'🇦🇫',SO:'🇸🇴',LY:'🇱🇾',YE:'🇾🇪',VG:'🇻🇬',LI:'🇱🇮'};
      var flag=flagMap[c.code]||'';
      h+='<button class="country-option'+(selected===c.code?' selected':'')+'" data-code="'+c.code+'" data-target="'+id+'">'+flag+' '+c.name+' <small>'+c.code+'</small>'+(c.eu?' <span class="country-tag">EU</span>':'')+(c.us?' <span class="country-tag">US</span>':'')+'</button>';
  });
  h+='</div>';
  h+='<input type="hidden" id="'+id+'" value="'+(selected||'')+'">';
  h+='</div>';
  return h;
}

function renderCountrySearch(){
  return renderCountrySelect('fmCountrySelect',state.jurisdiction,'Type country name or ISO code…');
}

// ── US STATES ─────────────────────────────────────────────────
function renderUSStates(){
  var sts=[{code:'MT',name:'Montana',ok:true},{code:'AL',name:'Alabama',ok:false},{code:'AK',name:'Alaska',ok:false},{code:'AZ',name:'Arizona',ok:false},{code:'AR',name:'Arkansas',ok:false},{code:'CA',name:'California',ok:false},{code:'CO',name:'Colorado',ok:false},{code:'CT',name:'Connecticut',ok:false},{code:'DE',name:'Delaware',ok:false},{code:'FL',name:'Florida',ok:false},{code:'GA',name:'Georgia',ok:false},{code:'HI',name:'Hawaii',ok:false},{code:'ID',name:'Idaho',ok:false},{code:'IL',name:'Illinois',ok:false},{code:'IN',name:'Indiana',ok:false},{code:'IA',name:'Iowa',ok:false},{code:'KS',name:'Kansas',ok:false},{code:'KY',name:'Kentucky',ok:false},{code:'LA',name:'Louisiana',ok:false},{code:'ME',name:'Maine',ok:false},{code:'MD',name:'Maryland',ok:false},{code:'MA',name:'Massachusetts',ok:false},{code:'MI',name:'Michigan',ok:false},{code:'MN',name:'Minnesota',ok:false},{code:'MS',name:'Mississippi',ok:false},{code:'MO',name:'Missouri',ok:false},{code:'NE',name:'Nebraska',ok:false},{code:'NV',name:'Nevada',ok:false},{code:'NH',name:'New Hampshire',ok:false},{code:'NJ',name:'New Jersey',ok:false},{code:'NM',name:'New Mexico',ok:false},{code:'NY',name:'New York',ok:false},{code:'NC',name:'North Carolina',ok:false},{code:'ND',name:'North Dakota',ok:false},{code:'OH',name:'Ohio',ok:false},{code:'OK',name:'Oklahoma',ok:false},{code:'OR',name:'Oregon',ok:false},{code:'PA',name:'Pennsylvania',ok:false},{code:'RI',name:'Rhode Island',ok:false},{code:'SC',name:'South Carolina',ok:false},{code:'SD',name:'South Dakota',ok:false},{code:'TN',name:'Tennessee',ok:false},{code:'TX',name:'Texas',ok:false},{code:'UT',name:'Utah',ok:false},{code:'VT',name:'Vermont',ok:false},{code:'VA',name:'Virginia',ok:false},{code:'WA',name:'Washington',ok:false},{code:'WV',name:'West Virginia',ok:false},{code:'WI',name:'Wisconsin',ok:false},{code:'WY',name:'Wyoming',ok:false}];
  var h='<p class="bloom-explain">US accounts are currently available for <strong>Montana</strong> residents and businesses only.</p><div class="fm-cards fm-cards--scroll">';
  sts.forEach(function(st){var cls='fm-card'+(st.ok?'':' fm-card--no')+(state.usState===st.code?' selected':'');h+='<button class="'+cls+'" data-state="'+st.code+'">'+st.name+' <small>'+st.code+'</small><span class="fm-card-sub">'+(st.ok?'✅ Available':'❌')+'</span></button>';});
  h+='</div>'; return h;
}

// ── STAKEHOLDERS — EXACT BLOOM 3-TAB ─────────────────────────
function renderStakeholders(){
  var h=''; var tab=state._activeStab||'shareholders';
  var list=state[tab]||[];

  // Tabs
  h+='<div class="bloom-tabs"><button class="bloom-tab'+(tab==='shareholders'?' active':'')+'" data-tab="shareholders">Shareholders ('+state.shareholders.length+')</button><button class="bloom-tab'+(tab==='officers'?' active':'')+'" data-tab="officers">Officers ('+state.officers.length+')</button><button class="bloom-tab'+(tab==='beneficialOwners'?' active':'')+'" data-tab="beneficialOwners">Beneficial Owners ('+state.beneficialOwners.length+')</button></div>';

  // BLOOM: section status
  var shTotal=state.shareholders.reduce(function(s,p){return s+(parseInt(p.percentage)||0);},0);
  var boTotal=state.beneficialOwners.reduce(function(s,p){return s+(parseInt(p.percentage)||0);},0);
  var shOk=state.shareholders.length>0&&shTotal>=75;
  var offOk=state.officers.length>0;
  var boOk=state.beneficialOwners.length>0&&boTotal>=75;

  if (tab==='shareholders') h+=renderStatusBadge(shOk,'Shareholders account for ≥75% ownership');
  if (tab==='officers') h+=renderStatusBadge(offOk,'At least one officer added');
  if (tab==='beneficialOwners') h+=renderStatusBadge(boOk,'Beneficial owners account for ≥75%');

  // Existing entries
  if (list.length>0){
    list.forEach(function(p,i){
      h+='<div class="bloom-person-row"><span class="bloom-person-name">'+(p.name||'Unnamed')+'</span>';
      if (p.type==='entity') h+='<span class="bloom-person-type-badge">Entity</span>';
      if (p.role) h+='<span class="bloom-person-role">'+p.role+'</span>';
      if (p.percentage) h+='<span class="bloom-person-pct">'+p.percentage+'%</span>';
      h+='<button class="bloom-person-remove" data-idx="'+i+'" data-tab="'+tab+'">✕</button></div>';
    });
  } else {
    h+='<p class="bloom-empty-state">No '+tab+' added yet</p>';
  }

  // BLOOM: publicly listed checkbox for beneficial owners
  if (tab==='beneficialOwners'){
    h+='<div class="bloom-check-box"><label class="bloom-check-label"><input type="checkbox" id="publiclyListedCheck"'+(state._publiclyListed?' checked':'')+'> The company is a publicly listed entity</label>';
    if (state._publiclyListed){
      h+='<div class="field-group" style="margin-top:8px"><label class="field-label">Listing market</label><input class="field-input" id="listingMarket" type="text" placeholder="e.g., NYSE, NASDAQ, LSE" value="'+esc(state._listingMarket||'')+'"></div>';
      h+='<p class="bloom-explain" style="color:#157A30">Publicly listed — beneficial ownership details are optional.</p>';
    }
    h+='</div>';
  }

  // Add form
  var s=tab==='shareholders'?'Shareholder':tab==='officers'?'Officer':'Beneficial Owner';
  var remainingPct=100-(tab==='shareholders'?shTotal:boTotal);
  var canAdd=tab==='officers'?true:(remainingPct>=10);

  // Gather all existing people from all sections for the "select existing" dropdown (BLOOM pattern)
  var allPeople=[];
  ['shareholders','officers','beneficialOwners'].forEach(function(sec){
    (state[sec]||[]).forEach(function(p){if(!allPeople.some(function(x){return x.name===p.name;}))allPeople.push(p);});
  });

  // BLOOM: only show add form if publicly listed not checked (for BOs)
  if (!(tab==='beneficialOwners'&&state._publiclyListed)){
    if (canAdd){
      h+='<div class="bloom-add-form" style="margin-top:12px"><strong style="display:block;margin-bottom:8px">Add '+s+'</strong>';

      // BLOOM: "Select existing" dropdown + Edit Persons button (modal)
      if (allPeople.length>0){
        h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Select existing</label><select class="field-input bloom-existing-select"><option value="">— Select existing —</option>';
        allPeople.forEach(function(p){
          if (tab==='beneficialOwners'&&p.type==='entity') return;
          h+='<option value="'+esc(p.name)+'">'+esc(p.name)+(p.role?' ('+p.role+')':'')+(p.percentage?' · '+p.percentage+'%':'')+'</option>';
        });
        h+='<option value="__modal__">+ Create New in modal</option></select></div>';
        h+='<button class="btn btn-secondary btn-sm" id="editPersonsBtn" style="flex-shrink:0;align-self:flex-end;margin-bottom:10px">📋 Edit</button></div>';
      }

      // Beneficial owners: ONLY persons allowed
      if (tab==='beneficialOwners'){
        h+='<p class="bloom-warning-text">⚠️ Only individuals (natural persons) can be beneficial owners. Entities are not allowed.</p>';
      }

      h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">First name</label><input class="field-input bloom-inp-fn" type="text" placeholder="First"></div><div class="field-group" style="flex:1"><label class="field-label">Middle name</label><input class="field-input bloom-inp-mn" type="text" placeholder="Middle (optional)"></div><div class="field-group" style="flex:1"><label class="field-label">Last name</label><input class="field-input bloom-inp-ln" type="text" placeholder="Last"></div></div>';

      // Type selector (not for BOs — they're always persons)
      if (tab==='shareholders'){
        h+='<div class="field-group"><label class="field-label">Type</label><select class="field-input bloom-inp-type"><option value="person">Person</option><option value="entity">Entity</option></select></div>';
      }

      // Percentage
      if (tab==='shareholders'||tab==='beneficialOwners'){
        h+='<div class="field-group"><label class="field-label">Ownership percentage (%) — maximum available: '+remainingPct+'%</label><input class="field-input bloom-inp-pct" type="number" min="10" max="'+remainingPct+'" step="1" placeholder="Enter percentage (10-'+remainingPct+'%)"></div>';
      }

      // Role (officers only) — entity-type-aware
      if (tab==='officers'){
        h+='<div class="field-group"><label class="field-label">Role</label><select class="field-input bloom-inp-role">';
        getOfficerRoles().forEach(function(r){h+='<option>'+r+'</option>';});
        h+='</select></div>';
      }

      h+='<div class="field-group"><label class="field-label">Country of residence</label>'+renderCountrySelect('personResidence','','Type country of residence…')+'</div>'+renderIDBlock('sh')+'';
      // BLOOM: PEP status per person
      h+='<div class="field-group"><label class="field-label">PEP Status</label><select class="field-input bloom-inp-pep"><option value="not_pep">Not a PEP</option><option value="is_pep">Yes, this person is a PEP</option><option value="family_member">Yes, this person is a family member of a PEP</option></select></div>';
      h+='<div class="field-group bloom-pep-extra" style="display:none"><label class="field-label">For how many years?</label><input class="field-input bloom-inp-pep-years" type="number" min="1" placeholder="e.g., 5" style="width:100px"></div>';
      h+='<div class="field-group bloom-pep-extra" style="display:none"><label class="field-label">PEP details (position / country / relationship)</label><input class="field-input bloom-inp-pep-details" type="text" placeholder="e.g., Minister of Finance, Country, Family member"></div>';
      h+='<button class="btn btn-lime bloom-add-btn" data-tab="'+tab+'" style="margin-top:8px">Add '+s+'</button></div>';
    } else {
      h+='<p class="bloom-explain" style="text-align:center;color:var(--color-text-muted)">Maximum ownership allocated. Remove a stakeholder to add another.</p>';
    }
  }

  // Percentage totals
  if (tab==='shareholders'){h+='<p style="margin-top:8px;font-size:0.85rem;color:'+(shTotal>=75?'#157A30':'#E02020')+'">Total: <strong>'+shTotal+'%</strong> '+(shTotal<75?'(minimum 75% required)':'✅')+'</p>';}
  if (tab==='beneficialOwners'&&!state._publiclyListed){h+='<p style="margin-top:8px;font-size:0.85rem;color:'+(boTotal>=75?'#157A30':'#E02020')+'">Total: <strong>'+boTotal+'%</strong> '+(boTotal<75?'(minimum 75% required)':'✅')+'</p>';}
  if (tab==='beneficialOwners'&&state._publiclyListed){h+='<p style="margin-top:8px;font-size:0.85rem;color:#157A30">Publicly listed — beneficial ownership details optional ✅</p>';}
  if (tab==='officers'){h+='<p style="margin-top:8px;font-size:0.85rem;color:'+(list.length>0?'#157A30':'#E02020')+'">At least one officer required.</p>';}
  return h;
}

function renderStatusBadge(ok,msg){
  return '<div class="bloom-status-badge'+(ok?' ok':'')+'">'+(ok?'✅':'⏳')+' '+msg+'</div>';
}

// ── BUSINESS ──────────────────────────────────────────────────
function renderBusiness(){
  var h='<p class="fm-hint">Industry</p><div class="fm-cards fm-cards--scroll" style="max-height:280px">';
  INDUSTRIES.forEach(function(ind){var sel=state.industry===ind.id?' selected':'';h+='<button class="fm-card'+sel+'" data-ind="'+ind.id+'">'+ind.label+'</button>';});
  h+='</div>';
  if (state.industry) {var bizLen=(state.businessDescription||'').length;h+='<div class="field-group" style="margin-top:12px"><label class="field-label">Brief business description (10–50 characters)</label><input class="field-input bloom-counter" id="bizDesc" type="text" placeholder="What does the business do?" minlength="10" maxlength="50" value="'+esc(state.businessDescription)+'" data-counter="bizCharCount"><p class="bloom-char-count'+(bizLen>=10?' valid':'')+'" id="bizCharCount">'+bizLen+'/50 '+(bizLen>=10?'✓':'('+(10-bizLen)+' more needed)')+'</p></div>';}
  h+='<p class="fm-hint" style="margin-top:16px">Staff size</p>'+renderCardList(STAFF_BANDS,'staffSize','staff');
  // BLOOM: Financial license toggle
  var isFinancial=state.entityType&&['holding','financial','trust','partnership_inv','estate'].indexOf(state.entityType)!==-1;
  if (isFinancial){
    h+='<div class="bloom-check-box" style="margin-top:16px"><label class="bloom-check-label"><input type="checkbox" id="finLicensedCheck"'+(state._finLicensed?' checked':'')+'> Is the entity currently licensed for financial services?</label>';
    if (state._finLicensed){
      var licenses=state._finLicenses||[];
      h+='<div style="margin-top:8px">';
      licenses.forEach(function(l,i){
        h+='<div class="bloom-person-row"><span class="bloom-person-name">'+esc(l.country||'')+'</span><span class="bloom-person-role">'+esc(l.type||'')+'</span><button class="bloom-person-remove" data-flidx="'+i+'">✕</button></div>';
      });
      h+='<div class="bloom-name-row" style="margin-top:8px"><input class="field-input" id="finLicCountry" type="text" placeholder="Country" style="flex:1"><input class="field-input" id="finLicType" type="text" placeholder="License type" style="flex:1"><button class="btn btn-secondary btn-sm" id="addFinLicBtn" style="flex-shrink:0">Add</button></div>';
      h+='</div>';
    }
    h+='</div>';
    h+='<div class="field-group" style="margin-top:8px"><label class="field-label">Legal Entity Identifier (LEI) — optional</label><input class="field-input" id="leiCode" type="text" placeholder="e.g., 549300VIRTXBZNETJ096" value="'+esc(state._leiCode||'')+'"></div>';
  }

  h+='<p class="fm-hint" style="margin-top:16px">Expected monthly volume</p>'+renderCardList(VOLUME_BANDS,'monthlyVolume','vol');

  // BLOOM: Financial info for entities (revenue, assets, liabilities)
  var cy=new Date().getFullYear();
  var formedYear=state.dateOfFormation?parseInt(state.dateOfFormation.split('-')[0]):cy;
  if (formedYear<cy-1||!state.dateOfFormation){
    h+='<div class="bloom-entity-section" style="margin-top:20px"><h3>Financial Information (USD, approximate)</h3>';
    h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Revenue '+(cy-1)+'</label><input class="field-input" id="revenue1" type="number" placeholder="$" value="'+esc(state._revenue1||'')+'"></div>';
    if (formedYear<cy-2||!state.dateOfFormation){h+='<div class="field-group" style="flex:1"><label class="field-label">Revenue '+(cy-2)+'</label><input class="field-input" id="revenue2" type="number" placeholder="$" value="'+esc(state._revenue2||'')+'"></div>';}
    h+='</div><div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Assets '+(cy-1)+'</label><input class="field-input" id="assets1" type="number" placeholder="$" value="'+esc(state._assets1||'')+'"></div>';
    if (formedYear<cy-2||!state.dateOfFormation){h+='<div class="field-group" style="flex:1"><label class="field-label">Assets '+(cy-2)+'</label><input class="field-input" id="assets2" type="number" placeholder="$" value="'+esc(state._assets2||'')+'"></div>';}
    h+='</div><div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Liabilities '+(cy-1)+'</label><input class="field-input" id="liabilities1" type="number" placeholder="$" value="'+esc(state._liabilities1||'')+'"></div>';
    if (formedYear<cy-2||!state.dateOfFormation){h+='<div class="field-group" style="flex:1"><label class="field-label">Liabilities '+(cy-2)+'</label><input class="field-input" id="liabilities2" type="number" placeholder="$" value="'+esc(state._liabilities2||'')+'"></div>';}
    h+='</div></div>';
  }
  return h;
}

// ── SOURCES OF FUNDS ─────────────────────────────────────────
function renderSourcesOfFunds(){
  var isEntity=state.respondentType==='entity';
  var ownerLabel=isEntity?'the entity':(state.firstName||'you');

  // Filter sources based on owner type (BLOOM: entities can't have salary/pension/etc.)
  var availableSources=SOURCE_TYPES.filter(function(s){return isEntity?s.entityOk:true;});

  // Get industry options based on selected primary source
  var primarySrc=SOURCE_TYPES.find(function(s){return s.id===state.primarySourceType;});
  var primaryIndustries=(primarySrc&&primarySrc.industries)||INDUSTRIES.map(function(i){return i.id;});
  var primaryEnforced=primarySrc&&primarySrc.enforceIndustry;

  var secondarySrc=SOURCE_TYPES.find(function(s){return s.id===state.secondarySourceType;});
  var secondaryIndustries=(secondarySrc&&secondarySrc.industries)||INDUSTRIES.map(function(i){return i.id;});
  var secondaryEnforced=secondarySrc&&secondarySrc.enforceIndustry;

  var h='';
  if (isEntity){
    h+='<div class="bloom-context-banner"><p>Entities cannot claim salary, pension, or personal benefit sources.</p></div>';
  }

  // ── PRIMARY SOURCE ─────────────────────────────────────────
  h+='<h3 style="margin-top:20px">Primary source of funds</h3>';
  h+='<p class="bloom-explain">This is the main origin of the funds that <strong>'+ownerLabel+'</strong> will use with paype.cc.</p>';

  // Source type — BIG CARD BUTTONS
  h+='<p class="fm-hint">Source type</p><div class="fm-cards">';
  availableSources.forEach(function(st){
    var sel=state.primarySourceType===st.id?' selected':'';
    h+='<button class="fm-card'+sel+'" data-src="'+st.id+'"><span class="fm-card-icon">'+st.icon+'</span><span class="fm-card-title">'+st.label+'</span></button>';
  });
  h+='</div>';

  // Source description
  if (primarySrc&&primarySrc.desc){
    h+='<p class="bloom-source-desc">'+primarySrc.desc+'</p>';
  }

  // Industry — BIG CARD BUTTONS (filtered by source)
  if (state.primarySourceType){
    h+='<p class="fm-hint" style="margin-top:12px">Industry'+(primaryEnforced?' (auto-selected)':'')+'</p><div class="fm-cards">';
    INDUSTRIES.forEach(function(ind){
      if (primaryIndustries.indexOf(ind.id)===-1) return;
      var sel=state.primarySourceIndustry===ind.id||primaryEnforced===ind.id?' selected':'';
      h+='<button class="fm-card'+sel+'" data-src-ind="'+ind.id+'">'+ind.label+'</button>';
    });
    h+='</div>';
  }

  // Country
  h+='<div class="field-group"><label class="field-label">Country of origin</label>';
  h+=renderCountrySelect('primaryCountrySelect',state.primarySourceCountry,'Type country name or ISO code…');
  h+='</div>';

  // Description with char counter
  var pdLen=(state.primarySourceDesc||'').length;
  h+='<div class="field-group"><label class="field-label">Description</label>';
  h+='<textarea class="field-input bloom-counter" id="primarySourceDesc" rows="4" placeholder="Describe the source of funds in detail — how were these funds originally acquired?" maxlength="500" data-counter="primaryCharCount">'+esc(state.primarySourceDesc)+'</textarea>';
  h+='<p class="bloom-char-count'+(pdLen>=50&&pdLen<=500?' valid':'')+'" id="primaryCharCount">'+pdLen+'/500 '+(pdLen>=50?'✓':'('+(50-pdLen)+' more characters needed)')+'</p></div>';

  // ── SECONDARY SOURCE ───────────────────────────────────────
  h+='<div class="bloom-secondary-box">';
  h+='<h3>Did the funds come from multiple sources?</h3>';
  h+='<p class="bloom-explain">If the funds came from more than one source, and any secondary source accounts for 25% or more of the total, please add it here.</p>';
  h+='<label class="bloom-check-label"><input type="checkbox" id="hasSecondarySource"'+(state.hasSecondarySource?' checked':'')+'> Add a secondary source of funds</label>';
  h+='</div>';

  if (state.hasSecondarySource){
    h+='<div class="bloom-secondary-panel">';
    h+='<h3>Secondary source of funds</h3>';

    // Secondary source type — cards
    h+='<p class="fm-hint">Source type</p><div class="fm-cards">';
    availableSources.forEach(function(st){
      var sel=state.secondarySourceType===st.id?' selected':'';
      h+='<button class="fm-card'+sel+'" data-src-sec="'+st.id+'"><span class="fm-card-icon">'+st.icon+'</span><span class="fm-card-title">'+st.label+'</span></button>';
    });
    h+='</div>';

    if (secondarySrc&&secondarySrc.desc){
      h+='<p class="bloom-source-desc">'+secondarySrc.desc+'</p>';
    }

    if (state.secondarySourceType){
      h+='<p class="fm-hint" style="margin-top:8px">Industry'+(secondaryEnforced?' (auto-selected)':'')+'</p><div class="fm-cards">';
      INDUSTRIES.forEach(function(ind){
        if (secondaryIndustries.indexOf(ind.id)===-1) return;
        var sel=state.secondarySourceIndustry===ind.id||secondaryEnforced===ind.id?' selected':'';
        h+='<button class="fm-card'+sel+'" data-src-sec-ind="'+ind.id+'">'+ind.label+'</button>';
      });
      h+='</div>';
    }

    h+='<div class="field-group"><label class="field-label">Country of origin</label><input type="text" class="field-input" id="secondaryCountry" placeholder="e.g., United Kingdom" value="'+esc(state.secondarySourceCountry||'')+'"></div>';

    var sdLen=(state.secondarySourceDesc||'').length;
    h+='<div class="field-group"><label class="field-label">Description</label>';
    h+='<textarea class="field-input bloom-counter" id="secondarySourceDesc" rows="4" placeholder="Describe the secondary source of funds" maxlength="500" data-counter="secondaryCharCount">'+esc(state.secondarySourceDesc)+'</textarea>';
    h+='<p class="bloom-char-count'+(sdLen>=50&&sdLen<=500?' valid':'')+'" id="secondaryCharCount">'+sdLen+'/500 '+(sdLen>=50?'✓':'('+(50-sdLen)+' more characters needed)')+'</p></div>';

    h+='<button class="btn btn-secondary" id="removeSecondaryBtn" style="margin-top:8px">✕ Remove secondary source</button></div>';
  }

  return h;
}

// ── RISK DECLARATIONS ────────────────────────────────────────
function renderRiskDeclarations(){
  var h='<p class="fm-hint">Select all that apply. These may trigger a <strong>+50% surcharge</strong>.</p><div class="fm-cards">';
  HIGH_RISK_FLAGS.forEach(function(rf){var sel=state.highRiskFlags.indexOf(rf.id)!==-1;h+='<button class="fm-card fm-multi'+(sel?' selected':'')+'" data-rf="'+rf.id+'"><span class="fm-card-title">'+rf.label+(rf.surcharge?' <small>+50%</small>':'')+'</span>'+(sel?'<span class="fm-card-check">✓</span>':'')+'</button>';});
  h+='<button class="fm-card fm-multi'+(state.highRiskFlags.length===0?' selected':'')+'" data-rf="__clear__" style="border-color:#157A30"><span class="fm-card-title">✅ None of the above</span></button></div>';

  h+='<div style="margin-top:20px;padding:16px;border:2px solid var(--color-border)">';
  h+='<label class="field-label" style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><input type="checkbox" id="pepCheck"'+(state.isPEP?' checked':'')+'> I, or any beneficial owner, am a <strong>Politically Exposed Person (PEP)</strong> or a close associate/family member of a PEP</label>';
  if (state.isPEP) h+='<div class="field-group"><label class="field-label">PEP details</label><input class="field-input" id="pepDetails" type="text" placeholder="Name, position, country, relationship" value="'+esc(state.pepDetails)+'"></div>';
  h+='<label class="field-label" style="display:flex;align-items:center;gap:8px;margin:12px 0"><input type="checkbox" id="sanctionsCheck"'+(state.hasSanctionsExposure?' checked':'')+'> I, or any beneficial owner, have been subject to <strong>sanctions, restrictions, or regulatory enforcement</strong></label>';
  if (state.hasSanctionsExposure) h+='<div class="field-group"><label class="field-label">Details</label><input class="field-input" id="sanctionsDetails" type="text" placeholder="Jurisdiction, nature of action, date" value="'+esc(state.sanctionsDetails)+'"></div>';
  h+='<label class="field-label" style="display:flex;align-items:center;gap:8px;margin:12px 0"><input type="checkbox" id="criminalCheck"'+(state.hasCriminalHistory?' checked':'')+'> I, or any beneficial owner, have a <strong>criminal conviction</strong> related to fraud, financial crime, or dishonesty</label>';
  if (state.hasCriminalHistory) h+='<div class="field-group"><label class="field-label">Details</label><input class="field-input" id="criminalDetails" type="text" placeholder="Nature of offence, jurisdiction, date" value="'+esc(state.criminalDetails)+'"></div>';
  h+='</div>'; return h;
}

// ── TAB STATUS INDICATOR ─────────────────────────────────────
function getTabStatus(id){
  switch(id){
    case 'owner': return state.respondentType?'ok':'warn';
    case 'entity_basic': return (state.entityName&&state.registrationNumber)?'ok':(state.respondentType==='entity'?'warn':'');
    case 'jurisdiction': return state.jurisdiction?'ok':'warn';
    case 'us_state': return state.usState?'ok':(function(){var c=COUNTRIES.find(function(x){return x.code===state.jurisdiction;});return c&&c.us?'warn':'';})();
    case 'stakeholders': return (state.officers.length>0)?'ok':(state.respondentType==='entity'?'warn':'');
    case 'business': return state.industry?'ok':'';
    case 'funds': return state.primarySourceType?'ok':'warn';
    case 'risk': return '';
    case 'other_users': return '';
    case 'authority': return '';
    default: return '';
  }
}

// ── OTHER USERS ───────────────────────────────────────────────
function renderOtherUsers(){
  var h='<p class="bloom-explain">Add other people who need access to this account. Each person gets a specific role with defined permissions.</p>';

  // Existing users
  if (state.otherUsers.length>0){
    state.otherUsers.forEach(function(u,i){
      var roleLabel=u.role==='view_only'?'👁 View Only':u.role==='draft'?'✏️ Draft':'⚡ Power of Attorney';
      h+='<div class="bloom-person-row"><span class="bloom-person-name">'+esc(u.name||'')+'</span><span class="bloom-person-role">'+roleLabel+'</span><span style="font-size:0.75rem;color:var(--color-text-muted)">'+esc(u.email||'')+'</span><button class="bloom-person-remove" data-uidx="'+i+'">✕</button></div>';
    });
  } else {
    h+='<p class="bloom-empty-state">No other users added yet. The account owner has full access by default.</p>';
  }

  // Add form
  h+='<div class="bloom-add-form" style="margin-top:12px"><strong style="display:block;margin-bottom:8px">Add user</strong>';
  h+='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Full name</label><input class="field-input bloom-usr-name" type="text" placeholder="Full name"></div><div class="field-group" style="flex:1"><label class="field-label">Email</label><input class="field-input bloom-usr-email" type="email" placeholder="email@example.com"></div></div>';
  h+='<div class="field-group"><label class="field-label">Access level</label><div class="bloom-owner-row">';
  h+='<label class="bloom-owner-card"><input type="radio" name="userRole" value="view_only" style="display:none" checked><div><span class="bloom-owner-title">👁 View Only</span><p class="bloom-owner-desc">See balances and history. Cannot move funds.</p></div></label>';
  h+='<label class="bloom-owner-card"><input type="radio" name="userRole" value="draft" style="display:none"><div><span class="bloom-owner-title">✏️ Draft</span><p class="bloom-owner-desc">Prepare transactions. Needs owner approval to execute.</p></div></label>';
  h+='<label class="bloom-owner-card"><input type="radio" name="userRole" value="poa" style="display:none"><div><span class="bloom-owner-title">⚡ Power of Attorney</span><p class="bloom-owner-desc">Full authority to act on behalf of the account.</p></div></label>';
  h+='</div></div>';
  h+='<button class="btn btn-lime bloom-add-user-btn" style="margin-top:8px">Add user</button></div>';
  return h;
}

// ── AUTHORITY MATRIX ──────────────────────────────────────────
function renderAuthorityMatrix(){
  var allUsers=[{name:state.firstName+' '+state.lastName||'Account Owner',role:'owner',email:state.respondentEmail}].concat(state.otherUsers);
  var h='<p class="bloom-explain">This is the authority matrix for your account — who can do what. The account owner always has full access.</p>';
  h+='<div style="overflow-x:auto"><table class="price-table"><thead><tr><th>Person</th><th>Role</th><th>View</th><th>Draft</th><th>Approve</th><th>Send</th><th>Add Users</th></tr></thead><tbody>';
  allUsers.forEach(function(u){
    var isOwner=u.role==='owner';
    var view=isOwner||u.role==='view_only'||u.role==='draft'||u.role==='poa';
    var draft=isOwner||u.role==='draft'||u.role==='poa';
    var approve=isOwner||u.role==='poa';
    var send=isOwner||u.role==='poa';
    var addUsers=isOwner;
    h+='<tr><td><strong>'+esc(u.name||'')+'</strong>'+(u.email?'<br><small>'+esc(u.email)+'</small>':'')+'</td><td>'+(isOwner?'🔑 Owner':u.role==='view_only'?'👁 View Only':u.role==='draft'?'✏️ Draft':'⚡ PoA')+'</td>';
    h+='<td>'+(view?'✅':'❌')+'</td><td>'+(draft?'✅':'❌')+'</td><td>'+(approve?'✅':'❌')+'</td><td>'+(send?'✅':'❌')+'</td><td>'+(addUsers?'✅':'❌')+'</td></tr>';
  });
  h+='</tbody></table></div>';
  h+='<p class="bloom-explain" style="margin-top:12px">Every access and every transaction is cryptographically gated to the named user — nothing moves without a signed confirmation.</p>';
  return h;
}

// ── DOCUMENTS ─────────────────────────────────────────────────
function renderDocuments(){
  var docs=[];
  // BLOOM: owner change invalidation warning
  var h='<h2>📄 Your document checklist</h2>';
  // BLOOM: owner change invalidation warning
  if (state._ownerChanged) {
    h+='<div class="bloom-recalc-banner"><div class="bloom-recalc-icon">⚠️</div><div><strong>The owner has changed</strong><p style="margin:4px 0 0;font-size:0.85rem">Previous documents have been invalidated. Please review the updated checklist below for the new owner.</p></div></div>';
    state._ownerChanged=false;
  }
  if (!state.respondentType) {
    var h='<h2>📄 Your document checklist</h2>';
    h+='<div style="padding:24px;text-align:center;border:2px dashed var(--color-border)"><p style="font-size:1.1rem;margin-bottom:8px">⚠️ Account owner not yet selected</p><p style="color:var(--color-text-muted);margin-bottom:16px">Please go back to the <strong>Account Owner</strong> step and select who owns the account. The document checklist depends on this.</p><a href="#" onclick="event.preventDefault();state.step=1;render();window.scrollTo(0,0);" style="color:var(--paype-ink);font-weight:700">← Go to Account Owner step</a></div>';
    h+='<div class="fm-nav"><button class="btn btn-secondary" id="fmPrevBtn">← Back</button></div>';
    return h;
  }
  var respondent=[state.firstName,state.lastName].filter(Boolean).join(' ')||'the account holder';
  var ownerName=(state.respondentType==='other_person'&&state._ownerFirstName)?(state._ownerFirstName+' '+(state._ownerLastName||'')).trim():respondent;
  var entityName=state.entityName||'the entity';
  var risk=calcRisk(), isHighRisk=risk>=2||state.highRiskFlags.length>0;

  // Helper: add a BLOOM-standard document with all 4 dimensions
  function doc(id,why,cat,issuer,conditions,namedPerson,tmpl){
    docs.push({doc:id,why:why,cat:cat,issuer:issuer,conditions:conditions||[],namedPerson:namedPerson,template:tmpl});
  }

  // ══════════════════════════════════════════════════════════════
  // CASE 1: OWNER = RESPONDENT (me)
  // ══════════════════════════════════════════════════════════════
  if (state.respondentType==='me'){
    doc(
      'Government-issued Photo ID',
      'A colour, high-quality scan of a currently valid passport, national identity card, or driving licence.',
      'Identity',
      'Issued by a national government authority (passport office, interior ministry, or equivalent).',
      ['In colour','High-quality scan — no blur, no crops','Currently valid — not expired','Shows full name, date of birth, and photograph'],
      'Must be in the name of: '+respondent
    );
    doc(
      'Proof of Address',
      'A recent utility bill, bank statement, or government-issued letter confirming the residential address.',
      'Identity',
      'Issued by a utility provider, licensed bank, or government authority.',
      ['Issued within the last 3 months','Shows full name and complete address','Matches the address declared in this application'],
      'Must be in the name of: '+respondent
    );
    if (risk>=1){
      doc(
        'Source of Funds Documentation',
        'A contract of employment, bank/trading account statement, sale agreement, or equivalent third-party document that clearly demonstrates the origin of the funds.',
        'Financial',
        'Issued by an employer, licensed bank, licensed exchange, solicitor, or relevant counterparty.',
        ['Must be in the name of '+respondent,'Must show the source and approximate amount of funds','Third-party document — not self-declared'],
        'Must be in the name of: '+respondent
      );
    }
    if (risk>=2){
      doc(
        'Source of Funds Confirmation',
        'A letter or certificate from a licensed bank, practising lawyer, chartered accountant, or regulatory body confirming the source and legitimacy of the funds.',
        'Financial',
        'Issued by a licensed financial institution, practising lawyer, chartered accountant, or regulatory body.',
        ['On official letterhead','Signed and dated within the last 6 months','Confirms the source and legitimate origin of funds','Must reference '+respondent],
        'Must reference: '+respondent
      );
    }
  }

  // ══════════════════════════════════════════════════════════════
  // CASE 2: OWNER = OTHER PERSON (PoA)
  // ══════════════════════════════════════════════════════════════
  else if (state.respondentType==='other_person'){
    doc(
      'Government-issued Photo ID — Owner',
      'A colour, high-quality scan of a currently valid passport, national identity card, or driving licence of the person you are acting for.',
      'Identity',
      'Issued by a national government authority (passport office, interior ministry, or equivalent).',
      ['In colour','High-quality scan','Currently valid — not expired','Shows the owner\'s full name, date of birth, and photograph'],
      'Must be in the name of: '+ownerName
    );
    doc(
      'Proof of Address — Owner',
      'A utility bill or letter from a licensed financial institution or government authority confirming the owner\'s residential address.',
      'Identity',
      'Issued by a utility provider, licensed bank, or government authority.',
      ['Issued within the last 3 months','Shows the owner\'s full name and complete address'],
      'Must be in the name of: '+ownerName
    );
    doc(
      'Power of Attorney (Natural Person)',
      'A signed and witnessed Power of Attorney authorising you to act on behalf of the owner for the purposes of this account.',
      'Authority',
      'Signed by the owner ('+ownerName+') and witnessed by a notary public, practising lawyer, or equivalent authorised person.',
      ['Use the paype.cc POA Natural Person template','All fields completed','Signed by the owner','Witnessed/certified','Upload a clear, high-quality scan'],
      'Must name: the owner ('+ownerName+') as Grantor and you ('+respondent+') as Grantee',
      'POA Natural Person template'
    );
    doc(
      'Beneficial Ownership Declaration',
      'A signed declaration identifying all natural persons who ultimately own or control 25% or more of the funds.',
      'Authority',
      'Signed by the owner ('+ownerName+'), witnessed.',
      ['Use the paype.cc BO Declaration template','All fields completed','Signed by the owner','Lists all ≥25% beneficial owners'],
      'Must be signed by: '+ownerName,
      'Beneficial Ownership Declaration template'
    );
    doc(
      'Data Processing Consent',
      'Signed consent from the owner authorising paype.cc to collect, process, and store their personal data for KYC and compliance purposes.',
      'Authority',
      'Signed by the owner ('+ownerName+').',
      ['Use the paype.cc Data Consent template','All fields completed','Signed by the owner'],
      'Must be signed by: '+ownerName,
      'Data Processing Consent template'
    );
    if (risk>=1){
      doc(
        'Source of Funds Documentation',
        'A contract, account statement, or third-party document that clearly demonstrates the source of funds for the owner.',
        'Financial',
        'Issued by an employer, licensed bank, licensed exchange, solicitor, or relevant counterparty.',
        ['Must reference the owner ('+ownerName+')','Must show the source and approximate amount of funds','Third-party document — not self-declared'],
        'Must reference: '+ownerName
      );
    }
    if (risk>=2){
      doc(
        'Source of Funds Confirmation',
        'A letter from a licensed bank, practising lawyer, or chartered accountant confirming the source and legitimacy of the owner\'s funds.',
        'Financial',
        'Issued by a licensed financial institution, practising lawyer, or chartered accountant.',
        ['On official letterhead','Signed and dated within the last 6 months','References '+ownerName],
        'Must reference: '+ownerName
      );
    }
  }

  // ══════════════════════════════════════════════════════════════
  // CASE 3: OWNER = ENTITY
  // ══════════════════════════════════════════════════════════════
  else if (state.respondentType==='entity'){
    doc(
      'Certificate of Incorporation / Registration',
      'The official certificate issued by the government registrar confirming the legal existence of the entity.',
      'Entity',
      'Issued by the Companies Registry, Business Registrar, or equivalent government authority in the jurisdiction of formation ('+((COUNTRIES.find(function(c){return c.code===state.jurisdiction;})||{}).name||'the formation country')+').',
      ['Certified true copy or original','Shows the legal name of: '+entityName,'Shows the registration/company number','Shows the date of incorporation/formation'],
      'Must be in the name of: '+entityName
    );
    doc(
      'Founding / Constitutional Documents',
      'The complete charter, articles of incorporation, bylaws, trust deed, or equivalent founding documents — including all schedules, annexes, and amendments.',
      'Entity',
      'As filed with or issued by the relevant government authority in the jurisdiction of formation.',
      ['Complete — all schedules and annexes included','Shows the entity\'s legal structure and purpose','Shows governance and decision-making rules','Currently in force'],
      'Must identify: '+entityName
    );
    doc(
      'Power of Attorney (Corporate)',
      'A corporate resolution or Power of Attorney authorising the respondent to act on behalf of the entity for account opening and operation.',
      'Authority',
      'Issued by the Board of Directors, Managing Director, or authorised officer of '+entityName+', witnessed.',
      ['Use the paype.cc Corporate POA template','Signed by an authorised director/officer of '+entityName,'Specifies the scope of authority granted','Names the respondent ('+respondent+') as authorised representative'],
      'Must identify the entity ('+entityName+') as Grantor and you ('+respondent+') as Grantee',
      'Corporate POA template'
    );
    doc(
      'Corporate Beneficial Ownership Declaration',
      'A signed declaration identifying all natural persons who ultimately own or control 25% or more of the entity, directly or indirectly.',
      'Authority',
      'Signed by an authorised director, officer, or company secretary of '+entityName+'.',
      ['Use the paype.cc Corporate BO Declaration template','All fields completed','Signed by an authorised signatory of '+entityName,'Lists all ≥25% beneficial owners (natural persons only)'],
      'Must identify the entity: '+entityName,
      'Corporate BO Declaration template'
    );

    var et=state.entityType||'commercial';

    // Commercial, Non-Profit, Statutory
    if (et==='commercial'||et==='nonprofit'||et==='statutory'){
      doc(
        'Certificate of Good Standing',
        'A certificate of good standing or equivalent document confirming the entity is in compliance and authorised to conduct business.',
        'Entity',
        'Issued by the Companies Registry, Business Registrar, or equivalent government authority in the jurisdiction of formation.',
        ['Issued within the last 12 months','Confirms the entity is in good standing','Shows the legal name: '+entityName],
        'Must be in the name of: '+entityName
      );
      doc(
        'Latest Governing Documents',
        'The most recent version of the entity\'s bylaws, operating agreement, or equivalent — only required if different from the founding documents submitted above.',
        'Entity',
        'As adopted by the Board of Directors, Members, or Shareholders of '+entityName+'.',
        ['Currently in force','Dated after the founding documents','Only required if amendments have been made'],
        'Must identify: '+entityName
      );
    }

    // Holding, Partnership (Investment)
    if (et==='holding'||et==='partnership_inv'){
      doc(
        'Stakeholder Verification Documents',
        'Proof of identity and proof of address for each key stakeholder (≥25% ownership), plus a current organisation chart showing the complete ownership chain.',
        'People',
        'Photo ID: issued by a national government authority. Proof of address: issued by a utility provider, licensed bank, or government authority. Organisation chart: prepared by the entity\'s directors or company secretary.',
        ['For each ≥25% stakeholder: certified passport copy + proof of address issued within 3 months','Organisation chart showing complete ownership structure up to ultimate natural persons','Chart must be dated and signed by a director or officer'],
        'Photo ID and PoA for each stakeholder must be in that stakeholder\'s name'
      );
      doc(
        'Latest Governing Documents',
        'The most recent version of the entity\'s governing documents currently in force.',
        'Entity',
        'As adopted by the partners, members, or governing body of '+entityName+'.',
        ['Currently in force'],
        'Must identify: '+entityName
      );
    }

    // Trust, Estate
    if (et==='trust'||et==='estate'){
      doc(
        'Trust Deed / Foundation Charter',
        'The complete trust instrument or foundation charter, including all schedules, identifying all trustees/council members and stating the purpose of the trust/foundation.',
        'Entity',
        'Executed by the Settlor/Founder and accepted by the Trustees/Council Members.',
        ['Complete — all schedules, side letters, and amendments','Identifies all trustees/council members by full name','States the purpose and objects of the trust/foundation','Names the beneficiaries or class of beneficiaries'],
        'Must identify the trust/foundation name and all trustees/council members'
      );
    }

    // High-risk entity additions
    if (isHighRisk){
      if (et==='commercial'||et==='nonprofit'){
        doc(
          'Business License / Operating Permit',
          'The current business license, operating permit, or equivalent authorisation showing the entity is permitted to conduct its stated business activities.',
          'Entity',
          'Issued by the municipal authority, trade ministry, or sector regulator in the entity\'s country of operation.',
          ['Currently valid at time of submission','Shows the entity name: '+entityName,'Shows the authorised business activities','Valid for the current period'],
          'Must be in the name of: '+entityName
        );
        doc(
          'Stakeholder Verification (High-Risk)',
          'Additional enhanced verification for all stakeholders with ≥25% ownership in a high-risk entity type.',
          'People',
          'Certified passport copies issued by a national government authority. Source of wealth statement issued by a licensed bank, lawyer, or accountant.',
          ['Certified passport copy for each ≥25% stakeholder','Proof of address (within 3 months) for each ≥25% stakeholder','Source of wealth statement for each ≥25% stakeholder'],
          'Each document must be in the name of the respective stakeholder'
        );
      }
      if (et==='holding'||et==='partnership_inv'){
        doc(
          'Certificate of Good Standing (High-Risk)',
          'A recent certificate of good standing — required for high-risk holding and investment entities.',
          'Entity',
          'Issued by the Companies Registry or equivalent government authority in the jurisdiction of formation.',
          ['Issued within the last 12 months','Confirms good standing'],
          'Must be in the name of: '+entityName
        );
      }
      if (et==='trust'||et==='estate'){
        doc(
          'Stakeholder Verification (High-Risk Trust)',
          'Additional enhanced verification for all trustees, council members, and beneficiaries of high-risk trust/estate entities.',
          'People',
          'Certified passport copies issued by a national government authority. Source of wealth for the settlor/founder issued by a licensed bank, lawyer, or accountant.',
          ['Certified passport copy for each trustee/council member','Proof of address (within 3 months) for each trustee/council member','Source of wealth statement for the settlor/founder'],
          'Each document must be in the name of the respective person'
        );
      }
    }

    // Source of funds risk-based
    if (risk>=1){
      doc(
        'Source of Funds Documentation — Entity',
        'A contract, audited financial statement, bank statement, or third-party document that clearly demonstrates the source of the entity\'s funds.',
        'Financial',
        'Issued by a licensed bank, auditor, counterparty, or relevant third party.',
        ['Must reference the entity: '+entityName,'Must show the source and approximate amount of funds','Third-party document — not self-declared'],
        'Must reference: '+entityName
      );
    }
    if (risk>=2){
      doc(
        'Source of Funds Confirmation — Entity',
        'A letter from a licensed bank, practising lawyer, or chartered accountant confirming the source and legitimacy of the entity\'s funds.',
        'Financial',
        'Issued by a licensed financial institution, practising lawyer, or chartered accountant.',
        ['On official letterhead','Signed and dated within the last 6 months','References '+entityName],
        'Must reference: '+entityName
      );
    }
  }

  // ══════════════════════════════════════════════════════════════
  // SHARED: RISK-BASED DOCUMENTS (all case types)
  // ══════════════════════════════════════════════════════════════
  if (state.isPEP){
    var pepPerson=state.respondentType==='entity'?'the relevant beneficial owner':respondent;
    doc(
      'PEP Self-Declaration Form',
      'A self-declaration of Politically Exposed Person status — stating the position held, the country, the years of service, and the relationship to the account holder or beneficial owner.',
      'Compliance',
      'Completed and signed by the PEP or the person with PEP family-member status.',
      ['State the position held','State the country','State the years of service','State the relationship to '+pepPerson,'Signed and dated'],
      'Must be completed by the PEP themselves or the person with family-member PEP status'
    );
  }

  // Stakeholder thresholds (BLOOM: ≥25% → standard; ≥50% → enhanced)
  var stakeholdersHi=[].concat(state.shareholders,state.beneficialOwners).filter(function(p){return parseInt(p.percentage||0)>=25;});
  if (stakeholdersHi.length>0){
    var v50count=stakeholdersHi.filter(function(p){return parseInt(p.percentage||0)>=50;}).length;
    var namesList=stakeholdersHi.map(function(p){return p.name||p.entityName;}).join(', ');
    if (v50count>0){
      doc(
        'Stakeholder Verification — Enhanced (≥50%)',
        'Enhanced due diligence documents for stakeholders owning 50% or more. '+
        v50count+' stakeholder(s) meet this threshold: '+namesList+'.',
        'People',
        'Photo ID: issued by a national government authority. Proof of address: issued by a utility provider, licensed bank, or government authority. Source of wealth: issued by a licensed bank, lawyer, or accountant.',
        ['Certified passport copy for each ≥50% stakeholder','Proof of address (within 3 months) for each ≥50% stakeholder','Source of wealth statement for each ≥50% stakeholder'],
        'Each document must be in the name of the respective stakeholder'
      );
    } else {
      doc(
        'Stakeholder Verification — Standard (≥25%)',
        'Standard verification for stakeholders with 25–49% ownership. '+
        stakeholdersHi.length+' stakeholder(s): '+namesList+'.',
        'People',
        'Photo ID: issued by a national government authority. Proof of address: issued by a utility provider, licensed bank, or government authority.',
        ['Passport copy for each ≥25% stakeholder','Proof of address (within 3 months) for each ≥25% stakeholder'],
        'Each document must be in the name of the respective stakeholder'
      );
    }
  }

  // ── RENDER ──────────────────────────────────────────────────
  var cats={};docs.forEach(function(d){if(!cats[d.cat])cats[d.cat]=[];cats[d.cat].push(d);});
  h+='<p class="fm-hint">Each document below specifies exactly who issues it, under what conditions, and in whose name it must be — based on your declared entity type, jurisdiction, and risk profile.</p>';
  h+='<div class="bloom-doc-risk-bar" style="padding:10px 14px;margin-bottom:16px;background:'+(risk>=2?'rgba(224,32,32,0.08)':risk>=1?'rgba(230,126,34,0.08)':'rgba(21,122,48,0.08)')+';border-left:4px solid '+(risk>=2?'#E02020':risk>=1?'#E67E22':'#157A30')+'">';
  h+='<strong>Case type:</strong> '+(state.respondentType==='me'?'Owner = Respondent':state.respondentType==='entity'?'Owner = Entity':state.respondentType==='other_person'?'Owner = Other Person':'Not yet set')+' · <strong>Risk level:</strong> <span style="color:'+(risk>=2?'#E02020':risk>=1?'#E67E22':'#157A30')+'">'+(risk>=2?'HIGH':risk>=1?'MEDIUM':'LOW')+'</span> · <strong>Docs required:</strong> '+docs.length+'</p>';
  h+='</div>';
  Object.keys(cats).forEach(function(cat){
    h+='<h3 style="text-align:left;margin-top:20px;color:var(--paype-ink);font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.04em;font-size:0.9rem">'+cat+' ('+cats[cat].length+')</h3>';
    cats[cat].forEach(function(d,i){
      h+='<div class="bloom-doc-card" style="border:2px solid var(--color-border);padding:16px 18px;margin-bottom:10px;background:var(--color-bg-primary)">';
      h+='<strong style="display:block;font-size:1rem;color:var(--paype-ink)">'+(i+1)+'. '+d.doc+'</strong>';
      h+='<p style="margin:6px 0 0;font-size:0.84rem;color:var(--color-text-secondary);line-height:1.55">'+d.why+'</p>';
      // ISSUER — who issues this document
      if (d.issuer){
        h+='<div style="margin-top:10px;padding:8px 12px;background:rgba(179,255,46,0.06);border-left:3px solid var(--paype-lime)">';
        h+='<span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--paype-ink)">🏛️ Issued by</span>';
        h+='<p style="margin:2px 0 0;font-size:0.8rem;color:var(--color-text-primary)">'+d.issuer+'</p>';
        h+='</div>';
      }
      // CONDITIONS — format, age, rules
      if (d.conditions&&d.conditions.length){
        h+='<div style="margin-top:8px;padding:8px 12px;background:rgba(0,223,255,0.04);border-left:3px solid var(--paype-cyan)">';
        h+='<span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--paype-cyan)">📋 Conditions</span>';
        h+='<ul style="margin:4px 0 0 16px;font-size:0.78rem;color:var(--color-text-secondary);padding:0">';
        d.conditions.forEach(function(r){h+='<li style="margin-bottom:2px">'+r+'</li>';});
        h+='</ul></div>';
      }
      // NAMED PERSON — in whose name
      if (d.namedPerson){
        h+='<div style="margin-top:8px;padding:8px 12px;background:rgba(230,126,34,0.06);border-left:3px solid #E67E22">';
        h+='<span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#E67E22">👤 Must be in the name of</span>';
        h+='<p style="margin:2px 0 0;font-size:0.8rem;color:var(--color-text-primary);font-weight:600">'+d.namedPerson+'</p>';
        h+='</div>';
      }
      // TEMPLATE
      if (d.template){h+='<p style="margin-top:8px;font-size:0.75rem;color:var(--paype-cyan)">📋 Template available: <strong>'+d.template+'</strong></p>';}
      h+='</div>';
    });
  });
  h+='<p style="margin-top:20px;font-size:0.9rem;text-align:center"><strong>'+docs.length+' documents</strong> across '+Object.keys(cats).length+' categories · '+(risk>=2?'Enhanced Due Diligence applies':'Standard verification')+'</p>';
  h+='<div class="fm-nav"><button class="btn btn-secondary" id="fmPrevBtn">← Back</button><button class="btn btn-lime" id="fmReviewBtn">Review & confirm →</button></div>';
  return h;
}

// ── RECALCULATION CASCADE ────────────────────────────────────
// BLOOM Identity: when you go back and change an answer, only the fields
// that actually depend on what changed are recalculated. Nothing else.
// Each of the 3 owner paths (me, entity, other_person) is distinct.
var _snapshot={};
var _entityBackup=null; // preserved entity data when switching away

function takeSnapshot(){
  _snapshot={respondentType:state.respondentType, entityType:state.entityType,
    jurisdiction:state.jurisdiction, industry:state.industry,
    managementCountry:state.managementCountry};
}

function detectRecalculations(){
  var msgs=[];

  // ── OWNER TYPE CHANGED: surgical, not destructive ────────────
  if (_snapshot.respondentType!==state.respondentType){state._ownerChanged=true;
    var oldType=_snapshot.respondentType, newType=state.respondentType;

    // Switching AWAY from entity → preserve entity data in backup
    if (oldType==='entity' && newType!=='entity'){
      _entityBackup={entityType:state.entityType, entityName:state.entityName,
        registrationNumber:state.registrationNumber, dateOfFormation:state.dateOfFormation,
        managementCountry:state.managementCountry, tinStatus:state.tinStatus,
        _tinNoReason:state._tinNoReason, tinExplanation:state.tinExplanation,
        _mgmtRegNum:state._mgmtRegNum, _tinNumber:state._tinNumber,
        _redomiciled:state._redomiciled, _redomDate:state._redomDate,
        _redomCountry:state._redomCountry, _redomRegNum:state._redomRegNum,
        _publiclyListed:state._publiclyListed, _listingMarket:state._listingMarket,
        _finLicensed:state._finLicensed, _finLicenses:state._finLicenses,
        _leiCode:state._leiCode, shareholders:state.shareholders.slice(),
        officers:state.officers.slice(), beneficialOwners:state.beneficialOwners.slice()};
      msgs.push('Entity data preserved — will be restored if you switch back.');
    }

    // Switching TO entity from me/other → restore backup if available, else start fresh
    if (newType==='entity'){
      state._showAdvanced=false;
      if (_entityBackup){
        // Restore preserved entity data — don't lose user's previous work
        Object.keys(_entityBackup).forEach(function(k){if(_entityBackup[k]!==undefined)state[k]=_entityBackup[k];});
        msgs.push('Entity data restored from your previous entries.');
      }
      // Only clear fields incompatible with entity (PoA owner name fields)
      state._ownerFirstName='';state._ownerMiddleName='';state._ownerLastName='';state._ownerEmail='';
    }

    // Switching to me (individual) → only clear entity fields, keep everything else
    if (newType==='me'){
      state.entityType=null;state.entityName='';state.registrationNumber='';
      state.managementCountry=null;state.tinStatus='has_tin';state._tinNoReason='';
      state.tinExplanation='';state._mgmtRegNum='';state._tinNumber='';
      state._redomiciled=false;state._redomDate='';state._redomCountry='';state._redomRegNum='';
      state._publiclyListed=false;state._listingMarket='';
      state._finLicensed=false;state._finLicenses=[];state._leiCode='';
      state.shareholders=[];state.officers=[];state.beneficialOwners=[];
      state.industry=null;state.businessDescription='';state.staffSize=null;
      state._revenue1='';state._revenue2='';state._assets1='';state._assets2='';
      state._liabilities1='';state._liabilities2='';
      msgs.push('Entity-specific fields cleared. Respondent identity kept intact.');
    }

    // Switching to other_person (PoA)
    if (newType==='other_person'){
      state.entityType=null;state.entityName='';state.registrationNumber='';
      state.managementCountry=null;state.tinStatus='has_tin';
      state.shareholders=[];state.officers=[];state.beneficialOwners=[];
      state.industry=null;state.businessDescription='';state.staffSize=null;
      msgs.push('Now acting for another person — enter their details below.');
    }
  }

  // ── ENTITY TYPE CHANGED within entity mode ──────────────────
  if (_snapshot.entityType!==state.entityType && state.respondentType==='entity'){
    // Only officers that are incompatible with new entity type need review
    // Trust/estate → commercial: director roles become available
    // Commercial → trust: only trustee/protector/settlor remain valid
    msgs.push('Entity type changed — officer role options updated. Review officers if needed.');
  }

  // ── JURISDICTION CHANGED ────────────────────────────────────
  if (_snapshot.jurisdiction!==state.jurisdiction){
    var c=COUNTRIES.find(function(x){return x.code===state.jurisdiction;});
    // US state: only clear if new country isn't US
    if (!c||!c.us){state.usState=null;}
    // EU restriction warning
    if (c&&c.eu&&state.respondentType==='me'){msgs.push('EU jurisdiction — personal accounts coming soon. Only companies can open in the EU today.');}
    // Management country: only clear if it was set to the old jurisdiction (auto-followed)
    if (state.managementCountry===_snapshot.jurisdiction){state.managementCountry=null;msgs.push('Management country cleared — please re-confirm.');}
  }

  // ── INDUSTRY CHANGED ────────────────────────────────────────
  if (_snapshot.industry!==state.industry){
    msgs.push('Industry changed — source-of-funds industry selections may need updating.');
  }

  if (msgs.length>0) state._recalcMessages=msgs;
  else state._recalcMessages=null;
}

// ── REVIEW ────────────────────────────────────────────────────
function renderReview(){
  stopTimer();updateTimer();
  var canOpen=calcEligibility();var el=ENTITY_TYPES.find(function(e){return e.id===state.entityType;});var vol=VOLUME_BANDS.find(function(v){return v.id===state.monthlyVolume;});var risk=calcRisk();

  // Recalc banner
  var h='';
  if (state._recalcMessages&&state._recalcMessages.length>0){
    h+='<div class="bloom-recalc-banner">';
    h+='<div class="bloom-recalc-icon">⚠️</div><div>';
    h+='<strong>Answers were recalculated</strong> because you went back and changed a previous answer.</div>';
    state._recalcMessages.forEach(function(m){h+='<div class="bloom-recalc-item">↳ '+m+'</div>';});
    h+='</div></div>';
    state._recalcMessages=null;
  }

  // ── SPEEDRUN LEADERBOARD ──
  h+=renderLbHTML();

  // ── FINAL SUMMARY ──
  h+='<h2>📋 Application Summary</h2>';
  h+='<p class="fm-hint">Please review every section carefully before signing. You can still go back and edit anything.</p>';

  // Eligibility pill
  h+='<div class="bloom-summary-pill" style="background:'+(canOpen?'rgba(21,122,48,0.08)':'rgba(224,32,32,0.08)')+';border:2px solid '+(canOpen?'#157A30':'#E02020')+';padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px">';
  h+='<span style="font-size:2rem">'+(canOpen?'✅':'⏳')+'</span><div><strong style="font-size:1.05rem;color:'+(canOpen?'#157A30':'#E02020')+'">'+(canOpen?'Eligible to open an account':'Additional review may be required')+'</strong>';
  h+='<p style="margin:2px 0 0;font-size:0.85rem;color:var(--color-text-muted)">Risk tier: <strong style="color:'+(risk>=2?'#E02020':risk>=1?'#E67E22':'#157A30')+'">'+(risk>=2?'HIGH':risk>=1?'MEDIUM':'LOW')+'</strong> · Pricing: <strong>'+(vol?vol.tier:'Melody')+'</strong> · Monthly fee: <strong style="color:#157A30">Free</strong></p></div>';
  h+='<a href="#" onclick="event.preventDefault();window.scrollTo(0,0);state.step=0;render();" style="margin-left:auto;font-family:var(--font-ui);font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--paype-ink);text-decoration:underline">Edit any answer ↑</a></div>';

  // Respondent
  h+=rvwSec('👤 Respondent',[['Type',state.respondentType==='me'?'Me, the respondent':state.respondentType==='other_person'?'Another person':'Legal Entity'],['Name',[state.firstName,state.middleName,state.lastName].filter(Boolean).join(' ')||'—'],['Email',state.respondentEmail||'—'],['Phone',(state._phoneCode||'+1')+' '+(state.respondentPhone||'—')]]);
  // Entity
  if (state.respondentType==='entity'){
    h+=rvwSec('🏢 Entity — '+((el&&el.label)||'—'),[['Legal name',state.entityName||'—'],['Registration #',state.registrationNumber||'—'],['Formed',state.dateOfFormation||'—'],['Jurisdiction',(COUNTRIES.find(function(c){return c.code===state.jurisdiction;})||{}).name||'—'],['Management country',(COUNTRIES.find(function(c){return c.code===state.managementCountry;})||{}).name||'—'],['TIN status',state.tinStatus==='has_tin'?'Has TIN':'No TIN'+(state._tinNoReason?' — '+({'startup':'Startup <2 years','no_tin_country':'Country doesn\'t issue TINs','other':'Other'})[state._tinNoReason]:'')],['Re-domiciled',state._redomiciled?'Yes — '+(COUNTRIES.find(function(c){return c.code===state._redomCountry;})||{}).name||state._redomCountry:'No'],['Publicly listed',state._publiclyListed?'Yes — '+state._listingMarket:'No']]);
  }
  // Stakeholders
  if (state.shareholders.length>0) h+=rvwSec('📊 Shareholders ('+state.shareholders.length+')',state.shareholders.map(function(s){return[s.name||s.entityName,(s.percentage||'')+'%'+(s.type==='entity'?' (Entity)':'')];}));
  if (state.officers.length>0) h+=rvwSec('📋 Officers ('+state.officers.length+')',state.officers.map(function(o){return[o.name||o.entityName,o.role||''];}));
  if (state.beneficialOwners.length>0) h+=rvwSec('🔑 Beneficial Owners ('+state.beneficialOwners.length+')',state.beneficialOwners.map(function(b){return[b.name,(b.percentage||'')+'%'+(b.pepStatus==='is_pep'?' · PEP':b.pepStatus==='family_member'?' · PEP Family':'')];}));
  // Business
  h+=rvwSec('🏭 Business',[['Industry',INDUSTRIES.find(function(i){return i.id===state.industry;})?.label||'—'],['Description',state.businessDescription||'—'],['Staff',STAFF_BANDS.find(function(s){return s.id===state.staffSize;})?.label||'—'],['Monthly volume',vol?vol.label:'—']]);
  // Funds
  h+=rvwSec('💰 Source of Funds',[['Primary',(SOURCE_TYPES.find(function(s){return s.id===state.primarySourceType;})||{}).label||'—'],['Primary country',(COUNTRIES.find(function(c){return c.code===state.primarySourceCountry;})||{}).name||'—'],['Primary industry',INDUSTRIES.find(function(i){return i.id===state.primarySourceIndustry;})?.label||'—'],['Description',(state.primarySourceDesc||'—').substring(0,80)+((state.primarySourceDesc||'').length>80?'…':'')]]);
  if (state.hasSecondarySource) h+=rvwSec('💰 Secondary Source',[['Type',(SOURCE_TYPES.find(function(s){return s.id===state.secondarySourceType;})||{}).label||'—'],['Country',state.secondarySourceCountry||'—'],['Industry',INDUSTRIES.find(function(i){return i.id===state.secondarySourceIndustry;})?.label||'—']]);
  // Declarations
  h+=rvwSec('⚠️ Declarations',[['PEP',state.isPEP?'Yes — '+state.pepDetails:'No'],['Sanctions exposure',state.hasSanctionsExposure?'Yes — '+state.sanctionsDetails:'No'],['Criminal history',state.hasCriminalHistory?'Yes — '+state.criminalDetails:'No'],['High-risk flags',state.highRiskFlags.length>0?state.highRiskFlags.map(function(f){var hf=HIGH_RISK_FLAGS.find(function(h){return h.id===f;});return (hf&&hf.label)||f;}).join(', '):'None']]);
  // Other Users
  if (state.otherUsers.length>0) h+=rvwSec('👥 Other Users ('+state.otherUsers.length+')',state.otherUsers.map(function(u){return[u.name||'',({'view_only':'👁 View Only','draft':'✏️ Draft','poa':'⚡ PoA'})[u.role]||u.role,u.email||''];}));

  // ══════════════════════════════════════════════════════════════
  // CONTRACT SIGNATURE SECTION (BLOOM IDENTITY STYLE)
  // ══════════════════════════════════════════════════════════════
  h+='<div class="bloom-contract-section" style="margin-top:28px;padding:20px;border:3px solid var(--paype-ink);background:var(--color-bg-secondary)">';
  h+='<h3 style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.04em;margin:0 0 12px">📜 Account Opening Agreement</h3>';
  h+='<div style="max-height:160px;overflow-y:auto;padding:12px;background:var(--color-bg-primary);border:1px solid var(--color-border);font-size:0.78rem;line-height:1.6;color:var(--color-text-secondary);margin-bottom:16px">';
  h+='<p><strong>By signing below, you confirm that:</strong></p>';
  h+='<ol style="padding-left:18px;margin:8px 0">';
  h+='<li>All information provided in this application is true, complete, and accurate to the best of your knowledge.</li>';
  h+='<li>You are the person named as the respondent or are duly authorised to act on behalf of the owner/entity identified above.</li>';
  h+='<li>You understand that paype.cc is a FinCEN-registered Money Services Business, not a bank, and balances are not FDIC-insured.</li>';
  h+='<li>You have read and agree to the <a href="/legal/terms/" target="_blank">Terms of Service</a>, <a href="/legal/privacy/" target="_blank">Privacy Policy</a>, and <a href="/legal/sailor-beware/" target="_blank">Sailor Beware risk disclosure</a>.</li>';
  h+='<li>You consent to paype.cc conducting identity verification, sanctions screening, and ongoing transaction monitoring as required by law.</li>';
  h+='<li>You understand that providing false or misleading information may result in account closure and reporting to relevant authorities.</li>';
  h+='</ol></div>';

  // Acceptance checkbox
  h+='<label class="bloom-check-label" style="margin-bottom:12px;display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:0.85rem">';
  h+='<input type="checkbox" id="contractAcceptCheck" style="margin-top:2px;width:18px;height:18px;accent-color:var(--paype-lime);flex-shrink:0" onchange="document.getElementById(\'signContractBtn\').style.display=this.checked?\'\':\'none\'">';
  h+='<span>I have read, understood, and agree to the Account Opening Agreement above.</span></label>';

  // Sign button (hidden until checkbox checked)
  h+='<div id="signContractBtn" style="display:none">';
  h+='<button class="btn btn-lime btn-xl" style="width:100%;justify-content:center" onclick="event.preventDefault();showSignatureModal()">✍️ Sign &amp; Submit Application</button>';
  h+='</div></div>';

  // Save state
  try{sessionStorage.setItem('paype_bloom',JSON.stringify(state));}catch(e){}
  h+='<div class="fm-nav" style="margin-top:20px"><button class="btn btn-secondary" id="fmPrevBtn">← Back</button></div>';
  return h;
}

// ── SIGNATURE MODAL ───────────────────────────────────────────
function showSignatureModal(){
  var respondent=[state.firstName,state.lastName].filter(Boolean).join(' ')||'the account holder';
  var now=new Date();var dateStr=now.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  var timeStr=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var bodyHTML='<p style="font-size:0.9rem;color:var(--color-text-secondary);margin-bottom:16px">Type your full name exactly as it appears on your government-issued ID to digitally sign this application.</p>';
  bodyHTML+='<div class="field-group"><label class="field-label">Full legal name (digital signature)</label><input class="field-input field-input--lg" id="signatureName" type="text" placeholder="'+esc(respondent)+'" value="'+esc(respondent)+'" style="font-size:1.2rem;font-family:var(--font-display);letter-spacing:0.04em"></div>';
  bodyHTML+='<div class="field-group"><label class="field-label">Date & time of signing</label><input class="field-input" type="text" value="'+dateStr+' at '+timeStr+'" readonly style="background:var(--color-bg-secondary)"></div>';
  bodyHTML+='<p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:8px">📍 IP address and browser metadata will be recorded with this signature for audit purposes.</p>';
  bodyHTML+='<p style="font-size:0.75rem;color:var(--color-text-muted)">🔐 This digital signature carries the same legal weight as a handwritten signature under US E-SIGN Act (15 U.S.C. § 7001) and applicable international e-signature laws.</p>';

  showModal('✍️ Digital Signature — Account Opening',bodyHTML,function(){
    var sigName=document.getElementById('signatureName').value;
    if (!sigName||sigName.length<2){alert('Please enter your full name to sign.');return;}
    state.submitted=true;state._signatureName=sigName;state._signatureDate=dateStr+' at '+timeStr;
    saveState();
    stopTimer();updateTimer();
    var bestTime=elapsedSec;try{var saved=JSON.parse(localStorage.getItem('paype_speedruns')||'[]');if(saved.length)bestTime=saved[0].time;}catch(e){}
    var bestMsg=bestTime===elapsedSec?' 🏆 NEW PERSONAL BEST!':' (Your best: '+fmt(bestTime)+')';
    alert('✅ Application signed & submitted!\n\nSigned by: '+sigName+'\nDate: '+dateStr+' at '+timeStr+'\nSpeedrun time: '+fmt(elapsedSec)+bestMsg+'\n\nIn production, this submits to the paype.cc onboarding API. You\'ll receive a confirmation email with next steps.\n\nThank you for choosing paype.cc — every way to get paid, every way to pay out.');
  });
}

function rvwSec(title,items){
  var h='<div style="border:2px solid var(--color-border);padding:12px 16px;margin-bottom:10px;background:var(--color-bg-primary)"><strong style="display:block;margin-bottom:8px;font-size:0.85rem">'+title+'</strong>';
  items.forEach(function(row){h+='<div class="fm-sum-row"><span class="fm-label">'+row[0]+'</span><span class="fm-val">'+row[1]+'</span></div>';});
  h+='</div>'; return h;
}

// ── RESULT ────────────────────────────────────────────────────
function renderResult(){
  var c=COUNTRIES.find(function(x){return x.code===state.jurisdiction;});var vol=VOLUME_BANDS.find(function(v){return v.id===state.monthlyVolume;});var risk=calcRisk();var canOpen=calcEligibility();var sur=state.highRiskFlags.some(function(f){return HIGH_RISK_FLAGS.find(function(h){return h.id===f&&h.surcharge;});});
  try{sessionStorage.setItem('paype_forme',JSON.stringify({entityType:state.respondentType,country:state.jurisdiction,industry:state.industry,volume:state.monthlyVolume,highRiskFlags:state.highRiskFlags,riskLabel:risk>=2?'High':risk>=1?'Medium':'Low',tier:vol?vol.tier:'Melody',canOpen:canOpen,ts:Date.now()}));}catch(e){}
  var h='<div style="animation:fmFadeUp 0.5s ease"><div style="border-left:6px solid '+(canOpen?'#157A30':'#E02020')+';padding:24px;text-align:center;background:var(--color-bg-primary);margin-bottom:20px"><div style="font-size:4rem">'+(canOpen?'✅':'⏳')+'</div><h2 style="color:'+(canOpen?'#157A30':'#E02020')+'">'+(canOpen?'You can open an account.':'Not yet available.')+'</h2><p style="font-size:1.1rem;color:var(--color-text-secondary)">'+(canOpen?'Your answers will pre-fill the full application.':'Contact us for options.')+'</p></div>';
  h+='<div class="fm-stats-row"><div class="fm-stat"><span class="fm-stat-val" style="color:'+(risk>=2?'#E02020':risk>=1?'#E67E22':'#157A30')+'">'+(risk>=2?'High':risk>=1?'Medium':'Low')+'</span><span class="fm-stat-label">Risk tier</span></div><div class="fm-stat"><span class="fm-stat-val">'+(vol?vol.tier:'Melody')+(sur?'<br><small>+50%</small>':'')+'</span><span class="fm-stat-label">Pricing tier</span></div><div class="fm-stat"><span class="fm-stat-val" style="color:#157A30">Free</span><span class="fm-stat-label">Monthly fee</span></div></div>';
  if (canOpen) h+='<div style="text-align:center;margin-top:24px"><a href="https://my.paype.cc/shared/_HWhUqMR9r7ZGO75Gd9HUcEbj9DZbOvaoco7JhQ_bpU" class="btn btn-lime btn-xl" data-open-account>Continue to full application →</a></div>';
  h+='<div style="text-align:center;margin-top:12px"><button class="btn btn-secondary" id="fmRestartBtn">↻ Start over</button></div></div>';
  return h;
}

// ── HELPERS ───────────────────────────────────────────────────
function renderCardList(items,key,attr){
  var h='<div class="fm-cards">';
  items.forEach(function(item){var sel=state[key]===item.id?' selected':'';h+='<button class="fm-card'+sel+'" data-'+attr+'="'+item.id+'"><span class="fm-card-title">'+item.label+'</span>'+(item.tier?'<span class="fm-card-sub">Tier: '+item.tier+'</span>':'')+(sel?'<span class="fm-card-check">✓</span>':'')+'</button>';});
  h+='</div>'; return h;
}

function calcRisk(){var c=COUNTRIES.find(function(x){return x.code===state.jurisdiction;});return Math.max((c&&c.risk)||0,state.highRiskFlags.length>0?2:0,state.isPEP||state.hasSanctionsExposure||state.hasCriminalHistory?2:0);}
function calcEligibility(){var c=COUNTRIES.find(function(x){return x.code===state.jurisdiction;});if(!c||c.risk>=3)return false;if(c.us&&state.usState&&state.usState!=='MT')return false;if(c.eu&&state.respondentType==='me')return false;return true;}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ── TIMER / LEADERBOARD ───────────────────────────────────────
function startTimer(){if(timerStart)return;timerStart=Date.now();timerInterval=setInterval(updateTimer,200);}
function stopTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}elapsedSec=Math.floor((Date.now()-timerStart)/1000);}
function updateTimer(){var el=document.getElementById('pixelTimer');if(!el)return;var sec=timerStart?Math.floor((Date.now()-timerStart)/1000):elapsedSec;el.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function fmt(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function renderLbHTML(){stopTimer();updateTimer();var pt=fmt(elapsedSec);var beaten=LB.filter(function(r){return elapsedSec<r.time;}).length;var h='<div class="pixel-scores"><div class="pixel-scores-title">🏆 SPEEDRUN LEADERBOARD</div><div class="pixel-player-row"><span class="pixel-player-label">YOUR TIME</span><span class="pixel-player-time">'+pt+'</span>';if(beaten>=LB.length)h+='<span class="pixel-new-record">★ NEW RECORD ★</span><span class="pixel-prize">💰 $10 earned!</span>';else if(beaten>0)h+='<span class="pixel-beat">You beat '+beaten+'/'+LB.length+'!</span><span class="pixel-prize">💰 $10 earned!</span>';else h+='<span class="pixel-try-again">Can you beat them next time?</span><span class="pixel-prize">💰 $5 earned — thanks for trying!</span>';h+='</div><div class="pixel-leaderboard"><div class="pixel-lb-header"><span>RANK</span><span>RUNNER</span><span>TIME</span><span>WHEN</span></div>';var all=LB.concat([{name:'>>> YOU <<<',time:elapsedSec,daysAgo:0,isPlayer:true}]);all.sort(function(a,b){return a.time-b.time;});all.forEach(function(r,i){var cls=r.isPlayer?'pixel-lb-row pixel-lb-player':'pixel-lb-row';if(i===0)cls+=' pixel-lb-first';h+='<div class="'+cls+'"><span>'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1))+'</span><span>'+r.name+'</span><span>'+fmt(r.time)+'</span><span>'+(r.isPlayer?'NOW':r.daysAgo+'d ago')+'</span></div>';});h+='</div></div>';return h;}

// ── EVENTS ────────────────────────────────────────────────────
function bindEvents(){
  // Country search inputs — filter dropdown on type
  ['fmCountrySelect','mgmtCountrySelect','primaryCountrySelect','entityJurisdictionSelect','redomCountrySelect','respCountrySelect','entJurisdictionSelect','personResidence','modalResidence','shIdCountry','peIdCountry','respDocCountry','entAddrCountry'].forEach(function(baseId){
    var search=document.getElementById(baseId+'_search'); if(!search)return;
    var dropdown=document.getElementById(baseId+'_dropdown'); if(!dropdown)return;
    var hidden=document.getElementById(baseId);
    search.addEventListener('focus',function(){dropdown.style.display='';search.select();});
    search.addEventListener('input',function(){
      var q=this.value.toLowerCase();dropdown.style.display='';
      var visible=0;
      dropdown.querySelectorAll('.country-option').forEach(function(opt){
        var t=(opt.textContent||'').toLowerCase();
        var match=t.indexOf(q)!==-1;
        opt.style.display=match?'':'none';
        if(match)visible++;
      });
    });
    search.addEventListener('blur',function(){setTimeout(function(){dropdown.style.display='none';},200);});
    dropdown.addEventListener('mousedown',function(e){
      var opt=e.target.closest('.country-option'); if(!opt)return;
      var code=opt.getAttribute('data-code'); var target=opt.getAttribute('data-target');
      if(hidden){hidden.value=code;}
      search.value=(opt.textContent||'').replace(/\s+/g,' ').trim();
      dropdown.style.display='none';
      // Update state
      if (baseId==='fmCountrySelect'){state.jurisdiction=code;render();}
      else if (baseId==='mgmtCountrySelect'){state.managementCountry=code;render();}
      else if (baseId==='primaryCountrySelect'){state.primarySourceCountry=code;}
      else if (baseId==='entityJurisdictionSelect'){state.jurisdiction=code;render();}
      else if (baseId==='redomCountrySelect'){state._redomCountry=code;saveState();}
      else if (baseId==='respCountrySelect'){state._respCountry=code;saveState();}
      saveState();
    });
  });
  // Phone code
  var pcd=document.getElementById('respPhoneCode');if(pcd)pcd.addEventListener('change',function(){state._phoneCode=this.value;saveState();});
  var ppc=document.getElementById('shPhoneCode');if(ppc)ppc.addEventListener('change',function(){state._phoneCode=this.value;saveState();});
  var ppc2=document.getElementById('pePhoneCode');if(ppc2)ppc2.addEventListener('change',function(){state._phoneCode=this.value;saveState();});

  // Owner cards
  document.querySelectorAll('.bloom-owner-card').forEach(function(card){card.addEventListener('click',function(){var r=this.querySelector('input[type="radio"]');if(r){r.checked=true;state.respondentType=r.value;/* only show advanced if PoA is selected */if(r.value==='other_person')state._showAdvanced=true;render();}});});
  var at=document.getElementById('bloomAdvancedToggle');if(at){at.addEventListener('click',function(){state._showAdvanced=!state._showAdvanced;render();});}

  // Card delegation
  document.querySelectorAll('.fm-cards').forEach(function(ct){ct.addEventListener('click',function(e){var card=e.target.closest('.fm-card');if(!card)return;var cnt=card.getAttribute('data-cnt'),stateCd=card.getAttribute('data-state'),ind=card.getAttribute('data-ind'),staff=card.getAttribute('data-staff'),vol=card.getAttribute('data-vol'),et=card.getAttribute('data-et'),rf=card.getAttribute('data-rf'),src=card.getAttribute('data-src'),srcInd=card.getAttribute('data-src-ind'),srcSec=card.getAttribute('data-src-sec'),srcSecInd=card.getAttribute('data-src-sec-ind');if(rf==='__clear__'){state.highRiskFlags=[];render();return;}if(cnt){state.jurisdiction=cnt;render();return;}if(stateCd){state.usState=stateCd;render();return;}if(ind){state.industry=ind;render();return;}if(staff){state.staffSize=staff;render();return;}if(vol){state.monthlyVolume=vol;render();return;}if(et){state.entityType=et;render();return;}if(rf){toggleArr('highRiskFlags',rf);}
    // Source type + source industry cards
    if(src){state.primarySourceType=src;var s=SOURCE_TYPES.find(function(x){return x.id===src;});if(s&&s.enforceIndustry)state.primarySourceIndustry=s.enforceIndustry;else if(s&&s.industries&&s.industries.length===1)state.primarySourceIndustry=s.industries[0];render();}
    if(srcInd){state.primarySourceIndustry=srcInd;render();}
    if(srcSec){state.secondarySourceType=srcSec;var ss=SOURCE_TYPES.find(function(x){return x.id===srcSec;});if(ss&&ss.enforceIndustry)state.secondarySourceIndustry=ss.enforceIndustry;else if(ss&&ss.industries&&ss.industries.length===1)state.secondarySourceIndustry=ss.industries[0];render();}
    if(srcSecInd){state.secondarySourceIndustry=srcSecInd;render();}});});

  // Tabs
  document.querySelectorAll('.bloom-tab').forEach(function(t){t.addEventListener('click',function(){state._activeStab=this.getAttribute('data-tab');render();});});
  // Remove person
  document.querySelectorAll('.bloom-person-remove').forEach(function(b){b.addEventListener('click',function(){var i=parseInt(this.getAttribute('data-idx')),tab=this.getAttribute('data-tab');if(state[tab]){state[tab].splice(i,1);render();}});});
  // Add person
  var ab=document.querySelector('.bloom-add-btn');if(ab){ab.addEventListener('click',function(){var tab=this.getAttribute('data-tab'),ct=this.closest('.bloom-add-form'),type=(ct.querySelector('.bloom-inp-type')||{}).value||'person',fn=(ct.querySelector('.bloom-inp-fn')||{}).value||'',mn=(ct.querySelector('.bloom-inp-mn')||{}).value||'',ln=(ct.querySelector('.bloom-inp-ln')||{}).value||'',name=[fn,mn,ln].filter(Boolean).join(' '),pct=(ct.querySelector('.bloom-inp-pct')||{}).value||'',role=(ct.querySelector('.bloom-inp-role')||{}).value||'',res=(document.getElementById('personResidence')||{}).value||'',idType=(ct.querySelector('.bloom-inp-idtype')||{}).value||'',idOther=(ct.querySelector('.bloom-inp-idother')||{}).value||'',idCountry=(document.getElementById('shIdCountry')||{}).value||(document.getElementById('peIdCountry')||{}).value||'',idNumber=(ct.querySelector('.bloom-inp-idnum')||{}).value||'',idExp=(ct.querySelector('.bloom-inp-idexp')||{}).value||'',email=(ct.querySelector('.bloom-inp-email')||{}).value||'',phone=(ct.querySelector('.bloom-inp-phone')||{}).value||'',pep=(ct.querySelector('.bloom-inp-pep')||{}).value||'not_pep',pepDetails=(ct.querySelector('.bloom-inp-pep-details')||{}).value||'',pepYears=(ct.querySelector('.bloom-inp-pep-years')||{}).value||'';
    // Entity shareholder: entity name + reg + rep
    if (type==='entity'){
      name=(ct.querySelector('.bloom-inp-ent-name')||{}).value||'';
      var entReg=(ct.querySelector('.bloom-inp-ent-reg')||{}).value||'';
      var entJur=(ct.querySelector('.bloom-inp-ent-rep')||{}).value||'';
      if(!name){alert('Entity name is required.');return;}
      var repName=(ct.querySelector('.bloom-inp-ent-rep')||{}).value;
      if(!repName||repName==='__new_rep__'){alert('Every entity must have a designated representative. Select a person or create one first.');return;}
    }
    // Person: require email or phone
    if (type==='person' && !name){/* entity already handled above */ return;}
    if (type==='person' && !email && !phone && tab!=='officers_ctrl'){alert('Email or phone number is required for every person.');return;}
    // officers_ctrl: controlling person check
    var isCtrl=false;
    if (tab==='officers_ctrl'){
      if (role==='__ctrl__'){isCtrl=true;role='Controlling Person';}
    }
    var list=state[tab]||[];if(tab==='officers_ctrl'){list=state.officers;}
    if (tab==='beneficialOwners') type='person';
    // Duplicate prevention
    if (list.some(function(p){return p.name===name&&(!p.role||p.role===role);})){alert('This person/entity is already added.');return;}
    if ((tab==='shareholders'||tab==='beneficialOwners')&&parseInt(pct||0)<10){pct='10';}
    var entry={name:name,percentage:pct,role:role,type:type,residence:res,idType:idType,idOther:idOther,idCountry:idCountry,idNumber:idNumber,idExp:idExp,email:email,phone:phone,pepStatus:pep,pepDetails:pepDetails,pepYears:pepYears};
    if (isCtrl){state._controllingPersons=(state._controllingPersons||[]);state._controllingPersons.push(entry);}
    else if (tab==='officers_ctrl'){state.officers.push(entry);}
    else {state[tab]=(state[tab]||[]);state[tab].push(entry);}
    saveState();render();});}

  // Nav
  var nb=document.getElementById('fmNextBtn'),pb=document.getElementById('fmPrevBtn');if(nb)nb.addEventListener('click',nextStep);if(pb)pb.addEventListener('click',function(){if(state.step>0){takeSnapshot();state.step--;render();window.scrollTo(0,0);}});
  var rb=document.getElementById('fmReviewBtn');if(rb)rb.addEventListener('click',function(){state.step=getSteps().length-1;render();window.scrollTo(0,0);});
  var sb=document.getElementById('fmSubmitBtn');if(sb)sb.addEventListener('click',function(){state.submitted=true;saveState();// Save speedrun time to localStorage (best time persistence)
    try { var prev=JSON.parse(localStorage.getItem('paype_speedruns')||'[]'); prev.push({time:elapsedSec,date:new Date().toISOString()}); prev.sort(function(a,b){return a.time-b.time;}); prev=prev.slice(0,20); localStorage.setItem('paype_speedruns',JSON.stringify(prev)); } catch(e){}
    var bestTime=elapsedSec; try{var saved=JSON.parse(localStorage.getItem('paype_speedruns')||'[]');if(saved.length)bestTime=saved[0].time;}catch(e){}
    var bestMsg=bestTime===elapsedSec?' 🏆 NEW PERSONAL BEST!':' (Your best: '+fmt(bestTime)+')';
    alert('✅ Application complete!\n\nYour time: '+fmt(elapsedSec)+bestMsg+'\n\nIn production, this submits to the paype onboarding API.');});
  var rst=document.getElementById('fmRestartBtn');if(rst)rst.addEventListener('click',function(){state={step:0,respondentType:null,firstName:'',middleName:'',lastName:'',respondentEmail:'',respondentPhone:'',entityType:null,entityName:'',registrationNumber:'',jurisdiction:null,dateOfFormation:'',managementCountry:null,tinStatus:null,tinExplanation:'',shareholders:[],officers:[],beneficialOwners:[],industry:null,businessDescription:'',staffSize:null,monthlyVolume:null,primarySourceType:null,primarySourceIndustry:null,primarySourceCountry:null,primarySourceDesc:'',secondarySourceType:null,secondarySourceIndustry:null,secondarySourceCountry:null,secondarySourceDesc:'',hasSecondarySource:false,isPEP:false,pepDetails:'',highRiskFlags:[],hasSanctionsExposure:false,sanctionsDetails:'',hasCriminalHistory:false,criminalDetails:'',usState:null,submitted:false,_showAdvanced:false,_activeStab:'shareholders'};timerStart=null;elapsedSec=0;if(timerInterval){clearInterval(timerInterval);timerInterval=null;}try{sessionStorage.removeItem('paype_bloom');sessionStorage.removeItem('paype_forme');}catch(e){}render();window.scrollTo(0,0);});

  // Checkboxes
  ['pepCheck','sanctionsCheck','criminalCheck','hasSecondarySource','publiclyListedCheck'].forEach(function(id){var cb=document.getElementById(id);if(!cb)return;cb.addEventListener('change',function(){if(id==='pepCheck')state.isPEP=this.checked;if(id==='sanctionsCheck')state.hasSanctionsExposure=this.checked;if(id==='criminalCheck')state.hasCriminalHistory=this.checked;if(id==='hasSecondarySource')state.hasSecondarySource=this.checked;if(id==='publiclyListedCheck')state._publiclyListed=this.checked;render();});});
  var lm=document.getElementById('listingMarket');if(lm)lm.addEventListener('blur',function(){state._listingMarket=this.value;saveState();});
  // NamedCoin NFT import (simulated — pre-fills demo identity)
  var nci=document.getElementById('namedcoinImportBtn');if(nci)nci.addEventListener('click',function(){
    state.firstName='Alex';state.middleName='';state.lastName='Karpov';state.respondentEmail='alex@paype.cc';state._respDOB='1990-06-15';state._respNationality='Maltese';state._respCountry='MT';state._respPepStatus='not_pep';state.respondentPhone='555 0100';
    var st=document.getElementById('nftImportStatus');if(st){st.style.display='';st.innerHTML='✅ Identity imported from NamedCoin NFT Registry · Verified by NamedCoin NFT Registry';st.style.color='#157A30';}
    saveState();render();
  });
  // Respondent fields
  var rd=document.getElementById('respDOB');if(rd)rd.addEventListener('change',function(){state._respDOB=this.value;saveState();});
  var rn=document.getElementById('respNationality');if(rn)rn.addEventListener('blur',function(){state._respNationality=this.value;saveState();});
  var rcs=document.getElementById('respCountrySelect_search');if(rcs){/* handled by country search handler */}
  var rps=document.getElementById('respPepStatus');if(rps)rps.addEventListener('change',function(){state._respPepStatus=this.value;saveState();});
  // Re-domiciliation
  var rdc=document.getElementById('redomiciledCheck');if(rdc)rdc.addEventListener('change',function(){state._redomiciled=this.checked;render();});
  var rdDate=document.getElementById('redomDate');if(rdDate)rdDate.addEventListener('change',function(){state._redomDate=this.value;saveState();});
  var rdReg=document.getElementById('redomRegNum');if(rdReg)rdReg.addEventListener('blur',function(){state._redomRegNum=this.value;saveState();});
  // Jurisdiction in entity_basic (syncs to state.jurisdiction)
  var ejs=document.getElementById('entityJurisdictionSelect_search'); /* handled by country search handler */
  // Owner fields for PoA
  ['ownerFirstName','ownerMiddleName','ownerLastName','ownerEmail'].forEach(function(fid){var f=document.getElementById(fid);if(f)f.addEventListener('blur',function(){state['_'+fid]=this.value;saveState();});});
  // Financial license toggle
  var flc=document.getElementById('finLicensedCheck');if(flc)flc.addEventListener('change',function(){state._finLicensed=this.checked;render();});
  var aflb=document.getElementById('addFinLicBtn');if(aflb)aflb.addEventListener('click',function(){
    var c=(document.getElementById('finLicCountry')||{}).value||'',t=(document.getElementById('finLicType')||{}).value||'';
    if(!c||!t)return;state._finLicenses=(state._finLicenses||[]);state._finLicenses.push({country:c,type:t});render();
  });
  var lei=document.getElementById('leiCode');if(lei)lei.addEventListener('blur',function(){state._leiCode=this.value;saveState();});
  // Financial license remove
  document.querySelectorAll('[data-flidx]').forEach(function(b){b.addEventListener('click',function(){var i=parseInt(this.getAttribute('data-flidx'));state._finLicenses.splice(i,1);render();});});
  // TIN radios
  document.querySelectorAll('input[name="tinStatus"]').forEach(function(r){r.addEventListener('change',function(){state.tinStatus=this.value;render();});});
  var tnr=document.getElementById('tinNoReason');if(tnr)tnr.addEventListener('change',function(){state._tinNoReason=this.value;if(this.value!=='other')state.tinExplanation=this.options[this.selectedIndex].text;render();});
  
  // ID Type "Other" toggle
  document.querySelectorAll('.bloom-inp-idtype').forEach(function(sel){sel.addEventListener('change',function(){var wrap=this.parentElement.parentElement.querySelector('.bloom-id-other-wrap');if(wrap)wrap.style.display=this.value==='other'?'':'none';});});
  var modalIdType=document.getElementById('modalIdType');if(modalIdType)modalIdType.addEventListener('change',function(){var wrap=document.getElementById('modalIdOtherWrap');if(wrap)wrap.style.display=this.value==='other'?'':'none';});
  // PEP select reveals details field
  document.querySelectorAll('.bloom-inp-pep').forEach(function(sel){sel.addEventListener('change',function(){var extra=this.closest('.bloom-add-form').querySelector('.bloom-pep-extra');if(extra)extra.style.display=(this.value==='is_pep'||this.value==='family_member')?'':'none';});});
  // BLOOM: select existing person → copy data into add form
  document.querySelectorAll('.bloom-existing-select').forEach(function(sel){sel.addEventListener('change',function(){
    var name=this.value; if (!name||name==='__new__') return;
    var allPpl=[];['shareholders','officers','beneficialOwners'].forEach(function(sec){(state[sec]||[]).forEach(function(p){allPpl.push(p);});});
    var p=allPpl.find(function(x){return x.name===name;}); if (!p) return;
    var form=this.closest('.bloom-add-form');
    // Auto-fill name parts
    var nameParts=(p.name||'').split(' ');
    var fnEl=form.querySelector('.bloom-inp-fn'); if(fnEl)fnEl.value=nameParts[0]||'';
    var lnEl=form.querySelector('.bloom-inp-ln'); if(lnEl)lnEl.value=nameParts.slice(1).join(' ')||'';
    var natEl=form.querySelector('.bloom-inp-nat'); if(natEl)natEl.value=p.nationality||'';
    var resEl=form.querySelector('.bloom-inp-res'); if(resEl)resEl.value=p.residence||'';
    var passEl=form.querySelector('.bloom-inp-pass'); if(passEl)passEl.value=p.passportNumber||'';
    var pctEl=form.querySelector('.bloom-inp-pct'); if(pctEl&&p.percentage)pctEl.value=p.percentage;
    var roleEl=form.querySelector('.bloom-inp-role'); if(roleEl&&p.role)roleEl.value=p.role;
    var pepEl=form.querySelector('.bloom-inp-pep'); if(pepEl)pepEl.value=p.pepStatus||'not_pep';
  });});
  // BLOOM IDENTITY: "Browse People" modal — shows all created persons/entities with icons
  var bpb=document.getElementById('browsePeopleBtn');if(bpb)bpb.addEventListener('click',function(){
    var allPpl=[];['shareholders','officers','beneficialOwners'].forEach(function(sec){(state[sec]||[]).forEach(function(p){if(!allPpl.some(function(x){return x.name===p.name&&x.type===p.type;}))allPpl.push(p);});});
    // Prepend respondent if they have an identity (not PoA — then show the owner)
    var respName=[state.firstName,state.lastName].filter(Boolean).join(' ');
    if (respName && state.respondentType!=='other_person'){
      var alreadyThere=allPpl.some(function(x){return x.name===respName;});
      if (!alreadyThere){
        allPpl.unshift({name:respName, type:'person', role:'Respondent', residence:(COUNTRIES.find(function(c){return c.code===state._respCountry;})||{}).name||'', pepStatus:state._respPepStatus||'not_pep', _isRespondent:true});
      }
    } else if (state.respondentType==='other_person'){
      var ownerName=[state._ownerFirstName,state._ownerLastName].filter(Boolean).join(' ');
      if (ownerName){
        var alreadyThereO=allPpl.some(function(x){return x.name===ownerName;});
        if (!alreadyThereO) allPpl.unshift({name:ownerName, type:'person', role:'Account Owner', _isOwner:true});
      }
    }
    var listHTML='<p style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:12px">Click any person to auto-fill the form below with their details.</p><div style="max-height:320px;overflow-y:auto">';
    if (allPpl.length===0) listHTML+='<p style="text-align:center;color:var(--color-text-muted)">No persons or entities created yet. Use "➕ New" to create one.</p>';
    else {
      allPpl.forEach(function(p,i){
        var icon=p.type==='entity'?'🏢':(p._isRespondent?'⭐':(p._isOwner?'👤':'🧑'));
        var tag='';if(p._isRespondent)tag=' <span style="font-size:0.6rem;font-weight:700;color:var(--paype-lime);background:var(--paype-ink);padding:1px 6px;text-transform:uppercase">You</span>';
        if(p._isOwner)tag=' <span style="font-size:0.6rem;font-weight:700;color:var(--paype-cyan);background:var(--paype-ink);padding:1px 6px;text-transform:uppercase">Owner</span>';
        listHTML+='<div class="bloom-person-row" style="cursor:pointer;transition:background 0.15s" onclick="event.preventDefault();var f=document.querySelector(\'.bloom-add-form\');if(!f)return;var fn=f.querySelector(\'.bloom-inp-fn\');var ln=f.querySelector(\'.bloom-inp-ln\');var res=document.getElementById(\'personResidence\');var pass=f.querySelector(\'.bloom-inp-pass\');var pct=f.querySelector(\'.bloom-inp-pct\');var role=f.querySelector(\'.bloom-inp-role\');var pep=f.querySelector(\'.bloom-inp-pep\');var nameParts=(\''+esc(p.name||'')+'\').split(\' \');if(fn)fn.value=nameParts[0]||\'\';if(ln)ln.value=nameParts.slice(1).join(\' \')||\'\';if(nat)nat.value=\''+esc(p.nationality||'')+'\';if(res)res.value=\''+esc(p.residence||'')+'\';if(pass)pass.value=\''+esc(p.passportNumber||'')+'\';if(pct)pct.value=\''+(p.percentage||'')+'\';if(role&&p.role)role.value=\''+esc(p.role)+'\';if(pep)pep.value=\''+(p.pepStatus||'not_pep')+'\';closeModal();">';
        listHTML+='<span class="bloom-person-name">'+icon+' '+esc(p.name)+'</span>';
        if (p.role) listHTML+='<span class="bloom-person-role">'+p.role+'</span>';
        if (p.percentage) listHTML+='<span class="bloom-person-pct">'+p.percentage+'%</span>';
        if (p.type==='entity') listHTML+='<span class="bloom-person-type-badge">Entity</span>';
        listHTML+='<span style="display:flex;gap:6px;margin-left:auto;align-items:center"><span class="bloom-browse-edit" style="font-size:0.55rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--paype-ink);cursor:pointer" data-edit-name="'+esc(p.name)+'" data-edit-type="'+(p.type||'person')+'" data-edit-idx="'+i+'">Edit</span><span style="font-size:0.7rem;color:var(--paype-ink);font-weight:700">Select →</span></span>';
        listHTML+='</div>';
      });
    }
    listHTML+='</div>';
    showModal('🧑 Browse People & Entities ('+allPpl.length+')',listHTML);
  });
  
  // BLOOM IDENTITY: "➕ New Person" button opens create modal
  var cnp=document.getElementById('createNewPersonBtn');if(cnp)cnp.addEventListener('click',function(){
    var tab=state._activeStab||'officers',s=tab==='officers'?'Officer':tab==='beneficialOwners'?'Beneficial Owner':tab==='controlling'?'Controlling Person':'Shareholder';
    var formHTML='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">First name</label><input class="field-input" id="modalFN" type="text"></div><div class="field-group" style="flex:1"><label class="field-label">Middle</label><input class="field-input" id="modalMN" type="text"></div><div class="field-group" style="flex:1"><label class="field-label">Last name</label><input class="field-input" id="modalLN" type="text"></div></div>';
    if (tab==='shareholders') formHTML+='<div class="bloom-owner-row"><label class="bloom-owner-card"><input type="radio" name="modalType" value="person" style="display:none" checked><div><span class="bloom-owner-title">🧑 Person</span></div></label><label class="bloom-owner-card"><input type="radio" name="modalType" value="entity" style="display:none"><div><span class="bloom-owner-title">🏢 Entity</span></div></label></div>';
    if (tab==='officers'){formHTML+='<div class="field-group"><label class="field-label">Role</label><select class="field-input" id="modalRole">';getOfficerRoles().forEach(function(r){formHTML+='<option>'+r+'</option>';});formHTML+='</select></div>';}
    if (tab==='shareholders'||tab==='beneficialOwners') formHTML+='<div class="field-group"><label class="field-label">Ownership %</label><input class="field-input" id="modalPct" type="number" min="10" max="100"></div>';
    formHTML+='<div class="field-group"><label class="field-label">Country of residence</label><input class="field-input" id="modalRes" type="text" placeholder="e.g., United Kingdom"></div>'+renderIDBlockModal()+'<div class="field-group"><label class="field-label">PEP Status</label><select class="field-input" id="modalPep"><option value="not_pep">Not a PEP</option><option value="is_pep">Is a PEP</option><option value="family_member">Family member of PEP</option></select></div>';
    showModal('➕ New '+s,formHTML,function(){
      var fn=document.getElementById('modalFN').value,ln=document.getElementById('modalLN').value,mn=(document.getElementById('modalMN')||{}).value||'',name=[fn,mn,ln].filter(Boolean).join(' ');
      if(!name)return;var pct=document.getElementById('modalPct'),role=document.getElementById('modalRole'),nat=document.getElementById('modalNat'),res=document.getElementById('modalRes'),pass=document.getElementById('modalPass'),pep=document.getElementById('modalPep'),typeEl=document.querySelector('input[name="modalType"]:checked'),type=typeEl?typeEl.value:'person';
      if(tab==='beneficialOwners')type='person';
      state[tab]=(state[tab]||[]);state[tab].push({name:name,percentage:(pct||{}).value||'',role:(role||{}).value||'',type:type,residence:(res||{}).value||'',idType:idType,idCountry:idCountry,idNumber:idNumber,idExp:idExp,pepStatus:(pep||{}).value||'not_pep'});saveState();render();
    });
  });
  // People step: authorized users
  
  // Account Users: Browse People
  var bau=document.getElementById('browseAcctUsersBtn');if(bau)bau.addEventListener('click',function(){
    var allPpl=[];['shareholders','officers','beneficialOwners'].forEach(function(sec){(state[sec]||[]).forEach(function(p){if(!allPpl.some(function(x){return x.name===p.name&&x.type===p.type;}))allPpl.push(p);});});
    var respName=[state.firstName,state.lastName].filter(Boolean).join(' ');
    if (respName) allPpl.unshift({name:respName, type:'person', role:'Respondent', _isRespondent:true});
    var listHTML='<div style="max-height:300px;overflow-y:auto">';
    if (allPpl.length===0) listHTML+='<p style="text-align:center;color:var(--color-text-muted)">No people yet. Add one first.</p>';
    else allPpl.forEach(function(p,i){
      listHTML+='<div class="bloom-person-row" style="cursor:pointer;transition:background 0.15s" data-name="'+esc(p.name||'')+'" data-residence="'+esc(p.residence||'')+'" onclick="var f=document.querySelector(\'.bloom-add-form\');if(!f){closeModal();return;}var n=f.querySelector(\'.bloom-usr-name\');var e=f.querySelector(\'.bloom-usr-email\');if(n)n.value=this.getAttribute(\'data-name\');closeModal();">';
      listHTML+='<span class="bloom-person-name">'+(p._isRespondent?'⭐ ':'🧑 ')+esc(p.name)+'</span>';
      if(p.role)listHTML+='<span class="bloom-person-role">'+p.role+'</span>';
      listHTML+='<span style="margin-left:auto;font-size:0.7rem;color:var(--paype-ink);font-weight:700">Select →</span></div>';
    });
    listHTML+='</div>';
    showModal('🧑 Select Account User ('+allPpl.length+')',listHTML);
  });
  // Account Users: New modal
  var cau=document.getElementById('createNewAcctUserBtn');if(cau)cau.addEventListener('click',function(){
    var formHTML='<div class="bloom-name-row"><div class="field-group" style="flex:1"><label class="field-label">Full name</label><input class="field-input" id="modalAUName" type="text"></div><div class="field-group" style="flex:1"><label class="field-label">Email</label><input class="field-input" id="modalAUEmail" type="email"></div></div><div class="field-group"><label class="field-label">Access level</label><select class="field-input" id="modalAURole"><option value="view_only">👁 View Only</option><option value="draft">✏️ Draft</option><option value="poa">⚡ PoA</option></select></div>';
    showModal('➕ New Account User',formHTML,function(){
      var n=document.getElementById('modalAUName').value,e=document.getElementById('modalAUEmail').value,r=document.getElementById('modalAURole').value;
      if(!n)return;state.otherUsers.push({name:n,email:e,role:r});saveState();render();
    });
  });
  var aub=document.querySelector('.bloom-add-auth-user-btn');if(aub)aub.addEventListener('click',function(){
    var ct=this.closest('.bloom-add-form'),name=(ct.querySelector('.bloom-usr-name')||{}).value||'',email=(ct.querySelector('.bloom-usr-email')||{}).value||'',role=(ct.querySelector('input[name="uRole"]:checked')||{}).value||'view_only';
    if(!name)return; if(state.otherUsers.some(function(u){return u.email===email&&email;})){alert('Email already added.');return;}
    state.otherUsers.push({name:name,email:email,role:role});saveState();render();
  });
  // People step: controlling persons
  var acb=document.querySelector('.bloom-add-ctrl-btn');if(acb)acb.addEventListener('click',function(){
    var ct=this.closest('.bloom-add-form'),name=(ct.querySelector('.bloom-inp-fn')||{}).value||'',role=(ct.querySelector('.bloom-inp-role')||{}).value||'';
    if(!name)return;state._controllingPersons=(state._controllingPersons||[]);state._controllingPersons.push({name:name,role:role});saveState();render();
  });
  // Person remove — handles all People tabs including controlling and authorized_users
  document.querySelectorAll('.bloom-person-remove').forEach(function(b){b.addEventListener('click',function(){
    var i=parseInt(this.getAttribute('data-idx')),tab=this.getAttribute('data-tab');
    if (tab==='controlling'&&state._controllingPersons){state._controllingPersons.splice(i,1);render();return;}
    if (tab==='authorized_users'&&state.otherUsers){state.otherUsers.splice(i,1);render();return;}
    if (state[tab]){state[tab].splice(i,1);render();}
  });});
  // BLOOM: % auto-correction — below 10 auto-corrects to 10 after 1700ms with orange flash
  document.addEventListener('input',function(e){if(!e.target.classList.contains('bloom-inp-pct'))return;var inp=e.target,val=parseInt(inp.value);if(!val||val>=10){inp.style.background='';return;}inp.style.background='#fff3cd';clearTimeout(inp._pctTimer);inp._pctTimer=setTimeout(function(){inp.value='10';inp.style.background='';},1700);});
  // Live character counters — update as user types
  document.addEventListener('input',function(e){
    var ta=e.target; if(!ta.classList.contains('bloom-counter'))return;
    var counterId=ta.getAttribute('data-counter'); if(!counterId)return;
    var counter=document.getElementById(counterId); if(!counter)return;
    var len=ta.value.length, ok=len>=50&&len<=500;
    counter.className='bloom-char-count'+(ok?' valid':'');
    counter.textContent=len+'/500 '+(ok?'✓':'('+(50-len)+' more characters needed)');
  });
  // Text inputs
  var im={firstName:'firstName',middleName:'middleName',lastName:'lastName',respEmail:'respondentEmail',respPhone:'respondentPhone',entityName:'entityName',regNum:'registrationNumber',incDate:'dateOfFormation',tinExplain:'tinExplanation',tinNumber:'_tinNumber',mgmtRegNum:'_mgmtRegNum',bizDesc:'businessDescription',primarySourceDesc:'primarySourceDesc',secondarySourceDesc:'secondarySourceDesc',pepDetails:'pepDetails',sanctionsDetails:'sanctionsDetails',criminalDetails:'criminalDetails',secondaryCountry:'secondarySourceCountry',revenue1:'_revenue1',revenue2:'_revenue2',assets1:'_assets1',assets2:'_assets2',liabilities1:'_liabilities1',liabilities2:'_liabilities2',entAddrStreet:'_entAddrStreet',entAddrCity:'_entAddrCity',entAddrState:'_entAddrState',entAddrZip:'_entAddrZip',respAddr1:'_respAddr1',respAddr2:'_respAddr2',respAddr3:'_respAddr3',respCity:'_respCity',respState:'_respState',respZip:'_respZip',respDocType:'_respDocType',respDocNumber:'_respDocNumber',respDocIssuer:'_respDocIssuer',respDocCountry:'_respDocCountry',respDocIssueDate:'_respDocIssueDate',respDocExpiryDate:'_respDocExpiryDate'};
  Object.keys(im).forEach(function(fid){var f=document.getElementById(fid);if(!f)return;f.addEventListener('blur',function(){state[im[fid]]=this.value;saveState();});});
  // Selects
  ['primarySourceType','secondarySourceType'].forEach(function(sid){var s=document.getElementById(sid);if(!s)return;s.addEventListener('change',function(){
    var isPri=sid==='primarySourceType'; if(isPri)state.primarySourceType=this.value; else state.secondarySourceType=this.value;
    // BLOOM: auto-enforce industry for certain source types
    var src=SOURCE_TYPES.find(function(x){return x.id===this.value;}.bind(this));
    if(src&&src.enforceIndustry){if(isPri)state.primarySourceIndustry=src.enforceIndustry;else state.secondarySourceIndustry=src.enforceIndustry;}
    else if(src&&src.industries&&src.industries.length===1){if(isPri)state.primarySourceIndustry=src.industries[0];else state.secondarySourceIndustry=src.industries[0];}
    saveState();render();
  });});
  // Source industry selects
  var psi=document.getElementById('primarySourceIndustry'); if(psi)psi.addEventListener('change',function(){state.primarySourceIndustry=this.value;saveState();});
  var ssi=document.getElementById('secondarySourceIndustry'); if(ssi)ssi.addEventListener('change',function(){state.secondarySourceIndustry=this.value;saveState();});
  // Remove secondary
  var rsb=document.getElementById('removeSecondaryBtn'); if(rsb)rsb.addEventListener('click',function(){state.hasSecondarySource=false;state.secondarySourceType=null;state.secondarySourceIndustry=null;state.secondarySourceCountry=null;state.secondarySourceDesc='';render();});
}

function toggleArr(key,id){var i=state[key].indexOf(id);if(i===-1)state[key].push(id);else state[key].splice(i,1);render();}

function showError(msg){var btn=document.getElementById('fmNextBtn');alert(msg);if(btn){btn.style.animation='none';btn.offsetHeight;btn.style.animation='fmShake 0.4s ease';}}

function nextStep(){
  // BLOOM: detect recalculations — if user went back and changed something,
  // downstream answers may have been recalculated
  if (Object.keys(_snapshot).length>0){detectRecalculations();_snapshot={};}
  var steps=getSteps(),visible=steps.filter(function(s){return !s.cond||s.cond();}),idx=Math.min(state.step,visible.length-1),sid=visible[idx].id;

  // ── BLOOM 7-STEP VALIDATION ──────────────────────────────────

  // STEP 1: YOUR IDENTITY — respondent + entity details + jurisdiction
  if(sid==='identity'){
    if(!state.firstName||!state.lastName){showError('First name and last name are required.');return;}
    if(!state.respondentEmail){showError('Email address is required.');return;}
    if(state._respDOB){
      var dob=new Date(state._respDOB+'T00:00:00'),now2=new Date(),a=now2.getFullYear()-dob.getFullYear();
      var m=now2.getMonth()-dob.getMonth();if(m<0||(m===0&&now2.getDate()<dob.getDate()))a--;
      if(a<18){showError('You must be at least 18 years old to open an account.');return;}
      if(a>120){showError('Please enter a valid date of birth.');return;}
    }
    if(!state.jurisdiction){showError('Please select your country.');return;}
    var c=COUNTRIES.find(function(x){return x.code===state.jurisdiction;});
    if(c&&c.us&&!state.usState){showError('Please select your US state.');return;}
    // Entity validations (if entity owner)
    if(state.respondentType==='entity'){
      if(!state.entityName){showError('Entity name is required.');return;}
      if(!state.registrationNumber){
        var et=state.entityType||'commercial';
        if(['trust','estate','partnership_biz','partnership_inv'].indexOf(et)===-1){showError('Registration number is required for this entity type.');return;}
      }
      if(state.dateOfFormation){
        var dof=new Date(state.dateOfFormation+'T00:00:00');
        if(dof>new Date()){showError('Date of formation cannot be in the future.');return;}
      }
      if(!state.managementCountry){showError('Please select where key management decisions are made.');return;}
      if(state.managementCountry!==state.jurisdiction&&!state._mgmtRegNum){showError('Please enter the registration number in the management country.');return;}
      if(state.tinStatus==='no_tin'){
        if(state._tinNoReason==='other'&&(!state.tinExplanation||state.tinExplanation.length<50)){showError('Please explain why you do not have a TIN (min 50 characters).');return;}
        if(!state._tinNoReason){showError('Please select a reason for not having a TIN.');return;}
      }
      if(state._redomiciled){
        if(!state._redomDate){showError('Please enter the re-domiciliation date.');return;}
        if(!state._redomCountry){showError('Please select the re-domiciliation country.');return;}
        if(state.dateOfFormation&&new Date(state._redomDate+'T00:00:00')<=new Date(state.dateOfFormation+'T00:00:00')){showError('Re-domiciliation date must be after the date of formation.');return;}
        if(new Date(state._redomDate+'T00:00:00')>new Date()){showError('Re-domiciliation date cannot be in the future.');return;}
      }
    }
  }

  // STEP 2: ACCOUNT OWNER — must select type
  if(sid==='owner'){
    if(!state.respondentType){showError('Please select who is going to be the legal owner of the account.');return;}
    if(state.respondentType==='other_person'&&(!state._ownerFirstName||!state._ownerLastName)){showError('Please enter the owner\'s first and last name.');return;}
  }

  // STEP 3: SOURCE OF FUNDS + BUSINESS + RISK
  if(sid==='funds'){
    if(!state.primarySourceType){showError('Please select the primary source of funds.');return;}
    if(!state.primarySourceIndustry){showError('Please select the industry for the primary source of funds.');return;}
    if(!state.primarySourceCountry){showError('Please select the country of origin.');return;}
    if(!state.primarySourceDesc||state.primarySourceDesc.length<50){showError('Primary source description must be at least 50 characters.');return;}
    if(state.primarySourceDesc.length>500){showError('Primary source description must not exceed 500 characters.');return;}
    if(state.hasSecondarySource){
      if(!state.secondarySourceType){showError('All secondary source fields are required. Please select the source type.');return;}
      if(!state.secondarySourceIndustry){showError('Please select the industry for the secondary source.');return;}
      if(!state.secondarySourceCountry){showError('Please select the country of origin for the secondary source.');return;}
      if(!state.secondarySourceDesc||state.secondarySourceDesc.length<50){showError('Secondary source description must be at least 50 characters.');return;}
      if(state.secondarySourceDesc.length>500){showError('Secondary source description must not exceed 500 characters.');return;}
    }
    if(state.respondentType==='entity'&&!state.industry){showError('Please select your industry.');return;}
  }

  // STEP 4: PEOPLE — officers + shareholders + BOs
  if(sid==='people'){
    if(state.respondentType==='entity'){
      if(state.officers.length===0){showError('You need to add at least one officer.');return;}
      var shTot=state.shareholders.reduce(function(s,p){return s+(parseInt(p.percentage)||0);},0);
      if(state.shareholders.length===0||shTot<75){showError('Shareholders must account for at least 75% ownership (currently '+shTot+'%).');return;}
      if(!state._publiclyListed){
        var boTot=state.beneficialOwners.reduce(function(s,p){return s+(parseInt(p.percentage)||0);},0);
        if(state.beneficialOwners.length===0||boTot<75){showError('Beneficial owners must account for at least 75% ownership (currently '+boTot+'%).');return;}
      } else if(!state._listingMarket){showError('Please provide the listing market.');return;}
    }
  }

  // For Me mode
  if(sid==='industry'&&!state.industry){showError('Please select your industry.');return;}
  if(sid==='volume'&&!state.monthlyVolume){showError('Please select your expected monthly volume.');return;}

  state.step++;if(state.step>=visible.length)state.step=visible.length-1;render();window.scrollTo(0,0);
}

// ── INIT ──────────────────────────────────────────────────────
if(MODE==='full'){try{var pf=JSON.parse(sessionStorage.getItem('paype_forme'));if(pf&&pf.canOpen){if(pf.entityType)state.respondentType=pf.entityType==='company'?'entity':'me';if(pf.country)state.jurisdiction=pf.country;if(pf.industry)state.industry=pf.industry;if(pf.volume)state.monthlyVolume=pf.volume;if(pf.highRiskFlags)state.highRiskFlags=pf.highRiskFlags;state.step=(state.respondentType&&state.jurisdiction)?2:0;}}catch(e){}}
render();
  // Export for inline onclick handlers (signature modal, close modal, edit person)
  window.showSignatureModal = showSignatureModal;
  window.closeModal = closeModal;
  window.editExistingPerson = function(name,type,idx){
    var all=[].concat(state.shareholders,state.officers,state.beneficialOwners,(state._controllingPersons||[]),state.otherUsers);
    var p=all.find(function(x){return x.name===name;});
    if(!p)return;
    var formHTML='<div class="field-group"><label class="field-label">Full name</label><input class="field-input" id="editPName" type="text" value="'+esc(p.name||'')+'"></div>';
    if(p.role)formHTML+='<div class="field-group"><label class="field-label">Role</label><input class="field-input" id="editPRole" type="text" value="'+esc(p.role||'')+'"></div>';
    if(p.percentage!==undefined)formHTML+='<div class="field-group"><label class="field-label">Ownership %</label><input class="field-input" id="editPPct" type="number" value="'+(p.percentage||'')+'"></div>';
    
    
    if(p.residence!==undefined)formHTML+='<div class="field-group"><label class="field-label">Country of residence</label><input class="field-input" id="editPRes" type="text" value="'+esc(p.residence||'')+'"></div><div class="field-group" style="font-size:0.7rem;color:var(--color-text-muted)">Use the country name as it appears on official documents.</div>';if(p.passportNumber!==undefined)formHTML+='<div class="field-group"><label class="field-label">Passport/ID</label><input class="field-input" id="editPPass" type="text" value="'+esc(p.passportNumber||'')+'"></div>';
    showModal('✏️ Edit: '+esc(name),formHTML,function(){
      var nn=document.getElementById('editPName').value;
      if(!nn)return;
      p.name=nn;
      if(document.getElementById('editPRole'))p.role=document.getElementById('editPRole').value;
      if(document.getElementById('editPPct'))p.percentage=document.getElementById('editPPct').value;
      
      if(document.getElementById('editPRes'))p.residence=document.getElementById('editPRes').value;
      if(document.getElementById('editPPass'))p.passportNumber=document.getElementById('editPPass').value;
      saveState();render();
    });
  };
})();
