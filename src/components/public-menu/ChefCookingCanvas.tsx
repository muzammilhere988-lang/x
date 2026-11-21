import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildIntroScene, type IntroSceneId} from './introScenes';

interface ChefCookingCanvasProps {
  sceneId: IntroSceneId;
  backgroundColorHex: string;
  isDarkTheme: boolean;
}

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function ChefCookingCanvas({
  sceneId,
  backgroundColorHex,
  isDarkTheme,
}: ChefCookingCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 300);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear any stale canvas before mounting
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(backgroundColorHex);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.032);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    const updateCameraFraming = (w: number, h: number) => {
      const aspect = Math.max(w / Math.max(h, 1), 0.55);
      camera.aspect = aspect;
      const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const targetZ = Math.max(7.2, 2.75 / (halfTan * aspect));
      camera.position.set(0, 2.35 + (targetZ - 7.2) * 0.2, targetZ);
      camera.lookAt(0, 0.78, 0);
      camera.updateProjectionMatrix();
    };
    updateCameraFraming(width, height);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(
      0xfff7ec,
      isDarkTheme ? 0x2b241e : 0xd5c8b6,
      0.95
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.85);
    keyLight.position.set(3.8, 6.4, 4.8);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 18;
      keyLight.shadow.camera.left = -4.5;
      keyLight.shadow.camera.right = 4.5;
      keyLight.shadow.camera.top = 4.5;
      keyLight.shadow.camera.bottom = -4.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffe0bd, 0.8);
    rimLight.position.set(-4.5, 3.5, -2.5);
    scene.add(rimLight);

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const matFloor = new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x29231e : 0xe8dfd1,
      roughness: 0.85,
      metalness: 0.04,
    });
    const matMat = new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x3b3027 : 0xdccbb5,
      roughness: 0.9,
      metalness: 0.0,
    });

    const floorDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.5, 0.16, 48),
      matFloor
    );
    floorDisc.position.set(0, -0.08, 0);
    floorDisc.receiveShadow = true;
    stageGroup.add(floorDisc);

    const kitchenMat = new THREE.Mesh(
      new THREE.CylinderGeometry(2.55, 2.55, 0.025, 48),
      matMat
    );
    kitchenMat.position.set(0, 0.01, 0);
    kitchenMat.scale.set(1.18, 1, 0.75);
    kitchenMat.receiveShadow = true;
    stageGroup.add(kitchenMat);

    // Mount ONLY the single selected animation scene
    const builtScene = buildIntroScene(sceneId);
    stageGroup.add(builtScene.group);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      updateCameraFraming(w, h);
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();
      builtScene.update(t);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();

      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });

      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [sceneId, backgroundColorHex, isDarkTheme]);

  if (webglFailed) {
    return null;
  }

  return <div ref={containerRef} className="w-full h-full" aria-hidden="true" />;
}
