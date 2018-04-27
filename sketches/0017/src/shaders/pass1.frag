precision highp float;

uniform float time;
uniform sampler2D prevFrame;
uniform sampler2D scene;

varying vec2 vUv;

void main() {
  vec4 curFrame = texture2D(scene, vUv);

  float angle = time * 0.1 * 3.14159 * 2.0;
  vec2 dir = vec2(cos(angle),sin(angle));
  float dirAmt = 0.01;
  float m = texture2D(prevFrame, vUv + dir * dirAmt).r; 
  
  float v = curFrame.r + m;
  if (v > 0.3) {
    v *= 0.97;
  } else if (v > 0.15) {
    v *= 0.9;
  } else {
    v = 0.0;
  }
  v = max(curFrame.r, v);

  gl_FragColor = vec4(vec3(v), 1);
}
