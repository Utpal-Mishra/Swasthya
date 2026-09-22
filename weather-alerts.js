/* Official severe-weather warning extension.
   Loaded after app.js/proximity-health.js. Weather forecasts remain modelled;
   this layer is reserved for official warnings and keeps their real geography. */

state.weatherWarningsData={generated_at:null,country_status:{},items:[]};
state.pointWeatherWarnings=[];

const WEATHER_SEVERITY_WEIGHT={unknown:0,low:1,moderate:2,severe:3,extreme:4};

function warningAction(item){
  const hazard=String(item.hazard||item.event||item.title||'').toLowerCase();
  if(hazard.includes('flood'))return 'Avoid flooded routes and follow the issuing authority’s instructions. Never enter flood water to save travel time.';
  if(hazard.includes('thunder'))return 'Limit exposed outdoor activity while the warning applies and follow local lightning/thunderstorm guidance.';
  if(hazard.includes('wind'))return 'Avoid unnecessarily exposed routes and check transport/local-authority guidance before travel.';
  if(hazard.includes('snow')||hazard.includes('ice'))return 'Allow extra travel time, use appropriate footwear and check road/transport conditions.';
  if(hazard.includes('heat')||hazard.includes('high temperature'))return 'Reduce prolonged heat exposure, hydrate regularly and follow the issuing health/weather authority’s advice.';
  if(hazard.includes('cold')||hazard.includes('low temperature'))return 'Limit prolonged cold exposure and check on people who may be vulnerable to cold conditions.';
  return 'Open the official warning, check whether its published warning area covers your location and follow the issuing authority’s advice.';
}

function normalisedWarningText(item){return normaliseGeo(`${item.title||''} ${item.summary||''} ${item.area||''}`);}
function warningGeoMatch(item){
  if(item.point_match)return 5;
  if(item.country_code!==state.countryCode)return 0;
  const text=normalisedWarningText(item);
  const county=normaliseGeo(state.county);
  const subdivision=normaliseGeo(state.subdivision);
  if(county&&county.length>=4&&text.includes(county))return 4;
  if(subdivision&&subdivision.length>=4&&text.includes(subdivision))return 3;
  return 1; // Country-feed relevance only; not enough to claim the user is inside the warning.
}

function currentWeatherWarnings(){
  const cached=(state.weatherWarningsData?.items||[]).filter(x=>x.country_code===state.countryCode);
  return [...state.pointWeatherWarnings,...cached]
    .filter((item,index,array)=>array.findIndex(x=>x.id===item.id)===index)
    .sort((a,b)=>(warningGeoMatch(b)-warningGeoMatch(a))||((WEATHER_SEVERITY_WEIGHT[b.severity]||0)-(WEATHER_SEVERITY_WEIGHT[a.severity]||0)));
}

function locallyRelevantWeatherWarning(){
  return currentWeatherWarnings().find(item=>warningGeoMatch(item)>=3&&WEATHER_SEVERITY_WEIGHT[item.severity]>=2)||null;
}

async function loadWeatherWarningCache(){
  try{
    const r=await fetch(`data/weather-alerts.json?ts=${Date.now()}`);
    if(!r.ok)throw new Error('Weather-warning cache unavailable');
    state.weatherWarningsData=await r.json();
  }catch(_){state.weatherWarningsData={generated_at:null,country_status:{},items:[]};}
}

async function loadNwsPointWarnings(){
  state.pointWeatherWarnings=[];
  if(state.countryCode!=='US'||!state.coords)return;
  try{
    const {latitude,longitude}=state.coords;
    const r=await fetch(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`,{headers:{Accept:'application/geo+json'}});
    if(!r.ok)throw new Error('NWS alert service unavailable');
    const payload=await r.json();
    state.pointWeatherWarnings=(payload.features||[]).map(feature=>{
      const p=feature.properties||{};
      const raw=String(p.severity||'').toLowerCase();
      const severity=raw==='extreme'?'extreme':raw==='severe'?'severe':raw==='moderate'?'moderate':'low';
      return {id:`nws-${p.id||feature.id||p.event||Math.random()}`,source:'US National Weather Service',source_kind:'official_weather_warning',country_code:'US',title:p.headline||p.event||'Official weather alert',hazard:p.event||'Weather warning',severity,updated_at:p.sent||p.effective||new Date().toISOString(),url:p['@id']||p.uri||'https://www.weather.gov/',summary:p.description||p.instruction||p.headline||'',area:p.areaDesc||'',geographic_precision:'NWS active alert returned for the current coordinate',point_match:true};
    });
  }catch(_){state.pointWeatherWarnings=[];}
}

function renderWeatherWarnings(){
  const grid=document.querySelector('#weatherWarningGrid'),meta=document.querySelector('#weatherWarningMeta');
  if(!grid||!meta)return;
  const all=currentWeatherWarnings(),status=state.weatherWarningsData?.country_status?.[state.countryCode];
  meta.textContent=state.countryCode?`${state.countryName||state.countryCode} · official warning layer`:'Country not resolved';
  if(!all.length){
    const checked=status?.ok?'The connected country feed currently contains no active warnings.':'No location-matched official warning is available from the connected warning sources.';
    grid.innerHTML=`<div class="all-clear"><strong>No active official warning shown.</strong><span>${safeText(checked)} This does not replace the national meteorological service.</span></div>`;
    return;
  }
  grid.innerHTML=all.slice(0,8).map(item=>{
    const match=warningGeoMatch(item),matchLabel=match>=5?'Current coordinate':match>=4?'County text match':match>=3?'Regional text match':'Country feed only';
    return `<article class="weather-warning-card warning-${safeText(item.severity||'unknown')}"><div class="weather-warning-top"><span>${safeText(item.source||'Official weather service')}</span><small>${safeText(String(item.severity||'unknown').toUpperCase())}</small></div><h3>${safeText(item.title||item.hazard||'Weather warning')}</h3><p>${safeText((item.summary||'Open the source for warning details.').slice(0,650))}</p><div class="warning-match"><strong>Location relevance</strong><span>${safeText(matchLabel)}</span></div><div class="health-precision"><strong>Geographic precision</strong><span>${safeText(item.geographic_precision||'Source-defined warning area')}</span></div><p class="action"><strong>Practical action:</strong> ${safeText(warningAction(item))}</p><a class="source-link" href="${item.url}" target="_blank" rel="noopener">Open official warning ↗</a></article>`;
  }).join('');
}

function maybeNotifyOfficialWeather(){
  if(!els.notificationToggle?.checked||!('Notification' in window)||Notification.permission!=='granted')return;
  const item=locallyRelevantWeatherWarning();
  if(!item||WEATHER_SEVERITY_WEIGHT[item.severity]<3)return;
  const key=`swasthyaWeather:${state.countryCode}:${item.id}`;
  const fingerprint=`${item.severity}:${item.updated_at||item.title}`;
  if(localStorage.getItem(key)===fingerprint)return;
  new Notification(`Swasthya: ${item.hazard||'official weather warning'}`,{body:warningAction(item),tag:`swasthya-weather-${item.id}`});
  localStorage.setItem(key,fingerprint);
}

const baseDeriveContextForWeather=deriveContext;
deriveContext=function(){
  const c=baseDeriveContextForWeather();
  const warning=locallyRelevantWeatherWarning();
  if(!warning)return c;
  const warningLevel=WEATHER_SEVERITY_WEIGHT[warning.severity]>=3?'high':'moderate';
  const existingWeight={critical:4,high:3,moderate:2,low:1,unknown:0}[c.overall]||0;
  const warningWeight={high:3,moderate:2}[warningLevel];
  if(warningWeight>=existingWeight){
    c.top={key:`official-weather-${warning.id}`,level:warningLevel,title:warning.hazard||'Official weather warning',kind:'official-weather'};
    c.overall=warningLevel;
    c.title=warning.title||warning.hazard||'Official weather warning';
    c.summary=`An official ${warning.severity||''} weather warning is relevant to your resolved area. This warning outranks the modelled forecast in Swasthya’s current context.`;
    c.action=warningAction(warning);
  }
  return c;
};

async function refreshOfficialWeatherWarnings(){
  await loadNwsPointWarnings();
  renderWeatherWarnings();
  try{const c=renderContext();renderVicinity(c);renderAlerts(c);}catch(_){/* app refresh may still be completing */}
  maybeNotifyOfficialWeather();
  const count=currentWeatherWarnings().filter(x=>warningGeoMatch(x)>=3).length;
  if(els.signalMetric&&count){const base=Number(els.signalMetric.textContent)||0;els.signalMetric.textContent=base+count;}
}

const baseRefreshAtForWarnings=refreshAt;
refreshAt=async function(...args){
  await baseRefreshAtForWarnings(...args);
  await refreshOfficialWeatherWarnings();
};

loadWeatherWarningCache().then(refreshOfficialWeatherWarnings);
