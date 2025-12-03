let bg;

// Chun Li animation frames
let chunLiAnimations = {
  stay: [],
  walk: [],
  attack: [],
  jumpAir: [],
  jumpGround: [],
};

// Ryu animation frames
let ryuAnimations = {
  stay: [],
  hit: [],
};

let bombFrames = [];
let sheets = {};

// Chun Li state
let chunLi = {
  x: 500,
  y: 500,
  vx: 0,
  vy: 0,
  isJumping: false,
  facing: 1,
  currentAnimation: "stay",
  frameIndex: 0,
  frameSpeed: 8
};

// Ryu state
let ryu = {
  x: 700,
  y: 500,
  facing: -1,
  currentAnimation: "stay",
  frameIndex: 0,
  frameSpeed: 10,
};

let gravity = 0.8;
let bombs = [];
let score = 0;

// Dialogue
let showDialog = false;
let playerInput = "";
let ryuReply = "";
let inputActive = false;

function preload() {
  bg = loadImage("bg.png");
  
  // 載入 Chun Li sprite sheets
  sheets.chunStay = loadImage("chun li/stay/131x171.png");
  sheets.chunWalk = loadImage("chun li/walk/123x195.png");
  sheets.chunAttack = loadImage("chun li/attack/208x158.png");
  sheets.chunJumpAir = loadImage("chun li/jump/air/103x214.png");
  sheets.chunJumpGround = loadImage("chun li/jump/ground/129x171.png");
  sheets.bomb = loadImage("chun li/bomb/56x32.png");
  
  // Ryu
  sheets.ryuStay = loadImage("ryu/stay/118x186.png");
  sheets.ryuHit = loadImage("ryu/hit/165x165.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 切割 Chun Li
  cutFrames(sheets.chunStay, 131, 171, chunLiAnimations.stay);
  cutFrames(sheets.chunWalk, 123, 195, chunLiAnimations.walk);
  cutFrames(sheets.chunAttack, 208, 158, chunLiAnimations.attack);
  cutFrames(sheets.chunJumpAir, 103, 214, chunLiAnimations.jumpAir);
  cutFrames(sheets.chunJumpGround, 129, 171, chunLiAnimations.jumpGround);
  cutFrames(sheets.bomb, 56, 32, bombFrames);

  // Ryu
  cutFrames(sheets.ryuStay, 118, 186, ryuAnimations.stay);
  cutFrames(sheets.ryuHit, 165, 165, ryuAnimations.hit);

  // 起始位置
  chunLi.y = height - 200;
  ryu.y = height - 200;
  ryu.x = width / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  chunLi.y = height - 200;
  ryu.y = height - 200;
  ryu.x = width / 2;
}

function draw() {
  drawBackgroundCover(bg);

  // Movement & Animations
  handleChunLiMovement();
  applyChunLiJump();
  updateChunLiAnimation();

  updateRyuFacing();
  updateRyuAnimation();

  updateBombs();

  // Draw characters
  drawChunLi();
  drawRyu();

  // Dialogue
  handleDialogue();

  drawScore();
}

// ----------- Background cover (保持比例填滿) -----------
function drawBackgroundCover(img) {
  let imgRatio = img.width / img.height;
  let canvasRatio = width / height;
  let w, h;

  if (canvasRatio > imgRatio) {
    w = width;
    h = width / imgRatio;
  } else {
    h = height;
    w = height * imgRatio;
  }

  imageMode(CENTER);
  image(img, width / 2, height / 2, w, h);
}

// ----------- Frame cutting -----------
function cutFrames(sheet, w, h, array) {
  let count = floor(sheet.width / (w + 5));
  for (let i = 0; i < count; i++) {
    let imgFrame = sheet.get(i * (w + 5), 0, w, h);
    array.push(imgFrame);
  }
}

// ----------- Draw Chun Li -----------
function drawChunLi() {
  let index = floor(chunLi.frameIndex / chunLi.frameSpeed);
  index = index % chunLiAnimations[chunLi.currentAnimation].length;

  push();
  translate(chunLi.x, chunLi.y);
  scale(chunLi.facing, 1);
  imageMode(CENTER);
  image(chunLiAnimations[chunLi.currentAnimation][index], 0, 0);
  pop();
}

// ----------- Draw Ryu -----------
function drawRyu() {
  let index = floor(ryu.frameIndex / ryu.frameSpeed);
  index = index % ryuAnimations[ryu.currentAnimation].length;

  push();
  translate(ryu.x, ryu.y);
  scale(ryu.facing, 1);
  imageMode(CENTER);
  image(ryuAnimations[ryu.currentAnimation][index], 0, 0);
  pop();
}

// ----------- Chun Li movement -----------
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

// ----------- Chun Li animation update -----------
function updateChunLiAnimation() {
  chunLi.frameIndex += 1;
  if (chunLi.frameIndex >= chunLiAnimations[chunLi.currentAnimation].length * chunLi.frameSpeed) {
    chunLi.frameIndex = 0;
    if (chunLi.currentAnimation === "attack") chunLi.currentAnimation = "stay";
  }
}

// ----------- Ryu face Chun Li -----------
function updateRyuFacing() {
  ryu.facing = (chunLi.x < ryu.x) ? -1 : 1;
}

// ----------- Ryu animation update -----------
function updateRyuAnimation() {
  ryu.frameIndex += 1;

  if (ryu.frameIndex >= ryuAnimations[ryu.currentAnimation].length * ryu.frameSpeed) {
    ryu.frameIndex = 0;
    // 受擊動畫播放完後回到待機
    if (ryu.currentAnimation === "hit") {
      ryu.currentAnimation = "stay";
    }
  }
}

// ----------- Key pressed (jump & attack & input) -----------
function keyPressed() {
  // Dialogue input (優先處理)
  if (inputActive) {
    if (keyCode === ENTER) {
      if (playerInput.trim() !== "") {
        ryuReply = playerInput + " 歡迎你！";
        playerInput = "";
        inputActive = false;
      }
    } else if (keyCode === BACKSPACE) {
      playerInput = playerInput.slice(0, -1);
    } else if (key.length === 1 && keyCode !== 32) {
      playerInput += key;
    }
    return; // 輸入時阻止其他按鍵動作
  }

  // Jump
  if ((keyCode === UP_ARROW || key === "w" || key === "W") && !chunLi.isJumping) {
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

// ----------- Jump physics -----------
function applyChunLiJump() {
  if (chunLi.isJumping) {
    chunLi.y += chunLi.vy;
    chunLi.vy += gravity;

    if (chunLi.vy > 0) chunLi.currentAnimation = "jumpGround";

    if (chunLi.y >= height - 200) {
      chunLi.y = height - 200;
      chunLi.vy = 0;
      chunLi.isJumping = false;
      chunLi.currentAnimation = "stay";
    }
  }
}

// ----------- Bombs & collision -----------
function updateBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    let b = bombs[i];
    b.x += b.vx;

    // 立即判定碰撞，觸發受擊動畫
    let distance = dist(b.x, b.y, ryu.x, ryu.y);
    if (distance < 60) {
      ryu.currentAnimation = "hit";
      ryu.frameIndex = 0;
      score++;
      bombs.splice(i, 1);
      continue;
    }

    // Draw bomb
    let frame = bombFrames[floor(chunLi.frameIndex / chunLi.frameSpeed) % bombFrames.length];
    push();
    translate(b.x, b.y);
    scale(b.facing, 1);
    imageMode(CENTER);
    image(frame, 0, 0);
    pop();

    if (b.x < -50 || b.x > width + 50) {
      bombs.splice(i, 1);
    }
  }
}

// ----------- Dialogue logic -----------
function handleDialogue() {
  let d = dist(chunLi.x, chunLi.y, ryu.x, ryu.y);

  if (d < 200) {
    showDialog = true;
    if (!ryuReply) inputActive = true;
    drawDialogueBox();
  } else {
    showDialog = false;
    inputActive = false;
    playerInput = "";
    ryuReply = "";
  }
}

function drawDialogueBox() {
  push();
  textAlign(CENTER);
  textSize(16);
  
  // ---- Ryu 對話框 ----
  fill(255, 255, 255, 230);
  stroke(0);
  strokeWeight(2);
  rect(ryu.x - 80, ryu.y - 150, 160, 30, 10);
  
  noStroke();
  fill(0);
  
  if (ryuReply) {
    text(ryuReply, ryu.x, ryu.y - 130);
  } else {
    text("請問你叫什麼名字？", ryu.x, ryu.y - 130);
  }
  
  // ---- Chun Li 輸入框 (只在輸入時顯示) ----
  if (inputActive) {
    fill(255, 255, 255, 230);
    stroke(0);
    strokeWeight(2);
    rect(chunLi.x - 80, chunLi.y - 150, 160, 30, 10);
    
    noStroke();
    fill(0);
    text(playerInput + "|", chunLi.x, chunLi.y - 130);
  }
  
  pop();
}

// ----------- Score -----------
function drawScore() {
  push();
  fill(255);
  stroke(0);
  strokeWeight(3);
  textSize(32);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);
  pop();
}