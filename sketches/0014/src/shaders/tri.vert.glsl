precision highp float;

uniform float time;

varying vec4 vColor;

const vec3 kBgColor = vec3(0.309, 0.427, 0.478);
const vec3 kFgColor = vec3(0.917, 0.917, 0.917);

void main() {
  vec4 orientation = vec4(0.0,0.0,0.0,1.0);
  
  float delta =
  sin(
    normal.x * 8.
    - normal.y * 1.
    - normal.z * 2.
    - time * 3.0
  );

  vec3 vPosition = position + normal * delta * 0.05;

  vec3 vcV = cross( orientation.xyz, vPosition );
  vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );

  float v = delta * 0.5 + 0.5;
  v = pow(v, 0.5);
  // v = min(max(v, 0.0), 1.0);
  vec3 color = mix(kBgColor, kFgColor, v);
  vColor = vec4(color, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
}
