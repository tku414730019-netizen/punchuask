let bg, quizTable;
let worldX = 0;   // 世界的水平位移（鏡頭）


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

  chunLi.x = width / 2;
  chunLi.y = height - 200;

  ryu.x = 600;   // Ryu 在世界中的位置
  ryu.y = height - 200;

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
  let scaleH = height / img.height;
  let drawW = img.width * scaleH;
  let drawH = height;

  // 根據 worldX 計算起始位置（循環）
  let startX = -(worldX % drawW);

  imageMode(CORNER);

  // 至少畫 3 張，確保覆蓋整個畫面
  for (let x = startX - drawW; x < width + drawW; x += drawW) {
    image(img, x, 0, drawW, drawH);
  }
}



// ================= Draw Characters =================
function drawChunLi() {
  let a = chunLiAnimations[chunLi.currentAnimation];
  if (!a || a.length === 0) return;
  let i = floor(chunLi.frameIndex / chunLi.frameSpeed) % a.length;
  push();
  translate(width / 2, chunLi.y);

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
  translate(ryu.x - worldX, ryu.y);

  scale(ryu.facing, 1);
  imageMode(CENTER);
  image(a[i], 0, 0);
  pop();
}

// ================= Movement =================
function handleChunLiMovement() {
  chunLi.vx = 0;

  if (keyIsDown(LEFT_ARROW)) {
    chunLi.vx = -5;
    chunLi.facing = -1;
    if (!chunLi.isJumping) chunLi.currentAnimation = "walk";
  }
  if (keyIsDown(RIGHT_ARROW)) {
    chunLi.vx = 5;
    chunLi.facing = 1;
    if (!chunLi.isJumping) chunLi.currentAnimation = "walk";
  }

  if (chunLi.vx === 0 && !chunLi.isJumping && chunLi.currentAnimation !== "attack") {
    chunLi.currentAnimation = "stay";
  }

  worldX += chunLi.vx;

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
  let chunLiWorldX = worldX + width / 2;
  ryu.facing = chunLiWorldX < ryu.x ? -1 : 1;
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

    // ===== 世界座標移動 =====
    b.x += b.vx;

    // ===== 與 Ryu 的碰撞（世界座標）=====
    let d = dist(b.x, b.y, ryu.x, ryu.y);
    if (d < 60) {
      ryu.currentAnimation = "hit";
      ryu.frameIndex = 0;
      score++;
      bombs.splice(i, 1);
      continue;
    }

    // ===== 畫面座標繪製 =====
    if (bombFrames.length > 0) {
      let frame = bombFrames[
        floor(chunLi.frameIndex / chunLi.frameSpeed) % bombFrames.length
      ];

      push();
      translate(b.x - worldX, b.y);
      scale(b.facing, 1);   // ★ 關鍵
      imageMode(CENTER);
      image(frame, 0, 0);
      pop();

    }

    // ===== 超出畫面移除 =====
    if (b.x - worldX < -100 || b.x - worldX > width + 100) {
      bombs.splice(i, 1);
    }
  }
}


// ================= Dialogue Logic =================
function handleDialogue() {
  let d = dist(width / 2, chunLi.y, ryu.x - worldX, ryu.y);
  let ryuScreenX = ryu.x - worldX;
  let chunLiScreenX = width / 2;


  // 離開範圍時重置對話狀態
  if (d > 200) {
    if (dialogState !== "welcome" && dialogState !== "quizResult") {
      dialogState = "none";
      inputActive = false;
      inputText = "";
    }
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
  let ryuScreenX = ryu.x - worldX;
  let chunLiScreenX = width / 2;

  push();
  textAlign(CENTER);
  textSize(16);

  // ===== Ryu 對話框 =====
  fill(255, 255, 255, 230);
  stroke(0);
  strokeWeight(2);
  rect(ryuScreenX - 80, ryu.y - 138, 160, 30, 10);

  noStroke();
  fill(0);
  text(ryuText, ryuScreenX, ryu.y - 130);

  // ===== Chun Li 輸入框 =====
  if (inputActive && chunLiText !== "") {
    fill(255, 255, 255, 230);
    stroke(0);
    strokeWeight(2);
    rect(chunLiScreenX - 50, chunLi.y - 138, 100, 30, 10);

    noStroke();
    fill(0);
    text(chunLiText, chunLiScreenX, chunLi.y - 130);
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
  let ryuScreenX = ryu.x - worldX;

  let padding = 20;
  let boxWidth = 300;
  let textWidthLimit = boxWidth - padding * 2;
  let lineHeight = 18;

  // 計算實際文字高度
  textSize(14);
  let textLines = textContent.split("\n");
  let totalLines = 0;

  for (let line of textLines) {
    totalLines += ceil(textWidth(line) / textWidthLimit);
  }

  let boxHeight = totalLines * lineHeight + padding * 2;

  push();
  fill(255, 255, 255, 230);
  stroke(0);
  strokeWeight(3);
  rect(
    ryuScreenX - boxWidth / 2,
    ryu.y - boxHeight -100,
    boxWidth,
    boxHeight,
    10
  );

  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  text(
    textContent,
    ryuScreenX - boxWidth / 2 + padding-5,
    ryu.y - boxHeight -100 + padding-5,
    textWidthLimit
  );
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
  if ((keyCode === UP_ARROW) && !chunLi.isJumping) {
    chunLi.isJumping = true;
    chunLi.vy = -18;
    chunLi.currentAnimation = "jumpAir";
  }

  // Attack
  if (key === " ") {
    chunLi.currentAnimation = "attack";
    chunLi.frameIndex = 0;

    bombs.push({
      x: worldX + width / 2 + (chunLi.facing * 50), // 世界座標
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
