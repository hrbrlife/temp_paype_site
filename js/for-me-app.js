/**
 * For Me? — Eligibility & suitability wizard.
 * BLOOM-level: animated steps, live risk preview, dashboard result,
 * sessionStorage pre-fill into Open Account flow.
 */
(function(){
'use strict';

// ── Embedded data ────────────────────────────────────────────
var FM = {};

FM.entityTypes = [
  { id:'individual', label:'Individual', desc:'Personal account for everyday use', icon:'👤', risk:0 },
  { id:'self_employed', label:'Self-Employed', desc:'Freelancer, contractor, sole trader', icon:'💼', risk:0 },
  { id:'company', label:'Company / LLC', desc:'Registered business entity', icon:'🏢', risk:0 },
  { id:'trust', label:'Trust / Foundation', desc:'Trust, foundation, or estate', icon:'🏛️', risk:1 },
  { id:'dao', label:'DAO / Digital Entity', desc:'Decentralized or token-based org', icon:'🔗', risk:2 },
];

FM.industries = [
  { id:'tech', label:'Technology / SaaS', risk:0 },
  { id:'consulting', label:'Consulting / Professional Services', risk:0 },
  { id:'ecommerce', label:'E-Commerce / Retail', risk:0 },
  { id:'trade', label:'Import / Export / Trade', risk:1 },
  { id:'realestate', label:'Real Estate / Property', risk:1 },
  { id:'manufacturing', label:'Manufacturing', risk:0 },
  { id:'media', label:'Media / Entertainment', risk:0 },
  { id:'finance', label:'Financial Services (non-crypto)', risk:1 },
  { id:'crypto', label:'Crypto / Web3 / Blockchain', risk:2 },
  { id:'gambling', label:'Gambling / Online Gaming', risk:3 },
  { id:'adult', label:'Adult Content', risk:3 },
  { id:'arms', label:'Arms / Defence', risk:3 },
  { id:'fx', label:'FX Brokerage', risk:2 },
  { id:'affiliate', label:'Affiliate Marketing', risk:2 },
  { id:'nutra', label:'Nutraceuticals / Supplements', risk:2 },
  { id:'family_office', label:'Family Office / Holding', risk:1 },
  { id:'yacht_aircraft', label:'Yacht / Aircraft SPV', risk:1 },
  { id:'fund', label:'Private Fund / Investment Vehicle', risk:1 },
  { id:'ngo', label:'Non-Profit / NGO', risk:0 },
  { id:'other', label:'Other', risk:0 },
];

FM.staffBands = [
  { id:'1', label:'Just me', risk:0 },
  { id:'2-10', label:'2–10', risk:0 },
  { id:'11-50', label:'11–50', risk:0 },
  { id:'51-250', label:'51–250', risk:1 },
  { id:'251+', label:'251+', risk:1 },
];

FM.volumeBands = [
  { id:'under10k', label:'Under $10K / month', risk:0, tier:'Melody' },
  { id:'10k-50k', label:'$10K–$50K / month', risk:0, tier:'Melody → Big Band' },
  { id:'50k-250k', label:'$50K–$250K / month', risk:1, tier:'Big Band' },
  { id:'250k-1m', label:'$250K–$1M / month', risk:1, tier:'Big Band → Orchestra' },
  { id:'over1m', label:'$1M+ / month', risk:2, tier:'Orchestra (40% off)' },
];

FM.paymentNeeds = [
  { id:'bank_in', label:'Receive bank transfers', icon:'🏦', desc:'ACH, SWIFT, SEPA inbound' },
  { id:'card_in', label:'Receive card payments', icon:'💳', desc:'Clients pay you by card' },
  { id:'crypto_in', label:'Receive crypto', icon:'₿', desc:'BTC, ETH, USDT, USDC in' },
  { id:'bank_out', label:'Send bank transfers', icon:'📤', desc:'ACH, SWIFT, SEPA outbound' },
  { id:'crypto_out', label:'Send crypto', icon:'🔗', desc:'To any external wallet' },
  { id:'swap', label:'Swap currencies & crypto', icon:'🔄', desc:'Instant conversion' },
  { id:'cards', label:'Debit cards', icon:'💳', desc:'Apple Pay / Google Pay' },
  { id:'subaccounts', label:'Sub-accounts', icon:'📂', desc:'Separate wallets per project' },
  { id:'masspay', label:'Mass payouts', icon:'📤', desc:'Pay contractors at scale' },
  { id:'otc', label:'VIP OTC', icon:'💎', desc:'Large-volume crypto swaps' },
];

FM.highRiskFlags = [
  { id:'crypto_exchange', label:'Crypto exchange / brokerage', surcharge:true },
  { id:'gambling', label:'Online gambling / gaming', surcharge:true },
  { id:'adult', label:'Adult content / entertainment', surcharge:true },
  { id:'arms', label:'Arms / defence (licensed)', surcharge:true },
  { id:'fx', label:'FX brokerage', surcharge:true },
  { id:'affiliate', label:'Affiliate marketing / media buying', surcharge:true },
  { id:'nutra', label:'Nutraceuticals / supplements', surcharge:true },
  { id:'third_party_funds', label:'Handle third-party client funds', risk:2 },
  { id:'msb', label:'Money services / money transmission', risk:2 },
  { id:'pep', label:'Politically Exposed Person (PEP)', risk:2 },
];

FM.docRequirements = {
  individual: [
    { doc:'Government-issued photo ID', why:'Identity verification (KYC)' },
    { doc:'Proof of address', why:'Residency verification' },
    { doc:'Selfie / liveness check', why:'Matches you to your ID' },
  ],
  self_employed: [
    { doc:'Government-issued photo ID', why:'Identity verification (KYC)' },
    { doc:'Proof of address', why:'Residency verification' },
    { doc:'Selfie / liveness check', why:'Matches you to your ID' },
    { doc:'Business registration or tax ID', why:'Self-employment verification' },
  ],
  company: [
    { doc:'Certificate of incorporation', why:'Company existence verification' },
    { doc:'Register of directors', why:'Who controls the company' },
    { doc:'Register of shareholders (25%+)', why:'UBO identification' },
    { doc:'UBO photo ID + proof of address', why:'Per UBO: identity + residency' },
    { doc:'Business activity description', why:'Nature of business' },
  ],
  trust: [
    { doc:'Trust deed / foundation charter', why:'Legal existence' },
    { doc:'Trustee ID + proof of address', why:'Trustee identity' },
    { doc:'Beneficiary declaration', why:'Who benefits' },
    { doc:'Settlor ID + proof of address', why:'Settlor identity' },
  ],
  dao: [
    { doc:'Governance documentation', why:'How decisions are made' },
    { doc:'Key signers ID + proof of address', why:'Per signer: identity + residency' },
    { doc:'Treasury / multisig setup', why:'How funds are controlled' },
    { doc:'Token holder structure', why:'Ownership / governance distribution' },
  ],
  high_risk_extra: [
    { doc:'Source of funds statement', why:'Where did the money come from?' },
    { doc:'Source of wealth statement', why:'How was wealth accumulated?' },
    { doc:'6 months bank statements', why:'Transaction history verification' },
    { doc:'Business plan or operating model', why:'Understand the business' },
  ],
  crypto_extra: [
    { doc:'Wallet ownership proof', why:'Verify you control the wallet' },
    { doc:'Transaction history (3 months)', why:'On-chain activity review' },
  ],
};

FM.countries = [
  { code:'AF', iso3:'AFG', name:'Afghanistan', risk:3 },{ code:'AL', iso3:'ALB', name:'Albania', risk:0 },
  { code:'DZ', iso3:'DZA', name:'Algeria', risk:1 },{ code:'AD', iso3:'AND', name:'Andorra', risk:0 },
  { code:'AO', iso3:'AGO', name:'Angola', risk:1 },{ code:'AG', iso3:'ATG', name:'Antigua and Barbuda', risk:0 },
  { code:'AR', iso3:'ARG', name:'Argentina', risk:1 },{ code:'AM', iso3:'ARM', name:'Armenia', risk:0 },
  { code:'AU', iso3:'AUS', name:'Australia', risk:0, eu:true },{ code:'AT', iso3:'AUT', name:'Austria', risk:0, eu:true },
  { code:'AZ', iso3:'AZE', name:'Azerbaijan', risk:0 },{ code:'BS', iso3:'BHS', name:'Bahamas', risk:0 },
  { code:'BH', iso3:'BHR', name:'Bahrain', risk:0 },{ code:'BD', iso3:'BGD', name:'Bangladesh', risk:1 },
  { code:'BB', iso3:'BRB', name:'Barbados', risk:0 },{ code:'BY', iso3:'BLR', name:'Belarus', risk:3 },
  { code:'BE', iso3:'BEL', name:'Belgium', risk:0, eu:true },{ code:'BZ', iso3:'BLZ', name:'Belize', risk:1 },
  { code:'BJ', iso3:'BEN', name:'Benin', risk:1 },{ code:'BT', iso3:'BTN', name:'Bhutan', risk:0 },
  { code:'BO', iso3:'BOL', name:'Bolivia', risk:1 },{ code:'BA', iso3:'BIH', name:'Bosnia and Herzegovina', risk:1 },
  { code:'BW', iso3:'BWA', name:'Botswana', risk:0 },{ code:'BR', iso3:'BRA', name:'Brazil', risk:1 },
  { code:'BN', iso3:'BRN', name:'Brunei', risk:0 },{ code:'BG', iso3:'BGR', name:'Bulgaria', risk:0, eu:true },
  { code:'BF', iso3:'BFA', name:'Burkina Faso', risk:1 },{ code:'BI', iso3:'BDI', name:'Burundi', risk:3 },
  { code:'CV', iso3:'CPV', name:'Cabo Verde', risk:0 },{ code:'KH', iso3:'KHM', name:'Cambodia', risk:2 },
  { code:'CM', iso3:'CMR', name:'Cameroon', risk:2 },{ code:'CA', iso3:'CAN', name:'Canada', risk:0, eu:true },
  { code:'CF', iso3:'CAF', name:'Central African Republic', risk:3 },{ code:'TD', iso3:'TCD', name:'Chad', risk:2 },
  { code:'CL', iso3:'CHL', name:'Chile', risk:0 },{ code:'CN', iso3:'CHN', name:'China', risk:1 },
  { code:'CO', iso3:'COL', name:'Colombia', risk:1 },{ code:'KM', iso3:'COM', name:'Comoros', risk:1 },
  { code:'CG', iso3:'COG', name:'Congo', risk:2 },{ code:'CR', iso3:'CRI', name:'Costa Rica', risk:0 },
  { code:'HR', iso3:'HRV', name:'Croatia', risk:0, eu:true },{ code:'CU', iso3:'CUB', name:'Cuba', risk:3 },
  { code:'CY', iso3:'CYP', name:'Cyprus', risk:0, eu:true },{ code:'CZ', iso3:'CZE', name:'Czech Republic', risk:0, eu:true },
  { code:'DK', iso3:'DNK', name:'Denmark', risk:0, eu:true },{ code:'DJ', iso3:'DJI', name:'Djibouti', risk:1 },
  { code:'DM', iso3:'DMA', name:'Dominica', risk:1 },{ code:'DO', iso3:'DOM', name:'Dominican Republic', risk:1 },
  { code:'EC', iso3:'ECU', name:'Ecuador', risk:1 },{ code:'EG', iso3:'EGY', name:'Egypt', risk:1 },
  { code:'SV', iso3:'SLV', name:'El Salvador', risk:1 },{ code:'GQ', iso3:'GNQ', name:'Equatorial Guinea', risk:2 },
  { code:'ER', iso3:'ERI', name:'Eritrea', risk:2 },{ code:'EE', iso3:'EST', name:'Estonia', risk:0, eu:true },
  { code:'SZ', iso3:'SWZ', name:'Eswatini', risk:1 },{ code:'ET', iso3:'ETH', name:'Ethiopia', risk:2 },
  { code:'FJ', iso3:'FJI', name:'Fiji', risk:0 },{ code:'FI', iso3:'FIN', name:'Finland', risk:0, eu:true },
  { code:'FR', iso3:'FRA', name:'France', risk:0, eu:true },{ code:'GA', iso3:'GAB', name:'Gabon', risk:1 },
  { code:'GM', iso3:'GMB', name:'Gambia', risk:1 },{ code:'GE', iso3:'GEO', name:'Georgia', risk:0 },
  { code:'DE', iso3:'DEU', name:'Germany', risk:0, eu:true },{ code:'GH', iso3:'GHA', name:'Ghana', risk:1 },
  { code:'GR', iso3:'GRC', name:'Greece', risk:0, eu:true },{ code:'GD', iso3:'GRD', name:'Grenada', risk:0 },
  { code:'GT', iso3:'GTM', name:'Guatemala', risk:1 },{ code:'GN', iso3:'GIN', name:'Guinea', risk:2 },
  { code:'GW', iso3:'GNB', name:'Guinea-Bissau', risk:2 },{ code:'GY', iso3:'GUY', name:'Guyana', risk:1 },
  { code:'HT', iso3:'HTI', name:'Haiti', risk:2 },{ code:'HN', iso3:'HND', name:'Honduras', risk:1 },
  { code:'HK', iso3:'HKG', name:'Hong Kong', risk:0 },{ code:'HU', iso3:'HUN', name:'Hungary', risk:0, eu:true },
  { code:'IS', iso3:'ISL', name:'Iceland', risk:0 },{ code:'IN', iso3:'IND', name:'India', risk:1 },
  { code:'ID', iso3:'IDN', name:'Indonesia', risk:1 },{ code:'IR', iso3:'IRN', name:'Iran', risk:3 },
  { code:'IQ', iso3:'IRQ', name:'Iraq', risk:2 },{ code:'IE', iso3:'IRL', name:'Ireland', risk:0, eu:true },
  { code:'IL', iso3:'ISR', name:'Israel', risk:0 },{ code:'IT', iso3:'ITA', name:'Italy', risk:0, eu:true },
  { code:'JM', iso3:'JAM', name:'Jamaica', risk:1 },{ code:'JP', iso3:'JPN', name:'Japan', risk:0 },
  { code:'JO', iso3:'JOR', name:'Jordan', risk:1 },{ code:'KZ', iso3:'KAZ', name:'Kazakhstan', risk:1 },
  { code:'KE', iso3:'KEN', name:'Kenya', risk:1 },{ code:'KI', iso3:'KIR', name:'Kiribati', risk:1 },
  { code:'KP', iso3:'PRK', name:'North Korea', risk:3 },{ code:'KR', iso3:'KOR', name:'South Korea', risk:0 },
  { code:'KW', iso3:'KWT', name:'Kuwait', risk:0 },{ code:'KG', iso3:'KGZ', name:'Kyrgyzstan', risk:1 },
  { code:'LA', iso3:'LAO', name:'Laos', risk:2 },{ code:'LV', iso3:'LVA', name:'Latvia', risk:0, eu:true },
  { code:'LB', iso3:'LBN', name:'Lebanon', risk:2 },{ code:'LS', iso3:'LSO', name:'Lesotho', risk:1 },
  { code:'LR', iso3:'LBR', name:'Liberia', risk:2 },{ code:'LY', iso3:'LBY', name:'Libya', risk:3 },
  { code:'LI', iso3:'LIE', name:'Liechtenstein', risk:0 },{ code:'LT', iso3:'LTU', name:'Lithuania', risk:0, eu:true },
  { code:'LU', iso3:'LUX', name:'Luxembourg', risk:0, eu:true },{ code:'MO', iso3:'MAC', name:'Macau', risk:1 },
  { code:'MG', iso3:'MDG', name:'Madagascar', risk:1 },{ code:'MW', iso3:'MWI', name:'Malawi', risk:1 },
  { code:'MY', iso3:'MYS', name:'Malaysia', risk:1 },{ code:'MV', iso3:'MDV', name:'Maldives', risk:0 },
  { code:'ML', iso3:'MLI', name:'Mali', risk:2 },{ code:'MT', iso3:'MLT', name:'Malta', risk:0, eu:true },
  { code:'MH', iso3:'MHL', name:'Marshall Islands', risk:0 },{ code:'MR', iso3:'MRT', name:'Mauritania', risk:2 },
  { code:'MU', iso3:'MUS', name:'Mauritius', risk:0 },{ code:'MX', iso3:'MEX', name:'Mexico', risk:1 },
  { code:'FM', iso3:'FSM', name:'Micronesia', risk:0 },{ code:'MD', iso3:'MDA', name:'Moldova', risk:1 },
  { code:'MC', iso3:'MCO', name:'Monaco', risk:0 },{ code:'MN', iso3:'MNG', name:'Mongolia', risk:1 },
  { code:'ME', iso3:'MNE', name:'Montenegro', risk:1 },{ code:'MA', iso3:'MAR', name:'Morocco', risk:1 },
  { code:'MZ', iso3:'MOZ', name:'Mozambique', risk:1 },{ code:'MM', iso3:'MMR', name:'Myanmar', risk:3 },
  { code:'NA', iso3:'NAM', name:'Namibia', risk:1 },{ code:'NR', iso3:'NRU', name:'Nauru', risk:1 },
  { code:'NP', iso3:'NPL', name:'Nepal', risk:1 },{ code:'NL', iso3:'NLD', name:'Netherlands', risk:0, eu:true },
  { code:'NZ', iso3:'NZL', name:'New Zealand', risk:0, eu:true },{ code:'NI', iso3:'NIC', name:'Nicaragua', risk:2 },
  { code:'NE', iso3:'NER', name:'Niger', risk:2 },{ code:'NG', iso3:'NGA', name:'Nigeria', risk:1 },
  { code:'MK', iso3:'MKD', name:'North Macedonia', risk:1 },{ code:'NO', iso3:'NOR', name:'Norway', risk:0 },
  { code:'OM', iso3:'OMN', name:'Oman', risk:0 },{ code:'PK', iso3:'PAK', name:'Pakistan', risk:2 },
  { code:'PW', iso3:'PLW', name:'Palau', risk:0 },{ code:'PA', iso3:'PAN', name:'Panama', risk:1 },
  { code:'PG', iso3:'PNG', name:'Papua New Guinea', risk:1 },{ code:'PY', iso3:'PRY', name:'Paraguay', risk:1 },
  { code:'PE', iso3:'PER', name:'Peru', risk:1 },{ code:'PH', iso3:'PHL', name:'Philippines', risk:1 },
  { code:'PL', iso3:'POL', name:'Poland', risk:0, eu:true },{ code:'PT', iso3:'PRT', name:'Portugal', risk:0, eu:true },
  { code:'QA', iso3:'QAT', name:'Qatar', risk:0 },{ code:'RO', iso3:'ROU', name:'Romania', risk:0, eu:true },
  { code:'RU', iso3:'RUS', name:'Russia', risk:3 },{ code:'RW', iso3:'RWA', name:'Rwanda', risk:0 },
  { code:'KN', iso3:'KNA', name:'Saint Kitts and Nevis', risk:0 },{ code:'LC', iso3:'LCA', name:'Saint Lucia', risk:0 },
  { code:'VC', iso3:'VCT', name:'Saint Vincent', risk:0 },{ code:'WS', iso3:'WSM', name:'Samoa', risk:0 },
  { code:'SM', iso3:'SMR', name:'San Marino', risk:0 },{ code:'ST', iso3:'STP', name:'Sao Tome and Principe', risk:1 },
  { code:'SA', iso3:'SAU', name:'Saudi Arabia', risk:1 },{ code:'SN', iso3:'SEN', name:'Senegal', risk:1 },
  { code:'RS', iso3:'SRB', name:'Serbia', risk:1 },{ code:'SC', iso3:'SYC', name:'Seychelles', risk:0 },
  { code:'SL', iso3:'SLE', name:'Sierra Leone', risk:2 },{ code:'SG', iso3:'SGP', name:'Singapore', risk:0 },
  { code:'SK', iso3:'SVK', name:'Slovakia', risk:0, eu:true },{ code:'SI', iso3:'SVN', name:'Slovenia', risk:0, eu:true },
  { code:'SB', iso3:'SLB', name:'Solomon Islands', risk:0 },{ code:'SO', iso3:'SOM', name:'Somalia', risk:3 },
  { code:'ZA', iso3:'ZAF', name:'South Africa', risk:1 },{ code:'SS', iso3:'SSD', name:'South Sudan', risk:3 },
  { code:'ES', iso3:'ESP', name:'Spain', risk:0, eu:true },{ code:'LK', iso3:'LKA', name:'Sri Lanka', risk:1 },
  { code:'SD', iso3:'SDN', name:'Sudan', risk:3 },{ code:'SR', iso3:'SUR', name:'Suriname', risk:1 },
  { code:'SE', iso3:'SWE', name:'Sweden', risk:0, eu:true },{ code:'CH', iso3:'CHE', name:'Switzerland', risk:0 },
  { code:'SY', iso3:'SYR', name:'Syria', risk:3 },{ code:'TW', iso3:'TWN', name:'Taiwan', risk:0 },
  { code:'TJ', iso3:'TJK', name:'Tajikistan', risk:1 },{ code:'TZ', iso3:'TZA', name:'Tanzania', risk:1 },
  { code:'TH', iso3:'THA', name:'Thailand', risk:1 },{ code:'TL', iso3:'TLS', name:'Timor-Leste', risk:1 },
  { code:'TG', iso3:'TGO', name:'Togo', risk:1 },{ code:'TO', iso3:'TON', name:'Tonga', risk:0 },
  { code:'TT', iso3:'TTO', name:'Trinidad and Tobago', risk:0 },{ code:'TN', iso3:'TUN', name:'Tunisia', risk:1 },
  { code:'TR', iso3:'TUR', name:'Turkey', risk:1 },{ code:'TM', iso3:'TKM', name:'Turkmenistan', risk:2 },
  { code:'TV', iso3:'TUV', name:'Tuvalu', risk:0 },{ code:'UG', iso3:'UGA', name:'Uganda', risk:1 },
  { code:'UA', iso3:'UKR', name:'Ukraine', risk:1 },{ code:'AE', iso3:'ARE', name:'United Arab Emirates', risk:0 },
  { code:'GB', iso3:'GBR', name:'United Kingdom', risk:0 },{ code:'US', iso3:'USA', name:'United States', risk:0, us:true },
  { code:'UY', iso3:'URY', name:'Uruguay', risk:0 },{ code:'UZ', iso3:'UZB', name:'Uzbekistan', risk:1 },
  { code:'VU', iso3:'VUT', name:'Vanuatu', risk:0 },{ code:'VA', iso3:'VAT', name:'Vatican City', risk:0 },
  { code:'VE', iso3:'VEN', name:'Venezuela', risk:3 },{ code:'VN', iso3:'VNM', name:'Vietnam', risk:1 },
  { code:'YE', iso3:'YEM', name:'Yemen', risk:3 },{ code:'ZM', iso3:'ZMB', name:'Zambia', risk:1 },
  { code:'ZW', iso3:'ZWE', name:'Zimbabwe', risk:2 },
];

// US states
var US_STATES = [
  { code:'MT', name:'Montana', ok:true },
  { code:'AL', name:'Alabama', ok:false },{ code:'AK', name:'Alaska', ok:false },{ code:'AZ', name:'Arizona', ok:false },
  { code:'AR', name:'Arkansas', ok:false },{ code:'CA', name:'California', ok:false },{ code:'CO', name:'Colorado', ok:false },
  { code:'CT', name:'Connecticut', ok:false },{ code:'DE', name:'Delaware', ok:false },{ code:'FL', name:'Florida', ok:false },
  { code:'GA', name:'Georgia', ok:false },{ code:'HI', name:'Hawaii', ok:false },{ code:'ID', name:'Idaho', ok:false },
  { code:'IL', name:'Illinois', ok:false },{ code:'IN', name:'Indiana', ok:false },{ code:'IA', name:'Iowa', ok:false },
  { code:'KS', name:'Kansas', ok:false },{ code:'KY', name:'Kentucky', ok:false },{ code:'LA', name:'Louisiana', ok:false },
  { code:'ME', name:'Maine', ok:false },{ code:'MD', name:'Maryland', ok:false },{ code:'MA', name:'Massachusetts', ok:false },
  { code:'MI', name:'Michigan', ok:false },{ code:'MN', name:'Minnesota', ok:false },{ code:'MS', name:'Mississippi', ok:false },
  { code:'MO', name:'Missouri', ok:false },{ code:'NE', name:'Nebraska', ok:false },{ code:'NV', name:'Nevada', ok:false },
  { code:'NH', name:'New Hampshire', ok:false },{ code:'NJ', name:'New Jersey', ok:false },{ code:'NM', name:'New Mexico', ok:false },
  { code:'NY', name:'New York', ok:false },{ code:'NC', name:'North Carolina', ok:false },{ code:'ND', name:'North Dakota', ok:false },
  { code:'OH', name:'Ohio', ok:false },{ code:'OK', name:'Oklahoma', ok:false },{ code:'OR', name:'Oregon', ok:false },
  { code:'PA', name:'Pennsylvania', ok:false },{ code:'RI', name:'Rhode Island', ok:false },{ code:'SC', name:'South Carolina', ok:false },
  { code:'SD', name:'South Dakota', ok:false },{ code:'TN', name:'Tennessee', ok:false },{ code:'TX', name:'Texas', ok:false },
  { code:'UT', name:'Utah', ok:false },{ code:'VT', name:'Vermont', ok:false },{ code:'VA', name:'Virginia', ok:false },
  { code:'WA', name:'Washington', ok:false },{ code:'WV', name:'West Virginia', ok:false },{ code:'WI', name:'Wisconsin', ok:false },
  { code:'WY', name:'Wyoming', ok:false },
];

// ── State ─────────────────────────────────────────────────────
var state = {
  step: 0,
  entityType: null, country: null, industry: null,
  staffSize: null, volume: null, paymentNeeds: [],
  highRiskFlags: [], usState: null,
  animating: false
};
var appEl = document.getElementById('fmApp');
if (!appEl) return;

// ── Step definitions ──────────────────────────────────────────
var steps = [
  { id:'entity', title:'Who are you?', why:'This helps us determine your account type and document requirements.', icon:'👤' },
  { id:'country', title:'Where are you based?', why:'Eligibility varies by country. We check regulations automatically.', icon:'🌍' },
  { id:'us_state', title:'US applicants: which state?', why:'US accounts are currently available for Montana residents and businesses.', icon:'📍', cond:function(){var c=FM.countries.find(function(x){return x.code===state.country;}); return c && c.us;} },
  { id:'industry', title:'What industry?', why:'Some industries need extra compliance. We check so there are no surprises.', icon:'🏭' },
  { id:'staff', title:'How many people?', why:'Team size helps us understand your volume and suggest the right account setup.', icon:'👥' },
  { id:'volume', title:'Monthly volume?', why:'Your volume determines your pricing tier. More volume = automatic discounts.', icon:'📊' },
  { id:'payments', title:'What do you need?', why:'Pick everything you plan to use. We\'ll show what\'s available and what costs.', icon:'⚡' },
  { id:'risk', title:'Any high-risk flags?', why:'These affect your risk tier. Be honest — we\'ll tell you exactly what changes.', icon:'⚠️' },
  { id:'result', title:'Your assessment', why:'', icon:'📋' },
];

// ── Live risk preview ─────────────────────────────────────────
function calcLiveRisk() {
  var c = FM.countries.find(function(x){return x.code===state.country;});
  var ind = FM.industries.find(function(x){return x.id===state.industry;});
  var ent = FM.entityTypes.find(function(x){return x.id===state.entityType;});
  var vol = FM.volumeBands.find(function(x){return x.id===state.volume;});
  var cr = (c&&c.risk)||0, ir = (ind&&ind.risk)||0, er = (ent&&ent.risk)||0, vr = (vol&&vol.risk)||0;
  var fr = state.highRiskFlags.length>0?2:0;
  return Math.max(cr,ir,er,vr,fr);
}

function riskMeterHTML() {
  var r = calcLiveRisk();
  var label = r>=2?'High':r>=1?'Medium':'Low';
  var color = r>=2?'#E02020':r>=1?'#E67E22':'#157A30';
  var bars = [0,1,2].map(function(i){return '<span class="fm-rm-bar'+(i<=r?' fm-rm-bar--on':'')+'" style="background:'+(i<=r?color:'#ddd')+'"></span>';}).join('');
  return '<div class="fm-risk-meter"><div class="fm-rm-label">Risk: <strong style="color:'+color+'">'+label+'</strong></div><div class="fm-rm-bars">'+bars+'</div></div>';
}

// ── Render ────────────────────────────────────────────────────
function render() {
  if (state.animating) return;
  var s = state.step;
  var visibleSteps = steps.filter(function(st){ return !st.cond || st.cond(); });
  var vsNonResult = visibleSteps.filter(function(st){ return st.id !== 'result'; });
  var stepData = visibleSteps[s];
  if (!stepData) { renderResult(); return; }

  // Step dots
  var dotsHTML = '<div class="fm-dots">';
  vsNonResult.forEach(function(st,i){
    var cls = i<s?'fm-dot--done':i===s?'fm-dot--active':'';
    dotsHTML += '<div class="fm-dot '+cls+'"><span class="fm-dot-num">'+(i+1)+'</span><span class="fm-dot-label">'+st.title+'</span></div>';
  });
  dotsHTML += '</div>';

  var pct = Math.round((s / vsNonResult.length) * 100);
  var progressHTML = '<div class="fm-progress"><div class="fm-progress-bar" style="width:'+pct+'%"></div></div>';
  var countHTML = '<div class="fm-progress-text">Question '+(s+1)+' of '+vsNonResult.length+'</div>';

  var titleHTML = '<h2>'+stepData.title+'</h2>';
  var whyHTML = stepData.why ? '<p class="fm-why">'+stepData.why+'</p>' : '';
  var stepHTML = renderStep(stepData.id);
  var navHTML = renderNav(s, vsNonResult.length);

  var riskHTML = (s>0 && stepData.id!=='result') ? riskMeterHTML() : '';

  appEl.innerHTML = '<div class="fm-wizard">'+
    dotsHTML + progressHTML + countHTML +
    '<div class="fm-step-body">'+titleHTML+whyHTML+stepHTML+riskHTML+navHTML+'</div>'+
    '</div>';

  bindEvents();
  if (s >= vsNonResult.length) { renderResult(); }
}

function renderStep(id) {
  switch(id) {
    case 'entity': return renderCards(FM.entityTypes.map(function(e){return{id:e.id,icon:e.icon,label:e.label,sub:e.desc,risk:e.risk};}), 'entity', false);
    case 'country': return renderCountrySearch();
    case 'us_state': return renderUSStates();
    case 'industry': return renderCards(FM.industries.map(function(i){return{id:i.id,label:i.label,risk:i.risk};}), 'industry', false);
    case 'staff': return renderCards(FM.staffBands.map(function(s){var icons={'1':'🧑','2-10':'👥','11-50':'👥👥','51-250':'🏢','251+':'🏢🏢'};return{id:s.id,icon:icons[s.id]||'👥',label:s.label,risk:s.risk};}), 'staff', false);
    case 'volume': return renderCards(FM.volumeBands.map(function(v){return{id:v.id,label:v.label,sub:'Tier: '+v.tier,risk:v.risk};}), 'volume', false);
    case 'payments': return renderMultiCards(FM.paymentNeeds, 'paymentNeeds');
    case 'risk': return renderRiskFlags();
    case 'result': return '<div id="fmResultArea"></div>';
    default: return '';
  }
}

function renderCards(items, key, multi) {
  var h = '<div class="fm-cards">';
  var cur = multi ? (state[key]||[]) : state[key];
  items.forEach(function(item){
    var sel = multi ? (cur.indexOf(item.id)!==-1) : (cur===item.id);
    var riskBadge = item.risk>=2?' <small class="fm-risk-badge">High-risk</small>':item.risk===1?' <small class="fm-risk-badge fm-risk-badge--med">Medium</small>':'';
    h += '<button class="fm-card'+(sel?' selected':'')+'" data-id="'+item.id+'">'+
      (item.icon?'<span class="fm-card-icon">'+item.icon+'</span>':'')+
      '<span class="fm-card-title">'+item.label+riskBadge+'</span>'+
      (item.sub?'<span class="fm-card-sub">'+item.sub+'</span>':'')+
      (sel?'<span class="fm-card-check">✓</span>':'')+
      '</button>';
  });
  h += '</div>';
  return h;
}

function renderMultiCards(items, key) {
  var cur = state[key] || [];
  var h = '<p class="fm-hint">Select all you need</p><div class="fm-cards">';
  items.forEach(function(item){
    var sel = cur.indexOf(item.id)!==-1;
    h += '<button class="fm-card fm-multi'+(sel?' selected':'')+'" data-id="'+item.id+'">'+
      '<span class="fm-card-icon">'+item.icon+'</span>'+
      '<span class="fm-card-title">'+item.label+'</span>'+
      '<span class="fm-card-sub">'+item.desc+'</span>'+
      (sel?'<span class="fm-card-check">✓</span>':'')+
      '</button>';
  });
  h += '</div>';
  return h;
}

function renderCountrySearch() {
  var h = '<input type="text" class="fm-search" id="fmSearch" placeholder="Type your country…" autocomplete="off">';
  h += '<div class="fm-cards fm-cards--scroll" id="fmCountryList">';
  FM.countries.forEach(function(c){
    if (c.risk===3) return;
    h += '<button class="fm-card" data-search="'+c.name.toLowerCase()+' '+c.code.toLowerCase()+'" data-id="'+c.code+'">'+
      '<span class="fm-card-title">'+c.name+' <small>'+c.code+(c.eu?' · EU':'')+(c.us?' · US':'')+'</small></span>'+
      '<span class="fm-card-sub">Risk: '+['Low','Medium','High'][c.risk]+'</span>'+
      '</button>';
  });
  h += '</div>';
  return h;
}

function renderUSStates() {
  var h = '<p class="fm-hint">US accounts are currently available for <strong>Montana</strong> residents and businesses only.</p>';
  h += '<div class="fm-cards fm-cards--scroll">';
  US_STATES.forEach(function(s){
    var cls = 'fm-card' + (s.ok?'':' fm-card--no') + (state.usState===s.code?' selected':'');
    h += '<button class="'+cls+'" data-id="'+s.code+'">'+
      '<span class="fm-card-title">'+s.name+' <small>'+s.code+'</small></span>'+
      '<span class="fm-card-sub">'+(s.ok?'✅ Available':'❌ Not available')+'</span></button>';
  });
  h += '</div>';
  return h;
}

function renderRiskFlags() {
  var h = '<p class="fm-hint">Select all that apply. These may trigger a <strong>+50% surcharge</strong>.</p><div class="fm-cards">';
  FM.highRiskFlags.forEach(function(rf){
    var sel = state.highRiskFlags.indexOf(rf.id)!==-1;
    h += '<button class="fm-card fm-multi fm-risk'+(sel?' selected':'')+'" data-id="'+rf.id+'">'+
      '<span class="fm-card-title">'+rf.label+(rf.surcharge?' <small>+50%</small>':'')+'</span>'+
      (sel?'<span class="fm-card-check">✓</span>':'')+'</button>';
  });
  h += '<button class="fm-card fm-multi'+(state.highRiskFlags.length===0?' selected':'')+'" data-id="__clear__" style="border-color:#157A30">'+
    '<span class="fm-card-title">✅ None of the above</span></button>';
  h += '</div>';
  return h;
}

function renderNav(current, total) {
  var h = '<div class="fm-nav">';
  if (current>0) h += '<button class="btn btn-secondary" id="fmPrevBtn">← Back</button>';
  else h += '<span></span>';
  if (current<total) h += '<button class="btn btn-lime" id="fmNextBtn">Next →</button>';
  h += '</div>';
  return h;
}

// ── Result dashboard ──────────────────────────────────────────
function renderResult() {
  var el = document.getElementById('fmResultArea');
  if (!el) return;

  var country = FM.countries.find(function(c){return c.code===state.country;});
  var industry = FM.industries.find(function(i){return i.id===state.industry;});
  var volume = FM.volumeBands.find(function(v){return v.id===state.volume;});
  var entity = FM.entityTypes.find(function(e){return e.id===state.entityType;});
  if (!country) { el.innerHTML=''; return; }

  var cr=country.risk||0, ir=industry?industry.risk:0, er=entity?entity.risk:0, vr=volume?volume.risk:0;
  var totalRisk = Math.max(cr,ir,er,vr,state.highRiskFlags.length>0?2:0);
  var riskLabel = totalRisk>=2?'High':totalRisk>=1?'Medium':'Low';
  var riskColor = totalRisk>=2?'#E02020':totalRisk>=1?'#E67E22':'#157A30';

  var excluded = cr>=3;
  var usRestricted = country&&country.us&&(!state.usState||state.usState!=='MT');
  var euIndividual = country&&country.eu&&state.entityType==='individual';
  var canOpen = !excluded && !usRestricted && !euIndividual;

  var hasSurcharge = state.highRiskFlags.some(function(f){
    var hf=FM.highRiskFlags.find(function(h){return h.id===f;});
    return hf&&hf.surcharge;
  });

  // Docs
  var docs = [];
  if (FM.docRequirements[state.entityType]) docs=docs.concat(FM.docRequirements[state.entityType]);
  if (totalRisk>=2 && FM.docRequirements.high_risk_extra) docs=docs.concat(FM.docRequirements.high_risk_extra);
  if (state.paymentNeeds.indexOf('crypto_in')!==-1||state.paymentNeeds.indexOf('crypto_out')!==-1) {
    if (FM.docRequirements.crypto_extra) docs=docs.concat(FM.docRequirements.crypto_extra);
  }

  var tier = volume?volume.tier:'Melody';
  if (hasSurcharge) tier+=' + 50% surcharge';

  // Save to sessionStorage for Open Account pre-fill
  try {
    sessionStorage.setItem('paype_forme', JSON.stringify({
      entityType: state.entityType,
      country: state.country,
      usState: state.usState,
      industry: state.industry,
      staffSize: state.staffSize,
      volume: state.volume,
      paymentNeeds: state.paymentNeeds,
      highRiskFlags: state.highRiskFlags,
      riskLabel: riskLabel,
      tier: tier,
      canOpen: canOpen,
      ts: Date.now()
    }));
  } catch(e){}

  var h = '<div class="fm-result-dashboard" style="animation:fmFadeUp 0.5s ease">';

  // Verdict card
  h += '<div class="fm-result-card" style="border-left:6px solid '+(canOpen?'#157A30':'#E02020')+'">';
  if (canOpen) {
    h += '<div class="fm-result-icon">✅</div>';
    h += '<h2 class="fm-result-verdict" style="color:#157A30">You can open an account.</h2>';
    h += '<p style="font-size:1.15rem;color:var(--color-text-secondary);margin-bottom:0">Everything checks out. Your answers will pre-fill the account opening flow — no typing things twice.</p>';
  } else {
    var reason = excluded?'Your country is currently not eligible.':
                 usRestricted?'US accounts are only available to Montana residents and businesses.':
                 euIndividual?'Personal accounts in the EU are coming soon. Companies can open today.':
                 'Not eligible at this time.';
    h += '<div class="fm-result-icon">⏳</div>';
    h += '<h2 class="fm-result-verdict" style="color:#E02020">Not yet available.</h2>';
    h += '<p style="font-size:1.15rem;color:var(--color-text-secondary);margin-bottom:0">'+reason+'</p>';
  }
  h += '</div>';

  // Stats row
  h += '<div class="fm-stats-row">';
  h += '<div class="fm-stat"><span class="fm-stat-val" style="color:'+riskColor+'">'+riskLabel+'</span><span class="fm-stat-label">Risk tier</span></div>';
  h += '<div class="fm-stat"><span class="fm-stat-val">'+tier.replace(' + ','<br>+ ')+'</span><span class="fm-stat-label">Pricing tier</span></div>';
  h += '<div class="fm-stat"><span class="fm-stat-val" style="color:#157A30">Free</span><span class="fm-stat-label">Monthly fee</span></div>';
  h += '<div class="fm-stat"><span class="fm-stat-val">'+(docs.length)+'</span><span class="fm-stat-label">Documents needed</span></div>';
  h += '</div>';

  // Summary
  h += '<div class="fm-summary-grid">';
  h += sumRow('Entity', entity?entity.label:'—');
  h += sumRow('Country', country?country.name+' ('+country.code+')':'—');
  if (state.usState) h += sumRow('US State', state.usState+' — '+(state.usState==='MT'?'✅':'❌'));
  h += sumRow('Industry', industry?industry.label:'—');
  h += sumRow('Volume', volume?volume.label:'—');
  if (hasSurcharge) h += sumRow('Surcharge','<span style="color:#E02020">+50% on all fees</span>');
  if (state.paymentNeeds.length) h += sumRow('Capabilities', state.paymentNeeds.map(function(n){var p=FM.paymentNeeds.find(function(pn){return pn.id===n});return p?p.label:n;}).join(', '));
  if (state.highRiskFlags.length) h += sumRow('Flags', state.highRiskFlags.map(function(f){var hf=FM.highRiskFlags.find(function(h){return h.id===f});return hf?hf.label:f;}).join(', '));
  h += '</div>';

  // Docs
  if (docs.length) {
    h += '<h3 style="text-align:left;margin-top:28px">📄 Documents you\'ll need</h3>';
    h += '<div class="fm-doc-list">';
    docs.forEach(function(d,i){
      h += '<div class="fm-doc-item" style="animation:fmFadeUp 0.4s ease '+(i*0.08)+'s both">'+
        '<span class="fm-doc-num">'+(i+1)+'</span>'+
        '<div><strong>'+d.doc+'</strong><span>'+d.why+'</span></div></div>';
    });
    h += '</div>';
  }

  // CTA — passes state to Open Account
  if (canOpen) {
    h += '<div style="margin-top:32px;text-align:center">'+
      '<a href="https://pay.paype.cc" class="btn btn-lime btn-lg" style="font-size:1.2rem;padding:20px 48px" data-open-account>Open your account — free</a>'+
      '<p style="margin-top:12px;font-size:0.9rem;color:var(--color-text-secondary)">Your answers are saved — the account opening flow will skip what you\'ve already told us.</p>'+
      '</div>';
  } else {
    h += '<div style="margin-top:32px;text-align:center">'+
      '<a href="/company/contact/" class="btn btn-primary btn-lg">Contact us for options</a>'+
      '</div>';
  }

  // Restart
  h += '<div style="margin-top:24px;text-align:center"><button class="btn btn-secondary" id="fmRestartBtn">↻ Start over</button></div>';

  h += '</div>';
  el.innerHTML = h;

  // Restart button
  var restartBtn = document.getElementById('fmRestartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click',function(){
      state.step=0; state.entityType=null; state.country=null; state.industry=null;
      state.staffSize=null; state.volume=null; state.paymentNeeds=[];
      state.highRiskFlags=[]; state.usState=null;
      try{sessionStorage.removeItem('paype_forme');}catch(e){}
      render(); window.scrollTo(0,0);
    });
  }
}

function sumRow(label, value) {
  return '<div class="fm-sum-row"><span class="fm-label">'+label+'</span><span class="fm-val">'+value+'</span></div>';
}

// ── Event binding ─────────────────────────────────────────────
function bindEvents() {
  // Country search
  var search = document.getElementById('fmSearch');
  if (search) {
    search.addEventListener('input', function(){
      var q=this.value.toLowerCase();
      document.querySelectorAll('#fmCountryList .fm-card').forEach(function(c){
        c.style.display = (c.getAttribute('data-search')||'').indexOf(q)!==-1?'':'none';
      });
    });
  }

  // Card clicks — delegate from container
  document.querySelectorAll('.fm-cards').forEach(function(container){
    container.addEventListener('click', function(e){
      var card = e.target.closest('.fm-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      if (!id) return;

      var stepId = steps.filter(function(st){return !st.cond||st.cond();})[state.step].id;

      if (id === '__clear__') { state.highRiskFlags=[]; render(); return; }

      if (stepId==='entity') { state.entityType=id; render(); }
      else if (stepId==='country') { state.country=id; render(); }
      else if (stepId==='us_state') { state.usState=id; render(); }
      else if (stepId==='industry') { state.industry=id; render(); }
      else if (stepId==='staff') { state.staffSize=id; render(); }
      else if (stepId==='volume') { state.volume=id; render(); }
      else if (stepId==='payments') toggleMulti('paymentNeeds',id);
      else if (stepId==='risk') toggleMulti('highRiskFlags',id);
    });
  });

  // Nav buttons
  var nextBtn = document.getElementById('fmNextBtn');
  var prevBtn = document.getElementById('fmPrevBtn');
  if (nextBtn) nextBtn.addEventListener('click', nextStep);
  if (prevBtn) prevBtn.addEventListener('click', function(){ if(state.step>0){state.step--;render();window.scrollTo(0,0);} });

  // Keyboard: Enter on search → select first visible
  if (search) {
    search.addEventListener('keydown',function(e){
      if (e.key==='Enter') {
        var first = document.querySelector('#fmCountryList .fm-card:not([style*="display: none"])');
        if (first) first.click();
      }
    });
  }
}

function toggleMulti(key, id) {
  var arr = state[key];
  var idx = arr.indexOf(id);
  if (idx===-1) arr.push(id); else arr.splice(idx,1);
  render();
}

function nextStep() {
  var visibleSteps = steps.filter(function(st){return !st.cond||st.cond();});
  var sid = visibleSteps[state.step].id;
  var ok = true;
  if (sid==='entity' && !state.entityType) ok=false;
  if (sid==='country' && !state.country) ok=false;
  if (sid==='us_state' && !state.usState) ok=false;
  if (sid==='industry' && !state.industry) ok=false;
  if (sid==='staff' && !state.staffSize) ok=false;
  if (sid==='volume' && !state.volume) ok=false;
  if (!ok) { var nextBtn=document.getElementById('fmNextBtn'); if(nextBtn){nextBtn.style.animation='none';nextBtn.offsetHeight;nextBtn.style.animation='fmShake 0.4s ease';} return; }
  state.step++;
  if (state.step>=visibleSteps.length-1) state.step=visibleSteps.length-1;
  render();
  window.scrollTo(0,0);
}

// ── Init ──────────────────────────────────────────────────────
render();
})();
