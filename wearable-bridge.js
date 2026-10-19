(() => {
  const STORAGE_KEY = 'swasthyaWearableSnapshot';
  const MOOD_KEY = 'swasthyaMoodAnchors';
  const ALLOWED_MOODS = new Set(['Happy','Calm','Focused','Stressed','Low','Tired']);
  let snapshot = null;

  const els = {
    status: document.querySelector('#wearableConnectionStatus'),
    source: document.querySelector('#wearableSource'),
    updated: document.querySelector('#wearableUpdated'),
    sleep: document.querySelector('#wearableSleep'),
    heart: document.querySelector('#wearableHeart'),
    activity: document.querySelector('#wearableActivity'),
    optional: document.querySelector('#wearableOptional'),
    contextTitle: document.querySelector('#wearableContextTitle'),
    contextText: document.querySelector('#wearableContextText'),
    contributors: document.querySelector('#wearableContributors'),
    association: document.querySelector('#wearableAssociation'),
    importButton: document.querySelector('#importWearableSnapshot'),
    connectButton: document.querySelector('#connectHealthConnect'),
    fileInput: document.querySelector('#wearableFileInput'),
    clearButton: document.querySelector('#clearWearableSnapshot'),
    nativeStatus: document.querySelector('#nativeHealthStatus')
  };

  function safeText(value){return String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function finite(value){return typeof value === 'number' && Number.isFinite(value);}
  function signed(value,unit=''){if(!finite(value))return '—';return `${value>0?'+':''}${Math.round(value*10)/10}${unit}`;}
  function fmtDate(value){if(!value)return 'Unknown';const d=new Date(value);return Number.isNaN(d.getTime())?'Unknown':new Intl.DateTimeFormat([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(d);}
  function mean(values){const valid=values.filter(finite);return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;}

  function validate(payload){
    if(!payload || typeof payload !== 'object') throw new Error('Snapshot is not a JSON object.');
    if(!['1.0','1.1','swasthya-wearable-v1'].includes(payload.schema_version)) throw new Error('Unsupported wearable snapshot version.');
    const nested = payload.sleep || payload.heart || payload.activity || payload.recovery;
    if(!nested && !payload.metrics) throw new Error('No wearable metrics found.');
    return payload;
  }

  function normalise(payload){
    validate(payload);
    if(payload.metrics){
      const m=payload.metrics||{}, b=payload.baseline_14d||{};
      return {
        schema_version:'1.1',date:(payload.generated_at||new Date().toISOString()).slice(0,10),generated_at:payload.generated_at||new Date().toISOString(),
        source:payload.source||'health_connect',data_origin:payload.data_origin||'Wearable summary',data_origins:payload.data_origins||[],consent_scope:payload.consent_scope||Object.keys(m).filter(k=>m[k]!=null),
        sleep:{duration_minutes:m.sleep_minutes??null,baseline_delta_minutes:finite(m.sleep_minutes)&&finite(b.sleep_minutes)?m.sleep_minutes-b.sleep_minutes:null,consistency_minutes:null},
        heart:{resting_bpm:m.resting_hr_bpm??null,resting_bpm_baseline_delta:finite(m.resting_hr_bpm)&&finite(b.resting_hr_bpm)?m.resting_hr_bpm-b.resting_hr_bpm:null,hrv_ms:m.hrv_rmssd_ms??null,hrv_baseline_delta:finite(m.hrv_rmssd_ms)&&finite(b.hrv_rmssd_ms)?m.hrv_rmssd_ms-b.hrv_rmssd_ms:null,average_bpm:m.heart_rate_avg_bpm??null},
        activity:{steps:m.steps??null,active_minutes:m.active_minutes??null,minutes_since_exercise:m.minutes_since_exercise??null},
        recovery:{energy_score:m.energy_score??null,skin_temperature_baseline_delta_c:m.skin_temp_delta_c??null,sleep_spo2_percent:m.spo2_avg_pct??null},
        mindfulness:{minutes_24h:m.mindfulness_minutes??null},mood_anchor:payload.mood_anchor||null
      };
    }
    return {...payload,schema_version:payload.schema_version||'1.1',generated_at:payload.generated_at||`${payload.date||new Date().toISOString().slice(0,10)}T12:00:00Z`,data_origin:payload.data_origin||payload.source||'Wearable summary',data_origins:payload.data_origins||[],mindfulness:payload.mindfulness||{minutes_24h:null}};
  }

  function physiologyContext(s){
    const contributors=[];
    let recovery=0, arousal=0;
    const sleepDelta=s.sleep?.baseline_delta_minutes;
    const restingDelta=s.heart?.resting_bpm_baseline_delta;
    const hrv=s.heart?.hrv_ms, hrvDelta=s.heart?.hrv_baseline_delta;
    const skinDelta=s.recovery?.skin_temperature_baseline_delta_c;
    const mindfulness=s.mindfulness?.minutes_24h;

    // Baseline-relative product heuristics only; these are not clinical cut-offs.
    if(finite(sleepDelta) && sleepDelta<=-60){recovery++;contributors.push(`Sleep was ${Math.abs(Math.round(sleepDelta))} min below your baseline.`);}
    if(finite(restingDelta) && restingDelta>=5){arousal++;contributors.push(`Resting heart rate was ${Math.round(restingDelta)} bpm above your baseline.`);}
    if(finite(hrvDelta) && finite(hrv) && hrvDelta<=-8){recovery++;contributors.push('HRV was lower than your recent baseline.');}
    if(finite(s.recovery?.energy_score) && s.recovery.energy_score<50){recovery++;contributors.push('Samsung Energy Score was lower than its usual high-readiness range.');}
    if(finite(skinDelta) && Math.abs(skinDelta)>=0.5){contributors.push(`Skin-temperature delta was ${signed(skinDelta,'°C')} relative to the source baseline; illness, environment, sleep and other factors can contribute.`);}
    if(finite(s.activity?.minutes_since_exercise) && s.activity.minutes_since_exercise<90){contributors.push('Recent exercise may explain elevated heart-rate or arousal signals.');}
    if(finite(mindfulness) && mindfulness>0){contributors.push(`${Math.round(mindfulness)} min of mindfulness/breathing activity was recorded in the last 24 h.`);}

    let title='Near your recent baseline';
    let text='The available wearable measurements do not show a strong deviation from your supplied personal baseline.';
    if(recovery+arousal>=2){title='Lower recovery / elevated arousal context';text='Several wearable signals differ from your personal baseline. Treat this as physiological context, not a statement about your mood or a diagnosis.';}
    else if(recovery+arousal===1){title='Mixed physiological context';text='One available wearable signal differs from your recent baseline. Exercise, illness, temperature, caffeine, excitement, stress or ordinary variation may contribute.';}
    if(!finite(sleepDelta)&&!finite(restingDelta)&&!finite(hrvDelta)&&!finite(s.recovery?.energy_score)){
      title='Baseline still building';text='Wearable measurements are available, but Swasthya needs a personal baseline before describing meaningful deviations.';
    }
    return {title,text,contributors};
  }

  function moodAnchors(){try{return JSON.parse(sessionStorage.getItem(MOOD_KEY)||'[]');}catch(_){return [];}}
  function saveAnchors(items){sessionStorage.setItem(MOOD_KEY,JSON.stringify(items.slice(-60)));}
  function associationText(){
    const items=moodAnchors();
    if(items.length<8) return `Add ${8-items.length} more self-reported mood anchor${8-items.length===1?'':'s'} before Swasthya describes baseline-relative personal associations.`;
    const groups=items.reduce((acc,x)=>{(acc[x.mood]??=[]).push(x);return acc;},{});
    const candidates=Object.entries(groups).filter(([,rows])=>rows.length>=3).sort((a,b)=>b[1].length-a[1].length);
    if(!candidates.length)return 'More repeated labels are needed within the same self-reported state before a useful personal association can be described.';
    const [mood,rows]=candidates[0],bits=[];
    const sleep=mean(rows.map(x=>x.sleep_delta)),resting=mean(rows.map(x=>x.resting_hr_delta)),hrv=mean(rows.map(x=>x.hrv_delta));
    if(finite(sleep)&&Math.abs(sleep)>=30)bits.push(`sleep averaged ${Math.abs(Math.round(sleep))} min ${sleep<0?'below':'above'} your baseline`);
    if(finite(resting)&&Math.abs(resting)>=3)bits.push(`resting HR averaged ${Math.abs(Math.round(resting))} bpm ${resting>0?'above':'below'} baseline`);
    if(finite(hrv)&&Math.abs(hrv)>=5)bits.push(`HRV averaged ${Math.abs(Math.round(hrv))} ms ${hrv<0?'below':'above'} baseline`);
    if(!bits.length)return `You have reported ${mood} ${rows.length} times, but no strong baseline-relative wearable pattern is visible from the currently stored session anchors.`;
    return `When you reported ${mood} (${rows.length}×), ${bits.join('; ')}. This is a personal association, not evidence that these measurements caused or can predict that mood.`;
  }

  function render(){
    if(!snapshot){
      if(els.status){els.status.textContent='NOT CONNECTED';els.status.className='status-pill ageing';}
      if(els.source)els.source.textContent='No wearable summary loaded';if(els.updated)els.updated.textContent='—';
      ['sleep','heart','activity','optional'].forEach(k=>{if(els[k])els[k].textContent='—';});
      if(els.contextTitle)els.contextTitle.textContent='Waiting for wearable context';if(els.contextText)els.contextText.textContent='Connect through the Android companion or import a local summary file.';if(els.contributors)els.contributors.innerHTML='';if(els.association)els.association.textContent=associationText();return;
    }
    const c=physiologyContext(snapshot);
    if(els.status){els.status.textContent='CONNECTED';els.status.className='status-pill fresh';}
    if(els.source)els.source.textContent=snapshot.data_origin||snapshot.source;if(els.updated)els.updated.textContent=fmtDate(snapshot.generated_at);
    if(els.sleep)els.sleep.textContent=finite(snapshot.sleep?.duration_minutes)?`${Math.floor(snapshot.sleep.duration_minutes/60)}h ${Math.round(snapshot.sleep.duration_minutes%60)}m`:'—';
    if(els.heart){const r=snapshot.heart?.resting_bpm,avg=snapshot.heart?.average_bpm;els.heart.textContent=finite(r)?`${Math.round(r)} bpm resting`:finite(avg)?`${Math.round(avg)} bpm avg`:'—';}
    if(els.activity)els.activity.textContent=Number.isInteger(snapshot.activity?.steps)?`${snapshot.activity.steps.toLocaleString()} steps`:'—';
    if(els.optional){const bits=[];if(finite(snapshot.heart?.hrv_ms))bits.push(`HRV ${Math.round(snapshot.heart.hrv_ms)} ms`);if(finite(snapshot.recovery?.sleep_spo2_percent))bits.push(`SpO₂ ${snapshot.recovery.sleep_spo2_percent.toFixed(1)}%`);if(finite(snapshot.recovery?.skin_temperature_baseline_delta_c))bits.push(`skin temp ${signed(snapshot.recovery.skin_temperature_baseline_delta_c,'°C')}`);if(finite(snapshot.recovery?.energy_score))bits.push(`Energy ${Math.round(snapshot.recovery.energy_score)}`);if(finite(snapshot.mindfulness?.minutes_24h)&&snapshot.mindfulness.minutes_24h>0)bits.push(`mindfulness ${Math.round(snapshot.mindfulness.minutes_24h)} min`);els.optional.textContent=bits.join(' · ')||'—';}
    if(els.contextTitle)els.contextTitle.textContent=c.title;if(els.contextText)els.contextText.textContent=c.text;if(els.contributors)els.contributors.innerHTML=c.contributors.length?c.contributors.map(x=>`<li>${safeText(x)}</li>`).join(''):'<li>No baseline-relative contributor is available yet.</li>';if(els.association)els.association.textContent=associationText();
  }

  function receiveSnapshot(payload){try{const parsed=typeof payload==='string'?JSON.parse(payload):payload;snapshot=normalise(parsed);sessionStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot));render();return {ok:true};}catch(error){if(els.contextTitle)els.contextTitle.textContent='Wearable snapshot could not be loaded';if(els.contextText)els.contextText.textContent=error.message;return {ok:false,error:error.message};}}
  function receiveNativeStatus(message,state){if(els.nativeStatus){els.nativeStatus.textContent=message;els.nativeStatus.dataset.state=state||'ready';}if(state==='connected'&&els.status){els.status.textContent='CONNECTED';els.status.className='status-pill fresh';}}
  function clearSnapshot(){snapshot=null;sessionStorage.removeItem(STORAGE_KEY);render();}
  function recordMoodAnchor(mood){if(!mood){render();return;}if(!ALLOWED_MOODS.has(mood))return;const c=snapshot?physiologyContext(snapshot):null;const items=moodAnchors();items.push({mood,at:new Date().toISOString(),context:c?.title||'No wearable snapshot',sleep_delta:snapshot?.sleep?.baseline_delta_minutes??null,resting_hr_delta:snapshot?.heart?.resting_bpm_baseline_delta??null,hrv_delta:snapshot?.heart?.hrv_baseline_delta??null,skin_temp_delta:snapshot?.recovery?.skin_temperature_baseline_delta_c??null});saveAnchors(items);render();}

  if(els.connectButton){const native=typeof window.SwasthyaNative?.requestHealthConnect==='function';els.connectButton.hidden=!native;if(native)els.connectButton.addEventListener('click',()=>window.SwasthyaNative.requestHealthConnect());}
  if(els.importButton&&els.fileInput){els.importButton.addEventListener('click',()=>els.fileInput.click());els.fileInput.addEventListener('change',async()=>{const file=els.fileInput.files?.[0];if(!file)return;receiveSnapshot(await file.text());els.fileInput.value='';});}
  if(els.clearButton)els.clearButton.addEventListener('click',clearSnapshot);
  try{const cached=sessionStorage.getItem(STORAGE_KEY);if(cached)snapshot=normalise(JSON.parse(cached));}catch(_){sessionStorage.removeItem(STORAGE_KEY);}
  window.SwasthyaWearableBridge={receiveSnapshot,receiveNativeStatus,clearSnapshot,recordMoodAnchor,getSnapshot:()=>snapshot};render();
})();
