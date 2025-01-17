const fightMode = document.getElementById("fight-mode");
const fightLog = document.querySelector(".fight-log");

// Бой

let heroTurn = false; // Покажет, сейчас ли ход героя

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
function updateInventory() {
  // Ваша логика
}

// Пример инициализации
moveHero();
showHero("stand");
