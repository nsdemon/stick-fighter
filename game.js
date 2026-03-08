(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  const SWORDS = [
    { id: "wood", name: "Wooden Sword", cost: 0, damage: 10, color: "#8B4513" },
    { id: "iron", name: "Iron Sword", cost: 50, damage: 25, color: "#708090" },
    { id: "steel", name: "Steel Sword", cost: 150, damage: 45, color: "#C0C0C0" },
    { id: "knight", name: "Knight's Blade", cost: 400, damage: 70, color: "#E8E8E8" },
    { id: "legend", name: "Legendary Edge", cost: 1000, damage: 120, color: "#FFD700" },
    { id: "flame", name: "Flame Brand", cost: 1500, damage: 155, color: "#FF6B35" },
    { id: "frost", name: "Frost Fang", cost: 2200, damage: 195, color: "#7DD3FC" },
    { id: "shadow", name: "Shadow Reaper", cost: 3000, damage: 240, color: "#4C1D95" },
    { id: "holy", name: "Holy Avenger", cost: 4000, damage: 290, color: "#FEF08A" },
    { id: "dragon", name: "Dragon's Tooth", cost: 5200, damage: 345, color: "#DC2626" },
    { id: "void", name: "Void Cleaver", cost: 6600, damage: 405, color: "#1F2937" },
    { id: "storm", name: "Stormcaller", cost: 8200, damage: 470, color: "#38BDF8" },
    { id: "phoenix", name: "Phoenix Edge", cost: 10000, damage: 540, color: "#F97316" },
    { id: "titan", name: "Titan's Wrath", cost: 12500, damage: 620, color: "#A3A3A3" },
    { id: "infinity", name: "Infinity Blade", cost: 15500, damage: 720, color: "#A78BFA" },
  ];

  let points = 0;
  let currentSwordIndex = 0;
  let playerHP = 100;
  let enemyHP = 100;
  let gameOver = false;

  const FLOOR_Y = canvas.height - 60;
  const FIGURE_HEIGHT = 120;
  const PLAYER_SPEED = 4;
  const PLAYER_MIN_X = 80;
  const PLAYER_MAX_X = canvas.width - 280;
  const ENEMY_SPEED = 3;
  const ENEMY_MIN_X = 640;
  const ENEMY_MAX_X = canvas.width - 80;
  const ENEMY_ATTACK_RANGE = 160;
  const ENEMY_APPROACH_RANGE = 200;
  const ENEMY_RETREAT_FRAMES = 25;

  let playerX = 180;
  let enemyX = canvas.width - 180;
  let playerSwing = 0;
  let enemySwing = 0;
  let enemyRetreat = 0;
  const SWING_DURATION = 12;
  let lastEnemyAttack = 0;
  let enemyMaxHP = 100;

  const keys = { w: false, a: false, s: false, d: false };

  function getState() {
    return {
      points,
      currentSwordIndex,
      playerHP,
      enemyHP,
      gameOver,
      playerSwing,
      enemySwing,
    };
  }

  function saveState() {
    try {
      localStorage.setItem("stickfighter", JSON.stringify({
        points,
        currentSwordIndex,
        unlockedSwords: SWORDS.slice(0, currentSwordIndex + 1).map((s) => s.id),
      }));
    } catch (e) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem("stickfighter");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.points === "number") points = data.points;
      if (typeof data.currentSwordIndex === "number")
        currentSwordIndex = Math.min(data.currentSwordIndex, SWORDS.length - 1);
    } catch (e) {}
  }

  loadState();
  updateUI();

  function currentSword() {
    return SWORDS[currentSwordIndex];
  }

  function enemyTier() {
    return Math.min(currentSwordIndex, SWORDS.length - 1);
  }
  function enemySwordStats() {
    return SWORDS[enemyTier()];
  }
  function enemyDamage() {
    return Math.max(8, Math.floor(enemySwordStats().damage * 0.35));
  }

  function drawStickFigure(x, y, facingRight, swingProgress, swordColor, swordLength) {
    if (swordLength == null) swordLength = 55 + (currentSwordIndex + 1) * 8;
    const dir = facingRight ? 1 : -1;
    const headY = y - FIGURE_HEIGHT + 20;
    const neckY = headY + 18;
    const shoulderY = neckY + 14;
    const torsoBottom = y - 42;

    ctx.strokeStyle = "#e8d4b8";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(x, headY, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, neckY);
    ctx.lineTo(x, torsoBottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, torsoBottom);
    ctx.lineTo(x - 32 * dir, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, torsoBottom);
    ctx.lineTo(x + 32 * dir, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, shoulderY);
    ctx.lineTo(x - 28 * dir, shoulderY - 15);
    ctx.stroke();

    const armAngle = swingProgress > 0
      ? (Math.PI / 2) * (1 - swingProgress) * dir
      : (Math.PI / 5) * dir;
    const swordHandX = x + Math.cos(armAngle) * 38 * dir;
    const swordHandY = shoulderY + Math.sin(armAngle) * 38;

    ctx.beginPath();
    ctx.moveTo(x, shoulderY);
    ctx.lineTo(swordHandX, swordHandY);
    ctx.stroke();

    let swordAngle = armAngle - (Math.PI / 2) * dir;
    if (swingProgress > 0) {
      swordAngle += (Math.PI * 0.85 * swingProgress) * dir;
    }
    const swordTipX = swordHandX + Math.cos(swordAngle) * swordLength;
    const swordTipY = swordHandY + Math.sin(swordAngle) * swordLength;

    ctx.strokeStyle = swordColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(swordHandX, swordHandY);
    ctx.lineTo(swordTipX, swordTipY);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#4a3520";
    ctx.beginPath();
    ctx.moveTo(swordHandX, swordHandY);
    ctx.lineTo(
      swordHandX + Math.cos(swordAngle) * 12 * dir,
      swordHandY + Math.sin(swordAngle) * 12
    );
    ctx.stroke();
  }

  function tick() {
    if (gameOver) {
      requestAnimationFrame(tick);
      return;
    }

    if (keys.a) playerX = Math.max(PLAYER_MIN_X, playerX - PLAYER_SPEED);
    if (keys.d) playerX = Math.min(PLAYER_MAX_X, playerX + PLAYER_SPEED);

    if (playerSwing > 0) {
      playerSwing--;
      if (playerSwing === Math.floor(SWING_DURATION / 2)) {
        const dist = Math.abs(enemyX - playerX);
        if (dist < ENEMY_ATTACK_RANGE && enemyHP > 0) {
          const dmg = currentSword().damage;
          enemyHP = Math.max(0, enemyHP - dmg);
          points += 5;
          if (enemyHP <= 0) {
            points += 25;
            spawnEnemy();
          }
          updateUI();
        }
      }
    }

    if (enemyHP > 0 && enemySwing === 0) {
      const dist = enemyX - playerX;
      let targetX;
      if (enemyRetreat > 0) {
        enemyRetreat--;
        targetX = enemyX + 50;
      } else if (Math.abs(dist) > ENEMY_APPROACH_RANGE) {
        targetX = playerX + 130;
      } else {
        targetX = enemyX + (Math.random() < 0.5 ? -35 : 35);
      }
      const dx = targetX - enemyX;
      if (Math.abs(dx) > 2) {
        enemyX += dx > 0 ? ENEMY_SPEED : -ENEMY_SPEED;
        enemyX = Math.max(ENEMY_MIN_X, Math.min(ENEMY_MAX_X, enemyX));
      }
    }

    lastEnemyAttack++;
    if (enemySwing > 0) {
      enemySwing--;
      if (enemySwing === Math.floor(SWING_DURATION / 2)) {
        const dist = Math.abs(enemyX - playerX);
        if (dist < ENEMY_ATTACK_RANGE && playerHP > 0) {
          playerHP = Math.max(0, playerHP - enemyDamage());
          enemyRetreat = ENEMY_RETREAT_FRAMES;
          updateUI();
          if (playerHP <= 0) endGame(false);
        }
      }
    } else if (enemyHP > 0 && lastEnemyAttack > 45) {
      const dist = Math.abs(enemyX - playerX);
      if (dist < 180) {
        enemySwing = SWING_DURATION;
        lastEnemyAttack = 0;
      }
    }

    draw();
    requestAnimationFrame(tick);
  }

  function draw() {
    ctx.fillStyle = "#0d0505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#2a1515";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(canvas.width, FLOOR_Y);
    ctx.stroke();

    const playerSwingNorm = playerSwing / SWING_DURATION;
    const enemySwingNorm = enemySwing / SWING_DURATION;

    drawStickFigure(
      playerX,
      FLOOR_Y,
      true,
      playerSwingNorm,
      currentSword().color
    );
    drawStickFigure(
      enemyX,
      FLOOR_Y,
      false,
      enemySwingNorm,
      enemySwordStats().color,
      50 + (enemyTier() + 1) * 5
    );
  }

  function attack() {
    if (gameOver || playerSwing > 0) return;
    playerSwing = SWING_DURATION;
  }

  function spawnEnemy() {
    enemyMaxHP = 80 + enemyTier() * 12;
    enemyHP = enemyMaxHP;
    enemyX = canvas.width - 180;
    enemyRetreat = 0;
  }

  function endGame(won) {
    gameOver = true;
    saveState();
    const title = document.getElementById("gameover-title");
    const msg = document.getElementById("gameover-msg");
    title.textContent = won ? "Victory!" : "Defeated";
    title.className = won ? "victory" : "defeat";
    msg.textContent = won
      ? "Another enemy approaches..."
      : "Buy better swords in the shop and try again!";
    document.getElementById("gameover-modal").hidden = false;
  }

  function restart() {
    document.getElementById("gameover-modal").hidden = true;
    gameOver = false;
    playerHP = 100;
    enemyMaxHP = 80 + enemyTier() * 12;
    enemyHP = enemyMaxHP;
    playerX = 180;
    enemyX = canvas.width - 180;
    playerSwing = 0;
    enemySwing = 0;
    enemyRetreat = 0;
    lastEnemyAttack = 0;
    updateUI();
  }

  function updateUI() {
    document.getElementById("points").textContent = points;
    document.getElementById("sword-name").textContent = currentSword().name;
    const playerHpPct = Math.max(0, (playerHP / 100) * 100);
    const enemyHpPct = Math.max(0, (enemyHP / enemyMaxHP) * 100);
    document.getElementById("player-hp").style.width = playerHpPct + "%";
    document.getElementById("enemy-hp").style.width = enemyHpPct + "%";
  }

  function openShop() {
    document.getElementById("shop-points").textContent = points;
    const list = document.getElementById("sword-list");
    list.innerHTML = "";
    SWORDS.forEach((s, i) => {
      const li = document.createElement("li");
      const owned = i <= currentSwordIndex;
      const canBuy = !owned && points >= s.cost;
      if (owned) li.classList.add("owned");
      else if (!canBuy) li.classList.add("locked");
      li.innerHTML =
        `<span>${s.name}</span>` +
        (owned
          ? "<span>Equipped</span>"
          : `<span class="cost">${s.cost} pts</span><span class="damage">${s.damage} dmg</span>`);
      if (canBuy) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn";
        btn.textContent = "Buy";
        btn.addEventListener("click", function () {
          points -= s.cost;
          currentSwordIndex = i;
          saveState();
          updateUI();
          openShop();
        });
        li.appendChild(btn);
      } else if (owned && i === currentSwordIndex) {
        li.appendChild(document.createTextNode(" ✓"));
      }
      list.appendChild(li);
    });
    document.getElementById("shop-modal").hidden = false;
  }

  function closeShop() {
    document.getElementById("shop-modal").hidden = true;
  }

  document.getElementById("shop-btn").addEventListener("click", openShop);
  document.getElementById("shop-close").addEventListener("click", closeShop);
  document.getElementById("restart-btn").addEventListener("click", restart);

  document.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      attack();
    }
    if (e.code === "KeyW") keys.w = true;
    if (e.code === "KeyA") keys.a = true;
    if (e.code === "KeyS") keys.s = true;
    if (e.code === "KeyD") keys.d = true;
  });
  document.addEventListener("keyup", function (e) {
    if (e.code === "KeyW") keys.w = false;
    if (e.code === "KeyA") keys.a = false;
    if (e.code === "KeyS") keys.s = false;
    if (e.code === "KeyD") keys.d = false;
  });

  canvas.addEventListener("click", function () {
    attack();
  });

  document.getElementById("shop-modal").addEventListener("click", function (e) {
    if (e.target === this) closeShop();
  });

  tick();
})();
