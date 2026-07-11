const alerts=[
{title:"High-temperature health reference",category:"Weather health",severity:"high",summary:"High temperatures are affecting parts of Ireland. This manually maintained reference alert highlights hydration, shade and heat-stress precautions.",distance:0,coverage:"Ireland — check official local warning",confidence:"Reference alert — verify with Met Éireann and HSE",action:"Drink water regularly, choose hydrating foods, avoid prolonged activity during peak heat and check on vulnerable people.",source:"Met Éireann and HSE reference pages",url:"https://www.met.ie/",label:"CURRENT REFERENCE"},
{title:"Air-quality monitoring foundation",category:"Air quality",severity:"moderate",summary:"Shows how a nearby particulate-matter or gas-pollution signal will appear after connection to a validated monitoring feed.",distance:3.2,coverage:"Demonstration only",confidence:"Not scored — no live feed",action:"Check the linked official source before changing activity. Follow existing clinical advice for respiratory conditions.",source:"EPA Ireland — Air Quality",url:"https://airquality.ie/",label:"DEMO · REFERENCE"},
{title:"Weather-health monitoring foundation",category:"Weather health",severity:"low",summary:"Shows future heat, cold, UV and severe-weather health relevance using official forecasts and public guidance.",distance:0,coverage:"Selected area",confidence:"Not scored — no live feed",action:"Review current official forecasts and any active public warnings.",source:"Met Éireann",url:"https://www.met.ie/",label:"DEMO · REFERENCE"},
{title:"Public-health notice foundation",category:"Infectious disease",severity:"low",summary:"Shows how official infectious-disease notices will be filtered by date, geography and public relevance.",distance:0,coverage:"Ireland",confidence:"Not scored — no live feed",action:"Use current HSE or HPSC guidance and consult a professional for personal concerns.",source:"Health Protection Surveillance Centre",url:"https://www.hpsc.ie/",label:"DEMO · REFERENCE"}
];

const locationInput=document.querySelector("#location"),radius=document.querySelector("#radius"),radiusValue=document.querySelector("#radiusValue"),radiusMetric=document.querySelector("#radiusMetric"),areaMetric=document.querySelector("#areaMetric"),signalMetric=document.querySelector("#signalMetric"),alertGrid=document.querySelector("#alertGrid"),checkedMetric=document.querySelector("#checkedMetric"),locationStatus=document.querySelector("#locationStatus"),locateButton=document.querySelector("#locateButton"),notificationToggle=document.querySelector("#notificationToggle"),notificationStatus=document.querySelector("#notificationStatus"),groceriesLink=document.querySelector("#groceriesLink");

let currentCoordinates=null;

function safeText(value){return String(value).replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));}

function updateGroceriesLink(){
  if(currentCoordinates){
    groceriesLink.href=`https://www.google.com/maps/search/open+grocery+stores/@${currentCoordinates.latitude},${currentCoordinates.longitude},14z`;
    return;
  }
  const place=encodeURIComponent(locationInput.value.trim()||"Ireland");
  groceriesLink.href=`https://www.google.com/maps/search/open+grocery+stores+near+${place}`;
}

function render(){
  const km=Number(radius.value),visible=alerts.filter(a=>a.distance<=km);
  radiusValue.textContent=km;
  radiusMetric.textContent=`${km} km`;
  areaMetric.textContent=locationInput.value.trim()||"Selected location";
  signalMetric.textContent=visible.length;
  checkedMetric.textContent=new Intl.DateTimeFormat([], {hour:"2-digit",minute:"2-digit"}).format(new Date());
  alertGrid.innerHTML=visible.map(a=>`<article class="alert-card ${a.severity==='high'?'high-alert-card':''}"><div class="alert-top"><span class="severity ${a.severity}">${safeText(a.severity)}</span><span class="label">${safeText(a.label)}</span></div><h3>${safeText(a.title)}</h3><p>${safeText(a.summary)}</p><p class="action"><strong>Suggested action:</strong> ${safeText(a.action)}</p><div class="metadata">${a.distance} km · ${safeText(a.coverage)}<br>Confidence: ${safeText(a.confidence)}</div><a class="source-link" href="${a.url}" target="_blank" rel="noopener">${safeText(a.source)} ↗</a></article>`).join("")||'<p>No demonstration signals fall inside this radius.</p>';
  updateGroceriesLink();
}

function showPriorityNotification(){
  if(!("Notification" in window)||Notification.permission!=="granted") return;
  const lastShown=Number(localStorage.getItem("swasthyaLastHeatNotice")||0);
  const sixHours=6*60*60*1000;
  if(Date.now()-lastShown<sixHours) return;
  new Notification("Swasthya: high-temperature health reference",{
    body:"Drink water regularly, avoid prolonged peak-heat exposure and check official Met Éireann and HSE advice.",
    tag:"swasthya-heat-reference"
  });
  localStorage.setItem("swasthyaLastHeatNotice",String(Date.now()));
}

async function setNotifications(enabled){
  if(!enabled){
    localStorage.setItem("swasthyaNotifications","off");
    notificationStatus.textContent="Notifications are off.";
    return;
  }
  if(!("Notification" in window)){
    notificationToggle.checked=false;
    notificationStatus.textContent="This browser does not support website notifications.";
    return;
  }
  const permission=await Notification.requestPermission();
  if(permission==="granted"){
    localStorage.setItem("swasthyaNotifications","on");
    notificationStatus.textContent="Notifications are on for high-priority signals while this website is active.";
    showPriorityNotification();
  }else{
    notificationToggle.checked=false;
    localStorage.setItem("swasthyaNotifications","off");
    notificationStatus.textContent="Notification permission was not granted. You can enable it later in browser settings.";
  }
}

radius.addEventListener("input",render);
locationInput.addEventListener("input",()=>{currentCoordinates=null;render();});
notificationToggle.addEventListener("change",()=>setNotifications(notificationToggle.checked));

locateButton.addEventListener("click",()=>{
  if(!navigator.geolocation){locationStatus.textContent="Location is not supported by this browser.";return;}
  locateButton.disabled=true;
  locationStatus.textContent="Requesting browser permission…";
  navigator.geolocation.getCurrentPosition(({coords})=>{
    currentCoordinates={latitude:coords.latitude,longitude:coords.longitude};
    const lat=coords.latitude.toFixed(2),lon=coords.longitude.toFixed(2);
    locationInput.value=`Approx. ${lat}, ${lon}`;
    locationStatus.textContent="Approximate coordinates are shown locally and are not stored or transmitted by this static page.";
    locateButton.disabled=false;
    render();
  },()=>{
    locationStatus.textContent="Location permission was unavailable. Enter an area manually instead.";
    locateButton.disabled=false;
  },{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
});

const notificationsEnabled=localStorage.getItem("swasthyaNotifications")==="on";
notificationToggle.checked=notificationsEnabled&&("Notification" in window)&&Notification.permission==="granted";
if(notificationToggle.checked){
  notificationStatus.textContent="Notifications are on for high-priority signals while this website is active.";
  showPriorityNotification();
}
render();
