precision highp float;

uniform sampler2D tex;
uniform sampler2D colorScale;
varying vec2 vUv;

// const float kBands = 2.0;
// const float kBandsFrac = 1.0 / kBands;

void main() {
    float v = texture2D(tex, vUv).r;
    // v = mod(v, kBandsFrac*1.00001) * kBands;
    // gl_FragColor = vec4(vec3(v), 1.0);

    vec4 c = texture2D(colorScale, vec2(1.0 - v, 0));
    gl_FragColor = c;
}
