import type { Action } from 'svelte/action';
import {
  bindFullScreenTriangle,
  linkProgram,
  observeDevicePixels,
  resizeToDevicePixels,
  toRgb,
  type Rgb,
} from '$lib/domains/shared/utils/webgl-canvas';

type StageShaderOptions = {
  onReady: (ready: boolean) => void;
};

type StageRenderer = {
  draw: (page: Rgb, ink: Rgb) => void;
  release: () => void;
};

export const stageShader: Action<HTMLCanvasElement, StageShaderOptions> = (
  canvas,
  options,
) => {
  let current = options;
  let renderer = createRenderer(canvas);
  const observer = new ResizeObserver(([entry]) => {
    resizeToDevicePixels(canvas, entry);
    paint();
  });

  observeDevicePixels(observer, canvas);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  function paint(): void {
    if (!renderer || canvas.width === 0 || canvas.height === 0) return;
    const style = getComputedStyle(canvas);
    renderer.draw(
      toRgb(style.getPropertyValue('--color-base-300')),
      toRgb(style.getPropertyValue('--color-base-content')),
    );
    current.onReady(true);
  }

  function onContextLost(event: Event): void {
    event.preventDefault();
    renderer = null;
    current.onReady(false);
  }

  function onContextRestored(): void {
    renderer = createRenderer(canvas);
    paint();
  }

  return {
    update(next: StageShaderOptions): void {
      current = next;
    },
    destroy(): void {
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      renderer?.release();
    },
  };
};

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

  vec3 floorTone = mix(page, ink, 0.1125);
  vec3 colour = mix(page, floorTone, softClamp((uv.y - 0.08) / 0.92, 0.2));

  float spotDistance = length((uv - vec2(0.5, 1.0)) / vec2(0.56, 0.70));
  colour = mix(colour, ink, 0.1875 * softClamp(1.0 - spotDistance, 0.3));
  colour += (ink - page) * 0.0186;

  colour = mix(page, colour, softClamp(uv.y / 0.4, 0.3));

  float dither = whiteNoise(gl_FragCoord.xy) + whiteNoise(gl_FragCoord.xy + 71.37) - 1.0;
  gl_FragColor = vec4(colour + dither / 255.0, 1.0);
}
`;

function createRenderer(canvas: HTMLCanvasElement): StageRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const program = linkProgram(gl, VERTEX_SOURCE, FRAGMENT_SOURCE);
  if (!program) return null;

  gl.useProgram(program);
  bindFullScreenTriangle(gl, gl.getAttribLocation(program, 'position'));

  const size = gl.getUniformLocation(program, 'size');
  const page = gl.getUniformLocation(program, 'page');
  const ink = gl.getUniformLocation(program, 'ink');

  return {
    draw(pageColour: Rgb, inkColour: Rgb): void {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(size, canvas.width, canvas.height);
      gl.uniform3fv(page, pageColour);
      gl.uniform3fv(ink, inkColour);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    release(): void {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
