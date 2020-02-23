import { App } from './app';
import './index.scss';

const canvasElem = document.getElementById('app');
if (!canvasElem) {
  console.error('No canvas!');
}

const app = new App(canvasElem as HTMLCanvasElement);
app.setup();
app.run();
