"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const heroStand = document.getElementById("hero-stand");
  const heroStandTc = document.getElementById("hero-tactic");
  const heroPunchTc = document.getElementById("hero-right-punch-tactic");
  const heroRunRight = document.getElementById("hero-run-right");
  const heroRunLeft = document.getElementById("hero-run-left");
  const heroRightPunch = document.getElementById("hero-right-punch");
  const enemy = document.getElementById("enemy");
  const enemyTc = document.getElementById("enemy-tactic");
  const enemyAtkTc = document.getElementById("enemy-attack");
  const game = document.getElementById("game");
  const tooltip3 = document.getElementById("tooltip3");
  const tooltip4 = document.getElementById("tooltip4");
  const tooltip5 = document.getElementById("tooltip5");
  const chestGif = document.getElementById("chestGif");
  const shop = document.getElementById("shop");
  const insideShop = document.getElementById("shop-inside");
  const inventory = document.getElementById("inventory");
  const blurContainer = document.getElementById("blur-container");
  const showMenu = document.querySelector(".menu");
  const restartBtn = document.querySelector(".restart");
  const sideInfoElement = document.querySelector(".sideInfo");
  const sideHelpElement = document.querySelector(".sideHelp");
  const fightMode = document.getElementById("fight-mode");
  const fightLog = document.querySelector(".fight-log");
  const shopMessage = document.querySelector(".shop-message");
  const invItemsContainer = document.getElementById("inv-items-container");

  // Новые элементы для боевой системы
  const potionBtn = document.getElementById("potionBtn");
  const shieldBtn = document.getElementById("shieldBtn");
  const magicBtn = document.getElementById("magicBtn");

  let heroX = 0;
  let hasWeapon = false;

  const baseSpeed = 5;
  let heroSpeed = baseSpeed;
  const sprintSpeed = 8;

  let movingRight = false;
  let movingLeft = false;
  let punching = false;

  let backgroundX = 0;

  const viewportWidth = window.innerWidth;
  const maxBackgroundX = -4000;

  const punchSound = new Audio("audio/punch-sound.mp3");
  const runSound = new Audio("audio/running.mp3");
  const mainAudio = new Audio("audio/main.mp3");

  runSound.loop = true;

  let minDistance = 600;
  let maxDistance = 4000;

  function getRandomPlace(min, max) {
    return Math.trunc(Math.random() * (max - min + 100) + min);
  }

  let randomEnemyPlace = getRandomPlace(minDistance, maxDistance);
  let randomItemPlace = getRandomPlace(minDistance, maxDistance);
  let randomShopePlace = getRandomPlace(minDistance, maxDistance);

  const enemyX = getRandomPlace(minDistance, maxDistance);
  const itemX = getRandomPlace(minDistance, maxDistance);
  const shopX = getRandomPlace(minDistance, maxDistance);

  let tooltip3Hidden = false;
  let tooltip4Hidden = false;

  // Статистика игрока
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

  // Статистика врага
  const enemyStats = {
    name: "Darkling",
    attack: 3,
    hp: 20,
    maxHp: 20,
  };

  // Боевые переменные
  let heroTurn = false;
  let isInFightMode = false;
  let potionUsedInBattle = false;
  let shieldActive = false;
  let magicSpellsUsed = 0;

  function moveHero() {
    if (movingRight && !punching) {
      if (heroX < viewportWidth / 2 || backgroundX <= maxBackgroundX) {
        heroX += heroSpeed;
      } else {
        backgroundX = Math.max(backgroundX - heroSpeed, maxBackgroundX);
        game.style.backgroundPositionX = `${backgroundX}px`;
      }
      showHero("right");
    } else if (movingLeft && !punching) {
      if (heroX > viewportWidth / 2 || backgroundX >= 0) {
        heroX -= heroSpeed;
      } else {
        backgroundX = Math.min(backgroundX + heroSpeed, 0);
        game.style.backgroundPositionX = `${backgroundX}px`;
      }
      showHero("left");
    }

    heroX = Math.max(heroX, 0);
    heroX = Math.min(heroX, viewportWidth - heroStand.width);

    heroStand.style.left = `${heroX}px`;
    heroRunRight.style.left = `${heroX}px`;
    heroRunLeft.style.left = `${heroX}px`;
    heroRightPunch.style.left = `${heroX}px`;

    const enemyViewportX = enemyX + backgroundX;
    enemy.style.left = `${enemyViewportX}px`;

    const itemViewportX = itemX + backgroundX;
    chestGif.style.left = `${itemViewportX}px`;

    const shopViewportX = shopX + backgroundX;
    shop.style.left = `${shopViewportX}px`;

    checkTooltip3Position();
    checkTooltip4Position();

    checkItemProximity();
    checkEnemyProximity();
    checkShopProximity();

    requestAnimationFrame(moveHero);
  }

  function checkTooltip3Position() {
    if (tooltip3Hidden) return;
    const tooltip3PositionX = enemyX + backgroundX - 200;

    if (heroX >= tooltip3PositionX && heroX <= tooltip3PositionX + 200) {
      tooltip3.classList.remove("hidden");
    } else {
      tooltip3.classList.add("hidden");
    }
  }

  function checkTooltip4Position() {
    if (tooltip4Hidden) return;

    const tooltip4PositionX = itemX + backgroundX - 300;

    if (heroX >= tooltip4PositionX && heroX <= tooltip4PositionX + 200) {
      tooltip4.classList.remove("hidden");
    } else {
      tooltip4.classList.add("hidden");
    }
  }

  function checkItemProximity() {
    const heroRect = heroStand.getBoundingClientRect();
    const itemRect = chestGif.getBoundingClientRect();

    return (
      heroRect.right > itemRect.left &&
      heroRect.left < itemRect.right &&
      heroRect.bottom > itemRect.top &&
      heroRect.top < itemRect.bottom
    );
  }

  function checkEnemyProximity() {
    const heroRect = heroStand.getBoundingClientRect();
    const enemyRect = enemy.getBoundingClientRect();

    return (
      heroRect.right > enemyRect.left &&
      heroRect.left < enemyRect.right &&
      heroRect.bottom > enemyRect.top &&
      heroRect.top < enemyRect.bottom
    );
  }

  function checkShopProximity() {
    const heroRect = heroStand.getBoundingClientRect();
    const shopRect = shop.getBoundingClientRect();

    return (
      heroRect.right > shopRect.left &&
      heroRect.left < shopRect.right &&
      heroRect.bottom > shopRect.top &&
      heroRect.top < shopRect.bottom
    );
  }

  function showHero(state) {
    heroStand.classList.add("hidden");
    heroRunRight.classList.add("hidden");
    heroRunLeft.classList.add("hidden");
    heroRightPunch.classList.add("hidden");

    if (state === "stand") {
      heroStand.classList.remove("hidden");
    } else if (state === "right") {
      heroRunRight.classList.remove("hidden");
    } else if (state === "left") {
      heroRunLeft.classList.remove("hidden");
    } else if (state === "punch") {
      heroRightPunch.classList.remove("hidden");
    }
  }

  function punchHero() {
    if (!punching) {
      punching = true;
      punchSound.play();
      showHero("punch");
      setTimeout(() => {
        punching = false;
        if (!movingRight && !movingLeft) {
          showHero("stand");
        }
      }, 500);
    }
  }

  function startRunSound() {
    if (runSound.paused) {
      runSound.play();
    }
  }

  function stopRunSound() {
    if (!runSound.paused) {
      runSound.pause();
      runSound.currentTime = 0;
    }
  }

  // Обработчики магазина
  document.querySelector(".hp-item").addEventListener("click", function () {
    if (heroStats.gold >= 100) {
      heroStats.gold -= 100;
      heroStats.potions += 1;
      updateInventory();
      setLocalStorage();
      showShopMessage("The elixir has been purchased!", "success");
    } else {
      showShopMessage("Not enough gold!", "error");
    }
  });

  function showShopMessage(message, type) {
    shopMessage.textContent = message;
    shopMessage.style.color = type === "success" ? "#4CAF50" : "#f44336";
    shopMessage.style.display = "block";
    setTimeout(() => {
      shopMessage.style.display = "none";
    }, 2000);
  }

  document.addEventListener("keydown", (e) => {
    if (isInFightMode && e.key !== "Escape") {
      return;
    }

    if (e.key === "Shift") {
      heroSpeed = sprintSpeed;
    }

    if (e.key === "ArrowRight" || e.key === "Right") {
      if (!movingRight && !movingLeft) {
        startRunSound();
      }
      movingRight = true;
      movingLeft = false;
    } else if (e.key === "ArrowLeft" || e.key === "Left") {
      if (!movingRight && !movingLeft) {
        startRunSound();
      }
      movingLeft = true;
      movingRight = false;
    } else if (e.key === " ") {
      punchHero();
    } else if (e.key === "Enter") {
      if (checkEnemyProximity()) {
        isInFightMode = true;
        tooltip3.classList.add("hidden");
        tooltip3Hidden = true;
        mainAudio.play();
        fightMode.style.display = "block";
        blurContainer.classList.add("blur-background");
        startFight();
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (isInFightMode && e.key !== "Escape") {
      return;
    }

    if (e.key === "Shift") {
      heroSpeed = baseSpeed;
    }

    if (e.key === "ArrowRight" || e.key === "Right") {
      movingRight = false;
      if (!movingLeft) {
        stopRunSound();
      }
    } else if (e.key === "ArrowLeft" || e.key === "Left") {
      movingLeft = false;
      if (!movingRight) {
        stopRunSound();
      }
    }

    if (!movingRight && !movingLeft && !punching) {
      showHero("stand");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (
      (e.key === "i" || e.key === "I" || e.key === "ш" || e.key === "Ш") &&
      !isInFightMode
    ) {
      if (
        inventory.style.display === "none" ||
        inventory.style.display === ""
      ) {
        inventory.style.display = "block";
        blurContainer.classList.add("blur-background");
      } else {
        inventory.style.display = "none";
        blurContainer.classList.remove("blur-background");
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.key === "esc") {
      const isAnyMenuOpen =
        inventory.style.display === "block" ||
        insideShop.style.display === "block" ||
        showMenu.style.display === "block";
      if (isAnyMenuOpen) {
        showMenu.style.display = "none";
        inventory.style.display = "none";
        insideShop.style.display = "none";
        blurContainer.classList.remove("blur-background");
      } else {
        showMenu.style.display = "block";
        blurContainer.classList.add("blur-background");
      }
    }
  });

  function renderSideInfo(amount) {
    sideInfoElement.textContent = `💰 +${amount} Gold`;
    sideHelpElement.style.display = "block";

    setTimeout(() => {
      sideHelpElement.style.display = "none";
    }, 3000);
  }

  let isChestOpen = false;

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      if (!isChestOpen && checkItemProximity()) {
        tooltip4.classList.add("hidden");
        tooltip4Hidden = true;
        openChest();

        isChestOpen = true;
        setTimeout(() => {
          addGold(100);
        }, 1000);
        setTimeout(() => {
          chestGif.classList.add("hidden");
        }, 2000);
      }
    }
  });

  function openChest() {
    chestGif.src = "assets/chest_opened.gif";
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !isInFightMode) {
      if (checkShopProximity()) {
        if (
          insideShop.style.display === "none" ||
          insideShop.style.display === ""
        ) {
          insideShop.style.display = "block";
          blurContainer.classList.add("blur-background");
        } else {
          insideShop.style.display = "none";
          blurContainer.classList.remove("blur-background");
        }
      }
    }
  });

  function updateInventory() {
    document.getElementById(
      "hero-attack"
    ).textContent = `⚔️ Attack - ${heroStats.attack}`;
    document.getElementById(
      "hero-hp"
    ).textContent = `❤️ Hp - ${heroStats.hp}/${heroStats.maxHp}`;
    document.getElementById(
      "hero-hp-tactic"
    ).textContent = `❤️ Hp - ${heroStats.hp}/${heroStats.maxHp}`;
    document.getElementById(
      "hero-gold"
    ).textContent = `💰 Gold - ${heroStats.gold}`;
    document.getElementById(
      "hero-mana"
    ).textContent = `✨ Mana - ${heroStats.mana}/${heroStats.maxMana}`;
    document.getElementById(
      "hero-mana-tactic"
    ).textContent = `✨ Mana - ${heroStats.mana}/${heroStats.maxMana}`;
    document.getElementById(
      "hero-potions"
    ).textContent = `🧪 Potions - ${heroStats.potions}`;

    // Обновляем инвентарь
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
      emptyItem.textContent = "Empty";
      invItemsContainer.appendChild(emptyItem);
    }
  }

  function addGold(amount) {
    heroStats.gold += amount;
    updateInventory();
    setLocalStorage();
    renderSideInfo(amount);
  }

  function setLocalStorage() {
    localStorage.setItem("heroStats", JSON.stringify(heroStats));
  }

  function getLocalStorage() {
    const data = localStorage.getItem("heroStats");
    if (data) {
      Object.assign(heroStats, JSON.parse(data));
      updateInventory();
    } else {
      console.log("No data found in localStorage");
    }
  }

  restartBtn.addEventListener("click", function () {
    localStorage.removeItem("heroStats");
    location.reload();
  });

  // Боевая система
  attackBtn.addEventListener("click", () => {
    if (heroTurn && isInFightMode) {
      heroAttack();
    }
  });

  potionBtn.addEventListener("click", () => {
    if (
      heroTurn &&
      isInFightMode &&
      !potionUsedInBattle &&
      heroStats.potions > 0
    ) {
      usePotion();
    }
  });

  shieldBtn.addEventListener("click", () => {
    if (heroTurn && isInFightMode && !shieldActive) {
      activateShield();
    }
  });

  magicBtn.addEventListener("click", () => {
    if (
      heroTurn &&
      isInFightMode &&
      magicSpellsUsed < 2 &&
      heroStats.mana >= 30
    ) {
      castMagic();
    }
  });

  function usePotion() {
    potionUsedInBattle = true;
    heroStats.potions--;
    const healAmount = 50;
    heroStats.hp = Math.min(heroStats.hp + healAmount, heroStats.maxHp);

    displayFightLog(
      `${heroStats.name} drank the elixir and was restored ${healAmount} HP!`
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
    }, 1000);

    if (enemyStats.hp <= 0) {
      displayFightLog(`${enemyStats.name} побеждён!`);
      endFight(true);
      return;
    }

    updateInventory();

    if (magicSpellsUsed >= 2) {
      magicBtn.disabled = true;
    }

    setTimeout(enemyAttack, 1500);
  }

  function getHeroRandomAttack() {
    return Math.trunc(Math.random() * (heroStats.attack + 1));
  }

  function getEnemyRandomAttack() {
    return Math.trunc(Math.random() * (enemyStats.attack + 1));
  }

  function startFight() {
    fightMode.classList.remove("hidden");
    fightMode.style.display = "block";
    enemy.style.display = "block";
    blurContainer.classList.add("blur-background");
    isInFightMode = true;

    // Сброс боевых переменных
    potionUsedInBattle = false;
    shieldActive = false;
    magicSpellsUsed = 0;

    // Включаем/выключаем кнопки
    potionBtn.disabled = heroStats.potions === 0;
    shieldBtn.disabled = false;
    magicBtn.disabled = heroStats.mana < 30;

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

    const heroRandomAttack = getHeroRandomAttack();

    heroStandTc.classList.add("hidden");
    heroPunchTc.classList.remove("hidden");
    enemyTc.classList.remove("hidden");
    enemyAtkTc.classList.add("hidden");

    // Отталкивание противника через 1 секунду
    setTimeout(() => {
      enemyTc.classList.add("enemy-knockback");
      enemyStats.hp -= heroRandomAttack;

      displayFightLog(
        `${heroStats.name} attacks ${enemyStats.name} and deals ${heroRandomAttack} damage.`
      );

      // Возврат на место
      setTimeout(() => {
        enemyTc.classList.remove("enemy-knockback");
      }, 300);

      if (enemyStats.hp <= 0) {
        displayFightLog(`${enemyStats.name} defeated!`);
        endFight(true);
        return;
      }

      updateInventory();
      setTimeout(enemyAttack, 500);
    }, 1000);
  }

  function enemyAttack() {
    heroStandTc.classList.remove("hidden");
    heroPunchTc.classList.add("hidden");
    enemyTc.classList.add("hidden");
    enemyAtkTc.classList.remove("hidden");

    let enemyRandomAttack = getEnemyRandomAttack();

    // Если щит активен, урон уменьшается вдвое
    if (shieldActive) {
      enemyRandomAttack = Math.floor(enemyRandomAttack / 2);
      displayFightLog(`The shield absorbed some of the damage!`);
    }

    // Отталкивание героя через 2 секунды
    setTimeout(() => {
      heroStandTc.classList.add("hero-knockback");
      heroStats.hp -= enemyRandomAttack;

      displayFightLog(
        `${enemyStats.name} attacks ${heroStats.name} and deals ${enemyRandomAttack} damage.`
      );

      // Возврат на место
      setTimeout(() => {
        heroStandTc.classList.remove("hero-knockback");
      }, 300);

      if (heroStats.hp <= 0) {
        setTimeout(() => {
          displayFightLog(`${heroStats.name} defeated...`);
          endFight(false);
        }, 1000);
        return;
      }

      updateInventory();
      setTimeout(startHeroTurn, 500);
    }, 2000);
  }

  function displayFightLog(message) {
    const newLog = document.createElement("p");
    newLog.textContent = message;
    fightLog.appendChild(newLog);
    fightLog.scrollTop = fightLog.scrollHeight;
  }

  function endFight(heroWon) {
    isInFightMode = false;

    if (heroWon) {
      addGold(50);
      // Восстанавливаем немного маны после победы
      heroStats.mana = Math.min(heroStats.mana + 20, heroStats.maxMana);
    } else {
      location.reload();
    }

    fightMode.classList.add("hidden");
    fightMode.style.display = "none";
    enemy.style.display = "none";
    blurContainer.classList.remove("blur-background");
    mainAudio.pause();

    // Очищаем лог боя
    fightLog.innerHTML = "";
  }

  moveHero();
  showHero("stand");
  getLocalStorage();
});
