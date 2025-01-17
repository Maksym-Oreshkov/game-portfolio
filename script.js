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
  /*   const tooltip = document.getElementById("tooltip");
  const tooltip2 = document.getElementById("tooltip2"); */
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

  let heroX = 0; // Начальная позиция героя слева
  let hasWeapon = false; // Изначально герой без оружия

  const baseSpeed = 5;
  let heroSpeed = baseSpeed;
  const sprintSpeed = 9;

  let movingRight = false;
  let movingLeft = false;
  let punching = false;

  let backgroundX = 0;

  const viewportWidth = window.innerWidth;
  const maxBackgroundX = -4000; // Максимальное значение background-position-x

  const punchSound = new Audio("audio/punch-sound.mp3"); // Звук удара
  const runSound = new Audio("audio/running.mp3"); // Звук бега
  const mainAudio = new Audio("audio/main.mp3");

  runSound.loop = true; // Зацикливаем звук бега

  let minDistance = 600;
  let maxDistance = 4000;

  function getRandomPlace(min, max) {
    return Math.trunc(Math.random() * (max - min + 100) + min);
  }

  let randomEnemyPlace = getRandomPlace(minDistance, maxDistance); // рандомное местоположение противника
  let randomItemPlace = getRandomPlace(minDistance, maxDistance); // рандомное местоположение предмета
  let randomShopePlace = getRandomPlace(minDistance, maxDistance); // рандомное местоположение предмета

  const enemyX = getRandomPlace(minDistance, maxDistance); // Позиция врага относительно фона
  const itemX = getRandomPlace(minDistance, maxDistance); // Позиция предмета относительно фона
  const shopX = getRandomPlace(minDistance, maxDistance); // Позиция врага относительно фона

  /*   let tooltipHidden = false;
  let tooltip2Hidden = false; */
  let tooltip3Hidden = false;
  let tooltip4Hidden = false; // Флаг для отслеживания скрытия tooltip4

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

    // Ограничиваем движение героя в пределах видимой области экрана
    heroX = Math.max(heroX, 0);
    heroX = Math.min(heroX, viewportWidth - heroStand.width);

    heroStand.style.left = `${heroX}px`;
    heroRunRight.style.left = `${heroX}px`;
    heroRunLeft.style.left = `${heroX}px`;
    heroRightPunch.style.left = `${heroX}px`;

    // Обновляем позицию врага/вещи/здания относительно фона
    const enemyViewportX = enemyX + backgroundX;
    enemy.style.left = `${enemyViewportX}px`;

    const itemViewportX = itemX + backgroundX;
    chestGif.style.left = `${itemViewportX}px`;

    const shopViewportX = shopX + backgroundX;
    shop.style.left = `${shopViewportX}px`;

    // Проверяем положение для показа подсказок
    /*    checkTooltipPosition();
    checkTooltip2Position(); */
    checkTooltip3Position();
    checkTooltip4Position();

    // Проверяем столкновение
    checkItemProximity();
    checkEnemyProximity();
    checkShopProximity();

    requestAnimationFrame(moveHero);
  }

  function checkTooltipPosition() {
    if (tooltipHidden) return;
    const tooltipPositionX = 0; // Задайте здесь нужную позицию для показа первой подсказки

    if (heroX >= tooltipPositionX && heroX <= tooltipPositionX + 100) {
      tooltip.classList.remove("hidden");
    } else {
      tooltip.classList.add("hidden");
    }
  }

  function checkTooltip2Position() {
    if (tooltip2Hidden) return;
    const tooltip2PositionX = 200; // Задайте здесь нужную позицию для показа второй подсказки

    if (heroX >= tooltip2PositionX && heroX <= tooltip2PositionX + 200) {
      tooltip2.classList.remove("hidden");
    } else {
      tooltip2.classList.add("hidden");
    }
  }

  function checkTooltip3Position() {
    if (tooltip3Hidden) return; // Не показываем подсказку, если она была скрыта
    // Вычисляем позицию третьей подсказки относительно текущего положения фона
    const tooltip3PositionX = enemyX + backgroundX - 200;

    if (heroX >= tooltip3PositionX && heroX <= tooltip3PositionX + 200) {
      tooltip3.classList.remove("hidden");
    } else {
      tooltip3.classList.add("hidden");
    }
  }

  function checkTooltip4Position() {
    if (tooltip4Hidden) return; // Не показываем подсказку, если она была скрыта

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

    // Проверяем, находиться ли герой и предмет рядом
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

    // Проверяем, находиться ли герой и враг рядом
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

    // Проверяем, находиться ли герой и враг рядом
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
      punchSound.play(); // Проигрывание звука удара
      showHero("punch");
      setTimeout(() => {
        punching = false;
        if (!movingRight && !movingLeft) {
          showHero("stand");
        }
      }, 500); // Длительность анимации удара
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

  document.addEventListener("keydown", (e) => {
    if (isInFightMode && e.key !== "Escape") {
      return;
    }

    if (e.key === "Shift") {
      heroSpeed = sprintSpeed;
      /*       tooltip2.classList.add("hidden"); */
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
        isInFightMode = true; // Включаем режим боя
        tooltip3.classList.add("hidden");
        tooltip3Hidden = true;
        /*         mainAudio.play(); */
        fightMode.style.display = "block";
        blurContainer.classList.add("blur-background"); // Добавление размытия фона
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
      /*       tooltip2Hidden = true; */
    }

    if (e.key === "ArrowRight" || e.key === "Right") {
      movingRight = false;
      if (!movingLeft) {
        stopRunSound();
        /*         tooltipHidden = true; */
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

  // Вызов панели ИНВЕНТАРЯ
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
        blurContainer.classList.add("blur-background"); // Добавление размытия фона
      } else {
        inventory.style.display = "none";
        blurContainer.classList.remove("blur-background"); // Удаление размытия фона
      }
    }
  });

  // Вызов панели МЕНЮ
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
        blurContainer.classList.remove("blur-background"); // Удаление размытия фона
      } else {
        showMenu.style.display = "block";
        blurContainer.classList.add("blur-background"); // Добавление размытия фона
      }
    }
  });

  // Функция отображения информации
  function renderSideInfo(amount) {
    // Обновляем содержимое элемента sideInfo
    sideInfoElement.textContent = `💰 +${amount} Gold`;
    sideHelpElement.style.display = "block"; // Показываем элемент

    // Скрываем элемент через несколько секунд (например, через 3 секунды)
    setTimeout(() => {
      sideHelpElement.style.display = "none"; // Скрываем элемент напрямую
    }, 3000); // 3000 миллисекунд = 3 секунды
  }

  // Сундук

  // Флаг, показывающий, открыт ли сундук
  let isChestOpen = false;

  document.addEventListener("keydown", function (e) {
    // Если нажата клавиша Enter
    if (e.key === "Enter") {
      // Если сундук ещё не открыт и игрок находится рядом
      if (!isChestOpen && checkItemProximity()) {
        tooltip4.classList.add("hidden");
        tooltip4Hidden = true;
        openChest();

        // Сразу делаем сундук недоступным для дальнейших открытий
        isChestOpen = true;
        setTimeout(() => {
          addGold(100);
        }, 1000);
        // Прячем сундук через 2 секунды
        setTimeout(() => {
          chestGif.classList.add("hidden");
        }, 2000);
      }
    }
  });

  function openChest() {
    chestGif.src = "assets/chest_opened.gif";
  }

  /*  function closeChest() {
    chestGif.src = "assets/chest_closed.png";
    isChestOpen = false;
  } */

  // Магазин
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !isInFightMode) {
      if (checkShopProximity()) {
        if (
          insideShop.style.display === "none" ||
          insideShop.style.display === ""
        ) {
          insideShop.style.display = "block";
          blurContainer.classList.add("blur-background"); // Добавление размытия фона
        } else {
          insideShop.style.display = "none";
          blurContainer.classList.remove("blur-background"); // Удаление размытия фона
        }
      }
    }
  });

  // Статистика игрока
  const heroStats = {
    name: "Gra'marh",
    attack: 5,
    hp: 15,
    gold: 0,
  };

  // Статистика врага
  const enemyStats = {
    name: "Darkling",
    attack: 3,
    hp: 20,
  };

  // Функция для обновления инвентаря
  function updateInventory() {
    document.getElementById(
      "hero-attack"
    ).textContent = `⚔️ Attack - ${heroStats.attack}`;
    document.getElementById("hero-hp").textContent = `❤️ Hp - ${heroStats.hp}`;
    document.getElementById(
      "hero-hp-tactic"
    ).textContent = `❤️ Hp - ${heroStats.hp}`;
    document.getElementById(
      "hero-gold"
    ).textContent = `💰 Gold - ${heroStats.gold}`;
  }

  // Функция, которая добавляет золото при открытии сундука
  function addGold(amount) {
    heroStats.gold += amount;
    updateInventory(); // Обновляем инвентарь после изменения данных героя
    setLocalStorage();
    renderSideInfo(amount);
  }

  // хранение данных игрока
  function setLocalStorage() {
    localStorage.setItem("heroStats", JSON.stringify(heroStats));
  }
  // Функция для загрузки данных игрока
  function getLocalStorage() {
    const data = localStorage.getItem("heroStats");
    if (data) {
      Object.assign(heroStats, JSON.parse(data));
      /*       console.log(heroStats); */
      updateInventory();
    } else {
      console.log("No data found in localStorage");
    }
  }

  restartBtn.addEventListener("click", function () {
    localStorage.removeItem("heroStats");
    location.reload();
  });

  // Бой

  // Покажет, сейчас ли ход героя
  let heroTurn = false;
  // Покажет, находимся ли мы в режиме боя
  let isInFightMode = false;

  // При нажатии на кнопку «Атаковать» — герой бьёт (если сейчас его ход)
  attackBtn.addEventListener("click", () => {
    if (heroTurn && isInFightMode) {
      heroAttack();
    }
  });

  // Функция рандомного удара героя
  function getHeroRandomAttack() {
    return Math.trunc(Math.random() * (heroStats.attack + 1));
  }

  // Функция рандомного удара врага
  function getEnemyRandomAttack() {
    return Math.trunc(Math.random() * (enemyStats.attack + 1));
  }

  // Функция начала боя
  function startFight() {
    fightMode.classList.remove("hidden");
    fightMode.style.display = "block";
    enemy.style.display = "block";
    blurContainer.classList.add("blur-background");
    isInFightMode = true;

    displayFightLog("Бой начался!");
    // Сразу даём ход герою
    startHeroTurn();
  }

  // Ход героя: ждём нажатия кнопки (бесконечно, пока не нажмут)
  function startHeroTurn() {
    heroTurn = true;
    displayFightLog(`${heroStats.name}, ваш ход!`);

    // Для наглядности переключим анимации (герой в стойке, враг ничего не делает)
    heroStandTc.classList.remove("hidden");
    heroPunchTc.classList.add("hidden");
    enemyTc.classList.remove("hidden");
    enemyAtkTc.classList.add("hidden");
  }

  // Собственно удар героя
  function heroAttack() {
    // Герой уже сделал удар
    heroTurn = false;

    const heroRandomAttack = getHeroRandomAttack();
    enemyStats.hp -= heroRandomAttack;

    // Переключим анимацию
    heroStandTc.classList.add("hidden");
    heroPunchTc.classList.remove("hidden");
    enemyTc.classList.remove("hidden");
    enemyAtkTc.classList.add("hidden");

    displayFightLog(
      `${heroStats.name} атакует ${enemyStats.name} и наносит ${heroRandomAttack} урона.`
    );

    // Проверяем, жив ли враг
    if (enemyStats.hp <= 0) {
      displayFightLog(`${enemyStats.name} побеждён!`);
      endFight(true);
      return;
    }

    // Обновляем статы (hp, атака, и т.д.)
    updateInventory();

    // Переход хода к врагу
    setTimeout(enemyAttack, 1000); // Немного задержим, чтобы анимация удара отобразилась
  }

  // Ход врага (автоматический)
  function enemyAttack() {
    // Переключим анимацию
    heroStandTc.classList.remove("hidden");
    heroPunchTc.classList.add("hidden");
    enemyTc.classList.add("hidden");
    enemyAtkTc.classList.remove("hidden");

    const enemyRandomAttack = getEnemyRandomAttack();
    heroStats.hp -= enemyRandomAttack;

    displayFightLog(
      `${enemyStats.name} атакует ${heroStats.name} и наносит ${enemyRandomAttack} урона.`
    );

    // Проверяем, жив ли герой
    if (heroStats.hp <= 0) {
      displayFightLog(`${heroStats.name} повержен...`);
      endFight(false);
      return;
    }

    // Обновляем статы
    updateInventory();

    // Возвращаем ход герою
    setTimeout(startHeroTurn, 1000);
  }

  // Функция для отображения логов боя
  function displayFightLog(message) {
    const newLog = document.createElement("p");
    newLog.textContent = message;
    fightLog.appendChild(newLog);
    fightLog.scrollTop = fightLog.scrollHeight; // Прокручиваем лог вниз
  }

  // Функция завершения боя
  function endFight(heroWon) {
    isInFightMode = false;

    if (heroWon) {
      addGold(50); // Награда за победу
    } else {
      location.reload(); // Или своя логика
    }

    fightMode.classList.add("hidden");
    fightMode.style.display = "none";
    enemy.style.display = "none";
    blurContainer.classList.remove("blur-background");
    mainAudio.pause(); // Если была музыка
  }

  // Функция для обновления интерфейса, статов и т.д.
  // Здесь обязательно выводи hp героя (и, если хочешь, hp врага)
  function updateInventory() {
    document.getElementById(
      "hero-attack"
    ).textContent = `⚔️ Attack - ${heroStats.attack}`;
    document.getElementById("hero-hp").textContent = `❤️ Hp - ${heroStats.hp}`;
    document.getElementById(
      "hero-hp-tactic"
    ).textContent = `❤️ Hp - ${heroStats.hp}`;
    document.getElementById(
      "hero-gold"
    ).textContent = `💰 Gold - ${heroStats.gold}`;

    // Если есть элемент для отображения hp врага, добавьте что-то вроде:
    // document.getElementById("enemy-hp").textContent = `❤️ Hp - ${enemyStats.hp}`;
  }

  // Пример инициализации (вызов любых функций, которые у тебя были)
  // чтобы герой появился и т.д.
  moveHero();
  showHero("stand");

  // Сохраняем и загружаем данные при запуске
  getLocalStorage();
});
