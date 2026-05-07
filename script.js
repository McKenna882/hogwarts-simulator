/* ═══════════ 霍格沃茨魔法模拟站 · 核心引擎 v0.02 ═══════════ */

// ── 时间系统 ──
const DAYS = ['星期一','星期二','星期三','星期四','星期五','星期六','星期日'];
const SLOTS = ['上午','下午','晚上'];
let currentDay = parseInt(localStorage.getItem('hp_day')||'0'); // 0-index into DAYS
let currentSlot = parseInt(localStorage.getItem('hp_slot')||'0'); // 0-2

function timeString(){ return DAYS[currentDay]+' · '+SLOTS[currentSlot]; }
function saveTime(){ localStorage.setItem('hp_day',currentDay); localStorage.setItem('hp_slot',currentSlot); }

// ── 玩家状态 ──
const player = {
  name: localStorage.getItem('hp_name') || '新生巫师',
  house: localStorage.getItem('hp_house') || '未分配',
  courses: JSON.parse(localStorage.getItem('hp_courses')||'[]'),
  forestVisited: localStorage.getItem('hp_forest')==='true',
  quidditchTeam: localStorage.getItem('hp_quidditch')||'未加入',
  potions: JSON.parse(localStorage.getItem('hp_potions')||'[]'),
  location: localStorage.getItem('hp_location')||'大礼堂',
  friendship: JSON.parse(localStorage.getItem('hp_friendship')||'{}'),
  courseSchedule: JSON.parse(localStorage.getItem('hp_schedule')||'{}')
};

// ── 预设计程表: 课程→星期→时段 ──
const COURSE_TIMES = {
  '防御黑魔法': { day: 0, slot: 0 },  // 星期一上午
  '魔药学':     { day: 1, slot: 0 },  // 星期二上午
  '占卜学':     { day: 2, slot: 1 },  // 星期三下午
  '草药学':     { day: 0, slot: 1 },  // 星期一下午
  '变形学':     { day: 3, slot: 0 },  // 星期四上午
  '魔咒学':     { day: 1, slot: 1 },  // 星期二下午
  '魁地奇技巧': { day: 5, slot: 0 }   // 星期六上午
};

function buildSchedule(){
  const sched = {};
  player.courses.forEach(c=>{
    const ct = COURSE_TIMES[c];
    if(ct) sched[ct.day+','+ct.slot] = c;
  });
  player.courseSchedule = sched;
  localStorage.setItem('hp_schedule', JSON.stringify(sched));
}

// ── 好友系统 ──
const FRIENDS = [
  { id:'harry',   name:'哈利·波特',     emoji:'⚡', house:'格兰芬多', personality:'勇敢，重视友谊，有时鲁莽',      defaultLoc:'魁地奇球场', locDays:[5] },
  { id:'hermione',name:'赫敏·格兰杰',   emoji:'📚', house:'格兰芬多', personality:'聪明，好学，逻辑清晰，偶尔说教',  defaultLoc:'图书馆',     locDays:null },
  { id:'ron',     name:'罗恩·韦斯莱',   emoji:'🍗', house:'格兰芬多', personality:'爱吃，幽默，偶尔胆小，忠诚',      defaultLoc:'大礼堂',     locDays:null },
  { id:'draco',   name:'德拉科·马尔福', emoji:'🐍', house:'斯莱特林', personality:'高傲，喜欢挑衅，家族自豪感强',  defaultLoc:'斯莱特林地窖',locDays:null },
  { id:'luna',    name:'卢娜·洛夫古德', emoji:'🌙', house:'拉文克劳', personality:'古怪，直觉敏锐，相信奇异生物',  defaultLoc:'禁林边缘',   locDays:null },
  { id:'neville', name:'纳威·隆巴顿',   emoji:'🌿', house:'格兰芬多', personality:'健忘，草药天赋极高，逐渐勇敢',  defaultLoc:'草药课温室', locDays:null },
  { id:'cedric',  name:'塞德里克·迪戈里',emoji:'🦡',house:'赫奇帕奇', personality:'正直友善，魁地奇好手，温和',    defaultLoc:'魁地奇球场', locDays:null }
];

function getFriend(id){ return FRIENDS.find(f=>f.id===id); }

function getFriendStatus(f){
  const loc = getFriendLocation(f.id);
  // simplified online check: 9am-9pm ≈ slots 0-1 always, slot 2 partial
  if(SLOTS[currentSlot]==='晚上') return { status:'away', text:'离开', cls:'status-away', loc:loc };
  return { status:'online', text:'在线', cls:'status-online', loc:loc };
}

function getFriendLocation(id){
  const idx = FRIENDS.findIndex(f=>f.id===id);
  if(idx<0) return '未知';
  return localStorage.getItem('hp_floc_'+id) || FRIENDS[idx].defaultLoc;
}

function setFriendLocation(id, loc){
  localStorage.setItem('hp_floc_'+id, loc);
}

function getFriendShip(id){
  const fs = player.friendship[id];
  if(!fs) return 50;
  return fs;
}

function adjustFriendShip(id, delta){
  const cur = getFriendShip(id);
  player.friendship[id] = Math.max(0, Math.min(100, cur+delta));
  localStorage.setItem('hp_friendship', JSON.stringify(player.friendship));
}

// ── 地图数据 ──
const MAP_ASCII = `
                              ╔══════════╗
                              ║ 🔭 天文塔  ║
                              ╚═════╤════╝
                                    │
              ╔══════════╗    ╔═════╧═════╗    ╔══════════╗
              ║🦅拉文克劳║────║✨变形课教室║────║🪄魔咒课教室║
              ║  塔楼   ║    ╚═════╤═════╝    ╚══════════╝
              ╚════╤════╝          │
                   │         ╔═════╧═════╗
                   │         ║ 📚 图书馆  ║
                   │         ╚═════╤═════╝
                   │               │
    ╔══════════╗   │    ╔══════════╧══════════╗   ╔══════════╗
    ║🛡️格兰芬多║───┴────║    🍽️  大礼堂       ║───║🚪有求必应║
    ║  塔楼   ║        ║  [玩家起始位置]      ║   ║   屋    ║
    ╚════╤════╝        ╚══════╤══╤══════════╝   ╚══════════╝
         │                     │  │
    ╔════╧════╗          ╔═════╧╗ ╚════╗
    ║🏟️魁地奇║          ║🧪魔药║      ║
    ║  球场  ║          ║课教室║  ╔═══╧══════╗
    ╚════╤═══╝          ╚══════╝  ║🏥 校医院  ║
         │                         ╚══════════╝
    ╔════╧════╗          ╔══════════╗    ╔══════════╗
    ║🏡海格小屋║          ║🐍斯莱特林║    ║🦡赫奇帕奇║
    ╚════╤════╝          ║  地窖   ║    ║ 地下室  ║
         │               ╚════╤════╝    ╚════╤════╝
    ╔════╧════╗               │              │
    ║🌲禁林边缘║         ╔════╧════╗    ╔════╧════╗
    ╚═════════╝         ║🍲 厨房  ║    ║🌿草药课║
                        ║(挠梨子) ║    ║  温室  ║
                        ╚═════════╝    ╚════╤════╝
                                            │
                                       ╔════╧══════╗
                                       ║🏛️校长办公室║
                                       ╚═══════════╝`;

const LOCATIONS = [
  '格兰芬多塔楼','斯莱特林地窖','拉文克劳塔楼','赫奇帕奇地下室',
  '图书馆','大礼堂','魔药课教室','变形课教室','魔咒课教室',
  '草药课温室','天文塔','有求必应屋','禁林边缘','魁地奇球场',
  '海格小屋','校长办公室','校医院','厨房'
];

// 拆分地名映射 — 地图上的ASCII文字会拆成两行，需要片段匹配
const SPLIT_LOC_FRAGMENTS = {
  '拉文克劳塔楼': ['拉文克劳', '塔楼'],
  '斯莱特林地窖': ['斯莱特林', '地窖'],
  '赫奇帕奇地下室': ['赫奇帕奇', '地下室'],
  '魔药课教室': ['魔药', '课教室'],
  '草药课温室': ['草药课', '温室'],
  '格兰芬多塔楼': ['格兰芬多', '塔楼'],
  '魁地奇球场': ['魁地奇', '球场'],
  '有求必应屋': ['有求必应', '屋'],
};

// 相邻关系: 地点 → [可前往的地点]
const ADJACENCY = {
  '格兰芬多塔楼':   ['大礼堂','变形课教室','魁地奇球场'],
  '斯莱特林地窖':   ['大礼堂','魔药课教室','厨房'],
  '拉文克劳塔楼':   ['变形课教室','魔咒课教室','图书馆'],
  '赫奇帕奇地下室': ['厨房','草药课温室','大礼堂'],
  '图书馆':         ['大礼堂','拉文克劳塔楼'],
  '大礼堂':         ['格兰芬多塔楼','斯莱特林地窖','赫奇帕奇地下室','图书馆','厨房','魔药课教室','校医院','有求必应屋'],
  '魔药课教室':     ['大礼堂','斯莱特林地窖'],
  '变形课教室':     ['格兰芬多塔楼','拉文克劳塔楼','天文塔'],
  '魔咒课教室':     ['拉文克劳塔楼','天文塔'],
  '草药课温室':     ['赫奇帕奇地下室','校长办公室','禁林边缘'],
  '天文塔':         ['变形课教室','魔咒课教室'],
  '有求必应屋':     ['大礼堂'],
  '禁林边缘':       ['草药课温室','海格小屋'],
  '魁地奇球场':     ['格兰芬多塔楼','海格小屋'],
  '海格小屋':       ['魁地奇球场','禁林边缘'],
  '校长办公室':     ['草药课温室'],
  '校医院':         ['大礼堂'],
  '厨房':           ['斯莱特林地窖','赫奇帕奇地下室','大礼堂']
};

// ── 特殊日期 ──
const SPECIAL_DATES = {
  '0,2': '开学典礼',
  '3,0': '魁地奇选拔',
  '5,0': '魁地奇比赛日',
  '6,1': '周末自由活动'
};

// 好友生日
const BIRTHDAYS = {
  'harry': { day: 5, slot: 0, text: '哈利·波特的生日' },
  'hermione': { day: 3, slot: 1, text: '赫敏·格兰杰的生日' },
  'ron': { day: 0, slot: 2, text: '罗恩·韦斯莱的生日' },
  'neville': { day: 5, slot: 1, text: '纳威·隆巴顿的生日' }
};

// ── 对话历史存储 ──
function getChatHistory(friendId){
  try { return JSON.parse(localStorage.getItem('hp_chat_'+friendId)||'[]'); }
  catch(e){ return []; }
}
function saveChatHistory(friendId, msgs){
  // 只保留最近20条
  const trimmed = msgs.slice(-20);
  localStorage.setItem('hp_chat_'+friendId, JSON.stringify(trimmed));
}

// ═══════════════════════════════════════════
//  渲染与UI
// ═══════════════════════════════════════════
function $(id){ return document.getElementById(id); }

function showToast(msg, duration){
  duration = duration || 1800;
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), duration);
}

function updateTopBar(){
  $('timeDisplay').textContent = timeString();
  $('locDisplay') && ($('locDisplay').textContent = player.location);
}

function appendToMain(html){
  const mc = $('mainContent');
  const div = document.createElement('div');
  div.innerHTML = html;
  mc.appendChild(div);
  // scroll to bottom
  $('mainArea').scrollTop = $('mainArea').scrollHeight;
}

function appendSystemMsg(msg){
  appendToMain('<div class="chat-msg chat-system">'+msg+'</div>');
}

function clearMain(){
  $('mainContent').innerHTML = '';
}

// ── Toast绑定 ──
window.showToast = showToast;

// ═══════════════════════════════════════════
//  设置面板
// ═══════════════════════════════════════════
function openSettings(){
  const c = apiManager.loadConfig();
  $('cfgBaseUrl').value = c.baseUrl || '';
  $('cfgApiKey').value = c.apiKey || '';
  $('cfgModel').value = c.model || '';
  // 尝试恢复模型列表
  const savedModels = JSON.parse(localStorage.getItem('api_models')||'[]');
  populateModelSelect(savedModels);
  $('settingsPanel').classList.add('open');
}

function closeSettings(){
  $('settingsPanel').classList.remove('open');
  clearSettingsResult();
}

function clearSettingsResult(){
  const r = $('settingsResult');
  r.className = '';
  r.textContent = '';
  r.style.display = 'none';
}

function showSettingsResult(type, msg){
  const r = $('settingsResult');
  r.className = type;
  r.textContent = msg;
  r.style.display = 'block';
}

function populateModelSelect(models){
  const sel = $('cfgModelList');
  sel.innerHTML = '<option value="">-- 选择模型 --</option>';
  if(models && models.length){
    models.forEach(m=>{
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      sel.appendChild(opt);
    });
  }
  // 同步下拉框改变时写入手动输入框
  sel.onchange = function(){
    if(this.value) $('cfgModel').value = this.value;
  };
}

async function testApiConnection(){
  clearSettingsResult();
  // 先保存临时配置
  const baseUrl = $('cfgBaseUrl').value.trim();
  const apiKey = $('cfgApiKey').value.trim();
  if(!baseUrl||!apiKey){ showSettingsResult('error','请先填写中转站地址和API Key。'); return; }
  apiManager.config.baseUrl = baseUrl;
  apiManager.config.apiKey = apiKey;

  showSettingsResult('info','🦉 猫头鹰正在飞行中，请稍候...');

  const result = await apiManager.testConnection();
  if(result.success){
    let msg = '✅ 连接成功！猫头鹰已带回信笺 🦉\n';
    if(result.method==='models'){
      msg += '检测到 '+result.modelCount+' 个模型：\n'+result.models.join(', ');
      // 存储模型列表并在下拉框中显示
      localStorage.setItem('api_models', JSON.stringify(result.models));
      populateModelSelect(result.models);
      if(result.models.length>0 && !$('cfgModel').value){
        $('cfgModelList').value = result.models[0];
        $('cfgModel').value = result.models[0];
      }
    } else {
      msg += '中转站连通正常（不支持模型列表查询，模型ID请手动填写）';
    }
    showSettingsResult('success', msg);
  } else {
    showSettingsResult('error', '❌ '+result.error);
  }
}

async function retestApiConnection(){
  clearSettingsResult();
  const baseUrl = $('cfgBaseUrl').value.trim();
  const apiKey = $('cfgApiKey').value.trim();
  if(!baseUrl||!apiKey){ showSettingsResult('error','请先填写中转站地址和API Key。'); return; }
  apiManager.config.baseUrl = baseUrl;
  apiManager.config.apiKey = apiKey;

  showSettingsResult('info','🦉 猫头鹰再次起飞，重新检测中...');

  const result = await apiManager.testConnection();
  if(result.success){
    let msg = '🔄 重新检测成功！';
    if(result.method==='models'){
      msg += '\n检测到 '+result.modelCount+' 个模型：\n'+result.models.join(', ');
      localStorage.setItem('api_models', JSON.stringify(result.models));
      populateModelSelect(result.models);
    } else {
      msg += '\n连通正常（不支持模型列表查询）';
    }
    showSettingsResult('success', msg);
  } else {
    showSettingsResult('error', '❌ '+result.error);
  }
}

function saveApiSettings(){
  const baseUrl = $('cfgBaseUrl').value.trim();
  const apiKey = $('cfgApiKey').value.trim();
  let model = $('cfgModel').value.trim();
  // 如果下拉框有值，优先用下拉框
  if($('cfgModelList').value) model = $('cfgModelList').value;
  if(!baseUrl||!apiKey){ showSettingsResult('error','请填写中转站地址和API Key。'); return; }

  apiManager.saveConfig(baseUrl, apiKey, model);
  showSettingsResult('success','💾 设置已保存！魔法枢纽已配置完毕。');
  setTimeout(closeSettings, 1200);
}

// 绑定全局设置函数
window.testApiConnection = testApiConnection;
window.retestApiConnection = retestApiConnection;
window.saveApiSettings = saveApiSettings;
window.closeSettings = closeSettings;

// ═══════════════════════════════════════════
//  地图
// ═══════════════════════════════════════════
function renderMap(){
  clearMain();
  // 在地图上标记在线好友位置
  let mapText = MAP_ASCII;
  FRIENDS.forEach(f=>{
    const status = getFriendStatus(f);
    if(status.status==='online' || status.status==='away'){
      const loc = getFriendLocation(f.id);
      const fragments = SPLIT_LOC_FRAGMENTS[loc];
      if (fragments) {
        if (fragments.every(f => mapText.includes(f))) {
          mapText = mapText.replace(fragments[0], fragments[0] + ' [@' + f.emoji + ']');
        }
      } else if (mapText.includes(loc)) {
        mapText = mapText.replace(loc, loc + ' [@' + f.emoji + ']');
      }
    }
  });

  let html = '<h2 style="color:#ffd700;">🗺️ 霍格沃茨完整地图</h2>';
  html += '<div class="map-container"><pre>'+escapeHTML(mapText)+'</pre></div>';
  html += '<div class="map-legend">';
  html += '<span>📍 你当前在：<strong style="color:#ffd700;">'+player.location+'</strong></span>';
  html += '<span> | 使用 <code style="color:#ffd700;">前往 [地点名]</code> 移动</span>';
  html += '</div>';
  html += '<div class="map-legend">';
  html += '<span>[@emoji] = 在线好友的当前位置</span>';
  html += '</div>';

  // 附近可前往的地点
  const nearby = ADJACENCY[player.location] || [];
  if(nearby.length>0){
    html += '<div class="card" style="margin-top:12px;"><h3>🚶 从当前地点可前往：</h3><p>';
    html += nearby.map(l=>'<button class="btn btn-small" onclick="quickGo(\''+l+'\')">'+l+'</button>').join(' ');
    html += '</p></div>';
  }

  appendToMain(html);
}

function escapeHTML(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.quickGo = function(loc){
  $('cmdInput').value = '前往 '+loc;
  $('cmdInput').focus();
};

// ═══════════════════════════════════════════
//  好友列表
// ═══════════════════════════════════════════
function renderFriendList(){
  clearMain();
  let html = '<h2 style="color:#ffd700;">👥 好友列表</h2>';
  html += '<p style="color:#888;">共 '+FRIENDS.length+' 位好友 · 指令：<code style="color:#ffd700;">对话 [好友名] [内容]</code> 或 <code style="color:#ffd700;">邀请 [好友名] [活动]</code></p>';

  FRIENDS.forEach(f=>{
    const status = getFriendStatus(f);
    const fs = getFriendShip(f.id);
    let fsIcon = fs>=80?'💚':fs>=60?'💛':fs>=40?'🧡':'❤️';
    html += '<div class="friend-card">';
    html += '<div class="friend-avatar">'+f.emoji+'</div>';
    html += '<div class="friend-info">';
    html += '<div class="name">'+f.name+' <span style="font-size:0.8rem;color:#888;">('+f.house+')</span></div>';
    html += '<div class="details">'+f.personality+'</div>';
    html += '<div class="details">📍 '+status.loc+' | '+fsIcon+' 友好度 '+fs+'</div>';
    html += '</div>';
    html += '<span class="friend-status '+status.cls+'">'+status.text+'</span>';
    html += '</div>';
  });

  appendToMain(html);
}

// ═══════════════════════════════════════════
//  日历
// ═══════════════════════════════════════════
function renderCalendar(){
  clearMain();
  let html = '<h2 style="color:#ffd700;">📅 本周日历</h2>';

  html += '<div class="cal-grid">';
  // 表头
  html += '<div class="cell header slot-label">时段</div>';
  DAYS.forEach((d,i)=>{
    const cls = i===currentDay?'header today':'header';
    html += '<div class="cell '+cls+'">'+d+'</div>';
  });
  // 三个时段
  SLOTS.forEach((s,si)=>{
    html += '<div class="cell slot-label">'+s+'</div>';
    DAYS.forEach((d,di)=>{
      const cls = (di===currentDay&&si===currentSlot)?'cell today':'cell';
      const key = di+','+si;
      const course = player.courseSchedule[key];
      const special = SPECIAL_DATES[key];
      let content = '';
      if(course) content = '<span class="has-course">📖 '+course+'</span>';
      if(special) content += (content?'<br>':'')+'<span style="color:#ffaa00;font-size:0.7rem;">⭐ '+special+'</span>';
      // 生日
      Object.entries(BIRTHDAYS).forEach(([fid,bd])=>{
        if(bd.day===di && bd.slot===si){
          const f = getFriend(fid);
          content += (content?'<br>':'')+'<span style="color:#ff8888;font-size:0.7rem;">🎂 '+f.name+'</span>';
        }
      });
      html += '<div class="cell '+cls+'">'+ (content||'—') +'</div>';
    });
  });
  html += '</div>';

  html += '<div class="card" style="margin-top:12px;">';
  html += '<h3>📌 今日日程</h3>';
  const todayKey = currentDay+','+currentSlot;
  const todayCourse = player.courseSchedule[todayKey];
  const todaySpecial = SPECIAL_DATES[todayKey];
  if(todayCourse) html += '<p>📖 当前时段有课：<strong style="color:#ffd700;">'+todayCourse+'</strong></p>';
  else html += '<p>🕊️ 当前时段空闲，可以自由探索。</p>';
  if(todaySpecial) html += '<p>⭐ 特殊日期：<strong style="color:#ffaa00;">'+todaySpecial+'</strong></p>';
  // 生日检查
  Object.entries(BIRTHDAYS).forEach(([fid,bd])=>{
    if(bd.day===currentDay&&bd.slot===currentSlot){
      html += '<p>🎂 今天是 <strong style="color:#ff8888;">'+bd.text+'</strong>！别忘了送祝福！</p>';
    }
  });
  html += '<p style="color:#888;margin-top:8px;">当前时间：<strong style="color:#ffd700;">'+timeString()+'</strong> | 地点：<strong>'+player.location+'</strong></p>';
  html += '</div>';

  appendToMain(html);
}

// ═══════════════════════════════════════════
//  帮助
// ═══════════════════════════════════════════
function renderHelp(){
  clearMain();
  let html = '<h2 style="color:#ffd700;">📜 可用指令</h2>';
  html += '<div class="help-grid">';
  const cmds = [
    ['帮助','显示此帮助信息'],
    ['设置','打开魔法枢纽API配置'],
    ['地图','显示霍格沃茨全场景地图'],
    ['好友列表','查看所有好友及其在线状态'],
    ['日历','查看本周课程与特殊日期'],
    ['今日日程','查看当前时段安排'],
    ['前往 [地点名]','移动到目标地点（消耗一个时段）'],
    ['对话 [好友名] [内容]','与好友对话（需API）'],
    ['邀请 [好友名] [活动]','邀请好友一起活动（需API）'],
    ['课程','选择/更改课程'],
    ['探索禁林','探索禁林（需位于禁林边缘）'],
    ['魁地奇','参加魁地奇选拔'],
    ['药剂','配制魔法药剂（需位于魔药课教室）'],
    ['档案','查看巫师档案'],
    ['等待','跳过当前时段'],
  ];
  cmds.forEach(([cmd,desc])=>{
    html += '<div class="help-item"><span class="help-cmd">'+cmd+'</span><span class="help-desc">'+desc+'</span></div>';
  });
  html += '</div>';
  appendToMain(html);
}

// ═══════════════════════════════════════════
//  移动系统
// ═══════════════════════════════════════════
function moveTo(loc){
  // 精确匹配
  let target = LOCATIONS.find(l=>l===loc);
  if(!target){
    // 模糊匹配
    target = LOCATIONS.find(l=>l.includes(loc)||loc.includes(l));
  }
  if(!target) return false;

  if(target===player.location){
    appendSystemMsg('你已经在'+target+'了。');
    return true;
  }

  // 检查是否相邻
  const nearby = ADJACENCY[player.location]||[];
  if(!nearby.includes(target)){
    // 检查是否可通过大礼堂中转
    const targetNearby = ADJACENCY[target]||[];
    const shared = nearby.filter(l=>targetNearby.includes(l));
    if(shared.length>0){
      appendSystemMsg('⚠️ '+target+' 不能从 '+player.location+' 直接到达。请先前往 '+shared[0]+'。');
      return true;
    }
    appendSystemMsg('⚠️ '+target+' 无法从当前位置 '+player.location+' 直接到达。请查看地图确认路径。');
    return true;
  }

  player.location = target;
  localStorage.setItem('hp_location', target);
  advanceTime();
  updateTopBar();

  // 更新当前位置显示
  const locDisp = $('locDisplay');
  if(locDisp) locDisp.textContent = target;

  appendSystemMsg('🚶 你来到了 <strong style="color:#ffd700;">'+target+'</strong>。');

  // 检查是否有人在这里
  const here = FRIENDS.filter(f=>getFriendLocation(f.id)===target && getFriendStatus(f).status==='online');
  if(here.length>0){
    const names = here.map(f=>f.emoji+' '+f.name).join('、');
    appendSystemMsg('👋 你看到了：'+names);
  }

  // 可能触发事件
  maybeTriggerEvent();

  return true;
}

// ═══════════════════════════════════════════
//  时间推进
// ═══════════════════════════════════════════
function advanceTime(){
  currentSlot++;
  if(currentSlot>=3){
    currentSlot=0;
    currentDay++;
    if(currentDay>=7) currentDay=0;
    // 每天开始时随机移动好友位置
    moveFriendsDaily();
  }
  saveTime();
  updateTopBar();
}

function moveFriendsDaily(){
  // 给每个好友随机分配一个位置
  FRIENDS.forEach(f=>{
    if(Math.random()<0.7){ // 70%概率改变位置
      const possibleLocs = (ADJACENCY[f.defaultLoc]||[]).concat([f.defaultLoc]);
      const newLoc = possibleLocs[Math.floor(Math.random()*possibleLocs.length)];
      setFriendLocation(f.id, newLoc);
    }
  });
}

// ═══════════════════════════════════════════
//  课程
// ═══════════════════════════════════════════
function renderCourseSelection(){
  const allCourses = ['防御黑魔法','魔药学','占卜学','草药学','变形学','魔咒学','魁地奇技巧'];
  let html = '<h2 style="color:#ffd700;">📖 选课系统</h2><p>请选择你想修读的课程（可多选）：</p>';
  allCourses.forEach(c=>{
    const checked = player.courses.includes(c)?'checked':'';
    const times = COURSE_TIMES[c];
    const timeStr = times?DAYS[times.day]+SLOTS[times.slot]:'未知';
    html += '<label style="display:block;margin:6px 0;cursor:pointer;">';
    html += '<input type="checkbox" value="'+c+'" '+checked+' style="margin-right:8px;">';
    html += c+' <span style="color:#888;font-size:0.8rem;">（'+timeStr+'）</span>';
    html += '</label>';
  });
  html += '<button class="btn btn-primary" id="btnSaveCourse" style="margin-top:12px;">💾 保存课程</button>';
  html += '<div id="courseResult" style="margin-top:8px;"></div>';
  clearMain();
  appendToMain(html);

  $('btnSaveCourse').onclick = function(){
    const checked = [...document.querySelectorAll('#mainContent input[type="checkbox"]:checked')].map(i=>i.value);
    player.courses = checked;
    localStorage.setItem('hp_courses', JSON.stringify(checked));
    buildSchedule();
    $('courseResult').innerHTML = '<span style="color:#8f8;">✅ 课程已保存！</span>';
    showToast('课程已更新');
  };
}

// ═══════════════════════════════════════════
//  禁林探索
// ═══════════════════════════════════════════
function doExploreForest(){
  if(player.location!=='禁林边缘'){
    appendSystemMsg('⚠️ 你需要先到达「禁林边缘」才能探索禁林。');
    return;
  }
  if(player.forestVisited){
    appendSystemMsg('你已探索过禁林，仍记得那头巨大的独角兽。');
    return;
  }
  player.forestVisited = true;
  localStorage.setItem('hp_forest','true');
  advanceTime();
  appendSystemMsg('🌲 你小心翼翼地踏入禁林。萤火虫在枝头闪烁，远处传来低沉的呼吸声...');
  appendSystemMsg('✨ 你发现了一头银白色的独角兽！它注视了你片刻，然后优雅地消失在密林深处。');
  appendSystemMsg('📝 <strong style="color:#ffd700;">禁林探索完成！</strong>这段经历将留在你的档案中。');
}

// ═══════════════════════════════════════════
//  魁地奇
// ═══════════════════════════════════════════
function renderQuidditch(){
  const teams = ['格兰芬多','赫奇帕奇','拉文克劳','斯莱特林'];
  let html = '<h2 style="color:#ffd700;">🏟️ 魁地奇赛季</h2>';
  html += '<p>选择你要加入的球队：</p>';
  teams.forEach(t=>{
    const checked = player.quidditchTeam===t?'checked':'';
    html += '<label style="display:block;margin:6px 0;cursor:pointer;">';
    html += '<input type="radio" name="team" value="'+t+'" '+checked+' style="margin-right:8px;">'+t;
    html += '</label>';
  });
  html += '<button class="btn btn-primary" id="btnSaveTeam" style="margin-top:12px;">确认加入</button>';
  html += '<div id="teamResult" style="margin-top:8px;"></div>';
  clearMain();
  appendToMain(html);

  $('btnSaveTeam').onclick = function(){
    const sel = document.querySelector('input[name="team"]:checked');
    if(sel){
      player.quidditchTeam = sel.value;
      localStorage.setItem('hp_quidditch', sel.value);
      $('teamResult').innerHTML = '<span style="color:#8f8;">✅ 已加入 '+sel.value+' 魁地奇球队！</span>';
      showToast('已加入 '+sel.value);
    }
  };
}

// ═══════════════════════════════════════════
//  药剂
// ═══════════════════════════════════════════
function renderPotionLab(){
  if(player.location!=='魔药课教室'){
    appendSystemMsg('⚠️ 你需要先到达「魔药课教室」才能配制魔法药剂。');
    return;
  }
  const allPotions = ['旋即恢复药水','隐形药剂','极速药剂','记忆消除剂'];
  let html = '<h2 style="color:#ffd700;">🧪 药剂实验室</h2><p>选择一种药剂来配制：</p>';
  allPotions.forEach(p=>{
    const owned = player.potions.includes(p)?' (已配制)':'';
    html += '<button class="btn potion-btn" data-potion="'+p+'" style="margin:4px;">'+p+owned+'</button> ';
  });
  html += '<div id="potionResult" style="margin-top:8px;"></div>';
  clearMain();
  appendToMain(html);

  document.querySelectorAll('.potion-btn').forEach(btn=>{
    btn.onclick = function(){
      const p = this.dataset.potion;
      if(!player.potions.includes(p)){
        player.potions.push(p);
        localStorage.setItem('hp_potions', JSON.stringify(player.potions));
        $('potionResult').innerHTML = '<span style="color:#8f8;">✅ '+p+' 配制成功！</span>';
        showToast(p+' 已配制');
      } else {
        showToast('已配制过啦');
      }
    };
  });
}

// ═══════════════════════════════════════════
//  档案
// ═══════════════════════════════════════════
function renderProfile(){
  clearMain();
  let html = '<h2 style="color:#ffd700;">⚡ 巫师档案</h2>';

  html += '<div class="card"><h3>基本信息</h3>';
  html += '<p>名字：<strong style="color:#ffd700;">'+player.name+'</strong> <button class="btn btn-small" id="btnEditName">改名</button></p>';
  html += '<p>学院：<strong style="color:#ffd700;">'+player.house+'</strong> <button class="btn btn-small" id="btnChooseHouse">重新分院</button></p>';
  html += '<p>当前位置：<strong>'+player.location+'</strong></p>';
  html += '<p>当前时间：<strong style="color:#ffd700;">'+timeString()+'</strong></p>';
  html += '</div>';

  html += '<div class="card"><h3>📖 已选课程</h3><p>'+(player.courses.length?player.courses.join(', '):'暂无')+'</p></div>';
  html += '<div class="card"><h3>🌲 禁林记录</h3><p>'+(player.forestVisited?'已探险过禁林':'尚未进入')+'</p></div>';
  html += '<div class="card"><h3>🏟️ 魁地奇</h3><p>'+player.quidditchTeam+'</p></div>';
  html += '<div class="card"><h3>🧪 已配药剂</h3><p>'+(player.potions.length?player.potions.join(', '):'暂无')+'</p></div>';

  // 好友关系概览
  html += '<div class="card"><h3>💛 好友关系</h3>';
  FRIENDS.forEach(f=>{
    const fs = getFriendShip(f.id);
    html += '<p>'+f.emoji+' '+f.name+'：'+fs+'/100</p>';
  });
  html += '</div>';

  appendToMain(html);

  // 改名
  $('btnEditName').onclick = function(){
    const newName = prompt('请输入新的巫师名字', player.name);
    if(newName && newName.trim()){
      player.name = newName.trim();
      localStorage.setItem('hp_name', player.name);
      renderProfile();
      updateTopBar();
    }
  };

  // 分院
  $('btnChooseHouse').onclick = function(){
    const houses = ['格兰芬多','赫奇帕奇','拉文克劳','斯莱特林'];
    let hhtml = '<p>选择你的学院：</p>';
    houses.forEach(h=>{
      hhtml += '<button class="btn house-btn" data-house="'+h+'" style="margin:4px;">'+h+'</button> ';
    });
    hhtml += '<div id="houseResult" style="margin-top:8px;"></div>';
    clearMain();
    appendToMain('<h2 style="color:#ffd700;">🎩 分院帽</h2>'+hhtml);
    document.querySelectorAll('.house-btn').forEach(b=>{
      b.onclick = function(){
        player.house = this.dataset.house;
        localStorage.setItem('hp_house', player.house);
        showToast('分院至 '+player.house+'！');
        renderProfile();
      };
    });
  };
}

// ═══════════════════════════════════════════
//  好友对话 (API)
// ═══════════════════════════════════════════
async function doTalk(friendName, message){
  if(!apiManager.isConfigured()){
    appendSystemMsg('🦉 请先在「设置」中配置魔法枢纽API连接。猫头鹰需要知道往哪里飞。');
    return;
  }

  const friend = FRIENDS.find(f=>f.name===friendName || f.name.includes(friendName));
  if(!friend){
    appendSystemMsg('❓ 找不到这位好友：「'+friendName+'」。输入「好友列表」查看所有好友。');
    return;
  }

  // 更新好友位置
  setFriendLocation(friend.id, player.location);
  appendToMain('<div class="chat-msg chat-player"><strong>你</strong>（对 '+friend.emoji+' '+escapeHTML(friend.name)+'）：'+escapeHTML(message)+'</div>');

  // 构建对话上下文
  const history = getChatHistory(friend.id);
  const fs = getFriendShip(friend.id);
  const systemPrompt = `你正在扮演霍格沃茨魔法学校的学生 ${friend.name}（${friend.house}学院）。
你的性格特点：${friend.personality}
你对玩家（${player.name}，${player.house}学院学生）的友好度是 ${fs}/100。
你当前在霍格沃茨的「${player.location}」。
请用符合角色性格的方式回复，语气自然，像一个真实的同学在聊天。
回复要简短自然（2-4句话），用中文。
不要输出任何前缀、标签或思考过程，直接输出角色对话内容。
如果友好度很低（<30），语气会冷淡或不耐烦；如果友好度高（>70），语气会热情友好。`;

  const messages = [{ role:'system', content: systemPrompt }];
  // 添加历史
  history.forEach(h=>{
    messages.push({ role:'user', content: h.user });
    messages.push({ role:'assistant', content: h.npc });
  });
  messages.push({ role:'user', content: message });

  try {
    const reply = await apiManager.chatCompletion(messages);
    appendToMain('<div class="chat-msg chat-npc"><div class="sender">'+friend.emoji+' '+escapeHTML(friend.name)+'</div>'+escapeHTML(reply)+'</div>');
    // 保存历史
    history.push({ user: message, npc: reply });
    saveChatHistory(friend.id, history);
    // 友好度微调
    adjustFriendShip(friend.id, 1);
  } catch(e){
    const errMsg = apiManager.getFriendlyError(e);
    appendSystemMsg(errMsg);
  }
}

// ═══════════════════════════════════════════
//  邀请好友 (API)
// ═══════════════════════════════════════════
async function doInvite(friendName, activity){
  if(!apiManager.isConfigured()){
    appendSystemMsg('🦉 请先在「设置」中配置魔法枢纽API连接。猫头鹰需要知道往哪里飞。');
    return;
  }

  const friend = FRIENDS.find(f=>f.name===friendName || f.name.includes(friendName));
  if(!friend){
    appendSystemMsg('❓ 找不到这位好友：「'+friendName+'」。');
    return;
  }

  setFriendLocation(friend.id, player.location);

  appendSystemMsg('📨 你向 '+friend.emoji+' '+friend.name+' 发出邀请：「'+activity+'」...');

  const fs = getFriendShip(friend.id);
  const systemPrompt = `你正在扮演霍格沃茨魔法学校的学生 ${friend.name}（${friend.house}学院）。
你的性格特点：${friend.personality}
玩家 ${player.name}（${player.house}学院）邀请你「${activity}」。你对玩家的友好度是 ${fs}/100。
你当前在霍格沃茨的「${player.location}」。
请判断你是否接受这个邀请，并给出符合角色性格的回应。
如果友好度很低（<30），大概率拒绝；如果友好度高（>70），大概率接受。
回复格式：第一行是「接受」或「拒绝」，第二行是角色对话（2-3句话，中文）。
不要输出任何其他内容。`;

  const messages = [
    { role:'system', content: systemPrompt },
    { role:'user', content: player.name+' 邀请你：'+activity }
  ];

  try {
    const reply = await apiManager.chatCompletion(messages);
    const lines = reply.trim().split('\n');
    const decision = lines[0].trim();
    const dialog = lines.slice(1).join('\n').trim();

    if(decision.includes('接受')){
      appendToMain('<div class="chat-msg chat-npc"><div class="sender">'+friend.emoji+' '+escapeHTML(friend.name)+'</div>'+escapeHTML(dialog)+'</div>');
      appendSystemMsg('✅ '+escapeHTML(friend.name)+' 接受了你的邀请！你们一起度过了愉快的时光。');
      adjustFriendShip(friend.id, 3);
      // 邀请活动也消耗时间
      advanceTime();
      maybeTriggerEvent();
    } else {
      appendToMain('<div class="chat-msg chat-npc"><div class="sender">'+friend.emoji+' '+escapeHTML(friend.name)+'</div>'+escapeHTML(dialog)+'</div>');
      appendSystemMsg('❌ '+escapeHTML(friend.name)+' 婉拒了你的邀请。');
    }
  } catch(e){
    const errMsg = apiManager.getFriendlyError(e);
    appendSystemMsg(errMsg);
  }
}

// ═══════════════════════════════════════════
//  动态事件 (API)
// ═══════════════════════════════════════════
let currentEvent = null; // { description, options: [{text, prompt}] }

async function maybeTriggerEvent(){
  // 30%概率触发事件
  if(Math.random()>0.3) return;
  if(!apiManager.isConfigured()) return;

  const context = {
    playerName: player.name,
    playerHouse: player.house,
    playerLocation: player.location,
    currentTime: timeString(),
    courses: player.courses,
    friendship: FRIENDS.map(f=>({ name: f.name, house: f.house, friendship: getFriendShip(f.id) })),
    forestVisited: player.forestVisited,
    quidditchTeam: player.quidditchTeam,
    nearbyFriends: FRIENDS.filter(f=>getFriendLocation(f.id)===player.location).map(f=>f.name)
  };

  const systemPrompt = `你是一个霍格沃茨魔法世界的动态事件生成器。
根据当前玩家的状态，创造一个有趣的意外事件。

玩家当前状态：
- 名字：${context.playerName}，${context.playerHouse}学院
- 时间：${context.currentTime}
- 地点：霍格沃茨「${context.playerLocation}」
- 已选课程：${context.courses.join(', ')||'无'}
- 当前地点附近的好友：${context.nearbyFriends.join(', ')||'无'}
- 已探索禁林：${context.forestVisited?'是':'否'}
- 魁地奇球队：${context.quidditchTeam}

请生成一个简短的意外事件（2-3句话描述场景），并提供2-3个选项供玩家选择。
每个选项需要包含选项文本和选择后可能发生什么的简短提示。

输出格式（严格JSON）：
{
  "description": "事件描述（中文，2-3句话）",
  "options": [
    {"text": "选项1文本", "hint": "选择后的简短提示"},
    {"text": "选项2文本", "hint": "选择后的简短提示"}
  ]
}
选项数量可以是2个或3个。只输出JSON，不要其他内容。`;

  try {
    const resp = await apiManager.chatCompletion([{ role:'system', content: systemPrompt }]);
    // 解析JSON
    let eventData;
    try {
      // 尝试提取JSON
      const jsonMatch = resp.match(/\{[\s\S]*\}/);
      eventData = JSON.parse(jsonMatch?jsonMatch[0]:resp);
    } catch(e){
      console.error('Failed to parse event JSON:', resp);
      return;
    }

    currentEvent = eventData;

    // 渲染事件卡片
    let html = '<div class="event-card" id="eventCard">';
    html += '<h3>⚡ 意外事件！</h3>';
    html += '<p style="line-height:1.7;">'+eventData.description+'</p>';
    html += '<div class="event-options">';
    eventData.options.forEach((opt,i)=>{
      html += '<button class="btn event-option-btn" data-index="'+i+'">'+(i+1)+'. '+opt.text+'</button>';
    });
    html += '</div>';
    html += '</div>';
    appendToMain(html);

    // 绑定选择事件
    document.querySelectorAll('.event-option-btn').forEach(btn=>{
      btn.onclick = async function(){
        const idx = parseInt(this.dataset.index);
        await handleEventChoice(idx);
      };
    });

    // 滚动到事件卡片
    setTimeout(()=>{
      const card = $('eventCard');
      if(card) card.scrollIntoView({ behavior:'smooth' });
    }, 100);

  } catch(e){
    console.error('Event generation failed:', e);
  }
}

async function handleEventChoice(idx){
  if(!currentEvent) return;
  const choice = currentEvent.options[idx];

  // 禁用所有选项按钮
  document.querySelectorAll('.event-option-btn').forEach(b=>b.disabled=true);

  const context = {
    eventDescription: currentEvent.description,
    playerName: player.name,
    playerHouse: player.house,
    playerLocation: player.location,
    currentTime: timeString(),
    chosenOption: choice.text
  };

  const systemPrompt = `玩家在霍格沃茨遇到了一个意外事件，并做出了选择。

事件：${context.eventDescription}
玩家的选择：${context.chosenOption}

请描述这个选择带来的结果（3-5句话，中文），要符合哈利波特世界观。
结果可以包括：获得/失去物品、友好度变化暗示、发现新信息、遇到新角色等。
保持有趣和沉浸感，但不要过于夸张。
直接输出结果描述，不要前缀。`;

  try {
    const result = await apiManager.chatCompletion([{ role:'system', content: systemPrompt }]);
    appendToMain('<div class="chat-msg chat-system">📜 '+escapeHTML(result)+'</div>');
  } catch(e){
    appendSystemMsg(apiManager.getFriendlyError(e));
  }

  // 移除事件卡片
  const card = $('eventCard');
  if(card) card.style.display = 'none';
  currentEvent = null;
}

// ═══════════════════════════════════════════
//  等待
// ═══════════════════════════════════════════
function doWait(){
  advanceTime();
  appendSystemMsg('⏳ 时间流逝... 现在是 <strong style="color:#ffd700;">'+timeString()+'</strong>。');
  maybeTriggerEvent();
}

// ═══════════════════════════════════════════
//  命令解析器
// ═══════════════════════════════════════════
function parseCommand(raw){
  const cmd = raw.trim();
  if(!cmd) return;

  // 添加用户输入到界面
  appendToMain('<div style="color:#666;font-size:0.8rem;margin:4px 0;">&gt; '+escapeHTML(cmd)+'</div>');

  const lower = cmd.toLowerCase();

  // 帮助
  if(lower==='帮助'||lower==='help'){ renderHelp(); return; }

  // 设置
  if(lower==='设置'||lower==='shezhi'||lower==='settings'){ openSettings(); return; }

  // 地图
  if(lower==='地图'||lower==='map'){ renderMap(); return; }

  // 好友列表
  if(lower==='好友列表'||lower==='friends'){ renderFriendList(); return; }

  // 日历
  if(lower==='日历'||lower==='calendar'){ renderCalendar(); return; }

  // 今日日程
  if(lower==='今日日程'||lower==='schedule'){ renderCalendar(); return; }

  // 课程
  if(lower==='课程'||lower==='选课'||lower==='course'){ renderCourseSelection(); return; }

  // 魁地奇
  if(lower==='魁地奇'||lower==='quidditch'){ renderQuidditch(); return; }

  // 药剂
  if(lower==='药剂'||lower==='potions'||lower==='potion'){ renderPotionLab(); return; }

  // 档案
  if(lower==='档案'||lower==='profile'){ renderProfile(); return; }

  // 等待
  if(lower==='等待'||lower==='wait'){ doWait(); return; }

  // 探索禁林
  if(lower==='探索禁林'||lower==='forest'){ doExploreForest(); return; }

  // 前往 [地点]
  const goMatch = cmd.match(/^前往\s+(.+)/);
  if(goMatch){
    const success = moveTo(goMatch[1].trim());
    if(!success){
      appendSystemMsg('❓ 找不到地点：「'+goMatch[1].trim()+'」。输入「地图」查看所有地点。');
    }
    return;
  }

  // 对话 [好友名] [内容]
  const talkMatch = cmd.match(/^对话\s+(.+?)\s+(.+)/);
  if(talkMatch){
    doTalk(talkMatch[1].trim(), talkMatch[2].trim());
    return;
  }

  // 邀请 [好友名] [活动]
  const inviteMatch = cmd.match(/^邀请\s+(.+?)\s+(.+)/);
  if(inviteMatch){
    doInvite(inviteMatch[1].trim(), inviteMatch[2].trim());
    return;
  }

  // 未识别
  appendSystemMsg('❓ 无法识别指令：「'+cmd+'」。输入「帮助」查看可用指令。');
}

// ═══════════════════════════════════════════
//  初始化
// ═══════════════════════════════════════════
function init(){
  // 构建课表
  buildSchedule();

  // 初始化好友位置
  FRIENDS.forEach(f=>{
    if(!localStorage.getItem('hp_floc_'+f.id)){
      setFriendLocation(f.id, f.defaultLoc);
    }
  });

  // 更新顶部栏
  updateTopBar();

  // 绑定命令输入
  const cmdInput = $('cmdInput');
  cmdInput.addEventListener('keydown', function(e){
    if(e.key==='Enter'){
      const cmd = this.value;
      this.value = '';
      parseCommand(cmd);
    }
  });

  // 点击背景关闭设置
  $('settingsPanel').addEventListener('click', function(e){
    if(e.target===this) closeSettings();
  });

  // 更新locDisplay
  const locDisp = $('locDisplay');
  if(locDisp) locDisp.textContent = player.location;

  // 欢迎信息
  setTimeout(()=>{
    appendSystemMsg('🦉 提示：输入「帮助」查看所有可用指令。输入「设置」配置魔法枢纽API。');
  }, 500);
}

// 启动
document.addEventListener('DOMContentLoaded', init);
