import * as PIXI from "pixi.js";
import * as Color from "color";
import * as CCapture from "ccapture.js";

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
  backgroundColor: 0x0,
  antialias: true,
  view: document.getElementById("app") as HTMLCanvasElement
});
app.renderer.autoResize = true;

const N_CIRCLES = 300;
const circles: PIXI.Graphics[] = [];
for (let i = 0; i < N_CIRCLES; ++i) {
  const circle = new PIXI.Graphics();
  circle.beginFill(0xffffff);
  circle.arc(0, 0, 10, 0, 2.0 * Math.PI);
  circle.endFill();
  app.stage.addChild(circle);
  circle.position.y = -50 + i * 4;
  circles.push(circle);
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

  const f = 5.0;
  const t = 0.2;
  for (let i = 0; i < N_CIRCLES; ++i) {
    const circle = circles[i];
    circle.position.x =
      Math.sin(time * t + i / f) * app.view.width / 2.0 + app.view.width / 2.0;
    circle.scale.x = circle.scale.y = 7.0;
    const color = Color.rgb(100, 100, 255).lighten(
      Math.sin(time * 0.8 + i / f) * 0.1 + 0.1
    );
    circle.tint = color.rgbNumber();
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
