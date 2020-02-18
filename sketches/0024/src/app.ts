import * as CCapture from 'ccapture.js';
import { fit, position } from 'object-fit-math';
import { makeNoise3D } from 'open-simplex-noise';
import {
  Color,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  SphereBufferGeometry,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { DepthPass } from './DepthPass';

export const run = (): void => {
  const canvasElem = document.getElementById('app');
  if (!canvasElem) {
    console.error('No canvas!');
    return;
  }
  const canvas = canvasElem as HTMLCanvasElement;
  const width = 1080;
  const height = 1920;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 16 / 9, -16 / 9, 0.00001, 25.0);

  const renderer = new WebGLRenderer({ canvas });
  renderer.setSize(width, height);
  const composer = new EffectComposer(renderer);

  const sphereGeom = new SphereBufferGeometry(0.3, 64, 64);
  const material = new MeshBasicMaterial({ color: 0xffffff });

  const renderPass = new RenderPass(scene, camera);
  renderPass.renderToScreen = false;
  // renderPass.needsSwap = false;
  composer.addPass(renderPass);

  const depthPass = new DepthPass(scene, camera, width, height, {
    fgColor: new Color(0x4f8fe6),
    bgColor: new Color(0xe6adcf),
    screenColor: new Color(0xe6adcf),
  });
  depthPass.renderToScreen = true;
  // depthPass.needsSwap = false;
  composer.addPass(depthPass);

  const spheres: Mesh[] = [];
  const rows = 7 * 1;
  const cols = 5 * 1;
  const xRange = 1;
  const yRange = (16 / 9) * 1.3;
  for (let i = 0; i < rows * cols; ++i) {
    const sphere = new Mesh(sphereGeom, material);
    sphere.position.x = ((i % cols) / (cols - 1)) * xRange - xRange / 2;
    sphere.position.y = (Math.floor(i / cols) / (rows - 1)) * yRange - yRange / 2;
    scene.add(sphere);
    spheres.push(sphere);
  }

  camera.position.z = 4;
  const noise3D = makeNoise3D(0);

  let recording = false;
  const recorder = new CCapture({
    name: 'Sketch-0024',
    format: 'png',
    framerate: 60,
  });

  const startRecording = (): void => {
    recording = true;
    recorder.start();
  };

  const stopRecording = (): void => {
    recording = false;
    recorder.stop();
    recorder.save();
  };

  window.addEventListener('keypress', (e) => {
    if (e.key == 'r') {
      if (recording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  });

  const onResize = (): void => {
    const { width: displayWidth, height: displayHeight } = fit(
      {
        width: Math.min(window.innerWidth, 1080 / 2),
        height: Math.min(window.innerHeight, 1920 / 2),
      },
      { width: width / 2, height: height / 2 },
      'contain'
    );

    const { x, y } = position(
      { width: window.innerWidth, height: window.innerHeight },
      { width: displayWidth, height: displayHeight },
      '50%',
      '50%'
    );

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.left = `${x}px`;
    canvas.style.top = `${y}px`;
  };

  window.addEventListener('resize', onResize);
  onResize();

  const RECORDING_FPS = 60;
  let now = 0;
  let lastFrame = Date.now();

  const loop = (): void => {
    requestAnimationFrame(loop);

    let delta = 0;
    if (recording) {
      delta = (1.0 / RECORDING_FPS) * 1000;
    } else {
      delta = Date.now() - lastFrame;
    }
    now += delta;
    lastFrame = Date.now();

    for (const [i, sphere] of spheres.entries()) {
      sphere.position.x =
        ((i % cols) / (cols - 1)) * xRange - xRange / 2 + Math.sin(now / 1000 + i) * 0.1;
      sphere.position.y =
        (Math.floor(i / cols) / (rows - 1)) * yRange - yRange / 2 + Math.cos(now / 1000 + i) * 0.2;

      sphere.position.z =
        noise3D(sphere.position.x * 1, sphere.position.y * 1, now / 1000 / 2) * 0.9;
      // sphere.position.z =
      //   Math.sin((now / 1000) * 2 + sphere.position.x * 3 + sphere.position.y * 3) * 0.75;
    }

    composer.render();
    if (recording) {
      recorder.capture(renderer.domElement);
    }
  };
  loop();
};
