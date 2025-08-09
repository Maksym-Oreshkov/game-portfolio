"use strict";

// Refactored: consolidated constants, helpers, state, and event handlers
// Notes:
// - Merged duplicated key handlers into single listeners
// - Extracted helpers for rect/overlap, tooltip range, audio control, UI toggling
// - Replaced magic numbers with named constants
// - Fixed missing `attackBtn` reference (now queried)
// - Removed unused random* variables
// - Centralized inventory updates and fight state resets
// - Ensured consistent show/hide via classList and style usage

document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM =====
  const $ = (id) => document.getElementById(id);
  const heroStand = $("hero-stand");
  const heroStandTc = $("hero-tactic");
  const heroPunchTc = $("hero-right-punch-tactic");
  const heroRunRight = $("hero-run-right");
  const heroRunLeft = $("hero-run-left");
  const heroRightPunch = $("hero-right-punch");
  const enemy = $("enemy");
  const enemyTc = $("enemy-tactic");
  const enemyAtkTc = $("enemy-attack");
  const game = $("game");
  const tooltip3 = $("tooltip3");
  const tooltip4 = $("tooltip4");
  const tooltip5 = $("tooltip5");
  const chestGif = $("chestGif");
  const shop = $("shop");
  const insideShop = $("shop-inside");
  const inventory = $("inventory");
  const blurContainer = $("blur-container");
  const fightMode = $("fight-mode");
  const invItemsContainer = $("inv-items-container");

  const showMenu = document.querySelector(".menu");
  const restartBtn = document.querySelector(".restart");
  const sideInfoElement = document.querySelector(".sideInfo");
  const sideHelpElement = document.querySelector(".sideHelp");
  const fightLog = document.querySelector(".fight-log");
  const shopMessage = document.querySelector(".shop-message");

  const shopHpItem = document.querySelector(".hp-item");
  const attackBtn = document.getElementById("attackBtn"); // existed in code but not queried
  const potionBtn = $("potionBtn");
  const shieldBtn = $("shieldBtn");
  const magicBtn = $("magicBtn");

  // ===== Constants =====
  const VIEWPORT_WIDTH = window.innerWidth;
  const MAX_BACKGROUND_X = -4000;
  const BASE_SPEED = 5;
  const SPRINT_SPEED = 8;
  const MIN_DISTANCE = 600;
  const MAX_DISTANCE = 4000;
  const PUNCH_DURATION = 500; // ms
  const ENEMY_KNOCKBACK_DELAY = 1000; // ms
  const ENEMY_RECOVER_DELAY = 300; // ms
  const HERO_KNOCKBACK_DELAY = 2000; // ms
  const HERO_RECOVER_DELAY = 300; // ms
  const HERO_TURN_DELAY_AFTER_ENEMY = 500; // ms
  const ENEMY_TURN_DELAY_AFTER_HERO = 500; // ms
  const MAGIC_ANIM_DURATION = 1000; // ms

  const KEYS = {
    LEFT: ["ArrowLeft", "Left"],
    RIGHT: ["ArrowRight", "Right"],
    SHIFT: ["Shift"],
    SPACE: [" "],
    ENTER: ["Enter"],
    ESC: ["Escape", "esc"],
    INVENTORY: ["i", "I", "ш", "Ш"],
  };

  // ===== Audio =====
  const punchSound = new Audio("audio/punch-sound.mp3");
  const runSound = new Audio("audio/running.mp3");
  const mainAudio = new Audio("audio/main.mp3");
  runSound.loop = true;

  // ===== Helpers =====
  const randPlace = (min, max) =>
    Math.trunc(Math.random() * (max - min + 1) + min);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

  const getRect = (el) => el.getBoundingClientRect();
  const overlaps = (a, b) =>
    a.right > b.left &&
    a.left < b.right &&
    a.bottom > b.top &&
    a.top < b.bottom;

  const inRange = (x, rangeStart, rangeWidth) =>
    x >= rangeStart && x <= rangeStart + rangeWidth;

  const show = (el) => (el.style.display = "block");
  const hide = (el) => (el.style.display = "none");

  const addHidden = (el) => el.classList.add("hidden");
  const removeHidden = (el) => el.classList.remove("hidden");

  const withBlur = (enabled) => {
    blurContainer.classList.toggle("blur-background", enabled);
  };

  const playOnce = (audio) => {
    if (audio.paused) audio.play();
  };
  const stopAndReset = (audio) => {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const showShopFlash = (message, type) => {
    shopMessage.textContent = message;
    shopMessage.style.color = type === "success" ? "#4CAF50" : "#f44336";
    shopMessage.style.display = "block";
    setTimeout(() => (shopMessage.style.display = "none"), 2000);
  };

  const updateSideInfo = (amount) => {
    sideInfoElement.textContent = `💰 +${amount} Gold`;
    sideHelpElement.style.display = "block";
    setTimeout(() => (sideHelpElement.style.display = "none"), 3000);
  };

  // ===== World State =====
  let heroX = 0;
  let backgroundX = 0;

  let movingRight = false;
  let movingLeft = false;
  let punching = false;
  let heroSpeed = BASE_SPEED;

  const enemyX = randPlace(MIN_DISTANCE, MAX_DISTANCE);
  const itemX = randPlace(MIN_DISTANCE, MAX_DISTANCE);
  const shopX = randPlace(MIN_DISTANCE, MAX_DISTANCE);

  let tooltip3Hidden = false;
  let tooltip4Hidden = false;
  let isChestOpen = false;

  // ===== Hero / Enemy Stats =====
  const heroStats = {
    name: "Gra'marh",
    attack: 5,
    hp: 15,
    maxHp: 15,
    gold: 0,
    mana: 100,
    maxMana: 100,
    potions: 0,
  };

  const enemyStats = {
    name: "Darkling",
    attack: 3,
    hp: 20,
    maxHp: 20,
  };

  // ===== Fight State =====
  let heroTurn = false;
  let isInFightMode = false;
  let potionUsedInBattle = false;
  let shieldActive = false;
  let magicSpellsUsed = 0;

  // ===== UI =====
  function showHero(state) {
    [heroStand, heroRunRight, heroRunLeft, heroRightPunch].forEach(addHidden);
    if (state === "stand") removeHidden(heroStand);
    else if (state === "right") removeHidden(heroRunRight);
    else if (state === "left") removeHidden(heroRunLeft);
    else if (state === "punch") removeHidden(heroRightPunch);
  }

  function moveHero() {
    if (movingRight && !punching) {
      if (heroX < VIEWPORT_WIDTH / 2 || backgroundX <= MAX_BACKGROUND_X)
        heroX += heroSpeed;
      else {
        backgroundX = Math.max(backgroundX - heroSpeed, MAX_BACKGROUND_X);
        game.style.backgroundPositionX = `${backgroundX}px`;
      }
      showHero("right");
    } else if (movingLeft && !punching) {
      if (heroX > VIEWPORT_WIDTH / 2 || backgroundX >= 0) heroX -= heroSpeed;
      else {
        backgroundX = Math.min(backgroundX + heroSpeed, 0);
        game.style.backgroundPositionX = `${backgroundX}px`;
      }
      showHero("left");
    }

    heroX = clamp(heroX, 0, VIEWPORT_WIDTH - heroStand.width);

    // sync positions
    [heroStand, heroRunRight, heroRunLeft, heroRightPunch].forEach(
      (el) => (el.style.left = `${heroX}px`)
    );

    const enemyViewportX = enemyX + backgroundX;
    const itemViewportX = itemX + backgroundX;
    const shopViewportX = shopX + backgroundX;

    enemy.style.left = `${enemyViewportX}px`;
    chestGif.style.left = `${itemViewportX}px`;
    shop.style.left = `${shopViewportX}px`;

    // tooltips
    updateTooltipRange(
      tooltip3,
      tooltip3Hidden,
      enemyX + backgroundX - 200,
      200
    );
    updateTooltipRange(
      tooltip4,
      tooltip4Hidden,
      itemX + backgroundX - 300,
      200
    );

    // proximity checks (side effects triggered on key handlers)
    requestAnimationFrame(moveHero);
  }

  function updateTooltipRange(tooltipEl, hiddenFlag, startX, width) {
    if (hiddenFlag) return;
    const shouldShow = inRange(heroX, startX, width);
    tooltipEl.classList.toggle("hidden", !shouldShow);
  }

  const nearItem = () => overlaps(getRect(heroStand), getRect(chestGif));
  const nearEnemy = () => overlaps(getRect(heroStand), getRect(enemy));
  const nearShop = () => overlaps(getRect(heroStand), getRect(shop));

  function punchHero() {
    if (punching) return;
    punching = true;
    punchSound.play();
    showHero("punch");
    setTimeout(() => {
      punching = false;
      if (!movingRight && !movingLeft) showHero("stand");
    }, PUNCH_DURATION);
  }

  function startRunSound() {
    playOnce(runSound);
  }
  function stopRunSound() {
    stopAndReset(runSound);
  }

  // ===== Inventory & Storage =====
  function updateInventory() {
    $("hero-attack").textContent = `⚔️ Attack - ${heroStats.attack}`;
    $("hero-hp").textContent = `❤️ Hp - ${heroStats.hp}/${heroStats.maxHp}`;
    $(
      "hero-hp-tactic"
    ).textContent = `❤️ Hp - ${heroStats.hp}/${heroStats.maxHp}`;
    $("hero-gold").textContent = `💰 Gold - ${heroStats.gold}`;
    $(
      "hero-mana"
    ).textContent = `✨ Mana - ${heroStats.mana}/${heroStats.maxMana}`;
    $(
      "hero-mana-tactic"
    ).textContent = `✨ Mana - ${heroStats.mana}/${heroStats.maxMana}`;
    $("hero-potions").textContent = `🧪 Potions - ${heroStats.potions}`;
    updateInventoryDisplay();
  }

  function updateInventoryDisplay() {
    invItemsContainer.innerHTML = "";
    if (heroStats.potions > 0) {
      for (let i = 0; i < heroStats.potions; i++) {
        const potionItem = document.createElement("div");
        potionItem.className = "inv-item";
        potionItem.textContent = `🧪 elixir of health`;
        invItemsContainer.appendChild(potionItem);
      }
    } else {
      const emptyItem = document.createElement("div");
      emptyItem.className = "inv-item";
      emptyItem.textContent = "Пусто";
      invItemsContainer.appendChild(emptyItem);
    }
  }

  function addGold(amount) {
    heroStats.gold += amount;
    updateInventory();
    localStorage.setItem("heroStats", JSON.stringify(heroStats));
    updateSideInfo(amount);
  }

  function loadStats() {
    const data = localStorage.getItem("heroStats");
    if (data) Object.assign(heroStats, JSON.parse(data));
    updateInventory();
  }

  // ===== Shop =====
  shopHpItem.addEventListener("click", () => {
    if (heroStats.gold >= 100) {
      heroStats.gold -= 100;
      heroStats.potions += 1;
      updateInventory();
      localStorage.setItem("heroStats", JSON.stringify(heroStats));
      showShopFlash("The elixir has been purchased!", "success");
    } else {
      showShopFlash("Not enough gold!", "error");
    }
  });

  // ===== Keyboard Handling =====
  const onKeyDown = (e) => {
    // Block inputs during fight mode except ESC
    if (isInFightMode && !KEYS.ESC.includes(e.key)) return;

    if (KEYS.SHIFT.includes(e.key)) heroSpeed = SPRINT_SPEED;

    if (KEYS.RIGHT.includes(e.key)) {
      if (!movingRight && !movingLeft) startRunSound();
      movingRight = true;
      movingLeft = false;
    } else if (KEYS.LEFT.includes(e.key)) {
      if (!movingRight && !movingLeft) startRunSound();
      movingLeft = true;
      movingRight = false;
    } else if (KEYS.SPACE.includes(e.key)) {
      punchHero();
    } else if (KEYS.ENTER.includes(e.key)) {
      if (nearEnemy()) {
        // start fight
        isInFightMode = true;
        tooltip3.classList.add("hidden");
        tooltip3Hidden = true;
        mainAudio.play();
        show(fightMode);
        withBlur(true);
        startFight();
      } else if (!isInFightMode && nearItem() && !isChestOpen) {
        // open chest
        tooltip4.classList.add("hidden");
        tooltip4Hidden = true;
        openChest();
        isChestOpen = true;
        setTimeout(() => addGold(100), 1000);
        setTimeout(() => chestGif.classList.add("hidden"), 2000);
      } else if (!isInFightMode && nearShop()) {
        // toggle shop
        const opening =
          insideShop.style.display === "none" ||
          insideShop.style.display === "";
        if (opening) {
          show(insideShop);
          withBlur(true);
        } else {
          hide(insideShop);
          withBlur(false);
        }
      }
    } else if (KEYS.INVENTORY.includes(e.key) && !isInFightMode) {
      const opening =
        inventory.style.display === "none" || inventory.style.display === "";
      if (opening) {
        show(inventory);
        withBlur(true);
      } else {
        hide(inventory);
        withBlur(false);
      }
    } else if (KEYS.ESC.includes(e.key)) {
      const isAnyMenuOpen =
        inventory.style.display === "block" ||
        insideShop.style.display === "block" ||
        showMenu.style.display === "block";
      if (isAnyMenuOpen) {
        hide(showMenu);
        hide(inventory);
        hide(insideShop);
        withBlur(false);
      } else {
        show(showMenu);
        withBlur(true);
      }
    }
  };

  const onKeyUp = (e) => {
    if (isInFightMode && !KEYS.ESC.includes(e.key)) return;
    if (KEYS.SHIFT.includes(e.key)) heroSpeed = BASE_SPEED;

    if (KEYS.RIGHT.includes(e.key)) {
      movingRight = false;
      if (!movingLeft) stopRunSound();
    } else if (KEYS.LEFT.includes(e.key)) {
      movingLeft = false;
      if (!movingRight) stopRunSound();
    }
    if (!movingRight && !movingLeft && !punching) showHero("stand");
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // Restart
  restartBtn.addEventListener("click", () => {
    localStorage.removeItem("heroStats");
    location.reload();
  });

  // ===== Chest =====
  function openChest() {
    chestGif.src = "assets/chest_opened.gif";
  }

  // ===== Fight System =====
  const getHeroRandomAttack = () =>
    Math.trunc(Math.random() * (heroStats.attack + 1));
  const getEnemyRandomAttack = () =>
    Math.trunc(Math.random() * (enemyStats.attack + 1));

  function displayFightLog(message) {
    const p = document.createElement("p");
    p.textContent = message;
    fightLog.appendChild(p);
    fightLog.scrollTop = fightLog.scrollHeight;
  }

  function startFight() {
    fightMode.classList.remove("hidden");
    show(fightMode);
    enemy.style.display = "block";
    withBlur(true);
    isInFightMode = true;

    // reset
    potionUsedInBattle = false;
    shieldActive = false;
    magicSpellsUsed = 0;

    // enable/disable buttons
    potionBtn.disabled = heroStats.potions === 0;
    shieldBtn.disabled = false;
    magicBtn.disabled = heroStats.mana < 30;

    fightLog.innerHTML = "";
    displayFightLog("The fight has begun!");
    startHeroTurn();
  }

  function startHeroTurn() {
    heroTurn = true;
    displayFightLog(`${heroStats.name}, your turn!`);

    heroStandTc.classList.remove("hidden");
    heroPunchTc.classList.add("hidden");
    enemyTc.classList.remove("hidden");
    enemyAtkTc.classList.add("hidden");

    if (shieldActive) {
      shieldActive = false;
      heroStandTc.classList.remove("shield-active");
    }
  }

  function heroAttack() {
    heroTurn = false;

    const dmg = getHeroRandomAttack();

    heroStandTc.classList.add("hidden");
    heroPunchTc.classList.remove("hidden");
    enemyTc.classList.remove("hidden");
    enemyAtkTc.classList.add("hidden");

    setTimeout(() => {
      enemyTc.classList.add("enemy-knockback");
      enemyStats.hp -= dmg;
      displayFightLog(
        `${heroStats.name} attacks ${enemyStats.name} and deals ${dmg} damage.`
      );

      setTimeout(
        () => enemyTc.classList.remove("enemy-knockback"),
        ENEMY_RECOVER_DELAY
      );

      if (enemyStats.hp <= 0) {
        displayFightLog(`${enemyStats.name} defeated!`);
        endFight(true);
        return;
      }
      updateInventory();
      setTimeout(enemyAttack, ENEMY_TURN_DELAY_AFTER_HERO);
    }, ENEMY_KNOCKBACK_DELAY);
  }

  function enemyAttack() {
    heroStandTc.classList.remove("hidden");
    heroPunchTc.classList.add("hidden");
    enemyTc.classList.add("hidden");
    enemyAtkTc.classList.remove("hidden");

    let dmg = getEnemyRandomAttack();
    if (shieldActive) {
      dmg = Math.floor(dmg / 2);
      displayFightLog(`The shield absorbed some of the damage!`);
    }

    setTimeout(() => {
      heroStandTc.classList.add("hero-knockback");
      heroStats.hp -= dmg;
      displayFightLog(
        `${enemyStats.name} attacks ${heroStats.name} and deals ${dmg} damage.`
      );
      setTimeout(
        () => heroStandTc.classList.remove("hero-knockback"),
        HERO_RECOVER_DELAY
      );

      if (heroStats.hp <= 0) {
        setTimeout(() => {
          displayFightLog(`${heroStats.name} defeated...`);
          endFight(false);
        }, 1000);
        return;
      }
      updateInventory();
      setTimeout(startHeroTurn, HERO_TURN_DELAY_AFTER_ENEMY);
    }, HERO_KNOCKBACK_DELAY);
  }

  function usePotion() {
    potionUsedInBattle = true;
    heroStats.potions--;
    const heal = 50;
    heroStats.hp = Math.min(heroStats.hp + heal, heroStats.maxHp);
    displayFightLog(
      `${heroStats.name} drank the elixir and was restored ${heal} HP!`
    );
    updateInventory();
    potionBtn.disabled = true;
    setTimeout(enemyAttack, 1000);
  }

  function activateShield() {
    shieldActive = true;
    shieldBtn.disabled = true;
    heroStandTc.classList.add("shield-active");
    displayFightLog(`${heroStats.name} поднял щит!`);
    setTimeout(enemyAttack, 1000);
  }

  function castMagic() {
    magicSpellsUsed++;
    heroStats.mana -= 30;

    fightMode.classList.add("magic-effect");
    heroStandTc.classList.add("magic-animation");

    const magicDamage = Math.floor(Math.random() * 10 + 10);
    enemyStats.hp -= magicDamage;

    displayFightLog(
      `${heroStats.name} used magic and inflicted ${magicDamage} урона!`
    );

    setTimeout(() => {
      fightMode.classList.remove("magic-effect");
      heroStandTc.classList.remove("magic-animation");
    }, MAGIC_ANIM_DURATION);

    if (enemyStats.hp <= 0) {
      displayFightLog(`${enemyStats.name} побеждён!`);
      endFight(true);
      return;
    }

    updateInventory();
    if (magicSpellsUsed >= 2) magicBtn.disabled = true;
    setTimeout(enemyAttack, 1500);
  }

  function endFight(heroWon) {
    isInFightMode = false;

    if (heroWon) {
      addGold(50);
      heroStats.mana = Math.min(heroStats.mana + 20, heroStats.maxMana);
    } else {
      location.reload();
    }

    fightMode.classList.add("hidden");
    hide(fightMode);
    enemy.style.display = "none";
    withBlur(false);
    mainAudio.pause();
    fightLog.innerHTML = "";
  }

  // ===== Fight Buttons =====
  attackBtn?.addEventListener("click", () => {
    if (heroTurn && isInFightMode) heroAttack();
  });
  potionBtn.addEventListener("click", () => {
    if (
      heroTurn &&
      isInFightMode &&
      !potionUsedInBattle &&
      heroStats.potions > 0
    )
      usePotion();
  });
  shieldBtn.addEventListener("click", () => {
    if (heroTurn && isInFightMode && !shieldActive) activateShield();
  });
  magicBtn.addEventListener("click", () => {
    if (
      heroTurn &&
      isInFightMode &&
      magicSpellsUsed < 2 &&
      heroStats.mana >= 30
    )
      castMagic();
  });

  // ===== Init =====
  moveHero();
  showHero("stand");
  loadStats();
});
