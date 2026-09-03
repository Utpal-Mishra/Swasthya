const els={
  location:document.querySelector('#location'),radius:document.querySelector('#radius'),radiusValue:document.querySelector('#radiusValue'),radiusMetric:document.querySelector('#radiusMetric'),areaMetric:document.querySelector('#areaMetric'),signalMetric:document.querySelector('#signalMetric'),checkedMetric:document.querySelector('#checkedMetric'),locationStatus:document.querySelector('#locationStatus'),locateButton:document.querySelector('#locateButton'),liveToggle:document.querySelector('#liveToggle'),notificationToggle:document.querySelector('#notificationToggle'),notificationStatus:document.querySelector('#notificationStatus'),contextTitle:document.querySelector('#contextTitle'),contextSummary:document.querySelector('#contextSummary'),contextBadge:document.querySelector('#contextBadge'),contextFacts:document.querySelector('#contextFacts'),contextAction:document.querySelector('#contextAction'),contextProvenance:document.querySelector('#contextProvenance'),vicinityGrid:document.querySelector('#vicinityGrid'),alertGrid:document.querySelector('#alertGrid'),proximityBadge:document.querySelector('#proximityBadge'),supportLink:document.querySelector('#supportLink'),pharmacyLink:document.querySelector('#pharmacyLink'),healthcareLink:document.querySelector('#healthcareLink'),essentialsLink:document.querySelector('#essentialsLink'),indoorLink:document.querySelector('#indoorLink')
};

let state={coords:null,watchId:null,lastCell:null,place:'Cork, Ireland',weather:null,air:null,loading:false,lastError:null};

const WEATHER_URL='https://api.open-meteo.com/v1/forecast';
const AIR_URL='https://air-quality-api.open-meteo.com/v1/air-quality';
const GEO_URL='https://geocoding-api.open-meteo.com/v1/search';

function safeText(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmtTime(date=new Date()){return new Intl.DateTimeFormat([], {hour:'2-digit',minute:'2-digit'}).format(date);}
function mapsSearch(query){if(state.coords)return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${state.coords.latitude},${state.coords.longitude},14z`;return `https://www.google.com/maps/search/${encodeURIComponent(query+' near '+(state.place||'Ireland'))}`;}
function updateNearbyLinks(){els.supportLink.href=mapsSearch('pharmacy health centre');els.pharmacyLink.href=mapsSearch('pharmacy');els.healthcareLink.href=mapsSearch('health centre urgent care');els.essentialsLink.href=mapsSearch('grocery water');els.indoorLink.href=mapsSearch('indoor public places');}
function coarseCell(coords){return `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;}

function weatherLabel(code,isDay){const day=isDay===1;const map={0:day?'Clear':'Clear night',1:day?'Mostly clear':'Mostly clear night',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Heavy freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Heavy freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Severe thunderstorm with hail'};return map[code]||'Current conditions';}
function weatherIcon(code,isDay){if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return '🌧';if([71,73,75,77,85,86].includes(code))return '❄️';if([95,96,99].includes(code))return '⛈';if([45,48].includes(code))return '🌫';if(code===0)return isDay===1?'☀️':'🌙';if([1,2].includes(code))return isDay===1?'🌤':'☁️';return '☁️';}
function airBand(aqi){if(aqi==null||Number.isNaN(aqi))return {label:'Unavailable',level:'unknown'};if(aqi<=20)return {label:'Good',level:'low'};if(aqi<=40)return {label:'Fair',level:'low'};if(aqi<=60)return {label:'Moderate',level:'moderate'};if(aqi<=80)return {label:'Poor',level:'high'};if(aqi<=100)return {label:'Very poor',level:'high'};return {label:'Extremely poor',level:'critical'};}
function hourIndex(times,target){if(!times?.length)return -1;const targetHour=target.slice(0,13);let idx=times.findIndex(t=>t.slice(0,13)===targetHour);if(idx<0)idx=0;return idx;}

async function geocodePlace(place){const url=`${GEO_URL}?name=${encodeURIComponent(place)}&count=1&language=en&format=json`;const r=await fetch(url);if(!r.ok)throw new Error('Location search unavailable');const data=await r.json();if(!data.results?.length)throw new Error('Location not found');const hit=data.results[0];return {latitude:hit.latitude,longitude:hit.longitude,label:[hit.name,hit.admin1,hit.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ')};}

async function fetchLiveContext(coords){
  const {latitude,longitude}=coords;
  const weatherParams=new URLSearchParams({latitude,longitude,current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m',hourly:'uv_index,precipitation_probability',forecast_days:'1',timezone:'auto'});
  const airParams=new URLSearchParams({latitude,longitude,current:'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone',timezone:'auto'});
  const [wr,ar]=await Promise.allSettled([fetch(`${WEATHER_URL}?${weatherParams}`).then(r=>{if(!r.ok)throw new Error('Weather provider unavailable');return r.json();}),fetch(`${AIR_URL}?${airParams}`).then(r=>{if(!r.ok)throw new Error('Air-quality provider unavailable');return r.json();})]);
  state.weather=wr.status==='fulfilled'?wr.value:null;
  state.air=ar.status==='fulfilled'?ar.value:null;
  if(!state.weather&&!state.air)throw new Error('Live environmental providers are unavailable');
}

function deriveContext(){
  const w=state.weather?.current||null,a=state.air?.current||null;
  const weatherTime=w?.time||null;
  const hIdx=state.weather?.hourly&&weatherTime?hourIndex(state.weather.hourly.time,weatherTime):-1;
  const uv=hIdx>=0?state.weather.hourly.uv_index?.[hIdx]:null;
  const precipProb=hIdx>=0?state.weather.hourly.precipitation_probability?.[hIdx]:null;
  const conditions=[];
  const alerts=[];
  const air=airBand(a?.european_aqi);

  if(w){
    const raining=(w.rain||0)>0||(w.precipitation||0)>0||[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(w.weather_code);
    if(raining)conditions.push({key:'rain',level:(w.rain||w.precipitation||0)>=5?'high':'moderate',title:'Rain now',summary:`${weatherLabel(w.weather_code,w.is_day)} at your current location.`,action:'Allow extra travel time, use appropriate rain protection and take care on wet surfaces.',query:'indoor public places'});
    if((w.apparent_temperature??w.temperature_2m)>=27)conditions.push({key:'heat',level:(w.apparent_temperature??w.temperature_2m)>=32?'high':'moderate',title:'Heat exposure',summary:`Feels like ${Math.round(w.apparent_temperature)}°C.`,action:'Hydrate regularly and reduce prolonged strenuous activity during the hottest period.',query:'water grocery indoor public places'});
    if((w.apparent_temperature??w.temperature_2m)<=2)conditions.push({key:'cold',level:(w.apparent_temperature??w.temperature_2m)<=-2?'high':'moderate',title:'Cold exposure',summary:`Feels like ${Math.round(w.apparent_temperature)}°C.`,action:'Use warm layers and take extra care if surfaces may be icy.',query:'indoor public places'});
    if((w.wind_speed_10m||0)>=50)conditions.push({key:'wind',level:(w.wind_speed_10m||0)>=70?'high':'moderate',title:'Strong wind',summary:`Wind around ${Math.round(w.wind_speed_10m)} km/h.`,action:'Take additional care outdoors and check official warnings before exposed travel.',query:'indoor public places'});
    if((uv||0)>=6)conditions.push({key:'uv',level:uv>=8?'high':'moderate',title:'UV exposure',summary:`UV index around ${Number(uv).toFixed(1)}.`,action:'Limit unprotected sun exposure and use appropriate sun protection.',query:'shade indoor public places'});
  }
  if(a&&air.level!=='low'&&air.level!=='unknown')conditions.push({key:'air',level:air.level,title:'Air health',summary:`European AQI is ${Math.round(a.european_aqi)} (${air.label.toLowerCase()}).`,action:'If you are sensitive to air pollution, consider reducing prolonged outdoor exposure and check official local monitoring.',query:'indoor public places pharmacy'});

  const priority={critical:4,high:3,moderate:2,low:1,unknown:0};conditions.sort((x,y)=>priority[y.level]-priority[x.level]);
  conditions.forEach(c=>alerts.push({...c,id:c.key,severity:c.level==='critical'?'high':c.level,source:'Live environmental context',confidence:'Modelled environmental data; verify important warnings with official Irish sources.'}));
  const top=conditions[0]||null;
  const overall=top?.level||'low';
  const title=top?top.title:'No major environmental health concern detected';
  const summary=top?top.summary:'Current weather and air signals do not cross Swasthya’s general awareness thresholds.';
  const action=top?top.action:'No specific environmental action is suggested. Continue to follow official local health and weather advice.';
  return {w,a,uv,precipProb,air,conditions,alerts,top,overall,title,summary,action};
}

function renderContext(){
  const c=deriveContext(),w=c.w,a=c.a;
  const icon=w?weatherIcon(w.weather_code,w.is_day):'◌';
  els.contextTitle.textContent=c.title;
  els.contextSummary.textContent=c.summary;
  els.contextBadge.textContent=state.loading?'UPDATING':state.lastError?'PARTIAL':'LIVE';
  els.contextBadge.className=`context-badge ${state.lastError?'warn':''}`;
  const weatherText=w?`${icon} ${weatherLabel(w.weather_code,w.is_day)} · ${Math.round(w.temperature_2m)}°C${w.apparent_temperature!=null?` · feels ${Math.round(w.apparent_temperature)}°C`:''}`:'Unavailable';
  const airText=a?`${c.air.label}${a.european_aqi!=null?` · AQI ${Math.round(a.european_aqi)}`:''}`:'Unavailable';
  els.contextFacts.innerHTML=`<div><span>Weather</span><strong>${safeText(weatherText)}</strong></div><div><span>Air health</span><strong>${safeText(airText)}</strong></div><div><span>Main concern</span><strong>${safeText(c.top?.title||'None detected')}</strong></div><div><span>Updated</span><strong>${fmtTime()}</strong></div>`;
  els.contextAction.innerHTML=`<strong>Next action</strong><p>${safeText(c.action)}</p>`;
  if(c.top)els.supportLink.href=mapsSearch(c.top.query);
  els.contextProvenance.innerHTML=`<div><span>Weather</span><strong>${w?'Live modelled data · Open-Meteo':'Unavailable'}</strong></div><div><span>Air</span><strong>${a?'Live modelled European AQI · Open-Meteo':'Unavailable'}</strong></div><div><span>Public health</span><strong>Official local disease feed not connected — no patient-level inference</strong></div><div><span>Official verification</span><strong><a href="https://www.met.ie/" target="_blank" rel="noopener">Met Éireann</a> · <a href="https://airquality.ie/" target="_blank" rel="noopener">EPA AirQuality.ie</a> · <a href="https://www.hpsc.ie/" target="_blank" rel="noopener">HPSC</a></strong></div>`;
  return c;
}

function statusCard(icon,title,status,detail,tone='neutral',link=''){const inner=`<article class="vicinity-card ${tone}"><div class="vicinity-icon">${icon}</div><div><span>${safeText(title)}</span><strong>${safeText(status)}</strong><small>${safeText(detail)}</small></div></article>`;return link?`<a class="vicinity-link" href="${link}" target="_blank" rel="noopener">${inner}</a>`:inner;}
function renderVicinity(c){
  const radius=Number(els.radius.value);
  const airStatus=c.a?c.air.label:'Unavailable';
  const weatherStatus=c.top&&['rain','heat','cold','wind','uv'].includes(c.top.key)?c.top.title:'Low concern';
  els.vicinityGrid.innerHTML=[
    statusCard('🦠','Disease activity','Unavailable','No trustworthy street-level disease feed connected. Check official surveillance.','unknown','https://www.hpsc.ie/'),
    statusCard('🌦','Weather health',weatherStatus,c.w?`${weatherLabel(c.w.weather_code,c.w.is_day)} · modelled live context`:'Provider unavailable',c.top&&['rain','heat','cold','wind','uv'].includes(c.top.key)?c.top.level:'good','https://www.met.ie/'),
    statusCard('🌬','Air health',airStatus,c.a?`European AQI ${Math.round(c.a.european_aqi)} · modelled`:'Provider unavailable',c.air.level,'https://airquality.ie/'),
    statusCard('💧','Environmental alerts','Not connected','Water and local incident feeds require official provider integration.','unknown'),
    statusCard('👥','Community signal','No data','No individual health status is collected or displayed.','unknown'),
    statusCard('🏥','Healthcare access','Search nearby',`Find healthcare within your selected ${radius} km context.`, 'good',mapsSearch('health centre urgent care pharmacy'))
  ].join('');
  els.proximityBadge.textContent=`${radius} km context`;
}

function renderAlerts(c){
  els.alertGrid.innerHTML=c.alerts.length?c.alerts.map(a=>`<article class="alert-card ${a.level==='high'||a.level==='critical'?'high-alert-card':''}"><div class="alert-top"><span class="severity ${a.level==='critical'?'high':a.level}">${safeText(a.level)}</span><span class="label">LIVE · MODELLED</span></div><h3>${safeText(a.title)}</h3><p>${safeText(a.summary)}</p><p class="action"><strong>Do this now:</strong> ${safeText(a.action)}</p><div class="alert-actions"><a class="mini-action primary" href="${mapsSearch(a.query)}" target="_blank" rel="noopener">Nearby option ↗</a><a class="mini-action" href="https://www.met.ie/" target="_blank" rel="noopener">Verify official advice ↗</a></div><details class="alert-details"><summary>Why this is shown</summary><p>Generated from current modelled environmental conditions at your selected location. This is a general-awareness rule, not a diagnosis or official warning.</p></details></article>`).join(''):'<div class="all-clear"><strong>No major environmental health signal detected.</strong><span>Disease and local public-health status remain unknown until trustworthy official feeds are connected.</span></div>';
  els.signalMetric.textContent=c.alerts.length;
}

function notificationFingerprint(c){return `${c.overall}:${c.top?.key||'none'}`;}
function maybeNotify(c){if(!els.notificationToggle.checked||!("Notification" in window)||Notification.permission!=='granted')return;if(!c.top||!['high','critical'].includes(c.top.level))return;const fingerprint=notificationFingerprint(c),previous=localStorage.getItem('swasthyaLiveFingerprint');if(previous===fingerprint)return;new Notification(`Swasthya: ${c.top.title}`,{body:c.action,tag:'swasthya-live-context'});localStorage.setItem('swasthyaLiveFingerprint',fingerprint);}

async function refreshAt(coords,label=null){
  state.loading=true;state.lastError=null;state.coords=coords;if(label){state.place=label;els.location.value=label;}els.locationStatus.textContent='Updating live health context…';updateNearbyLinks();
  try{await fetchLiveContext(coords);}catch(err){state.lastError=err.message;}
  state.loading=false;els.checkedMetric.textContent=fmtTime();els.areaMetric.textContent=state.place||`Nearby region (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`;els.locationStatus.textContent=state.lastError?`Some live data is unavailable: ${state.lastError}`:'Live environmental context updated. Exact coordinates remain in this browser session.';const c=renderContext();renderVicinity(c);renderAlerts(c);maybeNotify(c);updateNearbyLinks();
}

async function refreshFromPlace(){const place=els.location.value.trim();if(!place)return;els.locationStatus.textContent='Finding location…';try{const hit=await geocodePlace(place);state.place=hit.label;await refreshAt({latitude:hit.latitude,longitude:hit.longitude},hit.label);}catch(err){els.locationStatus.textContent=err.message;}}

function useBrowserLocation(){if(!navigator.geolocation){els.locationStatus.textContent='Location is not supported by this browser.';return;}els.locateButton.disabled=true;els.locationStatus.textContent='Requesting location permission…';navigator.geolocation.getCurrentPosition(async({coords})=>{const c={latitude:coords.latitude,longitude:coords.longitude};state.place=`Nearby region (${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)})`;await refreshAt(c,state.place);els.locateButton.disabled=false;},()=>{els.locationStatus.textContent='Location permission was unavailable. Enter a town or city instead.';els.locateButton.disabled=false;},{enableHighAccuracy:false,timeout:10000,maximumAge:180000});}

function startLiveAwareness(){if(!navigator.geolocation){els.liveToggle.checked=false;els.locationStatus.textContent='Live location is not supported by this browser.';return;}localStorage.setItem('swasthyaLiveAwareness','on');els.locationStatus.textContent='Live Health Awareness enabled. Updating only when coarse location changes.';state.watchId=navigator.geolocation.watchPosition(({coords})=>{const c={latitude:coords.latitude,longitude:coords.longitude},cell=coarseCell(c);if(cell===state.lastCell)return;state.lastCell=cell;state.place=`Nearby region (${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)})`;refreshAt(c,state.place);},()=>{els.locationStatus.textContent='Live location permission was unavailable.';els.liveToggle.checked=false;localStorage.setItem('swasthyaLiveAwareness','off');},{enableHighAccuracy:false,timeout:12000,maximumAge:180000});}
function stopLiveAwareness(){if(state.watchId!=null)navigator.geolocation.clearWatch(state.watchId);state.watchId=null;localStorage.setItem('swasthyaLiveAwareness','off');els.locationStatus.textContent='Live Health Awareness is off.';}

async function setNotifications(enabled){if(!enabled){localStorage.setItem('swasthyaNotifications','off');els.notificationStatus.textContent='Notifications are off.';return;}if(!('Notification' in window)){els.notificationToggle.checked=false;els.notificationStatus.textContent='This browser does not support website notifications.';return;}const permission=await Notification.requestPermission();if(permission==='granted'){localStorage.setItem('swasthyaNotifications','on');els.notificationStatus.textContent='Notifications are on for materially changed high-priority context.';if(state.weather||state.air)maybeNotify(deriveContext());}else{els.notificationToggle.checked=false;localStorage.setItem('swasthyaNotifications','off');els.notificationStatus.textContent='Notification permission was not granted.';}}

els.radius.addEventListener('input',()=>{els.radiusValue.textContent=els.radius.value;els.radiusMetric.textContent=`${els.radius.value} km`;if(state.weather||state.air)renderVicinity(deriveContext());});
els.locateButton.addEventListener('click',useBrowserLocation);
els.location.addEventListener('keydown',e=>{if(e.key==='Enter')refreshFromPlace();});
els.location.addEventListener('change',refreshFromPlace);
els.liveToggle.addEventListener('change',()=>els.liveToggle.checked?startLiveAwareness():stopLiveAwareness());
els.notificationToggle.addEventListener('change',()=>setNotifications(els.notificationToggle.checked));

els.radiusValue.textContent=els.radius.value;els.radiusMetric.textContent=`${els.radius.value} km`;updateNearbyLinks();
els.notificationToggle.checked=localStorage.getItem('swasthyaNotifications')==='on'&&('Notification' in window)&&Notification.permission==='granted';if(els.notificationToggle.checked)els.notificationStatus.textContent='Notifications are on for materially changed high-priority context.';
renderVicinity(deriveContext());
refreshFromPlace();
