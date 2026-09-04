const els={
  location:document.querySelector('#location'),radius:document.querySelector('#radius'),radiusValue:document.querySelector('#radiusValue'),radiusMetric:document.querySelector('#radiusMetric'),areaMetric:document.querySelector('#areaMetric'),signalMetric:document.querySelector('#signalMetric'),checkedMetric:document.querySelector('#checkedMetric'),locationStatus:document.querySelector('#locationStatus'),locateButton:document.querySelector('#locateButton'),liveToggle:document.querySelector('#liveToggle'),notificationToggle:document.querySelector('#notificationToggle'),notificationStatus:document.querySelector('#notificationStatus'),contextTitle:document.querySelector('#contextTitle'),contextSummary:document.querySelector('#contextSummary'),contextBadge:document.querySelector('#contextBadge'),contextFacts:document.querySelector('#contextFacts'),contextAction:document.querySelector('#contextAction'),contextProvenance:document.querySelector('#contextProvenance'),vicinityGrid:document.querySelector('#vicinityGrid'),alertGrid:document.querySelector('#alertGrid'),proximityBadge:document.querySelector('#proximityBadge'),supportLink:document.querySelector('#supportLink'),pharmacyLink:document.querySelector('#pharmacyLink'),healthcareLink:document.querySelector('#healthcareLink'),essentialsLink:document.querySelector('#essentialsLink'),indoorLink:document.querySelector('#indoorLink'),publicHealthGrid:document.querySelector('#publicHealthGrid'),publicHealthMeta:document.querySelector('#publicHealthMeta'),emergencyHeading:document.querySelector('#emergencyHeading'),emergencyIntro:document.querySelector('#emergencyIntro'),emergencyNumbers:document.querySelector('#emergencyNumbers'),emergencyAuthorityName:document.querySelector('#emergencyAuthorityName'),emergencyAuthorityLink:document.querySelector('#emergencyAuthorityLink')
};

let state={coords:null,watchId:null,lastCell:null,place:'Cork, Ireland',countryCode:'IE',countryName:'Ireland',subdivision:'County Cork',county:'County Cork',weather:null,air:null,loading:false,lastError:null,publicHealthData:null,usWastewaterData:null,providerRegistry:null};

const WEATHER_URL='https://api.open-meteo.com/v1/forecast';
const AIR_URL='https://air-quality-api.open-meteo.com/v1/air-quality';
const GEO_URL='https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL='https://api.bigdatacloud.net/data/reverse-geocode-client';
const EEA=new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE']);

function safeText(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmtTime(date=new Date()){return new Intl.DateTimeFormat([], {hour:'2-digit',minute:'2-digit'}).format(date);}
function fmtDate(value){if(!value)return 'Unknown';const d=new Date(value);if(Number.isNaN(d.getTime()))return 'Unknown';return new Intl.DateTimeFormat([], {day:'numeric',month:'short',year:'numeric'}).format(d);}
function ageDays(value){const d=new Date(value);if(Number.isNaN(d.getTime()))return Infinity;return Math.max(0,(Date.now()-d.getTime())/86400000);}
function normaliseGeo(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g,' ').replace(/\b(county|co|ireland|republic|city|borough|parish)\b/g,' ').replace(/\s+/g,' ').trim();}
function mapsSearch(query){if(state.coords)return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${state.coords.latitude},${state.coords.longitude},14z`;return `https://www.google.com/maps/search/${encodeURIComponent(query+' near '+(state.place||state.countryName||''))}`;}
function updateNearbyLinks(){els.supportLink.href=mapsSearch('pharmacy health centre');els.pharmacyLink.href=mapsSearch('pharmacy');els.healthcareLink.href=mapsSearch('health centre urgent care');els.essentialsLink.href=mapsSearch('grocery water');els.indoorLink.href=mapsSearch('indoor public places');}
function coarseCell(coords){return `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;}

function weatherLabel(code,isDay){const day=isDay===1;const map={0:day?'Clear':'Clear night',1:day?'Mostly clear':'Mostly clear night',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Heavy freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Heavy freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Severe thunderstorm with hail'};return map[code]||'Current conditions';}
function weatherIcon(code,isDay){if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return '🌧';if([71,73,75,77,85,86].includes(code))return '❄️';if([95,96,99].includes(code))return '⛈';if([45,48].includes(code))return '🌫';if(code===0)return isDay===1?'☀️':'🌙';if([1,2].includes(code))return isDay===1?'🌤':'☁️';return '☁️';}
function airBand(aqi){if(aqi==null||Number.isNaN(aqi))return {label:'Unavailable',level:'unknown'};if(aqi<=20)return {label:'Good',level:'low'};if(aqi<=40)return {label:'Fair',level:'low'};if(aqi<=60)return {label:'Moderate',level:'moderate'};if(aqi<=80)return {label:'Poor',level:'high'};if(aqi<=100)return {label:'Very poor',level:'high'};return {label:'Extremely poor',level:'critical'};}
function hourIndex(times,target){if(!times?.length)return -1;const targetHour=target.slice(0,13);let idx=times.findIndex(t=>t.slice(0,13)===targetHour);if(idx<0)idx=0;return idx;}

async function loadStaticIntelligence(){
  const [health,usWastewater,providers]=await Promise.allSettled([
    fetch(`data/public-health.json?ts=${Date.now()}`).then(r=>{if(!r.ok)throw new Error('Public-health cache unavailable');return r.json();}),
    fetch(`data/us-wastewater.json?ts=${Date.now()}`).then(r=>{if(!r.ok)throw new Error('US wastewater cache unavailable');return r.json();}),
    fetch('data/country-health-providers.json').then(r=>{if(!r.ok)throw new Error('Country provider registry unavailable');return r.json();})
  ]);
  state.publicHealthData=health.status==='fulfilled'?health.value:{generated_at:null,items:[]};
  state.usWastewaterData=usWastewater.status==='fulfilled'?usWastewater.value:{generated_at:null,items:[]};
  state.providerRegistry=providers.status==='fulfilled'?providers.value:{default:{authority_name:'WHO',authority_url:'https://www.who.int/emergencies/disease-outbreak-news',regional_sources:['WHO']}};
}

async function geocodePlace(place){
  const url=`${GEO_URL}?name=${encodeURIComponent(place)}&count=1&language=en&format=json`;
  const r=await fetch(url);if(!r.ok)throw new Error('Location search unavailable');const data=await r.json();if(!data.results?.length)throw new Error('Location not found');const hit=data.results[0];
  return {latitude:hit.latitude,longitude:hit.longitude,label:[hit.name,hit.admin2,hit.admin1,hit.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', '),countryCode:hit.country_code||null,countryName:hit.country||null,subdivision:hit.admin1||null,county:hit.admin2||null};
}

function countyFromReverse(data){
  const admin=data?.localityInfo?.administrative||[];
  const named=admin.find(a=>/county|borough|parish/i.test(`${a.name||''} ${a.description||''}`));
  if(named?.name)return named.name;
  const principal=normaliseGeo(data?.principalSubdivision);
  const candidates=admin.filter(a=>a?.name&&normaliseGeo(a.name)!==principal&&normaliseGeo(a.name)!==normaliseGeo(data?.countryName));
  return candidates.length?candidates[candidates.length-1].name:null;
}

async function reverseResolveLocation(coords){
  try{
    const params=new URLSearchParams({latitude:coords.latitude,longitude:coords.longitude,localityLanguage:'en'});
    const r=await fetch(`${REVERSE_URL}?${params}`);if(!r.ok)throw new Error('Reverse location unavailable');const data=await r.json();
    const locality=data.city||data.locality||data.principalSubdivision||'Nearby region';
    const county=countyFromReverse(data);
    return {label:[locality,county,data.principalSubdivision,data.countryName].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', '),countryCode:data.countryCode||null,countryName:data.countryName||null,subdivision:data.principalSubdivision||null,county};
  }catch(_){return {label:`Nearby region (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`,countryCode:null,countryName:null,subdivision:null,county:null};}
}

async function fetchLiveContext(coords){
  const {latitude,longitude}=coords;
  const weatherParams=new URLSearchParams({latitude,longitude,current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m',hourly:'uv_index,precipitation_probability',forecast_days:'1',timezone:'auto'});
  const airParams=new URLSearchParams({latitude,longitude,current:'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone',timezone:'auto'});
  const [wr,ar]=await Promise.allSettled([fetch(`${WEATHER_URL}?${weatherParams}`).then(r=>{if(!r.ok)throw new Error('Weather provider unavailable');return r.json();}),fetch(`${AIR_URL}?${airParams}`).then(r=>{if(!r.ok)throw new Error('Air-quality provider unavailable');return r.json();})]);
  state.weather=wr.status==='fulfilled'?wr.value:null;state.air=ar.status==='fulfilled'?ar.value:null;
  if(!state.weather&&!state.air)throw new Error('Live environmental providers are unavailable');
}

function countryProvider(){const registry=state.providerRegistry||{};return registry[state.countryCode]||registry.default||{authority_name:'WHO',authority_url:'https://www.who.int/emergencies/disease-outbreak-news',regional_sources:['WHO']};}
function hpscWastewaterRelevance(item){
  if(state.countryCode!=='IE'||item.source_kind!=='wastewater_surveillance')return 0;
  const county=normaliseGeo(item.county),userCounty=normaliseGeo(state.county||state.subdivision),place=normaliseGeo(state.place),catchment=normaliseGeo(item.catchment);
  if(catchment&&place&&place.includes(catchment))return 4;
  const catchmentCore=catchment.replace(/\b(north|lower|upper|regional|sewerage|scheme)\b/g,' ').replace(/\s+/g,' ').trim();
  if(catchmentCore.length>=4&&place.includes(catchmentCore))return 4;
  if(county&&userCounty&&(userCounty.includes(county)||county.includes(userCounty)))return 3;
  if(county&&place.includes(county))return 2;
  return 0;
}
function usWastewaterRelevance(item){
  if(state.countryCode!=='US'||item.source_kind!=='county_wastewater_surveillance')return 0;
  const userCounty=normaliseGeo(state.county),place=normaliseGeo(state.place),itemCounties=String(item.county_names||'').split(/[,;|]/).map(normaliseGeo).filter(Boolean),userState=normaliseGeo(state.subdivision),itemState=normaliseGeo(item.state);
  if(userCounty&&itemCounties.some(c=>c===userCounty||c.includes(userCounty)||userCounty.includes(c)))return 4;
  if(place&&itemCounties.some(c=>c.length>=4&&place.includes(c)))return 3;
  if(userState&&itemState&&(userState.includes(itemState)||itemState.includes(userState)))return 1;
  return 0;
}
function localRelevance(item){return Math.max(hpscWastewaterRelevance(item),usWastewaterRelevance(item));}
function localResultWeight(item){
  if(item.source_kind==='wastewater_surveillance'){const value=String(item.result_category||'').toLowerCase();if(value==='positive')return 4;if(value.includes('weak'))return 3;if(value.includes('undetect'))return 1;return 0;}
  if(item.source_kind==='county_wastewater_surveillance')return item.importance==='moderate'?3:1;
  return 0;
}
function localRelevanceLabel(item){const score=localRelevance(item);if(score>=4)return state.countryCode==='US'?'County/sewershed match':'Named catchment match';if(score===3)return 'Same county';if(score===2)return 'County context';if(score===1)return 'State/regional context';return 'National surveillance';}

function allHealthItems(){return [...(state.publicHealthData?.items||[]),...(state.usWastewaterData?.items||[])];}
function publicHealthMatches(){
  const code=state.countryCode;const items=allHealthItems();if(!code)return {local:[],exact:[],national:[],regional:[],all:[]};
  const recent=items.filter(i=>ageDays(i.published_at)<=90);
  const exact=recent.filter(i=>(i.countries||[]).includes(code));
  const local=exact.filter(i=>['wastewater_surveillance','county_wastewater_surveillance'].includes(i.source_kind)&&localRelevance(i)>0).sort((a,b)=>localRelevance(b)-localRelevance(a)||localResultWeight(b)-localResultWeight(a)||new Date(b.published_at)-new Date(a.published_at));
  const national=exact.filter(i=>i.source_kind==='national_surveillance');
  const exactThreats=exact.filter(i=>!['national_surveillance','wastewater_surveillance','county_wastewater_surveillance'].includes(i.source_kind));
  const regional=recent.filter(i=>EEA.has(code)&&(i.regions||[]).includes('EU_EEA')&&!(i.countries||[]).includes(code));
  return {local,exact:exactThreats,national,regional,all:[...local,...exactThreats,...national,...regional]};
}

function localHealthSignal(item){
  if(item.source_kind==='wastewater_surveillance'){
    const result=String(item.result_category||'').toLowerCase();
    if(!['positive','weak positive'].includes(result))return null;
    return {key:`wastewater-${item.id}`,level:result==='positive'?'moderate':'low',title:`Wastewater surveillance · ${item.catchment}`,summary:`HPSC ${item.result_category} SARS-CoV-2 wastewater result matched your ${localRelevanceLabel(item).toLowerCase()} context. This is population surveillance, not evidence of a nearby patient or personal exposure.`,action:'Use this as local circulation context only. Open the HPSC report for interpretation and follow current health guidance if relevant to you.',query:'health centre pharmacy',source:item.source,url:item.url,kind:'local-public-health',publishedAt:item.published_at};
  }
  if(item.source_kind==='county_wastewater_surveillance'&&item.importance==='moderate'){
    return {key:`us-wastewater-${item.id}`,level:'moderate',title:`${item.pathogen} wastewater activity`,summary:`CDC NWSS has a recent ${item.pathogen} wastewater signal matched to your ${localRelevanceLabel(item).toLowerCase()} context. ${item.activity_summary||''} A wastewater site may serve only part of a county and this does not prove personal exposure.`,action:'Treat this as population-level circulation context. Use the CDC source and local health authority for interpretation; use personal symptoms or clinician advice for individual decisions.',query:'health centre pharmacy',source:item.source,url:item.url,kind:'local-public-health',publishedAt:item.published_at};
  }
  return null;
}

function publicHealthSignals(){
  const m=publicHealthMatches();
  const outbreakSignals=m.exact.slice(0,3).map(item=>({key:`health-${item.id}`,level:item.importance==='high'?'high':'moderate',title:item.title,summary:`Official ${item.source} public-health item matched ${state.countryName||'your country'}. Geographic precision: ${item.geographic_precision||'country/region'}.`,action:'Open the official source and follow local public-health guidance. This does not mean you were exposed to a nearby individual.',query:'health centre pharmacy',source:item.source,url:item.url,kind:'public-health',publishedAt:item.published_at}));
  const localSignals=m.local.slice(0,8).map(localHealthSignal).filter(Boolean).slice(0,3);
  return [...outbreakSignals,...localSignals];
}

function deriveContext(){
  const w=state.weather?.current||null,a=state.air?.current||null;const weatherTime=w?.time||null;const hIdx=state.weather?.hourly&&weatherTime?hourIndex(state.weather.hourly.time,weatherTime):-1;const uv=hIdx>=0?state.weather.hourly.uv_index?.[hIdx]:null;const precipProb=hIdx>=0?state.weather.hourly.precipitation_probability?.[hIdx]:null;const conditions=[];const air=airBand(a?.european_aqi);
  if(w){
    const raining=(w.rain||0)>0||(w.precipitation||0)>0||[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(w.weather_code);
    if(raining)conditions.push({key:'rain',level:(w.rain||w.precipitation||0)>=5?'high':'moderate',title:'Rain now',summary:`${weatherLabel(w.weather_code,w.is_day)} at your current location.`,action:'Allow extra travel time, use appropriate rain protection and take care on wet surfaces.',query:'indoor public places',kind:'environment'});
    if((w.apparent_temperature??w.temperature_2m)>=27)conditions.push({key:'heat',level:(w.apparent_temperature??w.temperature_2m)>=32?'high':'moderate',title:'Heat exposure',summary:`Feels like ${Math.round(w.apparent_temperature)}°C.`,action:'Hydrate regularly and reduce prolonged strenuous activity during the hottest period.',query:'water grocery indoor public places',kind:'environment'});
    if((w.apparent_temperature??w.temperature_2m)<=2)conditions.push({key:'cold',level:(w.apparent_temperature??w.temperature_2m)<=-2?'high':'moderate',title:'Cold exposure',summary:`Feels like ${Math.round(w.apparent_temperature)}°C.`,action:'Use warm layers and take extra care if surfaces may be icy.',query:'indoor public places',kind:'environment'});
    if((w.wind_speed_10m||0)>=50)conditions.push({key:'wind',level:(w.wind_speed_10m||0)>=70?'high':'moderate',title:'Strong wind',summary:`Wind around ${Math.round(w.wind_speed_10m)} km/h.`,action:'Take additional care outdoors and check official local warnings before exposed travel.',query:'indoor public places',kind:'environment'});
    if((uv||0)>=6)conditions.push({key:'uv',level:uv>=8?'high':'moderate',title:'UV exposure',summary:`UV index around ${Number(uv).toFixed(1)}.`,action:'Limit unprotected sun exposure and use appropriate sun protection.',query:'shade indoor public places',kind:'environment'});
  }
  if(a&&air.level!=='low'&&air.level!=='unknown')conditions.push({key:'air',level:air.level,title:'Air health',summary:`European AQI is ${Math.round(a.european_aqi)} (${air.label.toLowerCase()}).`,action:'If you are sensitive to air pollution, consider reducing prolonged outdoor exposure and check official local monitoring.',query:'indoor public places pharmacy',kind:'environment'});
  conditions.push(...publicHealthSignals());
  const priority={critical:4,high:3,moderate:2,low:1,unknown:0};conditions.sort((x,y)=>priority[y.level]-priority[x.level]);const top=conditions[0]||null;const overall=top?.level||'low';
  return {w,a,uv,precipProb,air,conditions,alerts:conditions,top,overall,title:top?top.title:'No major matched health signal detected',summary:top?top.summary:'Connected environmental and official public-health feeds do not currently produce a high-priority matched signal for this location.',action:top?top.action:'No specific action is suggested. Continue to follow local official health and weather advice.'};
}

function renderContext(){
  const c=deriveContext(),w=c.w;const m=publicHealthMatches();const icon=w?weatherIcon(w.weather_code,w.is_day):'◌';els.contextTitle.textContent=c.title;els.contextSummary.textContent=c.summary;els.contextBadge.textContent=state.loading?'UPDATING':state.lastError?'PARTIAL':'LIVE';els.contextBadge.className=`context-badge ${state.lastError?'warn':''}`;
  const weatherText=w?`${icon} ${weatherLabel(w.weather_code,w.is_day)} · ${Math.round(w.temperature_2m)}°C${w.apparent_temperature!=null?` · feels ${Math.round(w.apparent_temperature)}°C`:''}`:'Unavailable';
  const localElevated=m.local.filter(i=>localResultWeight(i)>=3).length;
  const diseaseText=localElevated?`${localElevated} local surveillance signal${localElevated===1?'':'s'}`:m.local.length?'Local surveillance updated':m.exact.length?`${m.exact.length} matched official notice${m.exact.length===1?'':'s'}`:m.national.length?'National surveillance updated':m.regional.length?'Regional monitoring available':'No recent matched item';
  els.contextFacts.innerHTML=`<div><span>Weather</span><strong>${safeText(weatherText)}</strong></div><div><span>Disease intelligence</span><strong>${safeText(diseaseText)}</strong></div><div><span>Main concern</span><strong>${safeText(c.top?.title||'None detected')}</strong></div><div><span>Updated</span><strong>${fmtTime()}</strong></div>`;
  els.contextAction.innerHTML=`<strong>Next action</strong><p>${safeText(c.action)}</p>`;if(c.top)els.supportLink.href=mapsSearch(c.top.query);
  const provider=countryProvider();const cacheTime=state.publicHealthData?.generated_at?fmtDate(state.publicHealthData.generated_at):'Unavailable';const usCache=state.usWastewaterData?.generated_at?fmtDate(state.usWastewaterData.generated_at):'Unavailable';
  const healthSources=`WHO${EEA.has(state.countryCode)?' + ECDC':''}${state.countryCode==='IE'?' + HPSC wastewater':''}${state.countryCode==='US'?' + CDC NWSS county wastewater':''}`;
  els.contextProvenance.innerHTML=`<div><span>Location</span><strong>${safeText(state.countryName||'Country unresolved')} · ${safeText(state.county||state.subdivision||'')}</strong></div><div><span>Weather</span><strong>${w?'Live modelled data · Open-Meteo':'Unavailable'}</strong></div><div><span>Public health</span><strong>Official cache · ${safeText(healthSources)} · global cache ${safeText(cacheTime)}${state.countryCode==='US'?` · CDC cache ${safeText(usCache)}`:''}</strong></div><div><span>National authority</span><strong><a href="${provider.authority_url}" target="_blank" rel="noopener">${safeText(provider.authority_name)}</a></strong></div>`;
  return c;
}

function statusCard(icon,title,status,detail,tone='neutral',link=''){const inner=`<article class="vicinity-card ${tone}"><div class="vicinity-icon">${icon}</div><div><span>${safeText(title)}</span><strong>${safeText(status)}</strong><small>${safeText(detail)}</small></div></article>`;return link?`<a class="vicinity-link" href="${link}" target="_blank" rel="noopener">${inner}</a>`:inner;}
function renderVicinity(c){
  const radius=Number(els.radius.value),m=publicHealthMatches(),provider=countryProvider();const airStatus=c.a?c.air.label:'Unavailable';const weatherStatus=c.top&&['rain','heat','cold','wind','uv'].includes(c.top.key)?c.top.title:'Low concern';
  let diseaseStatus='No recent matched item',diseaseDetail='Connected official feeds are not exhaustive.';let diseaseTone='good';
  if(m.local.length){const elevated=m.local.filter(i=>localResultWeight(i)>=3).length;diseaseStatus=elevated?'Local surveillance signal':'Local surveillance updated';diseaseDetail=`${m.local.length} population surveillance record${m.local.length===1?'':'s'} matched your county/catchment context. Your ${radius} km radius is not automatically the surveillance boundary.`;diseaseTone=elevated?'moderate':'good';}
  else if(m.exact.length){diseaseStatus='Official notice matched';diseaseDetail=`${m.exact.length} country-relevant outbreak/update item${m.exact.length===1?'':'s'}; not street-level exposure data.`;diseaseTone='moderate';}
  else if(m.national.length){diseaseStatus='Surveillance updated';diseaseDetail=`Latest ${provider.authority_name} surveillance publications are available.`;diseaseTone='good';}
  else if(m.regional.length){diseaseStatus='Regional monitoring';diseaseDetail='ECDC regional communicable-disease monitoring is available for this country.';diseaseTone='good';}
  els.vicinityGrid.innerHTML=[statusCard('🦠','Disease activity',diseaseStatus,diseaseDetail,diseaseTone,provider.authority_url),statusCard('🌦','Weather health',weatherStatus,c.w?`${weatherLabel(c.w.weather_code,c.w.is_day)} · live modelled context`:'Provider unavailable',c.top&&['rain','heat','cold','wind','uv'].includes(c.top.key)?c.top.level:'good'),statusCard('🌬','Air health',airStatus,c.a?`Supporting exposure detail · European AQI ${Math.round(c.a.european_aqi)}`:'Provider unavailable',c.air.level),statusCard('🌍','Country context',state.countryName||'Unknown',[state.county,state.subdivision].filter(Boolean).join(' · ')||'Automatic country detection from location.','good',provider.authority_url),statusCard('👥','Community signal','Not collected','No individual health status is collected or displayed.','unknown'),statusCard('🏥','Healthcare access','Search nearby',`Find healthcare within your selected ${radius} km context.`,'good',mapsSearch('health centre urgent care pharmacy'))].join('');els.proximityBadge.textContent=`${radius} km · ${state.countryName||'country unresolved'}`;
}

function localDetail(item){
  if(item.source_kind==='wastewater_surveillance')return `<div class="health-precision"><strong>Catchment result</strong><span>${safeText(item.result_category||'Unknown')} · ${safeText(localRelevanceLabel(item))} · sample ${safeText(fmtDate(item.sample_date))}</span></div>`;
  if(item.source_kind==='county_wastewater_surveillance')return `<div class="health-precision"><strong>County/sewershed context</strong><span>${safeText(item.activity_summary||'Recent surveillance record')} · ${safeText(localRelevanceLabel(item))}</span></div>`;
  return '';
}
function renderPublicHealth(){
  const m=publicHealthMatches();const items=m.all.slice(0,12);const provider=countryProvider();
  els.publicHealthMeta.textContent=state.countryCode?`${state.countryName||state.countryCode} · local → national → regional → WHO`:'Country not resolved';
  if(!items.length){els.publicHealthGrid.innerHTML=`<div class="all-clear"><strong>No recent location-matched item in connected official feeds.</strong><span>This does not mean there is no disease activity. Check ${safeText(provider.authority_name)} for the latest local surveillance.</span><a class="source-link" href="${provider.authority_url}" target="_blank" rel="noopener">Open national authority ↗</a></div>`;return;}
  els.publicHealthGrid.innerHTML=items.map(item=>{const local=['wastewater_surveillance','county_wastewater_surveillance'].includes(item.source_kind);return `<article class="public-health-card ${local?'local-health-card':''}"><div class="public-health-top"><span>${safeText(item.source)}${local?' · LOCAL SURVEILLANCE':''}</span><small>${safeText(fmtDate(item.published_at))}</small></div><h3>${safeText(item.title)}</h3><p>${safeText(item.summary||'Official surveillance update.')}</p>${localDetail(item)}<div class="health-precision"><strong>Geographic precision</strong><span>${safeText(item.geographic_precision||'Source-specific')}</span></div><a class="source-link" href="${item.url}" target="_blank" rel="noopener">Open official source ↗</a></article>`;}).join('');
}

function renderAlerts(c){
  els.alertGrid.innerHTML=c.alerts.length?c.alerts.map(a=>`<article class="alert-card ${a.level==='high'||a.level==='critical'?'high-alert-card':''}"><div class="alert-top"><span class="severity ${a.level==='critical'?'high':a.level}">${safeText(a.level)}</span><span class="label">${a.kind==='local-public-health'?'OFFICIAL LOCAL':a.kind==='public-health'?'OFFICIAL HEALTH':'LIVE · MODELLED'}</span></div><h3>${safeText(a.title)}</h3><p>${safeText(a.summary)}</p><p class="action"><strong>Do this now:</strong> ${safeText(a.action)}</p><div class="alert-actions"><a class="mini-action primary" href="${a.url||mapsSearch(a.query)}" target="_blank" rel="noopener">${a.kind?.includes('public-health')?'Official source':'Nearby option'} ↗</a><a class="mini-action" href="${mapsSearch('health centre pharmacy')}" target="_blank" rel="noopener">Nearby healthcare ↗</a></div><details class="alert-details"><summary>Why this is shown</summary><p>${a.kind==='local-public-health'?'Matched to your current county/catchment context from official population-level wastewater surveillance. It does not identify a patient, prove exposure, or mean your selected radius is the surveillance boundary.':a.kind==='public-health'?'Matched by country from an official public-health feed. It is not evidence of individual exposure or a nearby patient.':'Generated from current modelled environmental conditions at your selected location. This is a general-awareness rule, not a diagnosis or official warning.'}</p></details></article>`).join(''):'<div class="all-clear"><strong>No major matched health signal detected.</strong><span>Connected feeds can be incomplete; use the national authority for full surveillance.</span></div>';els.signalMetric.textContent=c.alerts.length;
}

function renderEmergency(){const provider=countryProvider();els.emergencyHeading.textContent=`Emergency and health support · ${state.countryName||'current country'}`;els.emergencyIntro.textContent='For an immediate threat to life or serious injury, use the verified local emergency number shown when available. Swasthya does not contact services on your behalf.';const numbers=provider.emergency_numbers||[];els.emergencyNumbers.innerHTML=numbers.length?numbers.map(n=>`<a href="tel:${safeText(n)}">Call ${safeText(n)}</a>`).join(''):'<span class="emergency-unverified">Local emergency number not verified in Swasthya. Check official local guidance.</span>';els.emergencyAuthorityName.textContent=provider.authority_name||'National health authority';els.emergencyAuthorityLink.href=provider.authority_url||'https://www.who.int/';}

function notificationFingerprint(c){return `${state.countryCode||'XX'}:${normaliseGeo(state.county||'')}:${c.overall}:${c.top?.key||'none'}`;}
function maybeNotify(c){if(!els.notificationToggle.checked||!("Notification" in window)||Notification.permission!=='granted')return;if(!c.top||!['high','critical'].includes(c.top.level))return;const fingerprint=notificationFingerprint(c),previous=localStorage.getItem('swasthyaLiveFingerprint');if(previous===fingerprint)return;new Notification(`Swasthya: ${c.top.title}`,{body:c.action,tag:'swasthya-live-context'});localStorage.setItem('swasthyaLiveFingerprint',fingerprint);}

async function applyLocationMeta(meta){if(meta.countryCode)state.countryCode=meta.countryCode.toUpperCase();if(meta.countryName)state.countryName=meta.countryName;if(meta.subdivision)state.subdivision=meta.subdivision;if(meta.county)state.county=meta.county;else if(meta.countryCode&&meta.countryCode.toUpperCase()!=='IE')state.county=null;if(meta.label){state.place=meta.label;els.location.value=meta.label;}}
async function refreshAt(coords,meta=null){
  state.loading=true;state.lastError=null;state.coords=coords;if(meta)await applyLocationMeta(meta);els.locationStatus.textContent='Updating weather, country and public-health context…';updateNearbyLinks();
  try{await fetchLiveContext(coords);}catch(err){state.lastError=err.message;}
  state.loading=false;els.checkedMetric.textContent=fmtTime();els.areaMetric.textContent=state.place||`Nearby region (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`;els.locationStatus.textContent=state.lastError?`Some live data is unavailable: ${state.lastError}`:`Updated for ${state.countryName||'current country'}${state.county?` · ${state.county}`:''}. Coordinates are sent to selected data providers for lookup but are not stored by this static Swasthya site.`;const c=renderContext();renderVicinity(c);renderPublicHealth();renderAlerts(c);renderEmergency();maybeNotify(c);updateNearbyLinks();
}

async function refreshFromPlace(){const place=els.location.value.trim();if(!place)return;els.locationStatus.textContent='Finding location…';try{const hit=await geocodePlace(place);await refreshAt({latitude:hit.latitude,longitude:hit.longitude},hit);}catch(err){els.locationStatus.textContent=err.message;}}
async function useBrowserLocation(){if(!navigator.geolocation){els.locationStatus.textContent='Location is not supported by this browser.';return;}els.locateButton.disabled=true;els.locationStatus.textContent='Requesting location permission…';navigator.geolocation.getCurrentPosition(async({coords})=>{const c={latitude:coords.latitude,longitude:coords.longitude};const meta=await reverseResolveLocation(c);await refreshAt(c,meta);els.locateButton.disabled=false;},()=>{els.locationStatus.textContent='Location permission was unavailable. Enter a town or city instead.';els.locateButton.disabled=false;},{enableHighAccuracy:false,timeout:10000,maximumAge:180000});}

function startLiveAwareness(){if(!navigator.geolocation){els.liveToggle.checked=false;els.locationStatus.textContent='Live location is not supported by this browser.';return;}localStorage.setItem('swasthyaLiveAwareness','on');els.locationStatus.textContent='Live Health Awareness enabled. Country, county and health context will refresh when your coarse location changes.';state.watchId=navigator.geolocation.watchPosition(async({coords})=>{const c={latitude:coords.latitude,longitude:coords.longitude},cell=coarseCell(c);if(cell===state.lastCell)return;state.lastCell=cell;const meta=await reverseResolveLocation(c);refreshAt(c,meta);},()=>{els.locationStatus.textContent='Live location permission was unavailable.';els.liveToggle.checked=false;localStorage.setItem('swasthyaLiveAwareness','off');},{enableHighAccuracy:false,timeout:12000,maximumAge:180000});}
function stopLiveAwareness(){if(state.watchId!=null)navigator.geolocation.clearWatch(state.watchId);state.watchId=null;localStorage.setItem('swasthyaLiveAwareness','off');els.locationStatus.textContent='Live Health Awareness is off.';}
async function setNotifications(enabled){if(!enabled){localStorage.setItem('swasthyaNotifications','off');els.notificationStatus.textContent='Notifications are off.';return;}if(!('Notification' in window)){els.notificationToggle.checked=false;els.notificationStatus.textContent='This browser does not support website notifications.';return;}const permission=await Notification.requestPermission();if(permission==='granted'){localStorage.setItem('swasthyaNotifications','on');els.notificationStatus.textContent='Notifications are on for materially changed high-priority context.';if(state.weather||state.air)maybeNotify(deriveContext());}else{els.notificationToggle.checked=false;localStorage.setItem('swasthyaNotifications','off');els.notificationStatus.textContent='Notification permission was not granted.';}}

els.radius.addEventListener('input',()=>{els.radiusValue.textContent=els.radius.value;els.radiusMetric.textContent=`${els.radius.value} km`;if(state.weather||state.air){renderVicinity(deriveContext());renderPublicHealth();}});els.locateButton.addEventListener('click',useBrowserLocation);els.location.addEventListener('keydown',e=>{if(e.key==='Enter')refreshFromPlace();});els.location.addEventListener('change',refreshFromPlace);els.liveToggle.addEventListener('change',()=>els.liveToggle.checked?startLiveAwareness():stopLiveAwareness());els.notificationToggle.addEventListener('change',()=>setNotifications(els.notificationToggle.checked));

(async function init(){els.radiusValue.textContent=els.radius.value;els.radiusMetric.textContent=`${els.radius.value} km`;updateNearbyLinks();els.notificationToggle.checked=localStorage.getItem('swasthyaNotifications')==='on'&&('Notification' in window)&&Notification.permission==='granted';if(els.notificationToggle.checked)els.notificationStatus.textContent='Notifications are on for materially changed high-priority context.';await loadStaticIntelligence();renderEmergency();renderPublicHealth();renderVicinity(deriveContext());await refreshFromPlace();if(localStorage.getItem('swasthyaLiveAwareness')==='on'){els.liveToggle.checked=true;startLiveAwareness();}})();
