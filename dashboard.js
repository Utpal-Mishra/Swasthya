const conditionContent={
  adhd:{title:"ADHD support check-in",description:"Notice how sleep, structure, focus load and stress are affecting your day.",actions:["Choose one clearly defined next task.","Reduce distractions for a short focus block.","Use a visible reminder or timer.","Seek an assessment from a qualified professional if difficulties are persistent and impairing."]},
  epilepsy:{title:"Epilepsy wellbeing check-in",description:"Track general wellbeing factors that may be useful to discuss with your care team. This is not seizure prediction.",actions:["Take prescribed medication exactly as directed.","Protect regular sleep and avoid known personal triggers.","Record events or concerns for your clinical team.","Use emergency services for a prolonged seizure, repeated seizures without recovery or serious injury."]},
  stress:{title:"Stress pattern check-in",description:"Notice whether demands, sleep and recovery are becoming difficult to manage.",actions:["Pause for slow breathing or a short walk.","Reduce the next task to a manageable step.","Talk to someone you trust.","Seek professional support when stress is persistent or affecting daily life."]},
  mental:{title:"Mental wellbeing check-in",description:"Reflect on energy, routine, pressure and concentration without labelling or diagnosing yourself.",actions:["Keep one supportive routine today.","Connect with a trusted person.","Make time for food, water, rest and movement.","Use urgent support if you feel unable to stay safe."]}
};

const tabs=[...document.querySelectorAll(".condition-tab")];
const ranges=[...document.querySelectorAll(".checkin-range")];
const conditionTitle=document.querySelector("#conditionTitle");
const conditionDescription=document.querySelector("#conditionDescription");
const insightScore=document.querySelector("#insightScore");
const insightText=document.querySelector("#insightText");
const conditionActions=document.querySelector("#conditionActions");
let activeCondition="adhd";

function safeText(value){return String(value).replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));}

function updateCheckin(){
  ranges.forEach(range=>{
    const output=document.querySelector(`#${range.id.replace("Range","Value")}`);
    if(output) output.value=range.value;
  });
  const sleep=Number(document.querySelector("#sleepRange").value);
  const stress=Number(document.querySelector("#stressRange").value);
  const focus=Number(document.querySelector("#focusRange").value);
  const routine=Number(document.querySelector("#routineRange").value);
  const pressure=(6-sleep)+stress+focus+(6-routine);
  let score="Balanced";
  let text="Your check-in is mixed. Keep the day simple, protect sleep and use one clear next action.";
  if(pressure>=15){score="High load";text="Several pressures are elevated today. Reduce demands where possible and consider reaching out for support.";}
  else if(pressure<=9){score="Steady";text="Your current pattern looks relatively steady. Maintain the routines that are helping.";}
  insightScore.textContent=score;
  insightText.textContent=text;
  conditionActions.innerHTML=conditionContent[activeCondition].actions.map(item=>`<div>${safeText(item)}</div>`).join("");
}

function selectCondition(name){
  activeCondition=name;
  tabs.forEach(tab=>tab.classList.toggle("active",tab.dataset.condition===name));
  const content=conditionContent[name];
  conditionTitle.textContent=content.title;
  conditionDescription.textContent=content.description;
  updateCheckin();
}

tabs.forEach(tab=>tab.addEventListener("click",()=>selectCondition(tab.dataset.condition)));
ranges.forEach(range=>range.addEventListener("input",updateCheckin));
selectCondition("adhd");
