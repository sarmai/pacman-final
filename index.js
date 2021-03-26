const gameGrid = document.querySelector("#game");
const scoreTable = document.querySelector("#score");
const timerTable = document.querySelector("#timer");
const minutesLabel = document.getElementById("minutes");
const secondsLabel = document.getElementById("seconds");
const hpTable = document.querySelector("#hp");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");

const POWER_PILL_TIME = 10000;
const gameBoard = GameBoard.createGameBoard(gameGrid, LEVEL);
const pacman = new Pacman(12, 287);
const ghosts = [
  new Ghost(15, 188, randomMovement, OBJECT_TYPE.BLINKY),
  new Ghost(20, 209, randomMovement, OBJECT_TYPE.PINKY),
  new Ghost(18, 230, randomMovement, OBJECT_TYPE.INKY),
  new Ghost(14, 251, randomMovement, OBJECT_TYPE.CLYDE),
];

// --- SOUNDS --- //
const soundDot = "./sounds/munch.wav";
const soundPill = "./sounds/pill.wav";
const soundGameStart = "./sounds/game_start.wav";
const soundGameOver = "./sounds/death.wav";
const soundGhost = "./sounds/eat_ghost.wav";

let reqID;
let gameTimerID;
let requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;

let cancelAnimationFrame =
  window.cancelAnimationFrame || window.mozCancelAnimationFrame;
let score = 0;
let hp = 3;
let timer = null;
let gameWin = false;
let gameLost = false;
let powerPillActive = false;
let powerPillTimer = null;
let pause = false;
let totalSeconds = 0;

// --- AUDIO --- //
const playAudio = (audio) => {
  const soundEffect = new Audio(audio);
  soundEffect.play();
};

const setTime = () => {
  if (!pause) {
    ++totalSeconds;
    secondsLabel.innerHTML = pad(totalSeconds % 60);
    minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
  }
};

const pad = (val) => {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
};

const gameOver = () => {
  if (!gameWin) playAudio(soundGameOver);
  clearInterval(gameTimerID);
  document.removeEventListener("keydown", (e) =>
    pacman.handleKeyInput(e, gameBoard.objectExist)
  );

  gameBoard.showGameStatus(gameWin);
  cancelAnimationFrame(reqID);
  gameLost = true;

  startButton.textContent = "Start";
  pauseButton.classList.add("hide");
};

const checkCollision = () => {
  const collidedGhost = ghosts.find((ghost) => pacman.pos === ghost.pos);

  if (collidedGhost) {
    if (pacman.powerPill) {
      playAudio(soundGhost);
      gameBoard.removeObject(collidedGhost.pos, [
        OBJECT_TYPE.GHOST,
        OBJECT_TYPE.SCARED,
        collidedGhost.name,
      ]);
      collidedGhost.pos = collidedGhost.startPos;
      score += 100;
    } else {
      if (hp > 1 && !gameWin) {
        gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
        gameBoard.rotateDiv(pacman.pos, 0);
        pacman.reset(287);
        gameBoard.addObject(287, [OBJECT_TYPE.PACMAN]);
        hpTable.querySelector(`#pac-${hp}`).classList.add("hide-img");
        hp--;
      } else {
        hpTable.querySelector(`#pac-${hp}`).classList.add("hide-img");
        gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
        gameBoard.rotateDiv(pacman.pos, 0);
        gameOver();
      }
    }
  }
};

const gameLoop = () => {
  gameBoard.moveCharacter(pacman);
  ghosts.forEach((ghost) => gameBoard.moveCharacter(ghost));
  checkCollision();

  //check if pacman eats a dot
  if (gameBoard.objectExist(pacman.pos, OBJECT_TYPE.DOT)) {
    playAudio(soundDot);
    gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.DOT]);
    gameBoard.dotCount--;
    score += 10;
  }

  //check if pacman eats a power pill
  if (gameBoard.objectExist(pacman.pos, OBJECT_TYPE.PILL)) {
    playAudio(soundPill);
    gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PILL]);
    score += 50;
    pacman.powerPill = true;
    clearTimeout(powerPillTimer);
    powerPillTimer = setTimeout(() => {
      pacman.powerPill = false;
    }, POWER_PILL_TIME);
  }
  if (pacman.powerPill !== powerPillActive) {
    powerPillActive = pacman.powerPill;
    ghosts.forEach((ghost) => {
      ghost.isScared = pacman.powerPill;
    });
  }
  if (gameBoard.dotCount === 0) {
    gameWin = true;
    gameOver();
  }
  scoreTable.innerHTML = score;
  if (!gameLost & !pause) reqID = requestAnimationFrame(gameLoop);
};

const pauseGame = () => {
  pause = !pause;
  if (!pause) {
    pauseButton.textContent = "Pause";
    reqID = requestAnimationFrame(gameLoop);
  } else {
    pauseButton.textContent = "Resume";
  }
};

const startGame = () => {
  pauseButton.classList.remove("hide");
  startButton.textContent = "Restart";

  playAudio(soundGameStart);

  gameWin = false;
  gameLost = false;
  powerPillActive = false;
  score = 0;
  hp = 3;
  let imgs = hpTable.querySelectorAll("img");
  imgs.forEach((i) => i.classList.remove("hide-img"));

  totalSeconds = 0;
  clearInterval(gameTimerID);
  gameTimerID = setInterval(setTime, 1000);

  cancelAnimationFrame(reqID);

  pacman.reset(287);
  ghosts.forEach((ghost) => ghost.reset());

  gameBoard.createGrid(LEVEL);

  gameBoard.addObject(287, [OBJECT_TYPE.PACMAN]);
  document.addEventListener("keydown", (e) =>
    pacman.handleKeyInput(e, gameBoard.objectExist)
  );

  reqID = requestAnimationFrame(gameLoop);
};

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", pauseGame);
