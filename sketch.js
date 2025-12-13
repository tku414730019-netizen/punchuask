let bg, quizTable;

// ================= Animations =================
let chunLiAnimations = {
  stay: [], walk: [], attack: [], jumpAir: [], jumpGround: []
};
let ryuAnimations = { stay: [], hit: [] };
let bombFrames = [];
let sheets = {};

// ================= States =================
let chunLi = {
  x: 500, y: 0, vx: 0, vy: 0,
  isJumping: false, facing: 1,
  currentAnimation: "stay",
  frameIndex: 0, frameSpeed: 8
};

let ryu = {
  x: 0, y: 0, facing: -1,
  currentAnimation: "stay",
  frameIndex: 0, frameSpeed: 10
};

let gravity = 0.8;
let bombs = [];
let score = 0;

// ================= Dialogue =================
let dialogState = "none"; 
// none | askName | welcome | quiz | quizResult

let playerName = "";
let inputText = "";
let inputActive = false;

let dialogTimer = 0;
let currentQuiz = null;
let quizFeedback = "";

// ================= Preload =================
function preload() {
  bg = loadImage("bg.png");

  sheets.chunStay = loadImage("chun li/stay/131x171.png");
  sheets.chunWalk = loadImage("chun li/walk/123x195.png");
  sheets.chunAttack = loadImage("chun li/attack/208x158.png");
  sheets.chunJumpAir = loadImage("chun li/jump/air/103x214.png");
  sheets.chunJumpGround = loadImage("chun li/jump/ground/129x171.png");
  sheets.bomb = loadImage("chun li/bomb/56x32.png");

  sheets.ryuStay = loadImage("ryu/stay/118x186.png");
  sheets.ryuHit = loadImage("ryu/hit/165x165.png");

  quizTable = loadTable("ryu/quiz.csv", "csv", "header");
}

// ================= Setup =================
function setup() {
  createCanvas(windowWidth, windowHeight);

  cutFrames(sheets.chunStay, 131, 171, chunLiAnimations.stay);
  cutFrames(sheets.chunWalk, 123, 195, chunLiAnimations.walk);
  cutFrames(sheets.chunAttack, 208, 158, chunLiAnimations.attack);
  cutFrames(sheets.chunJumpAir, 103, 214, chunLiAnimations.jumpAir);
  cutFrames(sheets.chunJumpGround, 129, 171, chunLiAnimations.jumpGround);
  cutFrames(sheets.bomb, 56, 32, bombFrames);

  cutFrames(sheets.ryuStay, 118, 186, ryuAnimations.stay);
  cutFrames(sheets.ryuHit, 165, 165, ryuAnimations.hit);

  chunLi.y = height - 200;
  ryu.y = height - 200;
  ryu.x = width / 2;
}

// ================= Draw =================
function draw() {
  drawBackgroundCover(bg);

  handleChunLiMovement();
  applyChunLiJump();
  updateChunLiAnimation();

  updateRyuFacing();
  updateRyuAnimation();
  updateBombs();

  drawChunLi();
  drawRyu();

  handleDialogue();
  drawScore();
}

// ================= Utilities =================
function cutFrames(sheet, w, h, arr) {
  let count = floor(sheet.width / (w + 5));
  for (let i = 0; i < count; i++) {
    arr.push(sheet.get(i * (w + 5), 0, w, h));
  }
}

function drawBackgroundCover(img) {
  let r1 = img.width / img.height;
  let r2 = width / height;
  let w, h;
  if (r2 > r1) { w = width; h = width / r1; }
  else { h = height; w = height * r1; }
  imageMode(CENTER);
  image(img, width / 2, height / 2, w, h);
}

// ================= Draw Characters =================
function drawChunLi() {
  let a = chunLiAnimations[chunLi.currentAnimation];
  if (!a || a.length === 0) return;
  let i = floor(chunLi.frameIndex / chunLi.frameSpeed) % a.length;
  push();
  translate(chunLi.x, chunLi.y);
  scale(chunLi.facing, 1);
  imageMode(CENTER);
  image(a[i], 0, 0);
  pop();
}

function drawRyu() {
  let a = ryuAnimations[ryu.currentAnimation];
  if (!a || a.length === 0) return;
  let i = floor(ryu.frameIndex / ryu.frameSpeed) % a.length;
  push();
  translate(ryu.x, ryu.y);
  scale(ryu.facing, 1);
  imageMode(CENTER);
  image(a[i], 0, 0);
  pop();
}

// ================= Movement =================
function handleChunLiMovement() {
  chunLi.vx = 0;

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
    chunLi.vx = -5;
    chunLi.facing = -1;
    if (!chunLi.isJumping) chunLi.currentAnimation = "walk";
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
    chunLi.vx = 5;
    chunLi.facing = 1;
    if (!chunLi.isJumping) chunLi.currentAnimation = "walk";
  }

  if (chunLi.vx === 0 && !chunLi.isJumping && chunLi.currentAnimation !== "attack") {
    chunLi.currentAnimation = "stay";
  }

  chunLi.x += chunLi.vx;
  chunLi.x = constrain(chunLi.x, 50, width - 50);
}

function applyChunLiJump() {
  if (chunLi.isJumping) {
    chunLi.y += chunLi.vy;
    chunLi.vy += gravity;
    if (chunLi.vy > 0) chunLi.currentAnimation = "jumpGround";
    if (chunLi.y >= height - 200) {
      chunLi.y = height - 200;
      chunLi.isJumping = false;
      chunLi.currentAnimation = "stay";
    }
  }
}

function updateChunLiAnimation() {
  chunLi.frameIndex += 1;
  let a = chunLiAnimations[chunLi.currentAnimation];
  if (a && chunLi.frameIndex >= a.length * chunLi.frameSpeed) {
    chunLi.frameIndex = 0;
    if (chunLi.currentAnimation === "attack") chunLi.currentAnimation = "stay";
  }
}

function updateRyuFacing() {
  ryu.facing = chunLi.x < ryu.x ? -1 : 1;
}

function updateRyuAnimation() {
  ryu.frameIndex++;
  let a = ryuAnimations[ryu.currentAnimation];
  if (a && ryu.frameIndex >= a.length * ryu.frameSpeed) {
    ryu.frameIndex = 0;
    if (ryu.currentAnimation === "hit") ryu.currentAnimation = "stay";
  }
}

// ================= Bombs & collision =================
function updateBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    let b = bombs[i];
    b.x += b.vx;

    let distance = dist(b.x, b.y, ryu.x, ryu.y);
    if (distance < 60) {
      ryu.currentAnimation = "hit";
      ryu.frameIndex = 0;
      score++;
      bombs.splice(i, 1);
      continue;
    }

    if (bombFrames.length > 0) {
      let frame = bombFrames[floor(chunLi.frameIndex / chunLi.frameSpeed) % bombFrames.length];
      push();
      translate(b.x, b.y);
      scale(b.facing, 1);
      imageMode(CENTER);
      image(frame, 0, 0);
      pop();
    }

    if (b.x < -50 || b.x > width + 50) {
      bombs.splice(i, 1);
    }
  }
}

// ================= Dialogue Logic =================
function handleDialogue() {
  let d = dist(chunLi.x, chunLi.y, ryu.x, ryu.y);

  // 離開範圍時重置對話狀態
  if (d > 200) {
    dialogState = "none";
    inputActive = false;
    inputText = "";
    return;
  }

  // 進入範圍且尚未開始對話
  if (dialogState === "none") {
    dialogState = "askName";
    inputActive = true;
  }

  // 顯示對話框
  if (dialogState === "askName") {
    drawDialogueBox("請問你叫什麼名字？", inputText + "|");
  }

  if (dialogState === "welcome") {
    drawDialogueBox(playerName + "，歡迎你！", "");
    if (millis() > dialogTimer) {
      nextQuiz();
    }
  }

  if (dialogState === "quiz") {
    drawRyuQuizBox(
      currentQuiz.q + "\n\n" + currentQuiz.options.join("\n")
    );
    drawChunLiInputBox(inputText + "|");
  }

  if (dialogState === "quizResult") {
    drawDialogueBox(quizFeedback, "");
    if (millis() > dialogTimer) {
      nextQuiz();
    }
  }
}

// ================= Dialogue UI =================
function drawDialogueBox(ryuText, chunLiText) {
  push();
  textAlign(CENTER);
  textSize(16);
  
  // ---- Ryu 對話框 ----
  fill(255, 255, 255, 230);
  stroke(0);
  strokeWeight(2);
  rect(ryu.x - 80, ryu.y - 138, 160, 30, 10);
  
  noStroke();
  fill(0);
  text(ryuText, ryu.x, ryu.y - 130);
  
  // ---- Chun Li 輸入框 (只在輸入時顯示) ----
  if (inputActive && chunLiText !== "") {
    fill(255, 255, 255, 230);
    stroke(0);
    strokeWeight(2);
    rect(chunLi.x - 80, chunLi.y - 138, 160, 30, 10);
    
    noStroke();
    fill(0);
    text(chunLiText, chunLi.x, chunLi.y - 130);
  }
  
  pop();
}

function drawChunLiInputBox(content) {
  push();
  fill(255, 255, 255, 230);
  stroke(0);
  strokeWeight(2);
  rect(chunLi.x - 80, chunLi.y - 138, 160, 30, 10);
  fill(0);
  noStroke();
  textAlign(CENTER);
  textSize(14);
  text(content, chunLi.x, chunLi.y - 130);
  pop();
}

function drawRyuQuizBox(textContent) {
  push();
  fill(255, 255, 255, 230);
  stroke(0);
  strokeWeight(3);
  rect(ryu.x - 150, ryu.y - 200, 300, 150, 10);
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  text(textContent, ryu.x - 140, ryu.y - 190, 280);
  pop();
}

// ================= Quiz =================
function nextQuiz() {
  let r = floor(random(quizTable.getRowCount()));
  let row = quizTable.getRow(r);

  currentQuiz = {
    q: row.get("question"),
    options: [
      "A. " + row.get("A"),
      "B. " + row.get("B"),
      "C. " + row.get("C"),
      "D. " + row.get("D")
    ],
    answer: row.get("answer")
  };

  dialogState = "quiz";
  inputText = "";
  inputActive = true;
}

// ================= Input =================
function keyPressed() {
  if (inputActive) {
    if (keyCode === ENTER) {
      if (dialogState === "askName") {
        playerName = inputText;
        dialogState = "welcome";
        dialogTimer = millis() + 2000;
        inputActive = false;
      } else if (dialogState === "quiz") {
        if (inputText.toUpperCase() === currentQuiz.answer) {
          quizFeedback = "答對了！";
        } else {
          quizFeedback = "答錯了，正確答案是" + currentQuiz.answer;
        }
        dialogState = "quizResult";
        dialogTimer = millis() + 2000;
        inputActive = false;
      }
      inputText = "";
    } else if (keyCode === BACKSPACE) {
      inputText = inputText.slice(0, -1);
    } else if (key.length === 1) {
      inputText += key.toUpperCase();
    }
    return;
  }

  // Jump
  if ((keyCode === UP_ARROW || key === "W" || key === "w") && !chunLi.isJumping) {
    chunLi.isJumping = true;
    chunLi.vy = -18;
    chunLi.currentAnimation = "jumpAir";
  }

  // Attack
  if (key === " ") {
    chunLi.currentAnimation = "attack";
    chunLi.frameIndex = 0;

    bombs.push({
      x: chunLi.x + (chunLi.facing * 50),
      y: chunLi.y - 40,
      vx: 12 * chunLi.facing,
      facing: chunLi.facing
    });
  }
}

// ================= Score =================
function drawScore() {
  fill(255);
  stroke(0);
  strokeWeight(3);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 30);
}
