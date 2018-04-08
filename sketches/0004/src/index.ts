import * as PIXI from "pixi.js";
import * as Color from "color";
import * as CCapture from "ccapture.js";

// Why?
import Victor = require("victor");

// From https://gist.github.com/wteuber/6241786
const fmod = (a: number, b: number) =>
  Number((a - Math.floor(a / b) * b).toPrecision(8));

const normSin = (a: number) => Math.sin(a) * 0.5 + 0.5;
const lerp = (v0: number, v1: number, t: number) => v0 * (1 - t) + v1 * t;

const OUTPUT_SIZE = 1080;

const recorder = new CCapture({
  name: "Sketch",
  format: "png",
  framerate: 30,
  autoSaveTime: 1
});

const app = new PIXI.Application({
  width: OUTPUT_SIZE,
  height: OUTPUT_SIZE,
  backgroundColor: Color('rgb(255, 137, 137)').rgbNumber(),
  // transparent: true,
  antialias: true,
  view: document.getElementById("app") as HTMLCanvasElement
});
app.renderer.autoResize = true;

const N_LINES = 170;

const gs: PIXI.Graphics[] = [];
for (let i = 0; i < N_LINES; ++i) {
  const g = new PIXI.Graphics();
  app.stage.addChild(g);
  gs.push(g);
}

let recording = false;
const RECORDING_FPS = 30;
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

  const timeFac = 0.75;

  for (let i = 0; i < N_LINES; ++i) {
    const color = new Color(0xffffff).rotate((time + i) * 50.0).rgbNumber();
    const g = gs[i];
    g.clear();
    g.lineStyle(5, color);
    g.moveTo(
      -50,
      Math.sin(time + i) * lerp(5, 300, normSin(time * timeFac * 2.0)) +
        OUTPUT_SIZE / 2.0
    );

    g.quadraticCurveTo(
      Math.sin(time * timeFac + i * 0.5) * OUTPUT_SIZE / 3.0 +
        OUTPUT_SIZE / 3.0,
      Math.cos(time * timeFac + i * 0.5) * OUTPUT_SIZE / 3.0 +
        OUTPUT_SIZE / 3.0,
      OUTPUT_SIZE + 50,
      Math.sin(time * timeFac + i) *
        lerp(5, 300, normSin(time * timeFac * 2.0 + Math.PI / 2.0)) +
        OUTPUT_SIZE / 2.0
    );
    g.alpha = 0.4;
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
