#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

vec2 rot(vec2 uv, float rot) {
  float angle = atan(uv.y, uv.x);
  angle += rot;
  return vec2(cos(angle), sin(angle)) * length(uv);
}

float sq(vec2 uvIn, float rotAmt) {
  vec2 uv = rot(uvIn, rotAmt);

  vec2 r=abs(uv);
  float p = max(r.x,r.y);
  float s=smoothstep(.2,.22,p) * step(p, 0.25);

  return s;
}

float circ(vec2 uv) {
  float d = length(uv);
  float s = smoothstep(.2,.22,d) * step(d, 0.25);

  return s;
}

void main(void)  {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  uv += vec2(-0.5);
  uv.x *= resolution.x / resolution.y; 

  float fac = 8.0;
  vec2 quad = floor(uv * fac) + 0.5;
  float s = sq(
    mod(uv * fac, 1.0) - 0.5,
    (quad.x + quad.y + 0.1) / 9.0 * time / 0.2
  ) * step(0.0, sin(uv.x * fac) * sin(uv.y * 30.0));

  vec2 uv2 = uv + 0.008;//rot(uv, sin(time + 10.) * 0.02);
  s += circ(mod(uv2 * (fac /*+ sin(time) * 0.3*/), 1.0) - 0.5)
  * step(0.0, sin(uv.x * fac) * sin(uv.y * fac));

  gl_FragColor = vec4(vec3(s),1.0);
}
