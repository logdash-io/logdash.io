// Helpers shared by the canvases drawn with a fragment shader (the hero stage, the logo ripple).

export type Rgb = [number, number, number];

type Gl = WebGLRenderingContext | WebGL2RenderingContext;

export function linkProgram(
  gl: Gl,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
}

function compileShader(
  gl: Gl,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
  return shader;
}

/** One triangle that covers the whole viewport, fed to attribute 0. */
export function bindFullScreenTriangle(gl: Gl, location: number): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
}

export function observeDevicePixels(
  observer: ResizeObserver,
  canvas: HTMLCanvasElement,
): void {
  try {
    observer.observe(canvas, { box: 'device-pixel-content-box' });
  } catch {
    observer.observe(canvas);
  }
}

export function resizeToDevicePixels(
  canvas: HTMLCanvasElement,
  entry: ResizeObserverEntry,
): void {
  const width = Math.round(entry.contentRect.width * devicePixelRatio);
  const height = Math.round(entry.contentRect.height * devicePixelRatio);
  const devicePixels = entry.devicePixelContentBoxSize?.[0];
  const isExact =
    devicePixels !== undefined &&
    Math.abs(devicePixels.inlineSize - width) <= 2 &&
    Math.abs(devicePixels.blockSize - height) <= 2;
  canvas.width = isExact ? devicePixels.inlineSize : width;
  canvas.height = isExact ? devicePixels.blockSize : height;
}

let colourProbe: CanvasRenderingContext2D | null = null;

/** Any CSS colour as sRGB channels in 0..1. */
export function toRgb(colour: string): Rgb {
  colourProbe ??= document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  if (!colourProbe) return [0, 0, 0];
  colourProbe.clearRect(0, 0, 1, 1);
  colourProbe.fillStyle = colour.trim();
  colourProbe.fillRect(0, 0, 1, 1);
  const [red, green, blue] = colourProbe.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
}
