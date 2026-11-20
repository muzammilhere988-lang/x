import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

interface ChefCookingCanvasProps {
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

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(backgroundColorHex);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.045);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(0.4, 2.55, 6.1);
    camera.lookAt(0, 1.15, 0);

    // Studio environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Lighting Rig
    const hemiLight = new THREE.HemisphereLight(
      0xfff6ea,
      isDarkTheme ? 0x2a231e : 0xd6cab8,
      0.85
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dd, 1.9);
    keyLight.position.set(3.5, 6, 4.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 18;
      keyLight.shadow.camera.left = -3.5;
      keyLight.shadow.camera.right = 3.5;
      keyLight.shadow.camera.top = 3.5;
      keyLight.shadow.camera.bottom = -3.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffe2c2, 0.85);
    rimLight.position.set(-4, 3.5, -3);
    scene.add(rimLight);

    const stoveGlow = new THREE.PointLight(0xff6b2b, 1.6, 4.5, 2);
    stoveGlow.position.set(0.45, 0.95, 0.95);
    scene.add(stoveGlow);

    // Materials (varied roughness & metalness across adjacent parts)
    const matSkin = new THREE.MeshStandardMaterial({
      color: 0xf6c39c,
      roughness: 0.62,
      metalness: 0.02,
    });
    const matCheek = new THREE.MeshStandardMaterial({
      color: 0xe88d7c,
      roughness: 0.7,
      metalness: 0.0,
    });
    const matJacket = new THREE.MeshStandardMaterial({
      color: 0xfbf9f5,
      roughness: 0.78,
      metalness: 0.02,
    });
    const matHat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.0,
    });
    const matScarf = new THREE.MeshStandardMaterial({
      color: 0xc93b2b,
      roughness: 0.68,
      metalness: 0.04,
    });
    const matHairDark = new THREE.MeshStandardMaterial({
      color: 0x2d211b,
      roughness: 0.55,
      metalness: 0.05,
    });
    const matEyeWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.0,
    });
    const matEyePupil = new THREE.MeshStandardMaterial({
      color: 0x1a1512,
      roughness: 0.15,
      metalness: 0.1,
    });
    const matButton = new THREE.MeshStandardMaterial({
      color: 0x3b332d,
      roughness: 0.35,
      metalness: 0.4,
    });
    const matCounter = new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x2a241f : 0xe5dccf,
      roughness: 0.8,
      metalness: 0.05,
    });
    const matStove = new THREE.MeshStandardMaterial({
      color: 0x2b2928,
      roughness: 0.42,
      metalness: 0.65,
    });
    const matBurner = new THREE.MeshStandardMaterial({
      color: 0xff6224,
      emissive: 0xff4d12,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.1,
    });
    const matPan = new THREE.MeshStandardMaterial({
      color: 0x222224,
      roughness: 0.38,
      metalness: 0.78,
    });
    const matWood = new THREE.MeshStandardMaterial({
      color: 0x9b643b,
      roughness: 0.72,
      metalness: 0.02,
    });
    const matFoodGolden = new THREE.MeshStandardMaterial({
      color: 0xe6a135,
      roughness: 0.68,
      metalness: 0.02,
    });
    const matFoodTomato = new THREE.MeshStandardMaterial({
      color: 0xd93829,
      roughness: 0.4,
      metalness: 0.05,
    });
    const matFoodHerb = new THREE.MeshStandardMaterial({
      color: 0x4b8f42,
      roughness: 0.65,
      metalness: 0.02,
    });
    const matSteam = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.95,
      depthWrite: false,
    });

    // Ground & Contact Shadow
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const floorDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.5, 0.16, 48),
      matCounter
    );
    floorDisc.position.set(0, -0.08, 0);
    floorDisc.receiveShadow = true;
    stageGroup.add(floorDisc);

    // Kitchen Counter + Stove in front of chef
    const stoveGroup = new THREE.Group();
    stoveGroup.position.set(0.32, 0, 0.88);
    stageGroup.add(stoveGroup);

    const stoveBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.72, 0.78),
      matStove
    );
    stoveBase.position.set(0, 0.36, 0);
    stoveBase.castShadow = true;
    stoveBase.receiveShadow = true;
    stoveGroup.add(stoveBase);

    const burnerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.032, 12, 32),
      matBurner
    );
    burnerRing.rotation.x = Math.PI / 2;
    burnerRing.position.set(0, 0.735, 0);
    stoveGroup.add(burnerRing);

    // Chef Character Root (pivoted at ground y = 0)
    const chefGroup = new THREE.Group();
    chefGroup.position.set(-0.22, 0, -0.1);
    chefGroup.rotation.y = 0.25;
    stageGroup.add(chefGroup);

    // Torso (Double-breasted chef jacket)
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.52, 1.05, 28),
      matJacket
    );
    torso.position.set(0, 0.72, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    chefGroup.add(torso);

    // Jacket hem & buttons
    const buttonGeo = new THREE.SphereGeometry(0.042, 12, 12);
    [-0.12, 0.12].forEach((bx) => {
      [0.52, 0.72, 0.92].forEach((by) => {
        const btn = new THREE.Mesh(buttonGeo, matButton);
        btn.position.set(bx, by, 0.43);
        btn.scale.set(1, 1, 0.55);
        chefGroup.add(btn);
      });
    });

    // Red Neckerchief
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.075, 14, 28),
      matScarf
    );
    scarf.rotation.x = Math.PI / 2 + 0.12;
    scarf.position.set(0, 1.24, 0.02);
    scarf.castShadow = true;
    chefGroup.add(scarf);

    const scarfKnot = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.24, 14),
      matScarf
    );
    scarfKnot.position.set(0.08, 1.12, 0.36);
    scarfKnot.rotation.z = -0.3;
    scarfKnot.rotation.x = -0.2;
    chefGroup.add(scarfKnot);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.62, 0.04);
    chefGroup.add(headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.41, 32, 28), matSkin);
    head.scale.set(1.03, 0.96, 0.98);
    head.castShadow = true;
    headGroup.add(head);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.095, 16, 16);
    [-0.41, 0.41].forEach((ex) => {
      const ear = new THREE.Mesh(earGeo, matSkin);
      ear.position.set(ex, -0.02, -0.02);
      ear.scale.set(0.55, 0.95, 0.75);
      headGroup.add(ear);
    });

    // Rosy Cheeks
    const cheekGeo = new THREE.SphereGeometry(0.075, 16, 16);
    [-0.22, 0.22].forEach((cx) => {
      const cheek = new THREE.Mesh(cheekGeo, matCheek);
      cheek.position.set(cx, -0.08, 0.34);
      cheek.scale.set(1.15, 0.75, 0.45);
      headGroup.add(cheek);
    });

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 20), matSkin);
    nose.position.set(0, -0.02, 0.41);
    nose.scale.set(1.05, 0.9, 1.1);
    headGroup.add(nose);

    // Expressive Cartoon Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.068, 16, 16);
    const pupilGeo = new THREE.SphereGeometry(0.038, 14, 14);
    [-0.145, 0.145].forEach((ex) => {
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, matEyeWhite);
      eyeWhite.position.set(ex, 0.07, 0.355);
      eyeWhite.scale.set(0.95, 1.15, 0.55);
      headGroup.add(eyeWhite);

      const pupil = new THREE.Mesh(pupilGeo, matEyePupil);
      pupil.position.set(ex, 0.07, 0.382);
      pupil.scale.set(1, 1.1, 0.5);
      headGroup.add(pupil);

      const brow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.022, 0.09, 6, 10),
        matHairDark
      );
      brow.rotation.z = ex < 0 ? 1.42 : -1.42;
      brow.position.set(ex, 0.175, 0.355);
      headGroup.add(brow);
    });

    // Curled Chef Mustache (two symmetric curved lobes)
    [-1, 1].forEach((side) => {
      const mustacheHalf = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.048, 0.13, 8, 12),
        matHairDark
      );
      mustacheHalf.position.set(side * 0.1, -0.11, 0.38);
      mustacheHalf.rotation.z = side * 1.18;
      mustacheHalf.rotation.y = side * 0.22;
      headGroup.add(mustacheHalf);
    });

    // Iconic Pleated Chef Toque (Hat)
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.32, -0.02);
    hatGroup.rotation.x = -0.08;
    headGroup.add(hatGroup);

    const hatBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.34, 0.24, 28),
      matHat
    );
    hatBand.position.set(0, 0.1, 0);
    hatBand.castShadow = true;
    hatGroup.add(hatBand);

    const hatCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 20),
      matHat
    );
    hatCrown.position.set(0, 0.36, 0);
    hatCrown.scale.set(1.05, 0.85, 1.05);
    hatCrown.castShadow = true;
    hatGroup.add(hatCrown);

    // Puffy toque lobes around top crown
    const puffGeo = new THREE.SphereGeometry(0.2, 16, 16);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const puff = new THREE.Mesh(puffGeo, matHat);
      puff.position.set(Math.cos(angle) * 0.24, 0.34, Math.sin(angle) * 0.24);
      puff.castShadow = true;
      hatGroup.add(puff);
    }

    // Right Arm + Frying Pan Pivot (Animated cooking hand)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.45, 1.05, 0.12);
    chefGroup.add(rightArmPivot);

    const rightArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.11, 0.38, 8, 14),
      matJacket
    );
    rightArm.position.set(0.12, -0.14, 0.18);
    rightArm.rotation.x = 1.05;
    rightArm.rotation.z = -0.35;
    rightArm.castShadow = true;
    rightArmPivot.add(rightArm);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), matSkin);
    rightHand.position.set(0.22, -0.26, 0.42);
    rightArmPivot.add(rightHand);

    // Frying Pan attached to Right Hand
    const panGroup = new THREE.Group();
    panGroup.position.set(0.22, -0.24, 0.46);
    rightArmPivot.add(panGroup);

    const panHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.04, 0.42, 12),
      matWood
    );
    panHandle.rotation.x = Math.PI / 2;
    panHandle.position.set(0, 0, 0.18);
    panHandle.castShadow = true;
    panGroup.add(panHandle);

    const panRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.3, 0.11, 28),
      matPan
    );
    panRim.position.set(0, 0.01, 0.56);
    panRim.castShadow = true;
    panGroup.add(panRim);

    const panInterior = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.28, 0.03, 24),
      matPan
    );
    panInterior.position.set(0, 0.055, 0.56);
    panGroup.add(panInterior);

    // Left Arm + Wooden Spoon
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.46, 1.04, 0.08);
    chefGroup.add(leftArmPivot);

    const leftArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.11, 0.36, 8, 14),
      matJacket
    );
    leftArm.position.set(-0.14, -0.16, 0.12);
    leftArm.rotation.x = 0.65;
    leftArm.rotation.z = 0.45;
    leftArm.castShadow = true;
    leftArmPivot.add(leftArm);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 16), matSkin);
    leftHand.position.set(-0.26, -0.26, 0.28);
    leftArmPivot.add(leftHand);

    const spoonHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.022, 0.52, 10),
      matWood
    );
    spoonHandle.position.set(-0.26, -0.12, 0.38);
    spoonHandle.rotation.x = 0.7;
    spoonHandle.rotation.z = 0.2;
    leftArmPivot.add(spoonHandle);

    const spoonHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 14, 14),
      matWood
    );
    spoonHead.scale.set(0.85, 1.25, 0.35);
    spoonHead.position.set(-0.31, 0.07, 0.54);
    spoonHead.rotation.x = 0.7;
    leftArmPivot.add(spoonHead);

    // Food items tossed inside the pan (world-space group positioned above burner)
    const foodGroup = new THREE.Group();
    foodGroup.position.set(0.32, 0.94, 0.88);
    stageGroup.add(foodGroup);

    const pancake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.06, 22),
      matFoodGolden
    );
    pancake.castShadow = true;
    foodGroup.add(pancake);

    const tomato1 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), matFoodTomato);
    tomato1.position.set(0.11, 0.06, 0.05);
    foodGroup.add(tomato1);

    const tomato2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 14), matFoodTomato);
    tomato2.position.set(-0.1, 0.05, -0.06);
    foodGroup.add(tomato2);

    const herb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.015, 0.05), matFoodHerb);
    herb.position.set(0.01, 0.06, -0.03);
    foodGroup.add(herb);

    // Steam Puffs rising smoothly above the sizzling pan
    const steamPuffs: {mesh: THREE.Mesh; offset: number; driftX: number; driftZ: number}[] = [];
    const steamGeo = new THREE.SphereGeometry(0.09, 12, 12);
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(steamGeo, matSteam.clone());
      puff.position.set(0.32, 1.05, 0.88);
      stageGroup.add(puff);
      steamPuffs.push({
        mesh: puff,
        offset: i / 6,
        driftX: (i % 2 === 0 ? 1 : -1) * (0.06 + i * 0.015),
        driftZ: ((i % 3) - 1) * 0.05,
      });
    }

    // Compile shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // ResizeObserver for crisp layout
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation loop
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

      // Gentle chef bounce and cheerful head nod
      chefGroup.position.y = Math.abs(Math.sin(t * 2.8)) * 0.04;
      headGroup.rotation.z = Math.sin(t * 1.5) * 0.05;
      headGroup.rotation.y = Math.sin(t * 1.0) * 0.15;
      hatGroup.rotation.z = Math.sin(t * 2.8 - 0.5) * 0.04;

      // Rhythmic pan flip cycle (~1.9s per toss)
      const cycle = (t * 0.52) % 1;
      // Pan flicks upward during [0.0, 0.25]
      const panFlick =
        cycle < 0.25
          ? Math.sin((cycle / 0.25) * Math.PI)
          : -Math.sin(t * 3.8) * 0.06;
      rightArmPivot.rotation.x = -0.25 * panFlick;
      panGroup.rotation.x = -0.35 * panFlick;

      // Left arm cheers / stirs gently
      leftArmPivot.rotation.x = Math.sin(t * 2.8) * 0.16;
      leftArmPivot.rotation.z = Math.cos(t * 1.5) * 0.08;

      // Food toss parabolic arc synced with pan flick
      if (cycle < 0.72) {
        const arc = cycle / 0.72;
        const heightOffset = Math.sin(arc * Math.PI) * 0.78;
        foodGroup.position.y = 0.92 + heightOffset;
        pancake.rotation.x = arc * Math.PI * 2;
        tomato1.position.y = 0.06 + Math.sin(arc * Math.PI) * 0.16;
        tomato2.position.y = 0.05 + Math.sin(arc * Math.PI) * 0.22;
      } else {
        foodGroup.position.y = 0.92;
        pancake.rotation.x = 0;
        tomato1.position.y = 0.06;
        tomato2.position.y = 0.05;
      }

      // Stove glow subtle flicker
      stoveGlow.intensity = 1.45 + Math.sin(t * 8) * 0.2;

      // Steam puffs rising and fading smoothly
      for (const puff of steamPuffs) {
        const phase = (t * 0.38 + puff.offset) % 1;
        puff.mesh.position.set(
          0.32 + puff.driftX * phase * 2.2,
          1.05 + phase * 1.05,
          0.88 + puff.driftZ * phase * 2.2
        );
        const s = 0.65 + phase * 1.15;
        puff.mesh.scale.set(s, s, s);
        const mat = puff.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.sin(phase * Math.PI) * 0.42;
      }

      // Gentle camera showcase sway
      stageGroup.rotation.y = Math.sin(t * 0.5) * 0.18;

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
  }, [backgroundColorHex, isDarkTheme]);

  if (webglFailed) {
    return null;
  }

  return <div ref={containerRef} className="w-full h-full" aria-hidden="true" />;
}
