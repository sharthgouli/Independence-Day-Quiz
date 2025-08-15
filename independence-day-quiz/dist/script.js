/* India Knowledge Challenge — full app logic
   Features: welcome name/age, timed questions, timeout => show meaning,
   confetti/firework on correct, certificate generation for 9/10, leaderboard in localStorage,
   share on WhatsApp.
*/

// ---------- Data: question bank (add more if you want) ----------
const QUESTION_BANK = [
  { q:"Who was the first Prime Minister of independent India?", opts:["Mahatma Gandhi","Jawaharlal Nehru","Sardar Patel","Subhas Chandra Bose"], a:1, meaning:"Jawaharlal Nehru served as India's first Prime Minister from 1947 to 1964." },
  { q:"When did India gain independence?", opts:["15 Aug 1947","26 Jan 1950","2 Oct 1947","14 Aug 1947"], a:0, meaning:"India gained independence on 15 August 1947." },
  { q:"Who wrote India's national anthem 'Jana Gana Mana'?", opts:["Rabindranath Tagore","Bankim Chandra Chatterjee","Sarojini Naidu","Subramania Bharati"], a:0, meaning:"Rabindranath Tagore wrote the anthem in 1911." },
  { q:"What is the Ashoka Chakra's spoke-count?", opts:["12","24","36","48"], a:1, meaning:"The Ashoka Chakra has 24 spokes." },
  { q:"Who is known as the 'Iron Man of India'?", opts:["Sardar Patel","Bhagat Singh","C. Rajagopalachari","Lala Lajpat Rai"], a:0, meaning:"Sardar Vallabhbhai Patel earned this title for unifying princely states." },
  { q:"Which movement did Gandhi lead?", opts:["Quit India","Satyagraha","Non-Cooperation","All of these"], a:3, meaning:"He led multiple movements; Non-Cooperation, Civil Disobedience, Quit India—Satyagraha was his philosophy." },
  { q:"Who founded the Indian National Army (INA)?", opts:["Subhas Chandra Bose","M. K. Gandhi","Jawaharlal Nehru","Vallabhbhai Patel"], a:0, meaning:"Subhas Chandra Bose led the INA to fight British rule." },
  { q:"Which day is celebrated as Republic Day?", opts:["15 Aug","26 Jan","1 Jan","2 Oct"], a:1, meaning:"26 January 1950 is when India's Constitution came into effect." },
  { q:"Who drafted the Constitution of India?", opts:["Ambedkar Committee","Constituent Assembly","Dr. B.R. Ambedkar","All of above"], a:2, meaning:"Dr. B.R. Ambedkar was Chairman of the Drafting Committee." },
  { q:"Which freedom fighter said 'Give me blood, and I shall give you freedom'?", opts:["Bhagat Singh","Subhas Chandra Bose","Mangal Pandey","Rani Lakshmibai"], a:1, meaning:"This slogan is attributed to Subhas Chandra Bose." },
  { q:"Who was the first President of India?", opts:["Rajendra Prasad","Zakir Husain","R. Venkataraman","Sarvepalli Radhakrishnan"], a:0, meaning:"Dr. Rajendra Prasad became the first President in 1950." },
  { q:"Which city hosted the first session of the Indian National Congress?", opts:["Bombay","Calcutta","Madras","Poona"], a:1, meaning:"The first session (1885) took place in Bombay (Mumbai); but the first session presided by W.C. Banerjee was at Gokuldas Tejpal Sanskrit College, Bombay." },
  { q:"Who led the Salt Satyagraha (Dandi March)?", opts:["Jawaharlal Nehru","Mahatma Gandhi","Vallabhbhai Patel","Bipin Chandra Pal"], a:1, meaning:"Mahatma Gandhi led the Salt March in 1930 to protest the salt tax." },
  { q:"Which movement rejected British goods and encouraged homespun cloth?", opts:["Swadeshi","Civil Disobedience","Quit India","Non-Cooperation"], a:0, meaning:"The Swadeshi movement promoted local goods (homespun khadi)." },
  { q:"Which year did India become a republic?", opts:["1947","1950","1952","1949"], a:1, meaning:"India became a republic on 26 Jan 1950." }
];

// ---------- DOM ----------
const welcomeModal = document.getElementById('welcome');
const playerNameInp = document.getElementById('playerName');
const playerAgeInp = document.getElementById('playerAge');
const startBtn = document.getElementById('startBtn');

const greetingEl = document.getElementById('greeting');
const quizArea = document.getElementById('quizArea');
const qNumEl = document.getElementById('qNum');
const timerEl = document.getElementById('timer');
const questionText = document.getElementById('questionText');
const optionsEl = document.getElementById('options');
const explainEl = document.getElementById('explain');

const scoreArea = document.getElementById('scoreArea');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restart');
const shareScoreBtn = document.getElementById('shareScore');
const downloadCertBtn = document.getElementById('downloadCert');

const leaderboardList = document.getElementById('leaderboardList');
const viewLeaderboardBtn = document.getElementById('viewLeaderboard');

const confettiCanvas = document.getElementById('confetti');
const confettiCtx = confettiCanvas.getContext('2d');

const certCanvas = document.getElementById('certCanvas');
const certCtx = certCanvas.getContext('2d');

// ---------- State ----------
let player = { name: '', age: null };
let questions = []; // chosen questions
let current = 0;
let score = 0;
let timeLeft = 10;
let timerId = null;
let usedIndices = [];

// ---------- Utils ----------
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr }
function pickN(arr,n){ return shuffle(arr.slice()).slice(0,n) }
function saveLeaderboard(list){ localStorage.setItem('ikc.leaderboard.v1', JSON.stringify(list)) }
function loadLeaderboard(){ try{return JSON.parse(localStorage.getItem('ikc.leaderboard.v1'))||[] }catch{return []} }
function nowStr(){ return new Date().toLocaleString('en-IN', { timeZone:'Asia/Kolkata', hour12:true }) }

// ---------- Welcome / Start ----------
startBtn.addEventListener('click', () => {
  const name = (playerNameInp.value || '').trim();
  const age = parseInt(playerAgeInp.value,10);
  if(!name){ alert('Please enter your name'); playerNameInp.focus(); return; }
  if(!age || age < 6){ alert('Please enter a valid age (6+)'); playerAgeInp.focus(); return; }
  player.name = name; player.age = age;
  greetingEl.textContent = `Hello, ${player.name} (${player.age})!`;
  welcomeModal.classList.remove('active');
  beginQuiz();
});

// allow Enter to start
[playerNameInp, playerAgeInp].forEach(el=>{
  el.addEventListener('keydown', e=>{ if(e.key==='Enter') startBtn.click(); });
});

// ---------- Quiz logic ----------
function beginQuiz(){
  // choose 10 random questions (or fewer if bank small)
  questions = pickN(QUESTION_BANK, Math.min(10, QUESTION_BANK.length));
  current = 0; score = 0;
  showQuestion();
  quizArea.classList.remove('hidden');
  scoreArea.classList.add('hidden');
  explainEl.textContent = '';
}

function showQuestion(){
  explainEl.textContent = '';
  const q = questions[current];
  qNumEl.textContent = current+1;
  questionText.textContent = q.q;
  optionsEl.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.textContent = opt;
    b.dataset.index = i;
    b.onclick = () => chooseAnswer(i);
    optionsEl.appendChild(b);
  });
  // start timer
  timeLeft = 10; timerEl.textContent = timeLeft;
  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--; timerEl.textContent = timeLeft;
    if(timeLeft <= 0){ clearInterval(timerId); handleTimeout(); }
  }, 1000);
}

function chooseAnswer(i){
  clearInterval(timerId);
  const q = questions[current];
  const correctIndex = q.a;
  const buttons = optionsEl.querySelectorAll('.opt');
  buttons.forEach(btn => btn.disabled = true);
  if(i === correctIndex){
    // correct
    score++;
    buttons[i].classList.add('correct');
    explainEl.textContent = 'Correct! ' + q.meaning;
    // confetti blast
    confettiBurstAt(window.innerWidth/2, 200);
  } else {
    buttons[i].classList.add('wrong');
    buttons[correctIndex].classList.add('correct');
    explainEl.textContent = 'Wrong. ' + q.meaning;
  }
  setTimeout(()=> {
    current++;
    if(current >= questions.length) endQuiz();
    else showQuestion();
  }, 1400);
}

function handleTimeout(){
  const q = questions[current];
  const buttons = optionsEl.querySelectorAll('.opt');
  buttons.forEach(btn => btn.disabled = true);
  buttons[q.a].classList.add('correct');
  explainEl.textContent = "Time's up! " + q.meaning;
  setTimeout(()=> {
    current++;
    if(current >= questions.length) endQuiz();
    else showQuestion();
  }, 1600);
}

// ---------- End quiz / leaderboard / certificate ----------
function endQuiz(){
  clearInterval(timerId);
  quizArea.classList.add('hidden');
  scoreArea.classList.remove('hidden');
  finalScoreEl.textContent = `${score} / ${questions.length}`;

  // save leaderboard
  const lb = loadLeaderboard();
  lb.push({ name: player.name, age: player.age, score, time: nowStr() });
  lb.sort((a,b) => b.score - a.score || a.time.localeCompare(b.time));
  saveLeaderboard(lb.slice(0, 10));
  renderLeaderboard();

  // if high score (9 or 10) generate certificate & show download button
  if(score >= Math.max(9, Math.floor(questions.length * 0.9))){
    downloadCertBtn.classList.remove('hidden');
    const certDataUrl = generateCertificate(player.name, score);
    // auto-download? we will show download button that downloads this URL
    downloadCertBtn.onclick = ()=> downloadDataUrl(certDataUrl, `${player.name}_certificate.png`);
    // small confetti
    confettiBurstFull();
  } else {
    downloadCertBtn.classList.add('hidden');
  }
}

// ---------- Leaderboard render ----------
function renderLeaderboard(){
  const lb = loadLeaderboard();
  leaderboardList.innerHTML = '';
  lb.forEach((p, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${idx+1}. ${escapeHTML(p.name)}</strong> — ${p.score} pts <span class="muted">(${escapeHTML(p.time)})</span>`;
    leaderboardList.appendChild(li);
  });
}
renderLeaderboard();

// restart
restartBtn.addEventListener('click', ()=> {
  // show welcome to re-enter name/age OR reuse same person: reuse same player details
  // We'll reuse same player, just restart quiz
  beginQuiz();
  scoreArea.classList.add('hidden');
  quizArea.classList.remove('hidden');
});

// share score via WhatsApp
shareScoreBtn.addEventListener('click', ()=>{
  const text = `I scored ${score}/${questions.length} in the India Knowledge Challenge! Can you beat me? 🇮🇳`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
});

// view leaderboard quick
viewLeaderboardBtn.addEventListener('click', ()=> {
  // scroll to leaderboard (on small screens)
  document.getElementById('leaderboardList').scrollIntoView({ behavior:'smooth' });
});

// ---------- Certificate generation (canvas) ----------
function generateCertificate(name, score){
  const c = certCanvas;
  const ctx = certCtx;
  const W = c.width, H = c.height;
  // background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,W,H);
  // border
  ctx.strokeStyle = '#0a2a66';
  ctx.lineWidth = 8;
  roundRect(ctx, 18,18,W-36,H-36,24);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#0a2a66';
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px Inter, Arial';
  ctx.fillText('Certificate of Excellence', W/2, 120);

  // subtitle
  ctx.fillStyle = '#07213a';
  ctx.font = '700 28px Inter, Arial';
  ctx.fillText('India Knowledge Challenge', W/2, 170);

  // Name
  ctx.font = '900 42px Inter, Arial';
  ctx.fillText(name, W/2, 280);

  // Message
  ctx.font = '600 24px Inter, Arial';
  ctx.fillText(`has demonstrated outstanding knowledge of India.`, W/2, 320);

  // Score box
  ctx.fillStyle = '#ff9933';
  roundRectFill(ctx, W/2 - 140, 360, 280, 110, 16);
  ctx.fillStyle = '#07213a';
  ctx.font = 'bold 60px Inter, Arial';
  ctx.fillText(`${score} / ${questions.length}`, W/2, 438);

  // footer text & date
  ctx.font = '500 18px Inter, Arial';
  ctx.fillStyle = '#0a2a66';
  ctx.fillText(`Awarded on ${new Date().toLocaleDateString('en-IN')}`, W/2, 520);

  // small tricolor stripes
  ctx.fillStyle = '#ff9933'; ctx.fillRect(80, H-120, 160, 18);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(80, H-100, 160, 18);
  ctx.fillStyle = '#138808'; ctx.fillRect(80, H-80, 160, 18);

  // seal (chakra)
  drawChakraOnCtx(ctx, W-160, H-220, 48);

  return c.toDataURL('image/png');
}

function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath() }
function roundRectFill(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); ctx.fill() }
function drawChakraOnCtx(ctx,cx,cy,R){ ctx.save(); ctx.translate(cx,cy); ctx.strokeStyle='#0a2a66'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.stroke(); ctx.lineWidth=2; for(let i=0;i<24;i++){ const a=(i/24)*Math.PI*2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*R, Math.sin(a)*R); ctx.stroke(); } ctx.restore(); }

// helper download
function downloadDataUrl(dataUrl, filename){
  const a = document.createElement('a'); a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

// ---------- Confetti / Firework ----------
confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{ confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; });

let confettiParticles = [];
function confettiBurstAt(x,y){
  // small burst (on correct answer)
  for(let i=0;i<30;i++){
    confettiParticles.push(createConfettiParticle(x + (Math.random()-0.5)*80, y + (Math.random()-0.5)*30));
  }
  if(!confettiLoopRunning) requestAnimationFrame(confettiLoop);
}
function confettiBurstFull(){
  // big burst
  for(let i=0;i<200;i++){
    confettiParticles.push(createConfettiParticle(Math.random()*confettiCanvas.width, Math.random()*confettiCanvas.height/2));
  }
  if(!confettiLoopRunning) requestAnimationFrame(confettiLoop);
}
function createConfettiParticle(x,y){
  return {
    x,y,
    vx:(Math.random()-0.5)*6,
    vy:(Math.random()*-6)-2,
    size: 6 + Math.random()*8,
    color: ['#ff9933','#ffffff','#138808'][Math.floor(Math.random()*3)],
    rot: Math.random()*360,
    life: 80 + Math.random()*40
  };
}
let confettiLoopRunning = false;
function confettiLoop(){
  confettiLoopRunning = true;
  confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  for(let i=confettiParticles.length-1;i>=0;i--){
    const p = confettiParticles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot * Math.PI/180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
    confettiCtx.restore();
    if(p.life <= 0 || p.y > confettiCanvas.height + 50){
      confettiParticles.splice(i,1);
    }
  }
  if(confettiParticles.length>0) requestAnimationFrame(confettiLoop);
  else confettiLoopRunning = false;
}

// ---------- small helpers ----------
function escapeHTML(s){ return (s||'').replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }

// ---------- init: start quiz UI hidden until welcome done ----------
quizArea.classList.add('hidden');
scoreArea.classList.add('hidden');
renderLeaderboard();