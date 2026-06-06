import { useEffect, useRef, useState } from 'react';

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float box(vec2 uv, vec2 center, vec2 size) {
    vec2 d = abs(uv - center) - size;
    return 1.0 - smoothstep(0.0, 0.006, max(d.x, d.y));
  }

  float tower(vec2 uv, float x, float base, float width, float height) {
    float body = box(uv, vec2(x, base + height * 0.42), vec2(width, height * 0.42));
    float roof = smoothstep(width, 0.0, abs(uv.x - x) + (uv.y - base - height * 0.84) * 0.45);
    roof *= step(base + height * 0.78, uv.y) * step(uv.y, base + height);
    return max(body, roof);
  }

  float windowLight(vec2 uv, vec2 center, vec2 size, float phase) {
    float flicker = 0.65 + 0.35 * sin(u_time * 1.6 + phase);
    return box(uv, center, size) * flicker;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;

    vec3 top = vec3(0.025, 0.032, 0.070);
    vec3 mid = vec3(0.070, 0.055, 0.090);
    vec3 horizon = vec3(0.145, 0.105, 0.105);
    vec3 color = mix(horizon, mid, smoothstep(0.18, 0.55, uv.y));
    color = mix(color, top, smoothstep(0.55, 1.0, uv.y));

    float moon = smoothstep(0.075, 0.0, distance(uv, vec2(0.78, 0.78)));
    float moonCut = smoothstep(0.075, 0.0, distance(uv, vec2(0.805, 0.795)));
    color += vec3(0.85, 0.74, 0.48) * max(moon - moonCut * 0.82, 0.0);

    vec2 grid = floor(uv * vec2(80.0, 45.0));
    float starSeed = hash(grid);
    float star = step(0.985, starSeed);
    float twinkle = 0.45 + 0.55 * sin(u_time * 1.8 + starSeed * 80.0);
    color += vec3(0.85, 0.76, 0.55) * star * twinkle * smoothstep(0.42, 0.95, uv.y);

    float hill = smoothstep(0.0, 0.018, uv.y - (0.26 + 0.04 * sin((uv.x + 0.08) * 6.0)));
    color = mix(vec3(0.035, 0.045, 0.040), color, hill);

    float castle = 0.0;
    castle = max(castle, box(uv, vec2(0.50, 0.335), vec2(0.205, 0.075)));
    castle = max(castle, box(uv, vec2(0.43, 0.420), vec2(0.070, 0.135)));
    castle = max(castle, box(uv, vec2(0.58, 0.405), vec2(0.078, 0.118)));
    castle = max(castle, tower(uv, 0.31, 0.25, 0.038, 0.34));
    castle = max(castle, tower(uv, 0.70, 0.25, 0.048, 0.41));
    castle = max(castle, tower(uv, 0.52, 0.28, 0.033, 0.48));
    castle = max(castle, tower(uv, 0.62, 0.30, 0.026, 0.30));

    vec3 castleColor = mix(vec3(0.030, 0.025, 0.030), vec3(0.085, 0.072, 0.075), uv.y);
    color = mix(color, castleColor, castle);

    float lights = 0.0;
    lights += windowLight(uv, vec2(0.405, 0.380), vec2(0.008, 0.015), 1.0);
    lights += windowLight(uv, vec2(0.455, 0.420), vec2(0.007, 0.014), 4.0);
    lights += windowLight(uv, vec2(0.520, 0.520), vec2(0.006, 0.016), 7.0);
    lights += windowLight(uv, vec2(0.575, 0.395), vec2(0.008, 0.014), 2.0);
    lights += windowLight(uv, vec2(0.640, 0.390), vec2(0.006, 0.013), 9.0);
    lights += windowLight(uv, vec2(0.700, 0.485), vec2(0.007, 0.017), 12.0);
    color += vec3(0.95, 0.62, 0.18) * lights;

    float lakeMask = 1.0 - smoothstep(0.18, 0.30, uv.y);
    float ripple = sin((uv.x * 34.0) + u_time * 0.45) * sin((uv.y * 85.0) - u_time * 0.7);
    vec3 lake = vec3(0.030, 0.040, 0.055) + vec3(0.06, 0.045, 0.03) * (0.35 + 0.35 * ripple);
    color = mix(color, lake, lakeMask * 0.72);

    vec2 reflectionUv = vec2(uv.x + ripple * 0.008, 0.50 - uv.y * 0.9);
    float reflection = 0.0;
    reflection += windowLight(reflectionUv, vec2(0.405, 0.380), vec2(0.010, 0.010), 1.0);
    reflection += windowLight(reflectionUv, vec2(0.520, 0.520), vec2(0.008, 0.014), 7.0);
    reflection += windowLight(reflectionUv, vec2(0.700, 0.485), vec2(0.010, 0.013), 12.0);
    color += vec3(0.85, 0.50, 0.16) * reflection * lakeMask * 0.55;

    float vignette = smoothstep(0.95, 0.25, distance(uv, vec2(0.5, 0.50)));
    color *= 0.62 + 0.38 * vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface HogwartsAcademyBackgroundProps {
  className?: string;
}

export default function HogwartsAcademyBackground({
  className = 'fixed inset-0 -z-10',
}: HogwartsAcademyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      setWebglFailed(true);
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    if (!vertexShader || !fragmentShader || !program) {
      setWebglFailed(true);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglFailed(true);
      return;
    }

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    let frame = 0;
    const startedAt = performance.now();

    const render = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.floor(width * dpr);
      const displayHeight = Math.floor(height * dpr);
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (performance.now() - startedAt) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      frame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <div className={`${className} overflow-hidden bg-[#121013]`} aria-hidden="true">
      {!webglFailed && <canvas ref={canvasRef} className="h-full w-full" />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(197,160,89,0.15),transparent_34%),linear-gradient(90deg,rgba(18,16,19,0.55),transparent_26%,transparent_72%,rgba(18,16,19,0.55))]" />
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />
    </div>
  );
}
