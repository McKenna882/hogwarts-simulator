/*
  魔法法典 v0.03 - 完整交互逻辑（已修复布局、时间格式、公告等）
*/

// ---------- 常量 & 工具 ----------
const STORAGE_KEY = 'magicCodex_v0.03_state';
const ANNOUNCEMENT_DATA = [
  {title:'版本号',content:'v0.03'},
  {title:'修复 Bug',content:'优化聊天滚动、地图渲染、日历同步'},
  {title:'已知问题',content:'移动端地图在极小宽度下可能出现水平滚动'},
  {title:'下次更新预告',content:'新增任务系统、排行榜'}
];
const $ = sel=>document.querySelector(sel);
const $$ = sel=>Array.from(document.querySelectorAll(sel));
// ---------- Avatar 上传 ----------
const avatarInput = document.createElement('input');
avatarInput.type = 'file';
avatarInput.accept = 'image/png, image/jpeg';
avatarInput.style.display = 'none';
avatarInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const dataUrl = ev.target.result;
    localStorage.setItem('magic_avatar', dataUrl);
    const avatarImg = $('#avatarImg');
    if (avatarImg) avatarImg.src = dataUrl;
  };
  reader.readAsDataURL(file);
});
document.body.appendChild(avatarInput);
$('#avatarImg').addEventListener('click', () => avatarInput.click());

// ---------- 状态 ----------
let state = {
  currentView:'chat',
  gameTime:{date:new Date(),period:'上午'},
  friends:[],
  messages:{},
  unread:{},
  profile:{name:'新生巫师',house:'',year:'一年级'},
  hub:{baseUrl:'',apiKey:'',model:''},
  announcements:ANNOUNCEMENT_DATA,
  currentChat:null
};

function loadState(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){
    try{state = {...state, ...JSON.parse(saved)};}catch(e){console.warn('state load error',e);}
  }
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}

// ---------- 时间 ----------
function formatGameTime(){
  const d = state.gameTime.date;
  const month = d.getMonth()+1; const day = d.getDate();
  const week = ['日','一','二','三','四','五','六'][d.getDay()];
  const period = state.gameTime.period;
  return `${month}月, ${day} · 星期${week} ${period}`;
}
function updateTopBar(){
  $('#game-time').textContent = formatGameTime();
}

// ---------- 公告 ----------
function renderAnnouncement(){
  const cont = $('#announcement-content');
  cont.innerHTML='';
  state.announcements.forEach(a=>{
    const div=document.createElement('div');
    div.innerHTML=`<h4>${a.title}</h4><p>${a.content}</p>`;
    cont.appendChild(div);
  });
}
function toggleAnnouncement(){
  const panel = $('#announcement-panel');
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    // after transition hide to avoid focus trap
    setTimeout(()=>panel.classList.add('hidden'),400);
  } else {
    panel.classList.remove('hidden');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
  }
}

// ---------- 闲聊 ----------
function initChat(){
  state.friends=[
    {id:'f1',name:'赫敏',avatar:'👧',online:true},
    {id:'f2',name:'罗恩',avatar:'👦',online:true},
    {id:'f3',name:'哈利',avatar:'🧒',online:false}
  ];
  const scroll = $('#friendScroll');
  scroll.innerHTML='';
  // 地图入口
  const map=document.createElement('div');
  map.className='friend-avatar-item map-entry';
  map.innerHTML='<span class="friend-avatar-emoji">🗺️</span><span class="friend-avatar-name">地图</span>';
  map.onclick=showMap;
  scroll.appendChild(map);
  // 好友头像
  state.friends.forEach(f=>{
    const el=document.createElement('div');
    el.className='friend-avatar-item';
    el.dataset.id=f.id;
    el.innerHTML=`<span class="friend-avatar-emoji">${f.avatar}</span><span class="friend-avatar-name">${f.name}</span>`;
    el.onclick=()=>openChat(f.id);
    scroll.appendChild(el);
  });
  $('#chatMessages').innerHTML='<div class="msg-empty-state"><p>选择好友开始聊天</p></div>';
}
function openChat(id){
  const friend=state.friends.find(f=>f.id===id);
  if(!friend) return;
  $$('.friend-avatar-item').forEach(el=>el.classList.toggle('active',el.dataset.id===id));
  const msgs=state.messages[id]||[];
  const cont=$('#chatMessages');
  cont.innerHTML='';
  msgs.forEach(m=>renderMsg(cont,m));
  $('#chatInput').value='';
  $('#chatInput').focus();
  state.currentChat=id;
  saveState();
}
function renderMsg(parent,msg){
  const div=document.createElement('div');
  div.className='msg '+(msg.from==='self'?'self':'friend');
  div.textContent=msg.text;
  parent.appendChild(div);
  // 自动滚动到底部
  parent.scrollTop=parent.scrollHeight;
}
function sendMessage(){
  const txt=$('#chatInput').value.trim();
  if(!txt||!state.currentChat) return;
  const now=new Date().toISOString();
  const m={from:'self',text:txt,ts:now};
  if(!state.messages[state.currentChat]) state.messages[state.currentChat]=[];
  state.messages[state.currentChat].push(m);
  renderMsg($('#chatMessages'),m);
  $('#chatInput').value='';
  // 模拟回复
  setTimeout(()=>{
    const reply={from:'friend',text:'🪄 收到！',ts:new Date().toISOString()};
    state.messages[state.currentChat].push(reply);
    renderMsg($('#chatMessages'),reply);
    saveState();
  },800);
  saveState();
}

// ---------- 地图 ----------
const ASCII_MAP=`
  大礼堂 ── 教室A ── 教室B
     │          │
  图书馆 ── 食堂 ── 走廊
`;
function showMap(){
  $('#chatView').style.display='none';
  $('#mapView').style.display='block';
  $('#mapAscii').textContent=ASCII_MAP.trim();
}
function backToChat(){
  $('#mapView').style.display='none';
  $('#chatView').style.display='block';
}

// ---------- 日历 ----------
function initCalendar(){
  const grid=$('#calWeekGrid');
  grid.innerHTML='';
  const today=new Date();
  const start=new Date(today);
  start.setDate(today.getDate()-today.getDay()+1);
  for(let i=0;i<7;i++){
    const d=new Date(start);
    d.setDate(start.getDate()+i);
    const cell=document.createElement('div');
    cell.className='cell';
    cell.textContent=d.getDate();
    // 随机示例事件
    if(Math.random()<0.2){
      const ev=document.createElement('span');
      ev.textContent='🔴';
      cell.appendChild(ev);
    }
    grid.appendChild(cell);
  }
}

// ---------- 档案 ----------
function renderProfile(){
  $('#profileName').textContent=state.profile.name;
  $('#profileHouse').textContent=state.profile.house||'未分配';
  $('#profileYear').textContent=state.profile.year;
}

// ---------- 枢纽 ----------
function loadHub(){
  $('#cfgBaseUrl').value=state.hub.baseUrl;
  $('#cfgApiKey').value=state.hub.apiKey;
  $('#cfgModel').value=state.hub.model;
}
function saveHub(){
  state.hub.baseUrl=$('#cfgBaseUrl').value.trim();
  state.hub.apiKey=$('#cfgApiKey').value.trim();
  state.hub.model=$('#cfgModel').value.trim();
  $('#settingsResult').textContent='已保存';
  $('#settingsResult').className='success';
  saveState();
}
function clearCache(){
  localStorage.clear();
  alert('缓存已清理，页面将刷新');
  location.reload();
}
function resetData(){
  if(confirm('确定要重置所有数据吗？此操作不可恢复')){
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}
function exportConfig(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='magic_codex_config.json';a.click();URL.revokeObjectURL(url);
}
function importConfig(){
  $('#importFileInput').click();
}
$('#importFileInput').addEventListener('change',e=>{
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{ const obj=JSON.parse(ev.target.result); state={...state,...obj}; saveState(); location.reload(); }
    catch(err){ alert('导入错误：'+err.message); }
  };
  reader.readAsText(file);
});

// ---------- 视图切换 ----------
function switchView(view){
  state.currentView=view;
  $$('#view-container > .tab-view').forEach(v=>v.style.display='none');
  $(`#tab-${view}`).style.display='block';
  $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  saveState();
}

// ---------- 事件绑定 ----------
function bindEvents(){
  // 底部导航
  $$('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  // 公告
  $('#announcement-toggle').addEventListener('click',toggleAnnouncement);
  $('#announcement-close').addEventListener('click',toggleAnnouncement);
  // 聊天发送
  $('#chatSendBtn').addEventListener('click',sendMessage);
  $('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter') sendMessage();});
  // 地图返回
  $('#backToChatBtn').addEventListener('click',backToChat);
  // 枢纽按钮
  $('#saveSettingsBtn').addEventListener('click',saveHub);
  $('#clearCacheBtn').addEventListener('click',clearCache);
  $('#resetDataBtn').addEventListener('click',resetData);
  $('#exportConfigBtn').addEventListener('click',exportConfig);
  $('#importConfigBtn').addEventListener('click',importConfig);
}

// ---------- 初始化 ----------
function init(){
  loadState();
  updateTopBar();
  renderAnnouncement();
  initChat();
  initCalendar();
  renderProfile();
  loadHub();
  bindEvents();
  switchView(state.currentView||'chat');
}

document.addEventListener('DOMContentLoaded',init);
