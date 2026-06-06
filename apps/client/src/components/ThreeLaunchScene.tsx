import { useEffect, useRef, useState } from 'react';
import type * as THREE_NS from 'three';

type SceneVariant = 'station' | 'login';
type QualityTier = 'high' | 'medium' | 'low';

interface ThreeLaunchSceneProps {
  src: string;
  variant?: SceneVariant;
  active?: boolean;
  className?: string;
}

function getQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'medium';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 768;
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
  const lowCores = navigator.hardwareConcurrency <= 4;

  if (reducedMotion || coarsePointer || narrow || lowMemory || lowCores) return 'low';
  if (navigator.hardwareConcurrency <= 8 || window.innerWidth < 1280) return 'medium';
  return 'high';
}

function getTierConfig(tier: QualityTier) {
  if (tier === 'high') {
    return { dpr: Math.min(window.devicePixelRatio || 1, 1.8), particles: 220, rails: true, frameSkip: 1 };
  }
  if (tier === 'medium') {
    return { dpr: Math.min(window.devicePixelRatio || 1, 1.35), particles: 130, rails: true, frameSkip: 1 };
  }
  return { dpr: 1, particles: 62, rails: false, frameSkip: 2 };
}

export default function ThreeLaunchScene({
  src,
  variant = 'station',
  active = true,
  className = '',
}: ThreeLaunchSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [tier, setTier] = useState<QualityTier>(() => getQualityTier());

  useEffect(() => {
    const handleResizeTier = () => setTier(getQualityTier());
    window.addEventListener('resize', handleResizeTier);
    return () => window.removeEventListener('resize', handleResizeTier);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !active) return;

    let cleanup = () => {};
    let stopped = false;

    void (async () => {
      const THREE = await import('three');
      if (stopped) return;

      const config = getTierConfig(tier);
      const renderer = new THREE.WebGLRenderer({ antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(config.dpr);
      renderer.setClearColor(0x090706, 1);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(variant === 'login' ? 0x140d12 : 0x120d09, tier === 'low' ? 0.06 : 0.045);

      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0.3, 6.6);

      const group = new THREE.Group();
      scene.add(group);

      const clock = new THREE.Clock();
      const loader = new THREE.TextureLoader();
      const disposables: Array<{ dispose: () => void }> = [];
      const animationObjects: THREE_NS.Object3D[] = [];
      let texture: THREE_NS.Texture | null = null;
      let frame = 0;

      const resize = () => {
        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const addPlane = (map: THREE_NS.Texture, z: number, scale: number, opacity: number, x = 0, y = 0) => {
        const material = new THREE.MeshBasicMaterial({
          map,
          transparent: true,
          opacity,
          depthWrite: false,
        });
        const geometry = new THREE.PlaneGeometry(9.6 * scale, 5.4 * scale, 12, 8);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        group.add(mesh);
        disposables.push(material, geometry);
        animationObjects.push(mesh);
        return mesh;
      };

      const addLightVeil = () => {
        const geometry = new THREE.PlaneGeometry(9.5, 5.6, 1, 1);
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: variant === 'login' ? 0.18 : 0.12,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          color: variant === 'login' ? 0xeac0ff : 0xffd58a,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0.05, 1.2);
        group.add(mesh);
        disposables.push(geometry, material);
        animationObjects.push(mesh);
        return mesh;
      };

      const addRails = () => {
        const railMaterial = new THREE.MeshBasicMaterial({
          color: 0xd9b56d,
          transparent: true,
          opacity: 0.34,
          blending: THREE.AdditiveBlending,
        });
        const railGeometry = new THREE.BoxGeometry(0.035, 0.035, 7.2);
        [-0.42, 0.42].forEach((x) => {
          const rail = new THREE.Mesh(railGeometry, railMaterial);
          rail.position.set(x, -1.9, 1.2);
          rail.rotation.x = -0.09;
          rail.rotation.z = x > 0 ? -0.08 : 0.08;
          group.add(rail);
        });

        const tieMaterial = new THREE.MeshBasicMaterial({ color: 0x4b301b, transparent: true, opacity: 0.56 });
        const tieGeometry = new THREE.BoxGeometry(1.25, 0.045, 0.08);
        for (let i = 0; i < 18; i += 1) {
          const tie = new THREE.Mesh(tieGeometry, tieMaterial);
          tie.position.set(0, -1.96, -2 + i * 0.37);
          tie.scale.setScalar(0.72 + i * 0.026);
          group.add(tie);
        }
        disposables.push(railMaterial, railGeometry, tieMaterial, tieGeometry);
      };

      const addParticles = () => {
        const positions = new Float32Array(config.particles * 3);
        for (let i = 0; i < config.particles; i += 1) {
          const index = i * 3;
          positions[index] = (Math.random() - 0.5) * 8.8;
          positions[index + 1] = (Math.random() - 0.5) * 5.2;
          positions[index + 2] = Math.random() * 5.2 - 1.4;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
          color: variant === 'login' ? 0xffd1ec : 0xffdfa2,
          size: tier === 'low' ? 0.026 : 0.034,
          transparent: true,
          opacity: tier === 'low' ? 0.4 : 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const points = new THREE.Points(geometry, material);
        scene.add(points);
        disposables.push(geometry, material);
        animationObjects.push(points);
        return points;
      };

      const texturePromise = new Promise<void>((resolve) => {
        loader.load(
          src,
          (loaded) => {
            if (stopped) {
              loaded.dispose();
              resolve();
              return;
            }
            texture = loaded;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            disposables.push(texture);

            addPlane(texture, -2.7, 1.23, variant === 'login' ? 0.8 : 0.86, 0, 0);
            addPlane(texture, -1.2, 1.08, variant === 'login' ? 0.36 : 0.42, variant === 'login' ? -0.08 : 0.06, 0.04);
            addPlane(texture, 0.2, 0.94, variant === 'login' ? 0.18 : 0.24, variant === 'login' ? 0.12 : -0.08, -0.03);
            addLightVeil();
            if (config.rails && variant === 'station') addRails();
            addParticles();
            resolve();
          },
          undefined,
          () => {
            addLightVeil();
            addParticles();
            resolve();
          },
        );
      });

      const handlePointer = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        pointerRef.current = {
          x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
        };
      };

      const animate = () => {
        if (stopped) return;
        frame += 1;
        requestAnimationFrame(animate);
        if (config.frameSkip > 1 && frame % config.frameSkip !== 0) return;

        const elapsed = clock.getElapsedTime();
        const pointer = pointerRef.current;
        const parallax = tier === 'low' ? 0.04 : 0.09;

        group.rotation.y += (pointer.x * parallax - group.rotation.y) * 0.035;
        group.rotation.x += (-pointer.y * parallax * 0.55 - group.rotation.x) * 0.035;
        group.position.z = Math.sin(elapsed * 0.25) * 0.06;

        animationObjects.forEach((object, index) => {
          if (object instanceof THREE.Points) {
            object.rotation.z = elapsed * 0.018;
            object.position.y = Math.sin(elapsed * 0.34) * 0.08;
            return;
          }
          object.position.x += Math.sin(elapsed * (0.18 + index * 0.02) + index) * 0.0009;
          object.position.y += Math.cos(elapsed * (0.16 + index * 0.015) + index) * 0.0007;
        });

        camera.position.z = 6.45 + Math.sin(elapsed * 0.32) * 0.16;
        camera.position.x += (pointer.x * 0.08 - camera.position.x) * 0.025;
        camera.position.y += (0.3 - pointer.y * 0.045 - camera.position.y) * 0.025;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };

      resize();
      window.addEventListener('resize', resize);
      host.addEventListener('pointermove', handlePointer);
      texturePromise.then(() => {
        if (!stopped) animate();
      });

      cleanup = () => {
        window.removeEventListener('resize', resize);
        host.removeEventListener('pointermove', handlePointer);
        renderer.dispose();
        disposables.forEach((item) => item.dispose());
        scene.clear();
        if (renderer.domElement.parentElement === host) {
          host.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      stopped = true;
      cleanup();
    };
  }, [src, variant, active, tier]);

  return (
    <div className={`absolute inset-0 overflow-hidden bg-[#100d0b] ${className}`} data-quality-tier={tier}>
      <div ref={hostRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(0,0,0,0.16)_42%,rgba(0,0,0,0.68)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background:repeating-linear-gradient(90deg,rgba(255,225,163,0.035)_0_1px,transparent_1px_7px)]" />
    </div>
  );
}
