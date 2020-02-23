import * as CCapture from 'ccapture.js';
import { fit, position } from 'object-fit-math';
import { OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import {
  ASPECT,
  DIV_HEIGHT,
  DIV_WIDTH,
  HEIGHT,
  RECORDING_FPS,
  SKETCH_ID,
  WIDTH,
} from './constants';

export abstract class Runner {
  protected scene = new Scene();
  protected camera = new OrthographicCamera(-1, 1, 1 / ASPECT, -1 / ASPECT, 0.1, 10000.0);

  protected renderer: WebGLRenderer;
  protected composer: EffectComposer;

  protected recording = false;
  private recorder: typeof CCapture;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas });
    this.renderer.setSize(WIDTH, HEIGHT);
    this.composer = new EffectComposer(this.renderer);

    this.recorder = new CCapture({
      name: `Sketch-${SKETCH_ID}`,
      format: 'png',
      framerate: RECORDING_FPS,
    });

    const startRecording = (): void => {
      this.recording = true;
      this.recorder.start();
    };

    const stopRecording = (): void => {
      this.recording = false;
      this.recorder.stop();
      this.recorder.save();
    };

    window.addEventListener('keypress', (e) => {
      if (e.key == 'r') {
        if (this.recording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    });

    const onResize = (): void => {
      const { width, height } = fit(
        {
          width: Math.min(window.innerWidth, DIV_WIDTH),
          height: Math.min(window.innerHeight, DIV_HEIGHT),
        },
        { width: DIV_WIDTH, height: DIV_HEIGHT },
        'contain'
      );

      const { x, y } = position(
        { width: window.innerWidth, height: window.innerHeight },
        { width, height },
        '50%',
        '50%'
      );

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.left = `${x}px`;
      canvas.style.top = `${y}px`;
    };
    window.addEventListener('resize', onResize);
    onResize();
  }

  protected abstract setup(): void;
  protected onFrame: (dt: number, elapsed: number) => void = () => {
    // To be overridden
  };

  run(): void {
    let now = 0;
    let lastFrame = Date.now();
    const loop = (): void => {
      requestAnimationFrame(loop);

      let delta = 0;
      if (this.recording) {
        delta = (1.0 / RECORDING_FPS) * 1000;
      } else {
        delta = Date.now() - lastFrame;
      }
      now += delta;
      lastFrame = Date.now();

      this.onFrame(delta, now);

      this.composer.render();
      if (this.recording) {
        this.recorder.capture(this.renderer.domElement);
      }
    };
    loop();
  }
}
