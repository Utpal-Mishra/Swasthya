/* Fine-grained public-health proximity extensions.
   Loaded after app.js so it can extend the shared Swasthya state/functions. */

state.ieWastewaterData={generated_at:null,items:[]};

function haversineKm(a,b){
  if(!a||!b)return null;
  const toRad=x=>x*Math.PI/180;
  const R=6371;
  const dLat=toRad(b.latitude-a.latitude),dLon=toRad(b.longitude-a.longitude);
  const lat1=toRad(a.latitude),lat2=toRad(b.latitude);
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

function wastewaterDistanceKm(item){
  if(!state.coords||!Number.isFinite(Number(item.latitude))||!Number.isFinite(Number(item.longitude)))return null;
  return haversineKm(state.coords,{latitude:Number(item.latitude),longitude:Number(item.longitude)});
}

const baseAllHealthItems=allHealthItems;
allHealthItems=function(){
  return [...baseAllHealthItems(),...(state.ieWastewaterData?.items||[])];
};

const baseHpscWastewaterRelevance=hpscWastewaterRelevance;
hpscWastewaterRelevance=function(item){
  if(state.countryCode!=='IE'||item.source_kind!=='wastewater_surveillance')return 0;
  const distance=wastewaterDistanceKm(item);
  if(distance!=null&&item.coordinate_precision==='place geocoder'){
    return distance<=Number(els.radius.value)?5:0;
  }
  const place=normaliseGeo(state.place),catchment=normaliseGeo(item.catchment);
  if(catchment&&place&&(place.includes(catchment)||catchment.includes(place)))return 4;
  const catchmentCore=catchment.replace(/\b(north|lower|upper|regional|sewerage|scheme)\b/g,' ').replace(/\s+/g,' ').trim();
  if(catchmentCore.length>=4&&place.includes(catchmentCore))return 4;
  return 0;
};

const baseLocalRelevanceLabel=localRelevanceLabel;
localRelevanceLabel=function(item){
  if(item?.source_kind==='wastewater_surveillance'&&state.countryCode==='IE'){
    const distance=wastewaterDistanceKm(item);
    if(distance!=null&&item.coordinate_precision==='place geocoder'){
      return `Approx. catchment centre ${distance.toFixed(distance<10?1:0)} km away`;
    }
    if(hpscWastewaterRelevance(item)>=4)return 'Named catchment match';
  }
  return baseLocalRelevanceLabel(item);
};

const baseLocalHealthSignal=localHealthSignal;
localHealthSignal=function(item){
  const signal=baseLocalHealthSignal(item);
  if(!signal||item?.source_kind!=='wastewater_surveillance')return signal;
  const distance=wastewaterDistanceKm(item);
  if(distance!=null&&item.coordinate_precision==='place geocoder'){
    signal.summary=`HPSC ${item.result_category} SARS-CoV-2 wastewater result for ${item.catchment}; the geocoded catchment place is approximately ${distance.toFixed(distance<10?1:0)} km from your current location. Wastewater surveillance reflects population circulation, not an infected person nearby or proof of personal exposure.`;
  }
  return signal;
};

async function loadIrishWastewater(){
  try{
    const r=await fetch(`data/ie-wastewater.json?ts=${Date.now()}`);
    if(!r.ok)throw new Error('Irish wastewater cache unavailable');
    state.ieWastewaterData=await r.json();
  }catch(_){
    state.ieWastewaterData={generated_at:null,items:[]};
  }
  try{
    const c=deriveContext();
    renderContext();
    renderVicinity(c);
    renderPublicHealth();
    renderAlerts(c);
  }catch(_){/* app.js may still be completing its first async render */}
}

loadIrishWastewater();
