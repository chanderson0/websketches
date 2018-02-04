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
  backgroundColor: 0x6da7ff,
  // transparent: true,
  antialias: true,
  view: document.getElementById("app") as HTMLCanvasElement
});
app.renderer.autoResize = true;

const N_BOXES = 9;

const gs: PIXI.Graphics[] = [];
for (let i = 0; i < N_BOXES; ++i) {
  const g = new PIXI.Graphics();
  g.lineStyle(100, 0xffffff);
  // g.beginFill(0xffffff);
  g.arc(0, 0, 200, 0, 0.4 * Math.PI);
  app.stage.addChild(g);
  gs.push(g);
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
  for (let i = 0; i < N_BOXES; ++i) {
    const g = gs[i];
    g.position.set(
      Math.sin(i * 10.0 + time) * OUTPUT_SIZE / 4.0 + OUTPUT_SIZE / 2.0,
      Math.cos(i * 5.0 + time) * OUTPUT_SIZE / 4.0 + OUTPUT_SIZE / 2.0
    );
    const v = 1.0 - (Math.sin(time + i * 100) * 0.5 + 0.5);
    g.scale.set(Math.max(v, 0.2),Math.max(v, 0.2));
    g.alpha = v;
    g.rotation = (v + i) * 10.0;
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
