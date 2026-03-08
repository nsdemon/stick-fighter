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
  ];

  let points = 0;
  let currentSwordIndex = 0;
  let playerHP = 100;
  let enemyHP = 100;
  let gameOver = false;

  const PLAYER_X = 180;
  const ENEMY_X = canvas.width - 180;
  const FLOOR_Y = canvas.height - 60;
  const FIGURE_HEIGHT = 120;

  let playerSwing = 0;
  let enemySwing = 0;
  const SWING_DURATION = 12;
  let lastEnemyAttack = 0;

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

  function drawStickFigure(x, y, facingRight, swingProgress, swordColor, swordLength) {
    if (swordLength == null) swordLength = 55 + (currentSwordIndex + 1) * 8;
    const dir = facingRight ? 1 : -1;
    const headY = y - FIGURE_HEIGHT + 20;
    const neckY = headY + 18;
    const bodyTop = neckY + 4;
    const bodyBottom = y - 40;
    const armY = bodyTop + 15;

    ctx.strokeStyle = "#e8d4b8";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(x, headY, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, neckY);
    ctx.lineTo(x, bodyBottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, bodyTop);
    ctx.lineTo(x - 35 * dir, bodyBottom - 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, bodyTop);
    ctx.lineTo(x + 35 * dir, bodyBottom - 15);
    ctx.stroke();

    const armAngle = swingProgress > 0
      ? (Math.PI / 2) * (1 - swingProgress) * dir
      : (Math.PI / 4) * dir;
    const swordHandX = x + Math.cos(armAngle) * 40 * dir;
    const swordHandY = armY + Math.sin(armAngle) * 40;

    ctx.beginPath();
    ctx.moveTo(x, armY);
    ctx.lineTo(swordHandX, swordHandY);
    ctx.stroke();
    let swordAngle = armAngle + (Math.PI / 2) * dir;
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

    if (playerSwing > 0) {
      playerSwing--;
      if (playerSwing === Math.floor(SWING_DURATION / 2)) {
        const dist = Math.abs(ENEMY_X - PLAYER_X);
        if (dist < 160 && enemyHP > 0) {
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

    lastEnemyAttack++;
    if (enemySwing > 0) {
      enemySwing--;
      if (enemySwing === Math.floor(SWING_DURATION / 2)) {
        const dist = Math.abs(ENEMY_X - PLAYER_X);
        if (dist < 160 && playerHP > 0) {
          playerHP = Math.max(0, playerHP - 15);
          updateUI();
          if (playerHP <= 0) endGame(false);
        }
      }
    } else if (enemyHP > 0 && lastEnemyAttack > 45) {
      const dist = Math.abs(ENEMY_X - PLAYER_X);
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
      PLAYER_X,
      FLOOR_Y,
      true,
      playerSwingNorm,
      currentSword().color
    );
    drawStickFigure(
      ENEMY_X,
      FLOOR_Y,
      false,
      enemySwingNorm,
      "#708090",
      55
    );
  }

  function attack() {
    if (gameOver || playerSwing > 0) return;
    playerSwing = SWING_DURATION;
  }

  function spawnEnemy() {
    enemyHP = 100;
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
    enemyHP = 100;
    playerSwing = 0;
    enemySwing = 0;
    lastEnemyAttack = 0;
    updateUI();
  }

  function updateUI() {
    document.getElementById("points").textContent = points;
    document.getElementById("sword-name").textContent = currentSword().name;
    const playerHpPct = Math.max(0, (playerHP / 100) * 100);
    const enemyHpPct = Math.max(0, (enemyHP / 100) * 100);
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
  });

  canvas.addEventListener("click", function () {
    attack();
  });

  document.getElementById("shop-modal").addEventListener("click", function (e) {
    if (e.target === this) closeShop();
  });

  tick();
})();
