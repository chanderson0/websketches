import * as Two from "two.js";
import * as SimplexNoise from "simplex-noise";

const elem = document.getElementById("app");
const two = new Two({
  width: 724,
  height: 512
}).appendTo(elem);

function normSin(v: number) {
  return Math.sin(v) * 0.5 + 0.5;
}

for (let x = 0; x < two.width; x += 10) {
  for (let y = 0; y < two.height; y += 10) {
    const dist = new Two.Vector(x, y).distanceTo(
      new Two.Vector(two.width / 2, two.height / 2)
    );
    const normDist = dist / (Math.max(two.width, two.height) / 2.0);
    if (Math.pow(normDist, 2.0) > 0.4) {
      continue;
    }
    const r = normSin(
      Math.pow(Math.abs(x - two.width / 2.0) / 10, 3.1) +
      Math.pow(Math.abs(y - two.height / 2.0) / 10, 3.1)
    ) * 10;

    if (r < 3) {
      continue;
    }
    const rect = two.makeCircle(
      x,
      y,
      r
    ); //, normSin(x - y) * 10);
    // rect.rotation = normSin(x * Math.sqrt(y)) * Math.PI * 2.0;
    rect.stroke = "#222";
    rect.linewidth = 1;
    rect.noFill();
  }
}
two.update();

// const noise = new SimplexNoise();
// function gradientDir(pos: typeof Two.Vector) {
//   const EPS = 0.01;
//   const SCALE = 0.003;
//   const SPEED = 50;

//   const l = noise.noise2D(SCALE * pos.x - EPS, SCALE * pos.y);
//   const r = noise.noise2D(SCALE * pos.x + EPS, SCALE * pos.y);
//   const u = noise.noise2D(SCALE * pos.x, SCALE * pos.y + EPS);
//   const d = noise.noise2D(SCALE * pos.x, SCALE * pos.y - EPS);

//   return new Two.Vector(-(r - l) * SPEED, (u - d) * SPEED);
// }

// const paths: typeof Two.Path[] = [];
// for (let i = 0; i < 5000; ++i) {
//   const x = Math.random() * two.width;
//   const y = Math.random() * two.height;

//   let pos = new Two.Vector(x, y);

//   const points = [new Two.Anchor(pos.x, pos.y)];
//   for (let j = 0; j < 7; ++j) {
//     pos.addSelf(gradientDir(pos));
//     // pos.addSelf(new Two.Vector(Math.random(), Math.random()).multiplyScalar(2.0));
//     points.push(new Two.Anchor(pos.x, pos.y));
//   }
//   const path = two.makeCurve(points, true);
//   path.stroke = "#222";
//   path.linewidth = 1;
//   path.noFill();

//   paths.push(path);
// }
// two.update();
