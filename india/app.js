/* تحدّي الهند — مسابقة حيّة لأولياء الأمور
   شاشة المعلمة (?host=1) + جوالات أولياء الأمور (?r=رمز). التزامن عبر MQTT مجاني بلا حسابات. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const app = $('#app');
const P = new URLSearchParams(location.search);
const BASE = location.href.split('?')[0].split('#')[0];

/* ---------- الخوادم المجانية (يجرّبها بالترتيب) ---------- */
let BROKERS = { h: 'wss://broker.hivemq.com:8884/mqtt', e: 'wss://broker.emqx.io:8084/mqtt', m: 'wss://test.mosquitto.org:8081/mqtt' };
let ORDER = ['h', 'e', 'm'];
if (P.get('bu')) { BROKERS = { x: P.get('bu') }; ORDER = ['x']; }       // للتجربة فقط
const NS = 'yasmina-india/v1/';

/* ---------- الأسئلة ---------- */
const Q = [
 { t: 'ما الدولة الأكثر سكانًا في العالم اليوم؟', o: ['الصين', 'الولايات المتحدة', 'الهند', 'إندونيسيا'], c: 2, img: 'img/globe.jpg',
   f: 'تجاوزت الهند الصين عام 2023 بحسب الأمم المتحدة، ويزيد سكانها على 1.4 مليار نسمة… أي نحو سُدس سكان العالم!' },
 { t: 'ما اسم هذا المَعلم الشهير في نيودلهي؟', o: ['القلعة الحمراء', 'بوابة الهند', 'قطب منار', 'باب البحرين'], c: 1, img: 'img/gate.jpg',
   f: 'بوابة الهند نُصب تذكاري بارتفاع 42 مترًا، نُقشت عليه أسماء آلاف الجنود الهنود الذين قضوا في الحرب العالمية الأولى.' },
 { t: 'بنى الإمبراطور المغولي المسلم «شاه جهان» تاج محل تخليدًا لذكرى…', o: ['والدته', 'ابنته', 'معلّمه', 'زوجته ممتاز محل'], c: 3, img: 'img/taj.jpg',
   f: 'استغرق بناؤه نحو 20 عامًا بأيدي قرابة 20 ألف عامل، واختير عام 2007 ضمن عجائب الدنيا السبع الجديدة. وشاه جهان نفسه بنى «المسجد الجامع» الكبير في دلهي.' },
 { t: 'الأرقام 1 2 3 التي يسمّيها العالم «الأرقام العربية»… من أين أصلها الأول؟', o: ['الهند', 'اليونان', 'الرومان', 'الصين'], c: 0, svg: 'digits',
   f: 'طوّرها علماء الهند، ثم نقلها علماء المسلمين كالخوارزمي إلى العالم؛ لذلك نسمّي أرقامنا (١ ٢ ٣) «الأرقام الهندية»، ويسمّي الغرب أرقامه «العربية»!' },
 { t: 'في البحرين ما زال كثيرون يسمّون الـ 100 فلس «روبية»… لماذا؟', o: ['لأنها كلمة فارسية تعني «مئة»', 'لأن الروبية الهندية كانت عملة البحرين', 'نسبةً إلى سوق قديم في المنامة', 'لأنها أصغر عملة في الخليج'], c: 1, svg: 'coin', d: 25,
   f: 'ظلّت الروبية الهندية ثم «روبية الخليج» متداولة في البحرين، حتى صدر الدينار البحريني عام 1965 بقيمة 10 روبيات… فبقي اسم «الروبية» للـ 100 فلس إلى اليوم!' },
 { t: 'دارجيلنغ، آسام، نيلغيري… أسماء مناطق هندية تشتهر عالميًا بـ…', o: ['القطن', 'الحرير', 'الشاي', 'الأرز'], c: 2, img: 'img/tea.jpg',
   f: 'الهند من أكبر منتجي الشاي في العالم، وشاي «الكرك» المحبوب في الخليج مستوحى من «الماسالا تشاي» الهندي بالحليب والهيل.' },
 { t: 'يُلقَّب الفلفل الأسود بـ«ملك التوابل»… فمَن «ملكة التوابل» التي نضعها في القهوة العربية؟', o: ['الزعفران', 'الهيل', 'القرنفل', 'الزنجبيل'], c: 1, img: 'img/spices.jpg', d: 25,
   f: 'يُزرع الهيل في جبال جنوب غرب الهند الرطبة، وكانت سفن الخليج تجلبه مع البهارات منذ قرون. والهند من أكبر منتجي التوابل في العالم.' },
 { t: 'النمر البنغالي هو الحيوان الوطني للهند… كم نسبة نمور العالم البرية التي تعيش فيها؟', o: ['75٪', '50٪', '25٪', '10٪'], c: 0, img: 'img/tiger.jpg', d: 25,
   f: 'بحسب إحصاء 2022 يعيش في الهند نحو 3,682 نمرًا بريًا، بعد أن هبط العدد إلى 1,411 فقط عام 2006.' },
 { t: 'في الهند قرية تُعدّ الأكثر مطرًا على وجه الأرض… كم متوسط أمطارها في السنة؟', o: ['نحو 1,000 ملم', 'نحو 3,000 ملم', 'نحو 6,000 ملم', 'نحو 11,800 ملم'], c: 3, svg: 'rain', d: 25,
   f: 'إنها قرية «ماوسينرام» في ولاية ميغالايا، صاحبة رقم غينيس القياسي… أي ما يعادل أمطار البحرين لأكثر من 100 سنة!' },
 { t: 'في 2023 أصبحت الهند أول دولة في العالم تُنزل مركبة فضائية قرب…', o: ['القطب الشمالي للقمر', 'سطح المريخ', 'القطب الجنوبي للقمر', 'كوكب الزهرة'], c: 2, svg: 'moon',
   f: 'هبطت مهمة «تشاندرايان-3» يوم 23 أغسطس 2023، لتصبح الهند رابع دولة تهبط على القمر، والأولى قرب قطبه الجنوبي.' },
 { t: 'كم عدد الولايات في الهند؟', o: ['28 ولاية', '7 ولايات', '15 ولاية', '50 ولاية'], c: 0, img: 'img/flag.jpg',
   f: 'في الهند 28 ولاية و8 أقاليم اتحادية، ويعترف دستورها بـ 22 لغة رسمية!' },
 { t: 'ما أكبر جالية أجنبية تعيش في مملكة البحرين؟', o: ['الفلبينية', 'البنغالية', 'الهندية', 'الباكستانية'], c: 2, svg: 'bh', x2: true,
   f: 'يعيش في البحرين نحو 350 ألف هندي، والصلة بين البلدين قديمة جدًا؛ فقد كانت سفن «دلمون» تتاجر مع حضارة وادي السند قبل آلاف السنين.' },
];
const DUR = q => (q.d || 20) * 1000;
const PRE = 4500;
const AV = ['🐯', '🦚', '🐘', '🪷', '🥭', '🐒', '🫖', '🌶️', '🛺', '🥥', '🌺', '🏏'];
const OCOL = ['o0', 'o1', 'o2', 'o3'];
const SHAPES = [
  '<svg class="shape" viewBox="0 0 24 24"><path d="M12 3 22 20H2z"/></svg>',
  '<svg class="shape" viewBox="0 0 24 24"><path d="M12 2 22 12 12 22 2 12z"/></svg>',
  '<svg class="shape" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  '<svg class="shape" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n || 0).toLocaleString('en-US');
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
             set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
             del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
const uid = () => Math.random().toString(36).slice(2, 10);
let toastT;
function toast(m, ms = 3200) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = m; t.classList.remove('hide'); clearTimeout(toastT); if (ms) toastT = setTimeout(() => t.classList.add('hide'), ms); }

/* ---------- رسومات بسيطة للأسئلة بدون صورة ---------- */
const ART = {
  digits: `<svg viewBox="0 0 320 220" width="320" height="220"><rect width="320" height="220" rx="22" fill="#fff6e6" stroke="#e9a23b" stroke-width="6"/>
    <text x="160" y="95" text-anchor="middle" font-family="Taj" font-weight="800" font-size="70" fill="#8e1446">١ ٢ ٣</text>
    <text x="160" y="185" text-anchor="middle" font-family="Taj" font-weight="800" font-size="70" fill="#1f3f94" direction="ltr">1 2 3</text>
    <path d="M150 112v28M140 130l10 12 10-12" stroke="#e9a23b" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  coin: `<svg viewBox="0 0 260 260" width="250" height="250"><defs><radialGradient id="cg" cx=".4" cy=".35"><stop offset="0" stop-color="#fff1b8"/><stop offset=".6" stop-color="#e9b445"/><stop offset="1" stop-color="#a8641a"/></radialGradient></defs>
    <circle cx="130" cy="130" r="118" fill="url(#cg)" stroke="#8a4f12" stroke-width="6"/><circle cx="130" cy="130" r="96" fill="none" stroke="#8a4f12" stroke-width="3" stroke-dasharray="4 7"/>
    <text x="130" y="135" text-anchor="middle" font-family="Taj" font-weight="800" font-size="76" fill="#5a2c06" direction="ltr">100</text>
    <text x="130" y="185" text-anchor="middle" font-family="Taj" font-weight="800" font-size="34" fill="#5a2c06">فلس</text></svg>`,
  rain: `<svg viewBox="0 0 300 230" width="300" height="230"><g fill="#fff6e6"><circle cx="105" cy="85" r="48"/><circle cx="165" cy="65" r="58"/><circle cx="215" cy="95" r="42"/><rect x="70" y="85" width="180" height="52" rx="26"/></g>
    <g stroke="#7fc8ff" stroke-width="7" stroke-linecap="round">${[0,1,2,3,4,5,6].map(i=>`<line x1="${88+i*24}" y1="${158+(i%2)*12}" x2="${80+i*24}" y2="${186+(i%2)*12}"><animate attributeName="opacity" values="1;.2;1" dur="${1+i%3*.3}s" repeatCount="indefinite"/></line>`).join('')}</g></svg>`,
  moon: `<svg viewBox="0 0 280 250" width="280" height="250"><circle cx="140" cy="125" r="110" fill="#e7e2d6"/><circle cx="95" cy="90" r="20" fill="#cfc8b8"/><circle cx="175" cy="70" r="12" fill="#cfc8b8"/><circle cx="185" cy="150" r="24" fill="#cfc8b8"/><circle cx="110" cy="165" r="10" fill="#cfc8b8"/>
    <g transform="translate(140 222)"><rect x="-18" y="-26" width="36" height="22" rx="4" fill="#f6c453"/><path d="M-14-4-26 10M14-4 26 10" stroke="#f6c453" stroke-width="4"/><circle cy="-34" r="7" fill="#fff"/></g>
    <text x="140" y="248" text-anchor="middle" font-family="Taj" font-weight="800" font-size="18" fill="#fff6e6">القطب الجنوبي ؟</text></svg>`,
  bh: `<svg viewBox="0 0 300 200" width="300" height="200"><rect width="300" height="200" rx="16" fill="#ce1126"/><path d="M0 0h90l-30 20 30 20-30 20 30 20-30 20 30 20-30 20 30 20-30 20 30 20H0z" fill="#fff"/></svg>`
};
const mediaHTML = q => q.img ? `<img src="${q.img}" alt="">` : (q.svg ? ART[q.svg] : '');

/* ---------- MQTT ---------- */
function tryConnect(k, ms = 7000) {
  return new Promise((res, rej) => {
    let done = false;
    const c = mqtt.connect(BROKERS[k], { clientId: 'yi_' + uid(), clean: true, reconnectPeriod: 2000, connectTimeout: ms, keepalive: 30, protocolVersion: 4 });
    const to = setTimeout(() => { if (!done) { done = true; c.end(true); rej(new Error('timeout')); } }, ms + 500);
    c.once('connect', () => { if (!done) { done = true; clearTimeout(to); res(c); } });
    c.on('error', () => {});
  });
}
function statusDot(c) {
  c.on('offline', () => toast('⚠️ انقطع الاتصال… جاري إعادة الاتصال', 0));
  c.on('reconnect', () => toast('⏳ جاري إعادة الاتصال…', 0));
  c.on('connect', () => { const t = $('.toast'); if (t && /الاتصال/.test(t.textContent)) toast('✅ عاد الاتصال', 1800); });
}

/* ---------- صوت خفيف (بدون موسيقى ولا إيقاع) ---------- */
let AC = null, muted = ls.get('yi_mute', false);
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function bell(freqs, dur = 1.2, vol = .12, delay = 0) {
  if (muted) return; const a = ac(); if (!a) return; const t0 = a.currentTime + delay;
  freqs.forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol / (i + 1), t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + .05); });
}
const sfx = { join: () => bell([880, 1320], .5, .08), go: () => bell([660, 990], .8, .1), reveal: () => bell([784, 1176, 1568], 1.6, .12), end: () => { bell([523, 784], 1.4, .1); bell([659, 988], 1.6, .1, .25); bell([784, 1176, 1568], 2.2, .12, .5); } };

/* ---------- قصاصات احتفال ---------- */
function confetti(ms = 5000) {
  const cv = $('#fx'), x = cv.getContext('2d'); const W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio;
  cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  const cols = ['#f6c453', '#f28c28', '#138a3c', '#ffffff', '#c2185b', '#7fc8ff'];
  const ps = Array.from({ length: 170 }, () => ({ x: Math.random() * W, y: -Math.random() * H * .6, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, s: (6 + Math.random() * 8) * devicePixelRatio, c: cols[Math.random() * cols.length | 0] }));
  const end = performance.now() + ms;
  (function f(t) { x.clearRect(0, 0, W, H); ps.forEach(p => { p.x += p.vx; p.y += p.vy * devicePixelRatio; p.r += p.vr; if (p.y > H && t < end - 1200) { p.y = -20; p.x = Math.random() * W; }
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
    if (t < end) requestAnimationFrame(f); else x.clearRect(0, 0, W, H); })(performance.now());
}
let wake = null;
async function keepAwake() { try { if ('wakeLock' in navigator && document.visibilityState === 'visible') wake = await navigator.wakeLock.request('screen'); } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wake !== null) keepAwake(); });

/* =========================================================
   الصفحة الأولى (بدون رمز)
   ========================================================= */
function landing() {
  document.body.className = 'player';
  app.innerHTML = `<div class="scr land">
    <div class="hero"></div>
    <h1 class="ttl h"><small>رحلتي إلى الهند 🇮🇳</small>تحدّي الهند للكبار</h1>
    <div class="two">
      <a class="btn" href="?host=1">👩‍🏫 أنا المعلمة — ابدأ المسابقة</a>
      <button class="btn ghost" id="byCode">📱 عندي رمز المسابقة</button>
    </div>
    <div id="codeBox" class="hide" style="width:min(360px,90vw);display:flex;flex-direction:column;gap:.7em">
      <input class="field" id="code" inputmode="numeric" maxlength="4" placeholder="اكتب الرمز (4 أرقام)">
      <button class="btn" id="goCode">دخول</button>
    </div></div>`;
  $('#byCode').onclick = () => { $('#codeBox').classList.remove('hide'); $('#code').focus(); };
  $('#goCode').onclick = () => { const c = $('#code').value.replace(/\D/g, ''); if (c.length === 4) location.href = '?r=' + c; else toast('الرمز 4 أرقام'); };
}

/* =========================================================
   شاشة المعلمة
   ========================================================= */
function host() {
  document.body.className = 'host';
  let G = ls.get('yi_host', null), cl = null, tick = null, lastPub = 0, pubT = null;
  const save = () => ls.set('yi_host', G);
  const fresh = () => ({ room: '', bk: '', ph: 'lobby', qi: -1, t0: 0, seq: 1, pl: {}, ans: {}, order: [], prevRank: {} });

  if (G && G.room && G.ph !== 'lobby' && G.ph !== 'end') {
    app.innerHTML = `<div class="scr land"><h1 class="ttl h"><small>مسابقة غير مكتملة</small>نكمل من حيث وقفنا؟</h1>
      <p>السؤال ${G.qi + 1} من ${Q.length} — ${Object.keys(G.pl).length} مشارك</p>
      <div class="two"><button class="btn" id="cont">▶️ استكمال المسابقة</button><button class="btn ghost" id="neu">🔄 مسابقة جديدة</button></div></div>`;
    $('#cont').onclick = () => { ac(); boot(false); };
    $('#neu').onclick = () => { ac(); boot(true); };
  } else boot(!G || !G.room || G.ph === 'end');

  async function boot(isNew) {
    app.innerHTML = `<div class="scr"><div class="bigav">🇮🇳</div><p class="h" style="font-size:1.6em">جاري تجهيز المسابقة…</p><div class="dots"><i></i><i></i><i></i></div></div>`;
    const oldRoom = G && G.room, oldBk = G && G.bk;
    if (isNew) G = fresh();
    const order = (!isNew && G.bk && BROKERS[G.bk]) ? [G.bk, ...ORDER.filter(k => k !== G.bk)] : ORDER;
    for (const k of order) { try { cl = await tryConnect(k); G.bk = k; break; } catch (e) {} }
    if (!cl) { app.innerHTML = `<div class="scr land"><h1 class="ttl h">تعذّر الاتصال 😕</h1><p>تأكدي أن الآيباد متصل بالإنترنت. إذا كانت شبكة المدرسة تحجب الاتصال، جرّبي نقطة اتصال (Hotspot) من الجوال.</p><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div>`; return; }
    statusDot(cl);
    if (isNew) {
      if (oldRoom && oldBk === G.bk) cl.publish(NS + oldRoom + '/st', '', { retain: true, qos: 1 });   // تنظيف المسابقة القديمة
      G.room = String(1000 + Math.floor(Math.random() * 9000));
    }
    const T = NS + G.room + '/';
    cl.subscribe([T + 'j', T + 'a'], { qos: 1 });
    cl.on('message', (topic, buf) => {
      let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
      if (!m || typeof m.p !== 'string') return;
      if (topic === T + 'j') onJoin(m); else if (topic === T + 'a') onAns(m);
    });
    save(); keepAwake(); render(); publish(true);
    if (G.ph === 'q' || G.ph === 'pre') loop();
  }

  function onJoin(m) {
    const n = String(m.n || '').trim().slice(0, 22) || 'ضيف', a = AV.includes(m.a) ? m.a : '🐯';
    const isNew = !G.pl[m.p];
    if (isNew) { G.pl[m.p] = { n, a, s: 0, k: 0, ok: 0, last: null, t: 0 }; G.order.push(m.p); }
    else { G.pl[m.p].n = n; G.pl[m.p].a = a; }
    save();
    if (isNew) { sfx.join(); if (G.ph === 'lobby') renderLobbyPlayers(); }
    publish(true);
  }
  function onAns(m) {
    if (G.ph !== 'q' || m.q !== G.qi || !G.pl[m.p] || G.ans[m.p]) return;
    const ms = Date.now() - G.t0, q = Q[G.qi];
    if (ms > DUR(q) + 1000) return;
    const c = m.c | 0; if (c < 0 || c > 3) return;
    G.ans[m.p] = { c, ms };
    save(); updCount();
    if (Object.keys(G.ans).length >= Object.keys(G.pl).length) setTimeout(() => { if (G.ph === 'q') reveal(); }, 700);
    else publish(false);
  }

  function ranks() {
    const ids = Object.keys(G.pl).sort((a, b) => G.pl[b].s - G.pl[a].s || G.order.indexOf(a) - G.order.indexOf(b));
    const r = {}; ids.forEach((id, i) => { r[id] = (i > 0 && G.pl[ids[i - 1]].s === G.pl[id].s) ? r[ids[i - 1]] : i + 1; });
    return { ids, r };
  }
  function publish(force) {
    if (!cl) return;
    const now = Date.now();
    if (!force && now - lastPub < 700) { clearTimeout(pubT); pubT = setTimeout(() => publish(true), 700 - (now - lastPub)); return; }
    lastPub = now;
    const { ids, r } = ranks(), q = Q[G.qi];
    const R = {}; ids.forEach(id => { const p = G.pl[id]; R[id] = [p.s, r[id], p.last ? p.last.g : 0, p.last ? p.last.ok : -1, p.k, p.last ? p.last.q : -1]; });
    const msg = { s: G.seq++, ph: G.ph, qi: G.qi, tot: Q.length, n: ids.length, R, at: now };
    if (G.ph === 'q') { msg.rem = Math.max(0, G.t0 + DUR(q) - now); msg.na = Object.keys(G.ans).length; msg.mine = {}; Object.keys(G.ans).forEach(id => msg.mine[id] = 1); }
    if (G.ph === 'pre') msg.rem = Math.max(0, G.t0 - now);
    if (G.ph === 'rv') { msg.cnt = counts(); }
    cl.publish(NS + G.room + '/st', JSON.stringify(msg), { retain: true, qos: 1 });
    save();
  }
  const counts = () => { const c = [0, 0, 0, 0]; Object.values(G.ans).forEach(a => c[a.c]++); return c; };

  /* ---- انتقالات ---- */
  function startQ(i) {
    G.qi = i; G.ph = 'pre'; G.ans = {}; G.t0 = Date.now() + PRE;
    const rk = ranks().r; G.prevRank = rk;
    save(); render(); publish(true); sfx.go(); loop();
  }
  function openQ() { G.ph = 'q'; G.t0 = Date.now(); save(); render(); publish(true); }
  function reveal() {
    if (G.ph !== 'q') return;
    const q = Q[G.qi];
    G.prevRank = ranks().r;
    Object.keys(G.pl).forEach(id => {
      const p = G.pl[id], a = G.ans[id];
      if (a && a.c === q.c) { const g = Math.round((500 + 500 * Math.max(0, 1 - a.ms / DUR(q))) * (q.x2 ? 2 : 1)); p.s += g; p.k++; p.ok++; p.last = { q: G.qi, ok: 1, g }; }
      else { p.k = 0; p.last = { q: G.qi, ok: a ? 0 : -1, g: 0 }; }
    });
    G.ph = 'rv'; save(); render(); publish(true); sfx.reveal();
  }
  function next() {
    if (G.ph === 'rv') { if (G.qi >= Q.length - 1) { G.ph = 'end'; save(); render(); publish(true); sfx.end(); confetti(9000); } else { G.ph = 'lb'; save(); render(); publish(true); } }
    else if (G.ph === 'lb') startQ(G.qi + 1);
  }
  function loop() {
    cancelAnimationFrame(tick); let lastBeat = 0;
    const f = () => {
      const now = Date.now();
      if (G.ph === 'pre') { if (now >= G.t0) openQ(); }
      else if (G.ph === 'q') {
        const q = Q[G.qi], rem = G.t0 + DUR(q) - now;
        drawRing(rem, DUR(q));
        if (now - lastBeat > 2000) { lastBeat = now; publish(true); }
        if (rem <= 0) { reveal(); return; }
      } else return;
      tick = requestAnimationFrame(f);
    };
    tick = requestAnimationFrame(f);
  }
  function drawRing(rem, dur) {
    const el = $('.ring'); if (!el) return; const s = Math.ceil(rem / 1000);
    const c = el.querySelector('circle.fg'); c.style.strokeDashoffset = 289 * (1 - Math.max(0, rem) / dur);
    const n = el.querySelector('.n'); if (n.textContent !== String(s)) n.textContent = Math.max(0, s);
    el.classList.toggle('hurry', s <= 5);
  }
  function updCount() { const e = $('#na'); if (e) e.textContent = Object.keys(G.ans).length; }

  /* ---- الرسم ---- */
  const topbar = (extra = '') => `<div class="topbar"><div class="grp"><span class="pill">🇮🇳 تحدّي الهند</span>${extra}</div>
    <div class="grp"><span class="pill">👥 <span id="np">${Object.keys(G.pl).length}</span></span><span class="pill" dir="ltr">#${G.room}</span>
    <button class="ico" id="mute" title="الصوت">${muted ? '🔇' : '🔊'}</button><button class="ico" id="fs" title="ملء الشاشة">⛶</button><button class="ico" id="menu" title="خيارات">⋯</button></div></div>`;
  function wireTop() {
    const m = $('#mute'); if (m) m.onclick = () => { muted = !muted; ls.set('yi_mute', muted); m.textContent = muted ? '🔇' : '🔊'; if (!muted) sfx.join(); };
    const f = $('#fs'); if (f) f.onclick = () => { const d = document.documentElement; try { if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else (d.requestFullscreen || d.webkitRequestFullscreen).call(d); } catch (e) { toast('على الآيباد: شاركي الصفحة ← «إضافة إلى الشاشة الرئيسية» لعرضها بملء الشاشة'); } };
    const mn = $('#menu'); if (mn) mn.onclick = () => { if (confirm('بدء مسابقة جديدة من الصفر؟ (سيُمسح الترتيب الحالي)')) { cl && cl.end(true); cl = null; boot(true); } };
  }
  function render() {
    const ph = G.ph;
    if (ph === 'lobby') return rLobby();
    if (ph === 'pre') return rPre();
    if (ph === 'q') return rQ();
    if (ph === 'rv') return rRv();
    if (ph === 'lb') return rLb();
    if (ph === 'end') return rEnd();
  }
  function joinURL() { let u = BASE + '?r=' + G.room + '&b=' + G.bk; if (P.get('bu')) u += '&bu=' + encodeURIComponent(P.get('bu')); return u; }
  function rLobby() {
    const url = joinURL(); const qr = qrcode(0, 'H'); qr.addData(url); qr.make();
    app.innerHTML = topbar() + `<div class="scr lobby">
      <div class="l">
        <h1 class="ttl h"><small>رحلتي إلى الهند — لقاء أولياء الأمور</small>تحدّي الهند <span class="gold">للكبار</span> 🇮🇳</h1>
        <div class="steps"><div><b>1</b>افتح كاميرا الجوال</div><div><b>2</b>صوّر الباركود</div><div><b>3</b>اكتب اسمك واختر رمزك</div></div>
        <div class="plbox"><div class="plhead"><span>المتسابقون وصلوا: <span class="gold" id="np2">${Object.keys(G.pl).length}</span></span><span class="wait" id="hint">${Object.keys(G.pl).length ? 'اضغطي على اسم لحذفه' : 'بانتظار أول متسابق…'}</span></div><div class="chips" id="chips"></div></div>
        <div><button class="btn" id="start" style="font-size:1.35em" ${Object.keys(G.pl).length ? '' : 'disabled'}>🚀 ابدأ التحدّي (${Q.length} سؤالًا)</button></div>
      </div>
      <div class="r"><div class="qrbox">${qr.createSvgTag({ cellSize: 8, margin: 1, scalable: true })}<img class="flag" src="img/flag.jpg" alt=""></div>
        <div class="scan h">📷 صوّر الباركود وانضمّ</div>
        <div class="code">أو ادخل من الرابط واكتب الرمز <b>${G.room}</b></div></div></div>`;
    wireTop(); renderLobbyPlayers();
    $('#start').onclick = () => { ac(); startQ(0); };
  }
  function renderLobbyPlayers() {
    const box = $('#chips'); if (!box) return; const n = Object.keys(G.pl).length;
    const have = new Set([...box.children].map(e => e.dataset.id));
    G.order.forEach(id => { const p = G.pl[id]; if (!p || have.has(id)) return; const e = document.createElement('button'); e.className = 'chip'; e.dataset.id = id;
      e.innerHTML = `<i>${p.a}</i>${esc(p.n)}`; e.onclick = () => { if (confirm('حذف «' + p.n + '» من المسابقة؟')) { delete G.pl[id]; G.order = G.order.filter(x => x !== id); e.remove(); save(); publish(true); renderLobbyPlayers(); } }; box.appendChild(e); });
    [...box.children].forEach(e => { if (!G.pl[e.dataset.id]) e.remove(); });
    ['#np', '#np2'].forEach(s => { const e = $(s); if (e) e.textContent = n; });
    const st = $('#start'); if (st) st.disabled = !n; const h = $('#hint'); if (h) h.textContent = n ? 'اضغطي على اسم لحذفه' : 'بانتظار أول متسابق…';
  }
  const qbadge = q => `<span class="pill qnum">السؤال ${G.qi + 1} من ${Q.length}</span>${q.x2 ? '<span class="x2">⭐ سؤال الذهب — النقاط مضاعفة</span>' : ''}`;
  function rPre() {
    const q = Q[G.qi];
    app.innerHTML = topbar() + `<div class="scr pre"><div class="qtop">${qbadge(q)}</div>
      <div class="bigq h">${esc(q.t)}</div><div class="prebar"><i style="animation-duration:${Math.max(300, G.t0 - Date.now())}ms"></i></div>
      <p style="opacity:.8;margin-top:1em">📱 الخيارات ستظهر على جوالاتكم بعد لحظات…</p></div>`;
    wireTop();
  }
  const optsHTML = (q, cnt) => `<div class="opts ${cnt ? 'rv' : ''}">${q.o.map((o, i) => `<div class="opt ${OCOL[i]} ${i === q.c ? 'ok' : ''}">${SHAPES[i]}<span class="t">${esc(o)}</span><span class="tick">✔</span>${cnt ? `<span class="c">${cnt[i]}</span>` : ''}</div>`).join('')}</div>`;
  function rQ() {
    const q = Q[G.qi];
    app.innerHTML = topbar(qbadge(q)) + `<div class="scr" style="padding:0"><div class="qwrap">
      <div class="qhead"><div class="qtext h">${esc(q.t)}</div></div>
      <div class="mid"><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="rgba(0,0,0,.25)" stroke="rgba(255,255,255,.15)" stroke-width="7"/><circle class="fg" cx="50" cy="50" r="46" fill="none" stroke="#f6c453" stroke-width="7" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="0"/></svg><div class="n">${Math.ceil(DUR(q) / 1000)}</div></div>
        <div class="media">${mediaHTML(q)}</div>
        <div class="cnt"><b id="na">${Object.keys(G.ans).length}</b>من ${Object.keys(G.pl).length}<br>أجابوا</div></div>
      ${optsHTML(q)}
      <div class="ctrl"><button class="btn ghost" id="stop">⏹ إنهاء الوقت وإظهار الإجابة</button></div></div></div>`;
    wireTop(); $('#stop').onclick = () => reveal();
  }
  function rRv() {
    const q = Q[G.qi], cnt = counts(), mx = Math.max(1, ...cnt), last = G.qi >= Q.length - 1;
    const right = Object.values(G.ans).filter(a => a.c === q.c).length;
    app.innerHTML = topbar(qbadge(q)) + `<div class="scr" style="padding:0"><div class="rvwrap">
      <div class="qhead"><div class="qtext h">${esc(q.t)}</div></div>
      <div class="rvmid">
        <div style="display:flex;flex-direction:column;height:100%;justify-content:center;gap:.6em">
          <div class="bars">${cnt.map((n, i) => `<div class="b ${i === q.c ? '' : 'dim'}"><span>${n}</span><i class="${OCOL[i]}" style="height:${8 + 92 * n / mx}%;animation-delay:${i * .08}s"></i>${SHAPES[i]}</div>`).join('')}</div>
          <div style="text-align:center;font-weight:800">✅ ${right} إجابة صحيحة من ${Object.keys(G.pl).length}</div></div>
        <div class="fact card">${q.img ? `<img src="${q.img}" alt="">` : ''}<div><div class="lab">💡 هل تعلم؟</div><p>${esc(q.f)}</p></div></div>
      </div>
      ${optsHTML(q, cnt)}
      <div class="ctrl"><button class="btn" id="nx">${last ? '🏆 إعلان الفائزين' : '📊 لوحة الصدارة'}</button></div></div></div>`;
    wireTop(); $('#nx').onclick = next;
  }
  function rLb() {
    const { ids, r } = ranks(), top = ids.slice(0, 5);
    app.innerHTML = topbar() + `<div class="scr"><h1 class="ttl h" style="font-size:2.8em;margin:0 0 .5em">📊 لوحة الصدارة <small style="display:inline;font-size:.45em">بعد ${G.qi + 1} من ${Q.length}</small></h1>
      <div class="lb">${top.map(id => { const p = G.pl[id], was = G.prevRank[id], up = was && was > r[id] ? `<span class="up">▲ ${was - r[id]}</span>` : '';
        return `<div class="row" data-id="${id}"><span class="rk">${r[id]}</span><span class="av">${p.a}</span><span class="nm">${esc(p.n)} ${up}</span>${p.k >= 2 ? `<span class="fire">🔥${p.k}</span>` : ''}<span class="sc">${fmt(p.s)}</span></div>`; }).join('')}</div>
      <div class="ctrl" style="margin-top:1.4em"><button class="btn" id="nx">➡️ السؤال التالي</button></div></div>`;
    wireTop(); $('#nx').onclick = next;
    // حركة: الصفوف تنزلق من ترتيبها السابق
    const rows = [...document.querySelectorAll('.row')]; const h = rows[0] ? rows[0].offsetHeight + 11 : 0;
    rows.forEach((e, i) => { const was = G.prevRank[e.dataset.id] || (i + 1); const d = Math.min(was - 1, 6) - i; if (d) { e.style.transition = 'none'; e.style.transform = `translateY(${d * h}px)`; } else { e.style.transform = 'translateX(40px)'; e.style.opacity = 0; e.style.transition = 'none'; }
      requestAnimationFrame(() => requestAnimationFrame(() => { e.style.transition = ''; e.style.transitionDelay = (i * .07) + 's'; e.style.transform = ''; e.style.opacity = 1; e.style.transition = 'transform .9s cubic-bezier(.2,.9,.3,1) ' + (i * .07 + .2) + 's, opacity .5s ' + (i * .07) + 's'; })); });
  }
  function rEnd() {
    const { ids, r } = ranks(); const t = ids.slice(0, 3);
    const P3 = (id, k) => id ? `<div class="p p${k}"><div class="av">${G.pl[id].a}</div><div class="nm">${esc(G.pl[id].n)}</div><div class="sc">${fmt(G.pl[id].s)} نقطة</div><div class="blk">${['', '🥇', '🥈', '🥉'][k]}</div></div>` : '';
    app.innerHTML = topbar() + `<div class="scr"><h1 class="ttl h" style="text-align:center;margin:.2em 0 0;font-size:3em">🏆 أبطال تحدّي الهند</h1>
      <div class="pod">${P3(t[1], 2)}${P3(t[0], 1)}${P3(t[2], 3)}</div>
      <p style="margin:1.2em 0 .6em;font-size:1.2em">شكرًا لمشاركتكم الجميلة 🌺 — ترتيب كل متسابق ظاهر على جواله</p>
      <div class="ctrl"><button class="btn ghost" id="all">📋 الترتيب الكامل</button><button class="btn ghost" id="again">🔄 مسابقة جديدة</button></div></div>`;
    wireTop();
    $('#again').onclick = () => { if (confirm('بدء مسابقة جديدة؟')) { cl && cl.end(true); cl = null; boot(true); } };
    $('#all').onclick = () => { app.innerHTML = topbar() + `<div class="scr" style="justify-content:flex-start;padding-top:1em;overflow:auto"><h1 class="ttl h" style="font-size:2.4em;margin:0 0 .5em">📋 الترتيب الكامل</h1>
      <div class="lb">${ids.map(id => `<div class="row"><span class="rk">${r[id]}</span><span class="av">${G.pl[id].a}</span><span class="nm">${esc(G.pl[id].n)}</span><span style="font-size:.7em;opacity:.7">${G.pl[id].ok}/${Q.length} ✔</span><span class="sc">${fmt(G.pl[id].s)}</span></div>`).join('')}</div>
      <div class="ctrl" style="margin:1.2em 0"><button class="btn" id="bk">↩️ رجوع للمنصة</button></div></div>`; wireTop(); $('#bk').onclick = () => { rEnd(); }; };
  }
  window.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'Enter') { const b = $('#nx') || $('#start'); if (b && !b.disabled) { e.preventDefault(); b.click(); } } });
}

/* =========================================================
   جوال ولي الأمر
   ========================================================= */
function player(room) {
  document.body.className = 'player';
  const K = 'yi_p_' + room;
  let me = ls.get(K, null), cl = null, S = null, raf = null, lastJoin = 0, answered = (me && me.ans) || {};
  const save = () => { if (me) { me.ans = answered; ls.set(K, me); } };
  const T = NS + room + '/';

  function joinForm() {
    let av = (me && me.a) || AV[Math.random() * AV.length | 0];
    app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap join"><div class="pc" style="justify-content:flex-start;padding-top:.4em">
      <div class="hero"></div>
      <h1 class="h">تحدّي الهند <span class="gold">للكبار</span> 🇮🇳</h1>
      <p>أسئلة ممتعة عن الهند… من يعرف أكثر؟</p>
      <input class="field" id="nm" maxlength="22" placeholder="اسمك (مثال: أم ياسمين)" autocomplete="off" enterkeyhint="go">
      <div style="width:100%;text-align:right;font-weight:800;font-size:.9em;opacity:.9">اختر رمزك:</div>
      <div class="avs">${AV.map(a => `<button data-a="${a}" class="${a === av ? 'on' : ''}">${a}</button>`).join('')}</div>
      <button class="btn" id="go">انضمّ للتحدّي ✨</button></div></div></div>`;
    document.querySelectorAll('.avs button').forEach(b => b.onclick = () => { av = b.dataset.a; document.querySelectorAll('.avs button').forEach(x => x.classList.toggle('on', x === b)); });
    const go = () => { const n = $('#nm').value.trim(); if (n.length < 2) { toast('اكتب اسمك أولًا 🙂'); $('#nm').focus(); return; }
      me = { id: (me && me.id) || uid(), n, a: av, ans: {} }; answered = {}; save(); ac(); connect(); };
    $('#go').onclick = go; $('#nm').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }

  async function connect() {
    waitScr('جاري الدخول للمسابقة…');
    const b = P.get('b'); const order = b && BROKERS[b] ? [b] : ORDER;
    for (const k of order) {
      try { const c = await tryConnect(k); if (order.length > 1) { const ok = await hasRoom(c); if (!ok) { c.end(true); continue; } } cl = c; break; } catch (e) {}
    }
    if (!cl) { app.innerHTML = `<div class="scr"><div class="pwrap"><div class="pc"><div class="bigav">📶</div><h2 class="h">تعذّر الاتصال</h2>
      <p>${order.length > 1 ? 'تأكد من رمز المسابقة، أو ' : ''}جرّب إطفاء الواي فاي واستخدام بيانات الجوال، ثم أعد المحاولة.</p><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div></div></div>`; return; }
    statusDot(cl);
    cl.subscribe(T + 'st', { qos: 1 });
    cl.on('message', (t, buf) => { if (t !== T + 'st') return; const s = buf.toString(); if (!s) { S = null; waitScr('بانتظار المعلمة لبدء المسابقة…'); return; } let m; try { m = JSON.parse(s); } catch (e) { return; } onState(m); });
    cl.on('connect', () => sendJoin(true));
    sendJoin(true); keepAwake();
    setTimeout(() => { if (!S) waitScr('بانتظار المعلمة… تأكد أن شاشة المسابقة مفتوحة'); }, 3500);
  }
  function hasRoom(c) { return new Promise(res => { const t = setTimeout(() => { c.unsubscribe(T + 'st'); c.removeListener('message', f); res(false); }, 3000);
    const f = (tp, buf) => { if (tp === T + 'st' && buf.length) { clearTimeout(t); c.removeListener('message', f); c.unsubscribe(T + 'st'); res(true); } };
    c.on('message', f); c.subscribe(T + 'st', { qos: 1 }); }); }
  function sendJoin(force) { const now = Date.now(); if (!cl || (!force && now - lastJoin < 3000)) return; lastJoin = now; cl.publish(T + 'j', JSON.stringify({ p: me.id, n: me.n, a: me.a }), { qos: 1 }); }

  const bar = (S) => { const r = S && S.R && S.R[me.id]; return `<div class="pbar"><span class="me">${me.a} <span>${esc(me.n)}</span></span>${r ? `<span class="pill">⭐ ${fmt(r[0])}</span>` : ''}${S && S.qi >= 0 && S.ph !== 'lobby' && S.ph !== 'end' ? `<span class="pill">${S.qi + 1}/${S.tot}</span>` : ''}</div>`; };
  function waitScr(msg) { app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap">${me ? bar(S) : ''}<div class="pc"><div class="bigav">${me ? me.a : '🇮🇳'}</div><p class="h" style="font-size:1.3em">${msg}</p><div class="dots"><i></i><i></i><i></i></div></div></div></div>`; }

  let shown = '';
  function onState(m) {
    if (S && m.s < S.s && m.at <= S.at) return;
    S = m;
    if (!m.R || !m.R[me.id]) sendJoin(false);
    const key = m.ph + ':' + m.qi + ':' + (m.ph === 'q' && (answered[m.qi] !== undefined || (m.mine && m.mine[me.id])) ? 'a' : '');
    if (key === shown) { if (m.ph === 'q') sync(m); if (m.ph === 'lobby') updLobby(m); return; }
    shown = key; cancelAnimationFrame(raf);
    const q = Q[m.qi];
    if (m.ph === 'lobby') return lobby(m);
    if (m.ph === 'pre') return pre(m, q);
    if (m.ph === 'q') return (answered[m.qi] !== undefined || (m.mine && m.mine[me.id])) ? sent(m, q) : ask(m, q);
    if (m.ph === 'rv') return result(m, q);
    if (m.ph === 'lb') return standing(m);
    if (m.ph === 'end') return final(m);
  }
  function lobby(m) {
    const ok = m.R && m.R[me.id];
    app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap">${bar(m)}<div class="pc"><div class="bigav">${me.a}</div>
      <h2 class="h" style="margin:0">${ok ? 'أنت في المسابقة! ✅' : 'جاري التسجيل…'}</h2><p>شوف اسمك على شاشة المعلمة 👀<br>المسابقة تبدأ بعد لحظات</p>
      <div class="pill" id="pn">👥 ${m.n} متسابق</div><div class="dots"><i></i><i></i><i></i></div>
      <button class="btn ghost" id="edit" style="font-size:.85em;margin-top:1em">✏️ تعديل الاسم أو الرمز</button></div></div></div>`;
    $('#edit').onclick = () => { shown = ''; joinForm(); };
  }
  function updLobby(m) { const e = $('#pn'); if (e) e.textContent = '👥 ' + m.n + ' متسابق'; const h = document.querySelector('.pc h2'); if (h && m.R && m.R[me.id]) h.textContent = 'أنت في المسابقة! ✅'; }
  function pre(m, q) {
    app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap">${bar(m)}<div class="pc">${q.x2 ? '<span class="x2">⭐ سؤال الذهب — النقاط مضاعفة</span>' : ''}<div style="font-size:3.4em">👀</div><p style="margin:0;opacity:.85">السؤال ${m.qi + 1}</p><div class="pq">${esc(q.t)}</div><p style="opacity:.8">استعدّ… الخيارات قادمة</p></div></div></div>`;
    if (navigator.vibrate) navigator.vibrate(60);
  }
  let deadline = 0;
  function ask(m, q) {
    deadline = Date.now() + (m.rem || 0);
    app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap">${bar(m)}<div class="pq" style="text-align:center">${esc(q.t)}</div>
      <div class="ptimer"><i id="tb"></i></div>
      <div class="pbtns">${q.o.map((o, i) => `<button class="pbtn ${OCOL[i]}" data-i="${i}">${SHAPES[i]}<span>${esc(o)}</span></button>`).join('')}</div></div></div>`;
    document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => choose(m.qi, +b.dataset.i));
    const dur = DUR(q);
    const f = () => { const r = Math.max(0, deadline - Date.now()); const e = $('#tb'); if (e) e.style.transform = `scaleX(${r / dur})`; if (r > 0) raf = requestAnimationFrame(f); };
    f();
  }
  function sync(m) { if (m.rem !== undefined) deadline = Date.now() + m.rem; }
  function choose(qi, i) {
    if (answered[qi] !== undefined) return;
    answered[qi] = i; save();
    cl.publish(T + 'a', JSON.stringify({ p: me.id, q: qi, c: i }), { qos: 1 });
    if (navigator.vibrate) navigator.vibrate(30);
    shown = 'q:' + qi + ':a'; cancelAnimationFrame(raf); sent(S, Q[qi]);
  }
  function sent(m, q) {
    const i = answered[m.qi];
    app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap">${bar(m)}<div class="pc">
      ${i !== undefined ? `<div class="pbtn ${OCOL[i]}" style="width:100%;min-height:4em;animation:zoomIn .4s">${SHAPES[i]}<span>${esc(q.o[i])}</span></div>` : ''}
      <div class="sent">تم إرسال إجابتك ✅</div><p style="opacity:.85">ننتظر البقية… ارفع راسك للشاشة 👀</p><div class="dots"><i></i><i></i><i></i></div></div></div></div>`;
  }
  function result(m, q) {
    const r = m.R && m.R[me.id]; const okv = r && r[5] === m.qi ? r[3] : -1, g = r ? r[2] : 0, k = r ? r[4] : 0;
    const v = okv === 1 ? { c: 'ok', e: '🎉', w: 'إجابة صحيحة!' } : okv === 0 ? { c: 'no', e: '🙈', w: 'ليست هذه المرة' } : { c: 'na', e: '⏰', w: 'انتهى الوقت' };
    app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap">${bar(m)}<div class="pc" style="justify-content:flex-start;overflow:auto">
      <div class="verdict ${v.c}"><div class="e">${v.e}</div><div class="w">${v.w}</div>${okv === 1 ? `<div class="g">+${fmt(g)}</div>${k >= 2 ? `<div>🔥 ${k} إجابات صحيحة متتالية</div>` : ''}` : ''}</div>
      ${okv !== 1 ? `<div class="pbtn ${OCOL[q.c]}" style="width:100%;animation:none">${SHAPES[q.c]}<span>الصحيح: ${esc(q.o[q.c])}</span></div>` : ''}
      <div class="card pfact"><b>💡 هل تعلم؟</b><br>${esc(q.f)}</div>
      ${r ? `<p style="margin:0">ترتيبك الآن: <b class="gold">${r[1]}</b> من ${m.n}</p>` : ''}</div></div></div>`;
    if (navigator.vibrate) navigator.vibrate(okv === 1 ? [40, 60, 40] : 120);
    if (okv === 1) confetti(2200);
  }
  function standing(m) {
    const r = m.R && m.R[me.id];
    app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap">${bar(m)}<div class="pc"><p style="margin:0">ترتيبك</p><div class="rankbig">${r ? r[1] : '—'}</div><p style="margin:0">من ${m.n} متسابق</p>
      <div class="pill" style="font-size:1.2em">⭐ ${r ? fmt(r[0]) : 0} نقطة</div><p style="opacity:.85">${r && r[1] === 1 ? 'أنت في الصدارة! حافظ عليها 👑' : r && r[1] <= 3 ? 'قريب جدًا من القمة! 💪' : 'باقي أسئلة… تقدر تتقدّم! 🚀'}</p></div></div></div>`;
  }
  function final(m) {
    const r = m.R && m.R[me.id], rk = r ? r[1] : 0;
    const md = rk === 1 ? '🥇' : rk === 2 ? '🥈' : rk === 3 ? '🥉' : '🌺';
    app.innerHTML = `<div class="scr" style="padding:0"><div class="pwrap">${bar(m)}<div class="pc"><div class="medal">${md}</div>
      <h2 class="h" style="margin:0;font-size:1.6em">${rk && rk <= 3 ? 'مبروك! أنت من أبطال التحدّي' : 'شكرًا لمشاركتك!'}</h2>
      <p style="margin:0">ترتيبك النهائي: <b class="gold">${rk || '—'}</b> من ${m.n}</p><div class="pill" style="font-size:1.2em">⭐ ${r ? fmt(r[0]) : 0} نقطة</div>
      <p style="opacity:.85">عرفت الآن عن الهند أكثر من كثير من الناس 😉🇮🇳</p></div></div></div>`;
    if (rk && rk <= 3) confetti(6000);
  }
  if (me && me.n) connect(); else joinForm();
}

/* ---------- التشغيل ---------- */
if (P.get('host')) host();
else if (/^\d{4}$/.test(P.get('r') || '')) player(P.get('r'));
else landing();
})();
