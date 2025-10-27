// ---- CalmAir – minimalistisk p5 app ----
let mic, running = false;
let lvl = 0, lvlSmooth = 0;
let co2 = 600, co2Target = 650;

const C_BG = '#F6D466', C_GREEN = '#00C853', C_YELLOW = '#FFEB3B', C_RED = '#F44336';
const C_SMILE = '#22A95B', C_TEXT = '#000';

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textFont('Arial'); textAlign(CENTER, CENTER);
  mic = new p5.AudioIn();
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); }

function draw() {
  background(C_BG);

  // Kræv landscape for layoutet
  if (height > width) {
    fill(0,120); noStroke();
    rect(0,0,width,height);
    fill(255); textSize(min(width,height)*0.06);
    text('Vend telefonen til landscape', width/2, height/2);
    return;
  }

  // Data: lyd (smoothet) + dB
  if (running) lvl = mic.getLevel();
  lvlSmooth = lerp(lvlSmooth, lvl, 0.15);

  // dBFS ca. (-∞..0). Mapper -60..0 dBFS → 30..100 dB (klasselokale-ish)
  const dbfs = 20 * Math.log10(Math.max(lvlSmooth, 1e-6));
  let dB = map(dbfs, -60, 0, 30, 100, true);

  // CO2: rolig drift mod target
  if (frameCount % 180 === 0) co2Target = constrain(co2 + random(-80, 80), 400, 1600);
  co2 = lerp(co2, co2Target, 0.02);

  // Layout
  const topH = height * 0.68, bottomH = height - topH;
  stroke(0,45); strokeWeight(3); line(width/2, 0, width/2, topH); line(0, topH, width, topH);
  noStroke();

  // ---------- Venstre: dB gauge ----------
  const gCX = width * 0.25, gCY = topH * 0.56;
  const R = min(width/2, topH) * 0.60;         // kompakt radius
  const ring = R * 0.16;                        // tykkelse

  drawGauge(gCX, gCY, R, ring);
  drawNeedle(gCX, gCY, R, ring, dB);

  fill(255); textStyle(BOLD);
  textSize(R*0.18); text('dB', gCX, gCY + R*0.22);
  textSize(R*0.18); text(`${nf(dB,2,0)} dB`, gCX, gCY + R*0.40);

  // ---------- Højre: Smiley ----------
  const sCX = width * 0.75, sCY = topH * 0.50;
  const dia = min(width/2, topH) * 0.80;

  drawSmiley(sCX, sCY, dia, co2);

  // ---------- Bund: grøn bar ----------
  drawBottomBar(topH, bottomH, int(co2));
}

// ----- Tegn gauge segmenter (grøn->gul->rød) -----
function drawGauge(cx, cy, R, w) {
  push(); translate(cx, cy); noFill(); strokeWeight(w); strokeCap(SQUARE);
  const segs = ['#00C853','#6BD23F','#C9DF3A','#FFEB3B','#FFA93A','#F44336'];
  let a0 = -180;
  for (let i=0;i<segs.length;i++){
    const a1 = lerp(-180, 0, (i+1)/segs.length);
    stroke(segs[i]); arc(0,0, R*2-w, R*2-w, a0, a1);
    a0 = a1;
  }
  pop();
}

// ----- Viser -----
function drawNeedle(cx, cy, R, w, dB) {
  push(); translate(cx, cy);
  const theta = map(dB, 30, 100, -180, 0, true);
  stroke(0); strokeWeight(w*0.35); strokeCap(ROUND);
  const L = R - w*0.9;
  line(0,0, L*cos(theta), L*sin(theta));
  noStroke(); fill(0); circle(0,0, w*0.8);
  pop();
}

// ----- Smiley m. tykkelig kant; farve efter CO2 -----
function drawSmiley(cx, cy, dia, ppm) {
  let face = C_SMILE;
  if (ppm >= 800 && ppm < 1200) face =
