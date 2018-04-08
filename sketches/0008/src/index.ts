import * as Two from "two.js";
import * as SimplexNoise from "simplex-noise";

const elem = document.getElementById("app");
const two = new Two({
  width: 724,
  height: 512,
}).appendTo(elem);

const noise = new SimplexNoise();
function gradientDir(pos: typeof Two.Vector) {
  const EPS = 0.01;
  const SCALE = 0.003;
  const SPEED = 50;

  const l = noise.noise2D(SCALE * pos.x - EPS, SCALE * pos.y);
  const r = noise.noise2D(SCALE * pos.x + EPS, SCALE * pos.y);
  const u = noise.noise2D(SCALE * pos.x, SCALE * pos.y + EPS);
  const d = noise.noise2D(SCALE * pos.x, SCALE * pos.y - EPS);

  return new Two.Vector(-(r - l) * SPEED, (u - d) * SPEED);
}

const paths: typeof Two.Path[] = [];
for (let i = 0; i < 5000; ++i) {
  const x = Math.random() * two.width;
  const y = Math.random() * two.height;

  let pos = new Two.Vector(x, y);

  const points = [new Two.Anchor(pos.x, pos.y)];
  for (let j = 0; j < 7; ++j) {
    pos.addSelf(gradientDir(pos));
    // pos.addSelf(new Two.Vector(Math.random(), Math.random()).multiplyScalar(2.0));
    points.push(new Two.Anchor(pos.x, pos.y));
  }
  const path = two.makeCurve(points, true);
  path.stroke = "#222";
  path.linewidth = 1;
  path.noFill();

  paths.push(path);
}
two.update();
