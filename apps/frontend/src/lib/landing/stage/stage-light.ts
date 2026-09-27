import type { Action } from 'svelte/action';
import {
  bindFullScreenTriangle,
  linkProgram,
  observeDevicePixels,
  resizeToDevicePixels,
  toRgb,
  type Rgb,
} from '$lib/domains/shared/utils/webgl-canvas';

type Point = [number, number];

export type StageLighting = {
  spot: Point;
  spread: Point;
  floorFrom: Point;
  floorTo: Point;
  fadeTop: boolean;
};

type StageLightOptions = {
  lighting: StageLighting;
  onReady: (ready: boolean) => void;
};

type Renderer = {
  source: HTMLCanvasElement;
  draw: (
    width: number,
    height: number,
    lighting: StageLighting,
    page: Rgb,
    ink: Rgb,
  ) => void;
};

const repaints = new Set<() => void>();
let renderer: Renderer | null = null;
let unavailable = false;

export const stageLight: Action<HTMLCanvasElement, StageLightOptions> = (
  canvas,
  options,
) => {
  let current = options;
  const observer = new ResizeObserver(([entry]) => {
    resizeToDevicePixels(canvas, entry);
    paint();
  });

  observeDevicePixels(observer, canvas);
  repaints.add(paint);

  function paint(): void {
    if (canvas.width === 0 || canvas.height === 0) return;

    const shared = sharedRenderer();
    const target = canvas.getContext('2d');

    if (!shared || !target) {
      current.onReady(false);
      return;
    }

    const style = getComputedStyle(canvas);
    shared.draw(
      canvas.width,
      canvas.height,
      current.lighting,
      toRgb(style.getPropertyValue('--color-surface-root')),
      toRgb(style.getPropertyValue('--color-fg-default')),
    );
    target.drawImage(shared.source, 0, 0);
    current.onReady(true);
  }

  return {
    update(next: StageLightOptions): void {
      current = next;
      paint();
    },
    destroy(): void {
      observer.disconnect();
      repaints.delete(paint);
    },
  };
};

function sharedRenderer(): Renderer | null {
  if (renderer || unavailable) return renderer;

  const source = document.createElement('canvas');
  source.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer = null;
  });
  source.addEventListener('webglcontextrestored', () => {
    renderer = createRenderer(source);
    repaints.forEach((repaint) => repaint());
  });

  renderer = createRenderer(source);
  unavailable = renderer === null;

  return renderer;
}

const VERTEX_SOURCE = `
attribute vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SOURCE = `
precision highp float;

uniform vec2 size;
uniform vec3 page;
uniform vec3 ink;
uniform vec2 spot;
uniform vec2 spread;
uniform vec2 floorFrom;
uniform vec2 floorTo;
uniform float fadeTop;

float softClamp(float x, float knee) {
  float half_knee = knee * 0.5;
  if (x <= -half_knee) return 0.0;
  if (x < half_knee) return (x + half_knee) * (x + half_knee) / (2.0 * knee);
  if (x <= 1.0 - half_knee) return x;
  if (x < 1.0 + half_knee) return 1.0 - (1.0 + half_knee - x) * (1.0 + half_knee - x) / (2.0 * knee);
  return 1.0;
}

float whiteNoise(vec2 point) {
  vec3 p = fract(vec3(point.xyx) * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x / size.x, 1.0 - gl_FragCoord.y / size.y);

  vec2 axis = floorTo - floorFrom;
  float floorPosition = dot(uv - floorFrom, axis) / dot(axis, axis);

  vec3 floorTone = mix(page, ink, 0.1125);
  vec3 colour = mix(page, floorTone, softClamp(floorPosition, 0.2));

  float spotDistance = length((uv - spot) / spread);
  colour = mix(colour, ink, 0.1875 * softClamp(1.0 - spotDistance, 0.3));
  colour += (ink - page) * 0.0186;

  colour = mix(colour, mix(page, colour, softClamp(uv.y / 0.4, 0.3)), fadeTop);

  float dither = whiteNoise(gl_FragCoord.xy) + whiteNoise(gl_FragCoord.xy + 71.37) - 1.0;
  gl_FragColor = vec4(colour + dither / 255.0, 1.0);
}
`;

function createRenderer(source: HTMLCanvasElement): Renderer | null {
  const gl = source.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const program = linkProgram(gl, VERTEX_SOURCE, FRAGMENT_SOURCE);
  if (!program) return null;

  gl.useProgram(program);
  bindFullScreenTriangle(gl, gl.getAttribLocation(program, 'position'));

  const uniform = (name: string): WebGLUniformLocation | null =>
    gl.getUniformLocation(program, name);
  const size = uniform('size');
  const page = uniform('page');
  const ink = uniform('ink');
  const spot = uniform('spot');
  const spread = uniform('spread');
  const floorFrom = uniform('floorFrom');
  const floorTo = uniform('floorTo');
  const fadeTop = uniform('fadeTop');

  return {
    source,
    draw(width, height, lighting, pageColour, inkColour): void {
      if (source.width !== width) source.width = width;
      if (source.height !== height) source.height = height;

      gl.viewport(0, 0, width, height);
      gl.uniform2f(size, width, height);
      gl.uniform3fv(page, pageColour);
      gl.uniform3fv(ink, inkColour);
      gl.uniform2fv(spot, lighting.spot);
      gl.uniform2fv(spread, lighting.spread);
      gl.uniform2fv(floorFrom, lighting.floorFrom);
      gl.uniform2fv(floorTo, lighting.floorTo);
      gl.uniform1f(fadeTop, lighting.fadeTop ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
