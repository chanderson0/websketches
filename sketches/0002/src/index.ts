import * as PIXI from "pixi.js";
import * as Color from "color";
import * as CCapture from "ccapture.js";

// Why?
import Victor = require("victor");

// From https://gist.github.com/wteuber/6241786
const fmod = (a: number, b: number) =>
  Number((a - Math.floor(a / b) * b).toPrecision(8));

const OUTPUT_SIZE = 1080;

const recorder = new CCapture({
  name: "Sketch",
  format: "png",
  framerate: 60,
  autoSaveTime: 1
});

const app = new PIXI.Application({
  width: OUTPUT_SIZE,
  height: OUTPUT_SIZE,
  backgroundColor: 0x170065,
  antialias: true,
  view: document.getElementById("app") as HTMLCanvasElement
});
app.renderer.autoResize = true;

const BOX_SIZE = 50;
const BOX_MARGIN = 20;
const N_BOXES = (OUTPUT_SIZE - BOX_MARGIN) / (BOX_SIZE + BOX_MARGIN) - 1;

const boxes: PIXI.Graphics[] = [];
for (let i = 0; i < N_BOXES; ++i) {
  for (let j = 0; j < N_BOXES; ++j) {
    const x = BOX_MARGIN * 1.25 + i * (BOX_SIZE + BOX_MARGIN) + BOX_SIZE / 2.0;
    const y = BOX_MARGIN * 1.25 + j * (BOX_SIZE + BOX_MARGIN) + BOX_SIZE / 2.0;

    const rect = new PIXI.Graphics();
    rect.beginFill(0xffffff);
    rect.drawRoundedRect(
      -BOX_SIZE / 2.0,
      -BOX_SIZE / 2.0,
      BOX_SIZE,
      BOX_SIZE,
      10
    );
    rect.endFill();
    app.stage.addChild(rect);
    rect.position.set(x, y);
    boxes.push(rect);
  }
}

let recording = false;
const RECORDING_FPS = 60;
let time = 0;
let lastFrame = +new Date();
function loop() {
  requestAnimationFrame(loop);

  if (recording) {
    time += 1.0 / RECORDING_FPS;
  } else {
    time += (+new Date() - lastFrame) / 1000;
  }
  lastFrame = +new Date();

  const center = new Victor(OUTPUT_SIZE / 2.0, OUTPUT_SIZE / 2.0);
  for (const box of boxes) {
    const f = 0.5;
    const val = Math.sin(time + box.position.x * f + box.position.y * f);

    box.rotation = Math.pow(val,20) * Math.PI/2.0;

    const dist = new Victor(box.position.x, box.position.y).distance(center);
    const color = new Color(0x6c3fff).lighten((val + 0.2) * 0.2);
    box.tint = color.rgbNumber();
  }

  app.render();

  if (recording) {
    recorder.capture(app.view);
  }
}
loop();

const startRecording = () => {
  recording = true;
  recorder.start();
};

const stopRecording = () => {
  recording = false;
  recorder.stop();
  recorder.save();
};

window.addEventListener("keypress", e => {
  if (e.key == "r") {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
});
