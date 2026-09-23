import type { Action } from 'svelte/action';
import {
  bindFullScreenTriangle,
  linkProgram,
  observeDevicePixels,
  resizeToDevicePixels,
  toRgb,
  type Rgb,
} from '$lib/domains/shared/utils/webgl-canvas';

// The live logo: a small fluid simulation over the tile.
//   At rest the colour churns inside the three lines on a plain tile.
//   Hovering floods it out of the lines until the fan fills the tile and the
//   lines turn white; the colour keeps moving there while the pointer stays.
//   Leaving drains the colour back into the lines, where it keeps churning.
// One number drives all of it: the progress from lines (0) to full fan (1),
// which follows the pointer on a critically damped spring. It sets the reach,
// how far the colour extends from the lines; every force is a smooth function
// of the two and their speed, and the colour fills in behind the reach's front
// and clears beyond it. So coverage moves at the spring's pace, and turning
// back at any moment carries the motion on without a jump.
// The fluid never stops, so the mark is never a still image while it is on
// screen. Off screen, in a hidden tab or with reduced motion it does not run,
// and without WebGL2 float render targets LogoMark keeps its static CSS mark.

type LogoInkOptions = {
  /** True while the canvas draws the mark, so the static CSS mark can step aside. */
  onLive: (live: boolean) => void;
};

type Params = Record<string, number>;

type InkRenderer = {
  /** One fixed simulation step with these forces and relaxation rates. */
  step: (params: Params, time: number, stirTime: number) => void;
  draw: (white: number, paper: Rgb, time: number) => void;
  release: () => void;
};

/**
 * Tile units the colour reaches from the lines when the fan is full: past the
 * farthest corner (about 50) plus the front's noisy edge.
 */
const FULL_REACH = 72;
/** Spring stiffness (rad/s): the tile fills in about 0.8 s and clears in about 0.9 s. */
const FLOOD_OMEGA = 2.8;
const DRAIN_OMEGA = 2.5;
/** Progress per second that counts as full motion for stirring. */
const BUSY_SPEED = 1.2;
const STEP_SECONDS = 1 / 60;
/** Most steps per frame, so a long frame slows the fluid down rather than stalling to catch up. */
const MAX_STEPS = 4;
const GRID = 144;
const PRESSURE_ITERATIONS = 40;

/** The three lines as [x, y, width, height] in the 100 box, as drawn by LogoMark.svelte's mask. */
const BARS = [
  [46.69, 34.07, 31.32, 5.79],
  [21.99, 47.11, 41.11, 5.79],
  [40.93, 60.14, 29.16, 5.79],
];
/** Per line: segment start x, segment end x, y, radius, for round-capped capsules. */
const LINES = BARS.flatMap(([x, y, width, height]) => [
  x + height / 2,
  x + width - height / 2,
  y + height / 2,
  height / 2,
]);
/** The full fan opens from the tile's bottom-left corner; the lines show it squeezed onto their own square. */
const PIVOT = [0, 100];
const SQUEEZE = (78.01 - 21.99) / 100;
const FAN_COLOURS = ['#0255ff', '#ef3c00', '#ffb700'];
const CORNER_RADIUS = 16;

export const logoInk: Action<HTMLCanvasElement, LogoInkOptions> = (
  canvas,
  options,
) => {
  let current = options;
  const host = canvas.parentElement ?? canvas;
  // Logos mostly sit in a link with a wordmark; hovering any of it floods the mark.
  const trigger = host.closest('a') ?? host;
  let renderer: InkRenderer | null = null;
  let paper: Rgb = [0, 0, 0];
  let progress = 0;
  let speed = 0;
  let time = 0;
  /** The stir's own clock, which runs faster while the tile is flooded so its eddies keep changing. */
  let stirTime = 0;
  let pending = 0;
  let lastFrame = 0;
  let request = 0;
  let isHovered = false;
  let isVisible = false;

  const resizer = new ResizeObserver(([entry]) => {
    resizeToDevicePixels(canvas, entry);
    draw();
  });
  const visibility = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    play();
  });

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) start();

  function start(): void {
    renderer = createRenderer(canvas);
    if (!renderer) return;
    readPaper();
    observeDevicePixels(resizer, canvas);
    visibility.observe(host);
    trigger.addEventListener('pointerenter', onPointerEnter);
    trigger.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('webglcontextlost', onContextLost);
    draw();
    current.onLive(true);
  }

  function play(): void {
    if (request || !isVisible || !renderer) return;
    readPaper();
    lastFrame = performance.now();
    request = requestAnimationFrame(tick);
  }

  function tick(now: number): void {
    request = 0;
    if (!isVisible || !renderer) return;
    pending += Math.min((now - lastFrame) / 1000, MAX_STEPS * STEP_SECONDS);
    lastFrame = now;
    for (; pending >= STEP_SECONDS; pending -= STEP_SECONDS) {
      time += STEP_SECONDS;
      advance();
      const params = paramsAt(progress, speed);
      stirTime += STEP_SECONDS * params.stirPace;
      renderer.step(params, time % 1000, stirTime % 1000);
    }
    draw();
    request = requestAnimationFrame(tick);
  }

  /** One step of the progress's spring towards the pointer's state. */
  function advance(): void {
    const target = isHovered ? 1 : 0;
    const omega = target > progress ? FLOOD_OMEGA : DRAIN_OMEGA;
    speed +=
      (omega * omega * (target - progress) - 2 * omega * speed) * STEP_SECONDS;
    progress = clamp01(progress + speed * STEP_SECONDS);
  }

  function draw(): void {
    renderer?.draw(whiteAt(progress), paper, time % 1000);
  }

  /** The host's `color` is its tile colour, resolved for the current colour scheme. */
  function readPaper(): void {
    paper = toRgb(getComputedStyle(host).color);
  }

  function onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    isHovered = true;
    readPaper();
  }

  function onPointerLeave(): void {
    isHovered = false;
  }

  function onContextLost(event: Event): void {
    event.preventDefault();
    cancelAnimationFrame(request);
    request = 0;
    renderer = null;
    current.onLive(false);
  }

  return {
    update(next: LogoInkOptions): void {
      current = next;
    },
    destroy(): void {
      cancelAnimationFrame(request);
      resizer.disconnect();
      visibility.disconnect();
      trigger.removeEventListener('pointerenter', onPointerEnter);
      trigger.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      renderer?.release();
    },
  };
};

// Forces and relaxation rates (per second) at a progress and its speed.

function paramsAt(full: number, speed: number): Params {
  // Coverage grows about linearly with the reach until the front nears the corners, so a squared reach makes it
  // follow the progress instead of filling the tile in the first third.
  const reach = FULL_REACH * full * full;
  const reachSpeed = FULL_REACH * 2 * full * speed;
  const busy = Math.min(1, Math.abs(speed) / BUSY_SPEED);
  const flooding = smoothstep(0, 0.15, speed);
  // 1 unless the progress is falling fast: draining lets the colours travel with the fluid.
  const settling = smoothstep(-0.25, 0, speed);
  const resting = 1 - smoothstep(0, 0.25, full);
  const draining = 1 - settling;
  // Once colour is on the tile it is kept swirling, from early in the flood for as long as the pointer stays.
  // Draining calms it, so the colour contracts cleanly.
  const vivid = smoothstep(0.1, 0.5, full) * (0.3 + 0.7 * settling);
  return {
    // Flooding pushes the colour outwards at the front's own speed everywhere, so no part races ahead.
    // Draining pulls it in proportionally to its distance, so the whole field contracts evenly onto the lines.
    uDrift:
      reachSpeed >= 0 ? -reachSpeed : -reachSpeed / (reach + CONTRACTION_BIAS),
    uSpread: reachSpeed >= 0 ? 1 : 0,
    uBias: CONTRACTION_BIAS,
    uUneven: 0.3,
    uReach: reach,
    // At rest, jets along each line keep the colour churning inside them.
    uStirIn: 8 * resting,
    uJet: 70 * resting,
    // The tile is stirred hard and fast, with extra curl, so the colours marble into eddies instead of settling.
    uStir: 15 * bell(full) * busy + 26 * vivid,
    stirPace: 0.35 + 0.65 * vivid,
    uVort: 26 + 18 * vivid,
    uDamp: busy * 0.6 + (1 - busy) * (1.2 + 0.6 * resting - 0.4 * vivid),
    // The lines emit fresh colour, arranged as the squeezed fan, while it floods out of them.
    uEmit: 40 * (1 - smoothstep(0.5, 0.8, full)) * flooding,
    uBIn: smoothstep(0.85, 1, full),
    // Inside the lines the colours settle back into the squeezed fan (or, near full, the fan itself).
    uRelaxIn:
      2.2 +
      12 * smoothstep(0.5, 1, full) +
      12 * draining * (1 - smoothstep(0.05, 0.45, full)),
    uInLight: 1 - smoothstep(0.5, 0.95, full),
    // On the tile they drift back towards the fan only loosely: enough to keep all three hues in their places,
    // not enough to still the eddies.
    uRelaxOut: (1 + 2 * busy) * smoothstep(0.45, 1, full) * settling,
  };
}

/** How white the lines are: colour at rest, white once the colour has left them. */
function whiteAt(progress: number): number {
  return smoothstep(0.15, 0.6, progress);
}

/** Keeps the contraction moving near the lines, where the distance is small. */
const CONTRACTION_BIAS = 2;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(from: number, to: number, x: number): number {
  const t = clamp01((x - from) / (to - from));
  return t * t * (3 - 2 * t);
}

function bell(x: number): number {
  return Math.sin(Math.PI * clamp01(x));
}

// Shaders ---------------------------------------------------------------------

const VERTEX_SOURCE = `#version 300 es
layout(location = 0) in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Tile units: a 100 x 100 box, y down. Lines are round-capped capsules.
const GEOMETRY = `
uniform vec4 uLines[3];
uniform float uSqueeze;
const float PI = 3.14159265;
float sat(float x) { return clamp(x, 0.0, 1.0); }
float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
float capsule(vec2 p, int i) { vec4 l = uLines[i]; return segment(p, l.xz, l.yz) - l.w; }
float lines(vec2 p) { return min(capsule(p, 0), min(capsule(p, 1), capsule(p, 2))); }
int lineOf(vec2 p) { return p.y < 0.5 * (uLines[0].z + uLines[1].z) ? 0 : p.y < 0.5 * (uLines[1].z + uLines[2].z) ? 1 : 2; }
`;

// Ashima 3D simplex noise (MIT).
const NOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// The simulation (stable fluids on a GRID x GRID texture over the tile, y up in uv).
// The map texture holds, per cell: RG = where the colour here came from (offset, tile units), B = how much colour
// is here. The display looks the fan colour up at that origin, so the palette never muddies as it mixes.
const SIM_HEAD = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform vec2 uTexel;
${GEOMETRY}
vec2 tileAt(vec2 uv) { return vec2(uv.x, 1.0 - uv.y) * 100.0; }
float inLines(vec2 uv) { return smoothstep(1.0, -1.0, lines(tileAt(uv))); }
`;

const SIM_SOURCES = {
  // The rest state: colour only in the lines, each point showing its place in the squeezed fan.
  seed: `
void main() {
  vec2 pt = tileAt(vUv);
  float inL = inLines(vUv);
  vec2 lightX = 50.0 + (pt - 50.0) / uSqueeze;
  o = vec4((lightX - pt) * inL, inL, 1.0);
}`,
  curl: `
uniform sampler2D uVel;
void main() {
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).y;
  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  force: `${NOISE}
uniform sampler2D uVel;
uniform sampler2D uCurl;
uniform float uDt, uVort, uStir, uStirIn, uJet, uDamp, uTime, uStirTime;
void main() {
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f = f / (length(f) + 1e-5) * uVort * C * vec2(1.0, -1.0);
  vec2 ps = vUv * 100.0;
  float e = 0.8;
  vec3 q = vec3(ps * 0.032, uStirTime);
  float nx = snoise(q + vec3(e * 0.032, 0.0, 0.0)) - snoise(q - vec3(e * 0.032, 0.0, 0.0));
  float ny = snoise(q + vec3(0.0, e * 0.032, 0.0)) - snoise(q - vec3(0.0, e * 0.032, 0.0));
  vec2 stir = vec2(ny, -nx) / (2.0 * e) * 30.0;
  float inL = inLines(vUv);
  float fi = float(lineOf(tileAt(vUv)));
  vec2 jet = vec2(uJet * sin(uTime * 0.9 + fi * 2.1), 0.0);
  vec2 v = texture(uVel, vUv).xy + uDt * (f + uStir * stir + inL * (uStirIn * stir + jet));
  // A speed limit (tile units/s): past it the curl feeds on itself and the advection smears colour into streaks.
  v *= min(1.0, 90.0 / max(length(v), 1e-4));
  o = vec4(v * exp(-uDamp * uDt), 0.0, 1.0);
}`,
  divergence: `
uniform sampler2D uVel;
uniform float uH;
void main() {
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).y;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).y;
  o = vec4(0.5 * (R - L + T - B) / uH, 0.0, 0.0, 1.0);
}`,
  pressure: `
uniform sampler2D uP;
uniform sampler2D uDiv;
uniform float uH;
// Open edges: pressure is zero outside the tile, so fluid can leave and enter through them.
float P(vec2 uv) { return any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0))) ? 0.0 : texture(uP, uv).x; }
void main() {
  float s = P(vUv - vec2(uTexel.x, 0.0)) + P(vUv + vec2(uTexel.x, 0.0)) + P(vUv - vec2(0.0, uTexel.y)) + P(vUv + vec2(0.0, uTexel.y));
  o = vec4((s - texture(uDiv, vUv).x * uH * uH) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `
uniform sampler2D uP;
uniform sampler2D uVel;
uniform float uH;
float P(vec2 uv) { return any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0))) ? 0.0 : texture(uP, uv).x; }
void main() {
  vec2 g = vec2(P(vUv + vec2(uTexel.x, 0.0)) - P(vUv - vec2(uTexel.x, 0.0)), P(vUv + vec2(0.0, uTexel.y)) - P(vUv - vec2(0.0, uTexel.y)));
  o = vec4(texture(uVel, vUv).xy - 0.5 * g / uH, 0.0, 1.0);
}`,
  advectVelocity: `
uniform sampler2D uVel;
uniform float uDt;
void main() { o = vec4(texture(uVel, vUv - uDt * texture(uVel, vUv).xy / 100.0).xy, 0.0, 1.0); }`,
  advectMap: `${NOISE}
uniform sampler2D uVel;
uniform sampler2D uMap;
uniform float uDt, uBIn, uRelaxIn, uInLight, uRelaxOut, uEmit, uDrift, uSpread, uBias, uUneven, uReach, uTime;
void main() {
  vec2 pt = tileAt(vUv);
  // On top of the stirred fluid, the colour is carried towards the lines (uDrift > 0) or away from them (< 0):
  // at one speed everywhere (uSpread = 1) or faster the farther out it is (uSpread = 0).
  vec2 e = vec2(0.25, 0.0);
  vec2 grad = normalize(vec2(lines(pt + e.xy) - lines(pt - e.xy), lines(pt + e.yx) - lines(pt - e.yx)) + 1e-6);
  float d = lines(pt);
  float uneven = 1.0 + uUneven * snoise(vec3(pt * 0.045, uTime * 0.4));
  float push = mix(max(d, 0.0) + uBias, 1.0, uSpread);
  vec2 drift = -uDrift * uneven * push * smoothstep(-0.5, 0.5, d) * vec2(grad.x, -grad.y);
  vec2 back = vUv - uDt * (texture(uVel, vUv).xy + drift) / 100.0;
  bool outside = any(lessThan(back, vec2(0.0))) || any(greaterThan(back, vec2(1.0)));
  vec4 m = outside ? vec4(0.0, 0.0, uBIn, 1.0) : texture(uMap, back);
  vec2 X = tileAt(back) + m.xy;
  float B = m.z;
  float inL = inLines(vUv);
  vec2 lightX = 50.0 + (pt - 50.0) / uSqueeze;
  X = mix(X, mix(pt, lightX, uInLight), (1.0 - exp(-uRelaxIn * uDt)) * inL);
  X = mix(X, pt, (1.0 - exp(-uRelaxOut * uDt)) * (1.0 - inL));
  // Coverage follows the reach: colour fills in a little behind its front and clears a little beyond it, so it
  // spreads and recedes at the reach's pace whatever the fluid does in between. The front's edge wobbles, less so
  // when it is close to the lines.
  float scale = smoothstep(0.0, 20.0, uReach);
  float edge = d + 8.0 * scale * snoise(vec3(pt * 0.05, uTime * 0.3));
  float margin = 6.0 * scale;
  float behind = smoothstep(uReach - margin + 2.0, uReach - margin - 2.0, edge);
  float beyond = smoothstep(uReach + margin - 2.0, uReach + margin + 2.0, edge);
  B = mix(B, 1.0, (1.0 - exp(-8.0 * uDt)) * behind * (1.0 - inL));
  B = mix(B, 0.0, (1.0 - exp(-20.0 * uDt)) * beyond * (1.0 - inL));
  float emit = (1.0 - exp(-uEmit * uDt)) * inL;
  X = mix(X, lightX, emit);
  B = mix(B, 1.0, emit);
  o = vec4(X - pt, B, 1.0);
}`,
};

const DISPLAY_SOURCE = `#version 300 es
precision highp float;
out vec4 fragColour;
uniform float uSize;
uniform float uRadius;
uniform vec3 uPaper;
uniform float uWhite;
uniform float uTime;
uniform vec2 uPivot;
uniform vec3 uFanLab[3];
uniform sampler2D uMap;
${GEOMETRY}${NOISE}
float cover(float d) { return sat(0.5 - d / max(length(vec2(dFdx(d), dFdy(d))), 1e-4)); }
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float roundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

vec3 oklabToSrgb(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  vec3 rgbLinear = clamp(vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s), 0.0, 1.0);
  return mix(12.92 * rgbLinear, 1.055 * pow(rgbLinear, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, rgbLinear));
}
// Blue -> ember -> amber in OKLab. Past either end it runs back on itself, so a displaced fan stays continuous.
vec3 palette(float t) {
  t = abs(mod(t + 1.0, 2.0) - 1.0) * 2.0;
  return oklabToSrgb(t < 1.0 ? mix(uFanLab[0], uFanLab[1], t) : mix(uFanLab[1], uFanLab[2], t - 1.0));
}
// A quarter turn clockwise from 12 o'clock. Behind the pivot both ends run back to ember and meet there.
float fanAt(vec2 d) {
  float q = atan(d.x, -d.y) / (0.5 * PI);
  if (q < -1.5) q += 4.0;
  return q < 0.0 ? -q / 3.0 : q > 1.0 ? 1.0 - (q - 1.0) / 3.0 : q;
}
vec3 fan(vec2 p) {
  vec2 d = p - uPivot;
  float r = length(d);
  if (r < 1e-3) d = vec2(0.0, -1.0);
  return mix(palette(0.5), palette(fanAt(d)), smoothstep(0.0, 3.0, r));
}

vec4 cubic(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x, y = s.y - 4.0 * s.x, z = s.z - 4.0 * s.y + 6.0 * s.x;
  return vec4(x, y, z, 6.0 - x - y - z) * (1.0 / 6.0);
}
vec4 bicubic(sampler2D t, vec2 uv) {
  vec2 size = vec2(textureSize(t, 0));
  uv = uv * size - 0.5;
  vec2 f = fract(uv);
  uv -= f;
  vec4 xc = cubic(f.x), yc = cubic(f.y);
  vec4 c = uv.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 o = (c + vec4(xc.yw, yc.yw) / s) / size.xxyy;
  float sx = s.x / (s.x + s.y), sy = s.z / (s.z + s.w);
  return mix(mix(texture(t, o.yw), texture(t, o.xw), sx), mix(texture(t, o.yz), texture(t, o.xz), sx), sy);
}

void main() {
  float px = 100.0 / uSize;
  vec2 p = vec2(gl_FragCoord.x, uSize - gl_FragCoord.y) * px;
  float tile = sat(0.5 - roundBox(p - 50.0, vec2(50.0), uRadius) / px);
  vec4 m = bicubic(uMap, vec2(p.x, 100.0 - p.y) / 100.0);
  vec3 colour = fan(p + m.xy);
  float line = lines(p);
  // The white inside the lines shrinks to nothing as uWhite goes to 0, with a wobbly edge on the way.
  float w = min(uWhite, 1.0);
  float white = line + (1.0 - w) * (uLines[0].w + px) + (1.0 - w) * w * 3.0 * snoise(vec3(p * 0.12, uTime * 1.2));

  vec3 result = uPaper;
  result = mix(result, colour, cover(0.5 - m.z));
  float lineCover = cover(line);
  float whiteCover = sat(cover(white) / max(lineCover, 1e-4));
  result = mix(result, mix(colour, vec3(1.0), whiteCover), lineCover);
  result += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  fragColour = vec4(clamp(result, 0.0, 1.0) * tile, tile);
}
`;

// WebGL -----------------------------------------------------------------------

type Program = {
  use: (uniforms: Record<string, number | number[] | WebGLTexture>) => void;
};

type Target = { texture: WebGLTexture; framebuffer: WebGLFramebuffer };

function createRenderer(canvas: HTMLCanvasElement): InkRenderer | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;

  const programs = Object.fromEntries(
    Object.entries(SIM_SOURCES).map(([name, source]) => [
      name,
      createProgram(gl, SIM_HEAD + source),
    ]),
  );
  const display = createProgram(gl, DISPLAY_SOURCE);
  if (!display || Object.values(programs).some((program) => !program)) {
    return null;
  }
  const sim = programs as Record<keyof typeof SIM_SOURCES, Program>;

  bindFullScreenTriangle(gl, 0);
  const velocity = createPair(gl);
  const map = createPair(gl);
  const pressure = createPair(gl);
  const divergence = createTarget(gl);
  const curl = createTarget(gl);
  if (!velocity || !map || !pressure || !divergence || !curl) return null;

  const fanLab = FAN_COLOURS.flatMap(toOklab);
  const shared = {
    uTexel: [1 / GRID, 1 / GRID],
    uLines: LINES,
    uSqueeze: SQUEEZE,
  };
  const cell = 100 / GRID;
  const run = (
    program: Program,
    target: Target,
    uniforms: Record<string, number | number[] | WebGLTexture>,
  ) => {
    program.use({ ...shared, ...uniforms });
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  gl.disable(gl.BLEND);
  gl.viewport(0, 0, GRID, GRID);
  run(sim.seed, map.read, {});
  run(sim.seed, map.write, {});

  return {
    step(params: Params, time: number, stirTime: number): void {
      gl.viewport(0, 0, GRID, GRID);
      run(sim.curl, curl, { uVel: velocity.read.texture });
      run(sim.force, velocity.write, {
        uVel: velocity.read.texture,
        uCurl: curl.texture,
        uDt: STEP_SECONDS,
        uTime: time,
        uStirTime: stirTime,
        ...params,
      });
      velocity.swap();
      run(sim.divergence, divergence, {
        uVel: velocity.read.texture,
        uH: cell,
      });
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        run(sim.pressure, pressure.write, {
          uP: pressure.read.texture,
          uDiv: divergence.texture,
          uH: cell,
        });
        pressure.swap();
      }
      run(sim.gradient, velocity.write, {
        uP: pressure.read.texture,
        uVel: velocity.read.texture,
        uH: cell,
      });
      velocity.swap();
      run(sim.advectVelocity, velocity.write, {
        uVel: velocity.read.texture,
        uDt: STEP_SECONDS,
      });
      velocity.swap();
      run(sim.advectMap, map.write, {
        uVel: velocity.read.texture,
        uMap: map.read.texture,
        uDt: STEP_SECONDS,
        uTime: time,
        ...params,
      });
      map.swap();
    },
    draw(white: number, paper: Rgb, time: number): void {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      display.use({
        uSize: canvas.width,
        uRadius: CORNER_RADIUS,
        uPaper: paper,
        uWhite: white,
        uTime: time,
        uPivot: PIVOT,
        uFanLab: fanLab,
        uLines: LINES,
        uMap: map.read.texture,
      });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    release(): void {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

/** Links a full-screen program and returns a setter for its uniforms by name, textures on their own units. */
function createProgram(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): Program | null {
  const program = linkProgram(gl, VERTEX_SOURCE, fragmentSource);
  if (!program) return null;
  const setters: Record<string, (value: never) => void> = {};
  let unit = 0;
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const location = gl.getUniformLocation(program, info.name);
    const name = info.name.replace(/\[0\]$/, '');
    if (info.type === gl.FLOAT)
      setters[name] = (v: number) => gl.uniform1f(location, v);
    else if (info.type === gl.FLOAT_VEC2)
      setters[name] = (v: number[]) => gl.uniform2fv(location, v);
    else if (info.type === gl.FLOAT_VEC3)
      setters[name] = (v: number[]) => gl.uniform3fv(location, v);
    else if (info.type === gl.FLOAT_VEC4)
      setters[name] = (v: number[]) => gl.uniform4fv(location, v);
    else if (info.type === gl.SAMPLER_2D) {
      const textureUnit = unit++;
      setters[name] = (texture: WebGLTexture) => {
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(location, textureUnit);
      };
    }
  }
  return {
    use(uniforms): void {
      gl.useProgram(program);
      for (const name in uniforms) setters[name]?.(uniforms[name] as never);
    },
  };
}

function createTarget(gl: WebGL2RenderingContext): Target | null {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16F,
    GRID,
    GRID,
    0,
    gl.RGBA,
    gl.HALF_FLOAT,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    return null;
  }
  return { texture, framebuffer };
}

/** Two targets to read from and write into, swapped after every pass. */
function createPair(gl: WebGL2RenderingContext) {
  const targets = [createTarget(gl), createTarget(gl)];
  const [first, second] = targets;
  if (!first || !second) return null;
  const pair = [first, second];
  return {
    get read(): Target {
      return pair[0];
    },
    get write(): Target {
      return pair[1];
    },
    swap(): void {
      pair.reverse();
    },
  };
}

function toOklab(hex: string): number[] {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
