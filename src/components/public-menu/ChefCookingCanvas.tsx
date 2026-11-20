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
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.032);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    const updateCameraFraming = (w: number, h: number) => {
      const aspect = Math.max(w / Math.max(h, 1), 0.55);
      camera.aspect = aspect;
      const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const targetZ = Math.max(7.2, 2.75 / (halfTan * aspect));
      camera.position.set(0, 2.35 + (targetZ - 7.2) * 0.2, targetZ);
      camera.lookAt(0, 0.72, 0);
      camera.updateProjectionMatrix();
    };
    updateCameraFraming(width, height);

    // Studio environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Lighting Rig
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

    // Materials
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

    // Tom (Chef Cat in Cook Dress) Materials
    const matTomFur = new THREE.MeshStandardMaterial({
      color: 0x5c7089,
      roughness: 0.68,
      metalness: 0.04,
    });
    const matTomCream = new THREE.MeshStandardMaterial({
      color: 0xf4f0e8,
      roughness: 0.72,
      metalness: 0.02,
    });
    const matChefWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.76,
      metalness: 0.02,
    });
    const matDressTrim = new THREE.MeshStandardMaterial({
      color: 0xd9382e,
      roughness: 0.62,
      metalness: 0.04,
    });
    const matPink = new THREE.MeshStandardMaterial({
      color: 0xe68491,
      roughness: 0.58,
      metalness: 0.02,
    });
    const matEyeYellow = new THREE.MeshStandardMaterial({
      color: 0xf7e371,
      roughness: 0.25,
      metalness: 0.05,
    });
    const matWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.0,
    });
    const matDark = new THREE.MeshStandardMaterial({
      color: 0x1b1715,
      roughness: 0.25,
      metalness: 0.1,
    });
    const matPan = new THREE.MeshStandardMaterial({
      color: 0x262629,
      roughness: 0.35,
      metalness: 0.78,
    });
    const matWood = new THREE.MeshStandardMaterial({
      color: 0x9b6339,
      roughness: 0.72,
      metalness: 0.02,
    });

    // Jerry (Dodging Mouse) & Food Materials
    const matJerryFur = new THREE.MeshStandardMaterial({
      color: 0xa66537,
      roughness: 0.68,
      metalness: 0.02,
    });
    const matJerryTan = new THREE.MeshStandardMaterial({
      color: 0xebbd92,
      roughness: 0.74,
      metalness: 0.0,
    });
    const matCheese = new THREE.MeshStandardMaterial({
      color: 0xf5c23b,
      roughness: 0.55,
      metalness: 0.02,
    });
    const matCheeseHole = new THREE.MeshStandardMaterial({
      color: 0xd99b1e,
      roughness: 0.7,
      metalness: 0.0,
    });
    const matBun = new THREE.MeshStandardMaterial({
      color: 0xd88b3a,
      roughness: 0.68,
      metalness: 0.0,
    });
    const matPatty = new THREE.MeshStandardMaterial({
      color: 0x61311c,
      roughness: 0.8,
      metalness: 0.0,
    });
    const matLettuce = new THREE.MeshStandardMaterial({
      color: 0x52a846,
      roughness: 0.6,
      metalness: 0.0,
    });
    const matPlate = new THREE.MeshStandardMaterial({
      color: 0xfaf7f2,
      roughness: 0.24,
      metalness: 0.1,
    });
    const matTableCloth = new THREE.MeshStandardMaterial({
      color: 0xc93b32,
      roughness: 0.85,
      metalness: 0.0,
    });
    const matDust = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.48,
      roughness: 0.95,
      depthWrite: false,
    });

    // Stage Group
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

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

    // =========================================================================
    // CENTER SNACK TABLE (Tom & Jerry chase in a loop around this kitchen table!)
    // =========================================================================
    const centerTable = new THREE.Group();
    centerTable.position.set(0, 0.02, 0);
    stageGroup.add(centerTable);

    const tablePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 0.56, 16),
      matWood
    );
    tablePedestal.position.y = 0.28;
    tablePedestal.castShadow = true;
    centerTable.add(tablePedestal);

    const tableBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 0.06, 22),
      matWood
    );
    tableBase.position.y = 0.03;
    tableBase.receiveShadow = true;
    centerTable.add(tableBase);

    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, 0.055, 32),
      matTableCloth
    );
    tableTop.position.y = 0.58;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    centerTable.add(tableTop);

    const tableNapkin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.06, 28),
      matWhite
    );
    tableNapkin.position.y = 0.582;
    centerTable.add(tableNapkin);

    // Plate with a juicy burger on top of the center table
    const centerPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.2, 0.035, 24),
      matPlate
    );
    centerPlate.position.set(0, 0.63, 0);
    centerTable.add(centerPlate);

    const bBun = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.055, 20), matBun);
    bBun.position.y = 0.67;
    centerTable.add(bBun);

    const bPatty = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.045, 20), matPatty);
    bPatty.position.y = 0.715;
    centerTable.add(bPatty);

    const bLettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.025, 16), matLettuce);
    bLettuce.position.y = 0.745;
    centerTable.add(bLettuce);

    const bTopBun = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      matBun
    );
    bTopBun.position.y = 0.76;
    bTopBun.castShadow = true;
    centerTable.add(bTopBun);

    // =========================================================================
    // 1. TOM (Chef Cook Dress + Hat, running fast & swinging pan to beat Jerry!)
    // =========================================================================
    const tomRoot = new THREE.Group();
    stageGroup.add(tomRoot);

    const tomBodyTilt = new THREE.Group();
    tomBodyTilt.position.set(0, 0.56, 0);
    tomBodyTilt.rotation.x = 0.34;
    tomRoot.add(tomBodyTilt);

    // Cook dress bodice + flared skirt + red trim + waist sash bow
    const tomDressBodice = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.3, 0.52, 24),
      matChefWhite
    );
    tomDressBodice.position.set(0, 0.39, 0);
    tomDressBodice.castShadow = true;
    tomBodyTilt.add(tomDressBodice);

    const tomDressSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.53, 0.48, 28),
      matChefWhite
    );
    tomDressSkirt.position.set(0, -0.05, 0);
    tomDressSkirt.castShadow = true;
    tomBodyTilt.add(tomDressSkirt);

    const tomDressHem = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.035, 10, 32),
      matDressTrim
    );
    tomDressHem.rotation.x = Math.PI / 2;
    tomDressHem.position.set(0, -0.28, 0);
    tomBodyTilt.add(tomDressHem);

    const tomWaistSash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.315, 0.325, 0.09, 24),
      matDressTrim
    );
    tomWaistSash.position.set(0, 0.17, 0);
    tomBodyTilt.add(tomWaistSash);

    const bowLeft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 12), matDressTrim);
    bowLeft.position.set(-0.085, 0.17, -0.34);
    bowLeft.rotation.z = Math.PI / 2 - 0.25;
    tomBodyTilt.add(bowLeft);

    const bowRight = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 12), matDressTrim);
    bowRight.position.set(0.085, 0.17, -0.34);
    bowRight.rotation.z = -Math.PI / 2 + 0.25;
    tomBodyTilt.add(bowRight);

    const btnGeo = new THREE.SphereGeometry(0.028, 10, 10);
    [-0.07, 0.07].forEach((bx) => {
      [0.28, 0.43, 0.57].forEach((by) => {
        const btn = new THREE.Mesh(btnGeo, matDark);
        btn.position.set(bx, by, 0.28);
        btn.scale.set(1, 1, 0.5);
        tomBodyTilt.add(btn);
      });
    });

    const tomScarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.052, 12, 24),
      matDressTrim
    );
    tomScarf.rotation.x = Math.PI / 2 + 0.12;
    tomScarf.position.set(0, 0.65, 0.02);
    tomBodyTilt.add(tomScarf);

    // Tom Head
    const tomHeadGroup = new THREE.Group();
    tomHeadGroup.position.set(0, 0.94, 0.05);
    tomBodyTilt.add(tomHeadGroup);

    const tomHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 28, 24),
      matTomFur
    );
    tomHead.scale.set(1.06, 0.96, 1.0);
    tomHead.castShadow = true;
    tomHeadGroup.add(tomHead);

    [-0.09, 0.09].forEach((mx) => {
      const muzzle = new THREE.Mesh(
        new THREE.SphereGeometry(0.135, 18, 16),
        matTomCream
      );
      muzzle.position.set(mx, -0.07, 0.25);
      muzzle.scale.set(1.08, 0.85, 0.85);
      tomHeadGroup.add(muzzle);
    });

    const tomOpenMouth = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 14, 14),
      matPink
    );
    tomOpenMouth.position.set(0, -0.145, 0.26);
    tomOpenMouth.scale.set(1.15, 0.95, 0.6);
    tomHeadGroup.add(tomOpenMouth);

    const tomNose = new THREE.Mesh(
      new THREE.SphereGeometry(0.058, 14, 14),
      matPink
    );
    tomNose.position.set(0, -0.01, 0.36);
    tomNose.scale.set(1.2, 0.85, 0.9);
    tomHeadGroup.add(tomNose);

    [-1, 1].forEach((side) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.21, 0.25, -0.02);
      earGroup.rotation.z = -side * 0.32;
      tomHeadGroup.add(earGroup);

      const outerEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.105, 0.25, 16),
        matTomFur
      );
      outerEar.castShadow = true;
      earGroup.add(outerEar);

      const innerEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.17, 12),
        matPink
      );
      innerEar.position.set(0, -0.02, 0.036);
      earGroup.add(innerEar);
    });

    // Angry/Determined Cartoon Chase Eyes
    [-0.11, 0.11].forEach((ex) => {
      const eyeBg = new THREE.Mesh(
        new THREE.SphereGeometry(0.084, 16, 16),
        matEyeYellow
      );
      eyeBg.position.set(ex, 0.08, 0.265);
      eyeBg.scale.set(0.9, 1.25, 0.55);
      tomHeadGroup.add(eyeBg);

      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 12, 12),
        matDark
      );
      pupil.position.set(ex, 0.075, 0.302);
      pupil.scale.set(0.85, 1.2, 0.5);
      tomHeadGroup.add(pupil);

      const brow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.022, 0.09, 6, 8),
        matDark
      );
      brow.position.set(ex, 0.195, 0.275);
      brow.rotation.z = ex < 0 ? 1.15 : -1.15;
      tomHeadGroup.add(brow);
    });

    // Whiskers
    const whiskerGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.23, 6);
    [-1, 1].forEach((side) => {
      [-0.04, -0.09, -0.14].forEach((wy, idx) => {
        const w = new THREE.Mesh(whiskerGeo, matDark);
        w.position.set(side * 0.23, wy, 0.27);
        w.rotation.z = Math.PI / 2 + side * (idx - 1) * 0.18;
        tomHeadGroup.add(w);
      });
    });

    // Tall Chef Hat
    const tomHatGroup = new THREE.Group();
    tomHatGroup.position.set(0, 0.27, -0.04);
    tomHatGroup.rotation.x = -0.18;
    tomHeadGroup.add(tomHatGroup);

    const hatBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.21, 0.17, 22),
      matChefWhite
    );
    hatBand.position.set(0, 0.08, 0);
    hatBand.castShadow = true;
    tomHatGroup.add(hatBand);

    const hatCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 16),
      matChefWhite
    );
    hatCrown.position.set(0, 0.26, 0);
    hatCrown.scale.set(1.05, 0.86, 1.05);
    hatCrown.castShadow = true;
    tomHatGroup.add(hatCrown);

    // Tom Running Legs
    const tomLeftLegPivot = new THREE.Group();
    tomLeftLegPivot.position.set(-0.15, -0.21, 0);
    tomBodyTilt.add(tomLeftLegPivot);

    const tomRightLegPivot = new THREE.Group();
    tomRightLegPivot.position.set(0.15, -0.21, 0);
    tomBodyTilt.add(tomRightLegPivot);

    [tomLeftLegPivot, tomRightLegPivot].forEach((legPivot) => {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.072, 0.24, 8, 12),
        matTomFur
      );
      leg.position.set(0, -0.15, 0);
      leg.castShadow = true;
      legPivot.add(leg);

      const paw = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 14, 14),
        matTomCream
      );
      paw.position.set(0, -0.3, 0.07);
      paw.scale.set(0.95, 0.62, 1.45);
      paw.castShadow = true;
      legPivot.add(paw);
    });

    // Tom Right Arm (swinging Frying Pan overhead to whack Jerry!)
    const tomRightArmPivot = new THREE.Group();
    tomRightArmPivot.position.set(0.31, 0.55, 0.02);
    tomBodyTilt.add(tomRightArmPivot);

    const rSleeve = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 12), matChefWhite);
    rSleeve.position.set(0.04, -0.02, 0.02);
    tomRightArmPivot.add(rSleeve);

    const rArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.068, 0.34, 8, 12),
      matTomFur
    );
    rArm.position.set(0.06, -0.12, 0.15);
    rArm.rotation.x = 1.0;
    rArm.castShadow = true;
    tomRightArmPivot.add(rArm);

    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), matTomCream);
    rHand.position.set(0.08, -0.18, 0.35);
    tomRightArmPivot.add(rHand);

    const panHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.03, 0.34, 10),
      matWood
    );
    panHandle.rotation.x = Math.PI / 2;
    panHandle.position.set(0.08, -0.16, 0.52);
    tomRightArmPivot.add(panHandle);

    const panBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.2, 0.08, 24),
      matPan
    );
    panBody.position.set(0.08, -0.16, 0.8);
    panBody.castShadow = true;
    tomRightArmPivot.add(panBody);

    // Tom Left Arm (reaching forward trying to grab Jerry)
    const tomLeftArmPivot = new THREE.Group();
    tomLeftArmPivot.position.set(-0.31, 0.55, 0.02);
    tomBodyTilt.add(tomLeftArmPivot);

    const lSleeve = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 12), matChefWhite);
    lSleeve.position.set(-0.04, -0.02, 0.02);
    tomLeftArmPivot.add(lSleeve);

    const lArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.068, 0.34, 8, 12),
      matTomFur
    );
    lArm.position.set(-0.06, -0.14, 0.14);
    lArm.rotation.x = 0.85;
    lArm.castShadow = true;
    tomLeftArmPivot.add(lArm);

    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), matTomCream);
    lHand.position.set(-0.08, -0.22, 0.34);
    tomLeftArmPivot.add(lHand);

    const tomTailPivot = new THREE.Group();
    tomTailPivot.position.set(0, -0.12, -0.36);
    tomBodyTilt.add(tomTailPivot);

    const tailShaft = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.52, 8, 12),
      matTomFur
    );
    tailShaft.position.set(0, 0.14, -0.22);
    tailShaft.rotation.x = -0.85;
    tomTailPivot.add(tailShaft);

    const tailTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 12, 12),
      matTomCream
    );
    tailTip.position.set(0, 0.34, -0.44);
    tomTailPivot.add(tailTip);

    // =========================================================================
    // 2. JERRY (Sprinting ahead, dodging & weaving while clutching stolen cheese!)
    // =========================================================================
    const jerryRoot = new THREE.Group();
    stageGroup.add(jerryRoot);

    const jerryBodyTilt = new THREE.Group();
    jerryBodyTilt.position.set(0, 0.25, 0);
    jerryBodyTilt.rotation.x = 0.38; // Forward dash lean!
    jerryRoot.add(jerryBodyTilt);

    const jerryTorso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.165, 0.2, 10, 18),
      matJerryFur
    );
    jerryTorso.position.set(0, 0.18, 0);
    jerryTorso.castShadow = true;
    jerryBodyTilt.add(jerryTorso);

    const jerryBelly = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 16, 16),
      matJerryTan
    );
    jerryBelly.position.set(0, 0.17, 0.085);
    jerryBelly.scale.set(0.95, 1.15, 0.65);
    jerryBodyTilt.add(jerryBelly);

    // Jerry Head (glances back over shoulder at Tom!)
    const jerryHeadGroup = new THREE.Group();
    jerryHeadGroup.position.set(0, 0.44, 0.04);
    jerryBodyTilt.add(jerryHeadGroup);

    const jerryHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 24, 20),
      matJerryFur
    );
    jerryHead.scale.set(1.06, 0.96, 1.04);
    jerryHead.castShadow = true;
    jerryHeadGroup.add(jerryHead);

    [-0.09, 0.09].forEach((cx) => {
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.088, 14, 14),
        matJerryTan
      );
      cheek.position.set(cx, -0.05, 0.135);
      jerryHeadGroup.add(cheek);
    });

    const jerrySnout = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 14, 14),
      matJerryTan
    );
    jerrySnout.position.set(0, -0.038, 0.19);
    jerryHeadGroup.add(jerrySnout);

    const jerryNose = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 12, 12),
      matDark
    );
    jerryNose.position.set(0, -0.02, 0.258);
    jerryHeadGroup.add(jerryNose);

    [-1, 1].forEach((side) => {
      const earOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.155, 0.155, 0.034, 22),
        matJerryFur
      );
      earOuter.rotation.x = Math.PI / 2;
      earOuter.rotation.y = side * 0.22;
      earOuter.position.set(side * 0.21, 0.18, -0.03);
      earOuter.castShadow = true;
      jerryHeadGroup.add(earOuter);

      const earInner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.038, 18),
        matPink
      );
      earInner.rotation.x = Math.PI / 2;
      earInner.rotation.y = side * 0.22;
      earInner.position.set(side * 0.21, 0.18, -0.022);
      jerryHeadGroup.add(earInner);
    });

    // Wide Alert Eyes
    [-0.072, 0.072].forEach((ex) => {
      const eyeW = new THREE.Mesh(
        new THREE.SphereGeometry(0.048, 12, 12),
        matWhite
      );
      eyeW.position.set(ex, 0.06, 0.168);
      eyeW.scale.set(0.95, 1.25, 0.6);
      jerryHeadGroup.add(eyeW);

      const eyeP = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 10, 10),
        matDark
      );
      eyeP.position.set(ex, 0.06, 0.192);
      jerryHeadGroup.add(eyeP);
    });

    // Jerry Fast Running Legs
    const jerryLeftLegPivot = new THREE.Group();
    jerryLeftLegPivot.position.set(-0.085, 0.02, 0);
    jerryBodyTilt.add(jerryLeftLegPivot);

    const jerryRightLegPivot = new THREE.Group();
    jerryRightLegPivot.position.set(0.085, 0.02, 0);
    jerryBodyTilt.add(jerryRightLegPivot);

    [jerryLeftLegPivot, jerryRightLegPivot].forEach((legPivot) => {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.042, 0.12, 6, 10),
        matJerryFur
      );
      leg.position.set(0, -0.08, 0);
      legPivot.add(leg);

      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        matJerryTan
      );
      foot.position.set(0, -0.17, 0.04);
      foot.scale.set(0.88, 0.6, 1.4);
      foot.castShadow = true;
      legPivot.add(foot);
    });

    // Jerry Arms clutching a big stolen Swiss Cheese Wedge while running!
    const jerryArmsGroup = new THREE.Group();
    jerryArmsGroup.position.set(0, 0.25, 0.1);
    jerryBodyTilt.add(jerryArmsGroup);

    [-0.12, 0.12].forEach((ax) => {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.04, 0.14, 6, 10),
        matJerryFur
      );
      arm.position.set(ax, 0.02, 0.09);
      arm.rotation.x = 1.05;
      arm.rotation.z = ax < 0 ? -0.4 : 0.4;
      jerryArmsGroup.add(arm);
    });

    // Extruded Cheese Wedge in Jerry's paws
    const cheeseShape = new THREE.Shape();
    cheeseShape.moveTo(0, 0);
    cheeseShape.lineTo(0.28, 0.1);
    cheeseShape.lineTo(0.28, -0.1);
    cheeseShape.closePath();

    const cheeseGeo = new THREE.ExtrudeGeometry(cheeseShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    const stolenCheese = new THREE.Mesh(cheeseGeo, matCheese);
    stolenCheese.position.set(-0.08, 0.01, 0.18);
    stolenCheese.rotation.y = 0.2;
    stolenCheese.castShadow = true;
    jerryArmsGroup.add(stolenCheese);

    const holeGeo = new THREE.SphereGeometry(0.024, 8, 8);
    [
      [0.08, 0.09, 0.25],
      [0.14, 0.05, 0.18],
    ].forEach(([hx, hy, hz]) => {
      const hole = new THREE.Mesh(holeGeo, matCheeseHole);
      hole.position.set(hx, hy, hz);
      jerryArmsGroup.add(hole);
    });

    // Jerry Tail streaming behind
    const jerryTail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.018, 0.34, 6, 10),
      matPink
    );
    jerryTail.position.set(0, 0.08, -0.22);
    jerryTail.rotation.x = -1.05;
    jerryBodyTilt.add(jerryTail);

    // =========================================================================
    // DUST PUFFS BEHIND BOTH TOM AND JERRY
    // =========================================================================
    const tomDustPuffs: {mesh: THREE.Mesh; offset: number}[] = [];
    const jerryDustPuffs: {mesh: THREE.Mesh; offset: number}[] = [];
    const dustGeo = new THREE.SphereGeometry(0.08, 10, 10);
    for (let i = 0; i < 4; i++) {
      const tPuff = new THREE.Mesh(dustGeo, matDust.clone());
      stageGroup.add(tPuff);
      tomDustPuffs.push({mesh: tPuff, offset: i / 4});

      const jPuff = new THREE.Mesh(dustGeo, matDust.clone());
      stageGroup.add(jPuff);
      jerryDustPuffs.push({mesh: jPuff, offset: i / 4});
    }

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

    const trackRx = 1.65;
    const trackRz = 0.98;

    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();

      // Continuous oval chase speed around the kitchen table
      const chaseAngle = t * 1.45;
      const tomAngle = chaseAngle - 0.55;
      // Jerry sprints ahead of Tom and weaves/dodges dynamically!
      const jerryAngle = chaseAngle + 0.35 + Math.sin(t * 2.2) * 0.08;

      // 1. TOM POSITION & TANGENT HEADING
      const tomX = Math.sin(tomAngle) * trackRx;
      const tomZ = Math.cos(tomAngle) * trackRz;
      const tomDx = Math.cos(tomAngle) * trackRx;
      const tomDz = -Math.sin(tomAngle) * trackRz;

      const tomStrideSpeed = t * 12.0;
      const tomStride = Math.sin(tomStrideSpeed);
      const tomHop = Math.abs(tomStride) * 0.15;

      tomRoot.position.set(tomX, 0.02 + tomHop, tomZ);
      tomRoot.rotation.y = Math.atan2(tomDx, tomDz);

      // Tom rapid legs + pan swinging down to beat Jerry!
      tomLeftLegPivot.rotation.x = tomStride * 1.2;
      tomRightLegPivot.rotation.x = -tomStride * 1.2;

      // Whack! Swings frying pan overhead & down every ~0.85s
      const panWhack = Math.sin(t * 7.2);
      tomRightArmPivot.rotation.x = -0.85 + panWhack * 1.15;
      tomRightArmPivot.rotation.z = Math.cos(t * 7.2) * 0.22;
      tomLeftArmPivot.rotation.x = tomStride * 0.85;

      tomBodyTilt.rotation.z = Math.sin(tomStrideSpeed) * 0.1;
      tomHeadGroup.rotation.z = -Math.sin(tomStrideSpeed) * 0.07;
      tomHatGroup.rotation.x = -0.24 - Math.abs(tomStride) * 0.15;
      tomHatGroup.rotation.z = Math.sin(tomStrideSpeed - 0.6) * 0.12;
      tomTailPivot.rotation.y = Math.sin(t * 9) * 0.4;

      // 2. JERRY POSITION, WEAVING DODGE & TANGENT HEADING
      // Jerry zig-zags radially (in-and-out) to dodge Tom's frying pan!
      const dodgeWeave = Math.sin(t * 6.5) * 0.32;
      const jerryRx = trackRx + dodgeWeave;
      const jerryRz = trackRz + dodgeWeave * 0.75;

      const jerryX = Math.sin(jerryAngle) * jerryRx;
      const jerryZ = Math.cos(jerryAngle) * jerryRz;
      const jerryDx = Math.cos(jerryAngle) * jerryRx + Math.sin(jerryAngle) * Math.cos(t * 6.5) * 0.6;
      const jerryDz = -Math.sin(jerryAngle) * jerryRz + Math.cos(jerryAngle) * Math.cos(t * 6.5) * 0.45;

      const jerryStrideSpeed = t * 16.5;
      const jerryStride = Math.sin(jerryStrideSpeed);
      // Playful dodge leap synced with Tom's pan swings!
      const dodgeLeap = Math.max(0, Math.sin(t * 7.2 - 0.4)) * 0.24;

      jerryRoot.position.set(jerryX, 0.02 + Math.abs(jerryStride) * 0.07 + dodgeLeap, jerryZ);
      jerryRoot.rotation.y = Math.atan2(jerryDx, jerryDz);
      // Bank left/right cleanly in Jerry's local frame as he weaves!
      jerryBodyTilt.rotation.z = -Math.cos(t * 6.5) * 0.25;

      jerryLeftLegPivot.rotation.x = jerryStride * 1.25;
      jerryRightLegPivot.rotation.x = -jerryStride * 1.25;

      // Jerry looks ahead to steer, then glances back over his shoulder at Tom while dodging!
      jerryHeadGroup.rotation.y = -0.35 - (Math.sin(t * 2.8) + 1) * 0.85;
      jerryTail.rotation.z = Math.sin(t * 11) * 0.35;

      // 3. DUST PUFFS BEHIND BOTH RUNNERS
      const tomBackX = -tomDx / Math.hypot(tomDx, tomDz);
      const tomBackZ = -tomDz / Math.hypot(tomDx, tomDz);
      for (const puff of tomDustPuffs) {
        const phase = (t * 2.0 + puff.offset) % 1;
        puff.mesh.position.set(
          tomX + tomBackX * (0.28 + phase * 0.7),
          0.09 + phase * 0.24,
          tomZ + tomBackZ * (0.28 + phase * 0.7)
        );
        const s = 0.55 + phase * 1.05;
        puff.mesh.scale.set(s, s, s);
        const mat = puff.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.sin(phase * Math.PI) * 0.42;
      }

      const jerryBackX = -jerryDx / Math.hypot(jerryDx, jerryDz);
      const jerryBackZ = -jerryDz / Math.hypot(jerryDx, jerryDz);
      for (const puff of jerryDustPuffs) {
        const phase = (t * 2.4 + puff.offset) % 1;
        puff.mesh.position.set(
          jerryX + jerryBackX * (0.18 + phase * 0.5),
          0.07 + phase * 0.16,
          jerryZ + jerryBackZ * (0.18 + phase * 0.5)
        );
        const s = 0.35 + phase * 0.65;
        puff.mesh.scale.set(s, s, s);
        const mat = puff.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.sin(phase * Math.PI) * 0.38;
      }

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
