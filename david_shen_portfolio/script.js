const root = document.documentElement;
const cursorGlow = document.querySelector(".cursor-glow");
const themeToggle = document.querySelector(".theme-toggle");

document.addEventListener("pointermove", (event) => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

themeToggle.addEventListener("click", () => {
  root.classList.toggle("light");
  themeToggle.textContent = root.classList.contains("light") ? "☀" : "☾";
});

const terminalText = document.getElementById("terminalText");
const terminalLines = [
  "> load profile: David Shen",
  "> domains: AI/ML drug discovery · data science · chemistry · economics",
  "> side quests: Latin quiz bowl · ice hockey captaincy · creative nonfiction",
  "> building mode: research pipeline + interactive web demos + community systems",
  "> status: open to ambitious, useful, human-centered projects"
];
let terminalIndex = 0;
let charIndex = 0;

function typeTerminal() {
  if (terminalIndex >= terminalLines.length) return;
  const current = terminalLines[terminalIndex];
  terminalText.textContent += current[charIndex] || "";
  charIndex += 1;

  if (charIndex > current.length) {
    terminalText.textContent += "\n";
    terminalIndex += 1;
    charIndex = 0;
    setTimeout(typeTerminal, 350);
  } else {
    setTimeout(typeTerminal, 18);
  }
}
typeTerminal();

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  document.getElementById("dateLine").textContent = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
updateClock();
setInterval(updateClock, 1000);

const calendarGrid = document.getElementById("calendarGrid");
const calendarMonth = document.getElementById("calendarMonth");
let calendarDate = new Date();

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarMonth.textContent = firstDay.toLocaleDateString([], { month: "long", year: "numeric" });
  calendarGrid.innerHTML = "";

  ["S", "M", "T", "W", "T", "F", "S"].forEach((day) => {
    const cell = document.createElement("div");
    cell.className = "dow";
    cell.textContent = day;
    calendarGrid.appendChild(cell);
  });

  for (let i = 0; i < startDay; i += 1) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement("div");
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    cell.className = isToday ? "today" : "";
    cell.textContent = day;
    calendarGrid.appendChild(cell);
  }
}

document.getElementById("prevMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

renderCalendar();

const scoreInputs = ["mw", "logp", "hbd", "rot"].map((id) => document.getElementById(id));
const scoreEl = document.getElementById("drugScore");
const scoreText = document.getElementById("scoreText");
const scoreBar = document.getElementById("scoreBar");

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function updateDrugScore() {
  const mw = Number(document.getElementById("mw").value);
  const logp = Number(document.getElementById("logp").value);
  const hbd = Number(document.getElementById("hbd").value);
  const rot = Number(document.getElementById("rot").value);

  const mwScore = 1 - Math.abs(mw - 420) / 320;
  const logpScore = 1 - Math.abs(logp - 3.1) / 4.2;
  const hbdScore = 1 - Math.abs(hbd - 3) / 8;
  const rotScore = 1 - Math.abs(rot - 6) / 15;
  const score = Math.round(clamp((mwScore * 0.34 + logpScore * 0.28 + hbdScore * 0.19 + rotScore * 0.19) * 100, 0, 100));

  scoreEl.textContent = score;
  scoreBar.style.width = `${score}%`;
  if (score > 78) scoreText.textContent = "Promising profile in this toy scoring model.";
  else if (score > 52) scoreText.textContent = "Mixed profile; several properties are close, but not all.";
  else scoreText.textContent = "Weak profile; the toy model would deprioritize this compound.";
}
scoreInputs.forEach((input) => input.addEventListener("input", updateDrugScore));
updateDrugScore();

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".award").forEach((award) => {
      award.style.display = filter === "all" || award.dataset.category === filter ? "" : "none";
    });
  });
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreNode = document.getElementById("gameScore");
const livesNode = document.getElementById("gameLives");
let player = { x: canvas.width / 2, y: canvas.height - 44, w: 88, h: 28 };
let falling = [];
let score = 0;
let lives = 3;
let playing = false;
let paused = false;
let lastSpawn = 0;
let lastFrame = 0;

function resetGame() {
  falling = [];
  score = 0;
  lives = 3;
  scoreNode.textContent = score;
  livesNode.textContent = lives;
  lastSpawn = 0;
}

function spawnItem() {
  const good = Math.random() > 0.28;
  falling.push({
    x: Math.random() * (canvas.width - 30) + 15,
    y: -20,
    r: good ? 12 : 15,
    vy: good ? 1.5 + Math.random() * 1.8 : 2.0 + Math.random() * 2.0,
    good
  });
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function drawFlask() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = getComputedStyle(root).getPropertyValue("--accent").trim();
  ctx.strokeStyle = getComputedStyle(root).getPropertyValue("--text").trim();
  ctx.lineWidth = 3;
  roundedRect(-player.w / 2, -player.h / 2, player.w, player.h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(-player.w / 2 + 8, -3, player.w - 16, 6);
  ctx.restore();
}

function drawItem(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.strokeStyle = item.good ? getComputedStyle(root).getPropertyValue("--accent-3").trim() : getComputedStyle(root).getPropertyValue("--accent-2").trim();
  ctx.fillStyle = item.good ? "rgba(255,211,110,0.22)" : "rgba(215,184,255,0.2)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, item.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-item.r * 0.65, 0);
  ctx.lineTo(item.r * 0.65, 0);
  ctx.moveTo(0, -item.r * 0.65);
  ctx.lineTo(0, item.r * 0.65);
  ctx.stroke();
  ctx.restore();
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = getComputedStyle(root).getPropertyValue("--text").trim();
  for (let x = 0; x < canvas.width; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 80, canvas.height);
    ctx.stroke();
  }
  ctx.restore();
}

function gameLoop(timestamp) {
  if (!playing || paused) return;
  const dt = Math.min(timestamp - lastFrame, 32);
  lastFrame = timestamp;
  if (timestamp - lastSpawn > 690) {
    spawnItem();
    lastSpawn = timestamp;
  }
  falling.forEach((item) => {
    item.y += item.vy * (dt / 16);
  });
  falling = falling.filter((item) => {
    const caught = item.y + item.r > player.y - player.h / 2 && item.y - item.r < player.y + player.h / 2 && item.x > player.x - player.w / 2 && item.x < player.x + player.w / 2;
    if (caught) {
      if (item.good) score += 10;
      else lives -= 1;
      scoreNode.textContent = score;
      livesNode.textContent = lives;
      return false;
    }
    if (item.y - item.r > canvas.height) {
      if (item.good) {
        lives -= 1;
        livesNode.textContent = lives;
      }
      return false;
    }
    return true;
  });

  drawBackground();
  falling.forEach(drawItem);
  drawFlask();
  ctx.fillStyle = getComputedStyle(root).getPropertyValue("--muted").trim();
  ctx.font = "600 15px ui-sans-serif, system-ui";
  ctx.fillText("Catch compounds. Avoid noise.", 20, 30);

  if (lives <= 0) {
    playing = false;
    ctx.fillStyle = getComputedStyle(root).getPropertyValue("--text").trim();
    ctx.font = "900 46px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Model retired", canvas.width / 2, canvas.height / 2);
    ctx.font = "600 18px ui-sans-serif, system-ui";
    ctx.fillText("Press Start to run another experiment.", canvas.width / 2, canvas.height / 2 + 36);
    ctx.textAlign = "left";
    return;
  }
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  player.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
});

canvas.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();
  player.x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
}, { passive: true });

document.getElementById("startGame").addEventListener("click", () => {
  resetGame();
  playing = true;
  paused = false;
  lastFrame = performance.now();
  requestAnimationFrame(gameLoop);
});

document.getElementById("pauseGame").addEventListener("click", () => {
  if (!playing) return;
  paused = !paused;
  document.getElementById("pauseGame").textContent = paused ? "Resume" : "Pause";
  if (!paused) {
    lastFrame = performance.now();
    requestAnimationFrame(gameLoop);
  }
});

drawBackground();
drawFlask();
