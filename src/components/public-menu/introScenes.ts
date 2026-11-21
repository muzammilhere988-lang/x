import * as THREE from 'three';

export type IntroSceneId = 'tom-jerry-chase' | 'wok-flip' | 'pizza-spin' | 'scooter-dash';

export interface IntroSceneMeta {
  id: IntroSceneId;
  label: string;
}

export const INTRO_SCENES: IntroSceneMeta[] = [
  {id: 'tom-jerry-chase', label: 'Tom & Jerry'},
  {id: 'wok-flip', label: 'Chef Flip'},
  {id: 'pizza-spin', label: 'Pizza Spin'},
  {id: 'scooter-dash', label: 'Delivery'},
];

export interface BuiltIntroScene {
  group: THREE.Group;
  update: (t: number) => void;
}

interface SharedMaterials {
  matChefWhite: THREE.MeshStandardMaterial;
  matTrimRed: THREE.MeshStandardMaterial;
  matSkin: THREE.MeshStandardMaterial;
  matDark: THREE.MeshStandardMaterial;
  matWhite: THREE.MeshStandardMaterial;
  matPink: THREE.MeshStandardMaterial;
  matPan: THREE.MeshStandardMaterial;
  matWood: THREE.MeshStandardMaterial;
  matCheese: THREE.MeshStandardMaterial;
  matBun: THREE.MeshStandardMaterial;
  matLettuce: THREE.MeshStandardMaterial;
  matDust: THREE.MeshStandardMaterial;
}

function createSharedMaterials(): SharedMaterials {
  return {
    matChefWhite: new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.76, metalness: 0.02}),
    matTrimRed: new THREE.MeshStandardMaterial({color: 0xd9382e, roughness: 0.62, metalness: 0.04}),
    matSkin: new THREE.MeshStandardMaterial({color: 0xf4c29f, roughness: 0.7, metalness: 0.02}),
    matDark: new THREE.MeshStandardMaterial({color: 0x1b1715, roughness: 0.25, metalness: 0.1}),
    matWhite: new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.22, metalness: 0.0}),
    matPink: new THREE.MeshStandardMaterial({color: 0xe68491, roughness: 0.58, metalness: 0.02}),
    matPan: new THREE.MeshStandardMaterial({color: 0x262629, roughness: 0.35, metalness: 0.78}),
    matWood: new THREE.MeshStandardMaterial({color: 0x9b6339, roughness: 0.72, metalness: 0.02}),
    matCheese: new THREE.MeshStandardMaterial({color: 0xf5c23b, roughness: 0.55, metalness: 0.02}),
    matBun: new THREE.MeshStandardMaterial({color: 0xd88b3a, roughness: 0.68, metalness: 0.0}),
    matLettuce: new THREE.MeshStandardMaterial({color: 0x52a846, roughness: 0.6, metalness: 0.0}),
    matDust: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.48,
      roughness: 0.95,
      depthWrite: false,
    }),
  };
}

// ============================================================================
// SCENE 1: TOM & JERRY CHASE (Tom in cook dress chasing dodging Jerry)
// ============================================================================
function buildTomAndJerryScene(m: SharedMaterials): BuiltIntroScene {
  const root = new THREE.Group();

  const matTomFur = new THREE.MeshStandardMaterial({color: 0x5c7089, roughness: 0.68, metalness: 0.04});
  const matTomCream = new THREE.MeshStandardMaterial({color: 0xf4f0e8, roughness: 0.72, metalness: 0.02});
  const matEyeYellow = new THREE.MeshStandardMaterial({color: 0xf7e371, roughness: 0.25, metalness: 0.05});
  const matJerryFur = new THREE.MeshStandardMaterial({color: 0xa66537, roughness: 0.68, metalness: 0.02});
  const matJerryTan = new THREE.MeshStandardMaterial({color: 0xebbd92, roughness: 0.74, metalness: 0.0});
  const matCheeseHole = new THREE.MeshStandardMaterial({color: 0xd99b1e, roughness: 0.7, metalness: 0.0});
  const matPatty = new THREE.MeshStandardMaterial({color: 0x61311c, roughness: 0.8, metalness: 0.0});
  const matPlate = new THREE.MeshStandardMaterial({color: 0xfaf7f2, roughness: 0.24, metalness: 0.1});

  // Center snack table
  const centerTable = new THREE.Group();
  centerTable.position.set(0, 0.02, 0);
  root.add(centerTable);

  const tablePedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.56, 16), m.matWood);
  tablePedestal.position.y = 0.28;
  tablePedestal.castShadow = true;
  centerTable.add(tablePedestal);

  const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 22), m.matWood);
  tableBase.position.y = 0.03;
  tableBase.receiveShadow = true;
  centerTable.add(tableBase);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.055, 32), m.matTrimRed);
  tableTop.position.y = 0.58;
  tableTop.castShadow = true;
  centerTable.add(tableTop);

  const tableNapkin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 28), m.matWhite);
  tableNapkin.position.y = 0.582;
  centerTable.add(tableNapkin);

  const centerPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.035, 24), matPlate);
  centerPlate.position.set(0, 0.63, 0);
  centerTable.add(centerPlate);

  const bBun = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.055, 20), m.matBun);
  bBun.position.y = 0.67;
  centerTable.add(bBun);

  const bPatty = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.045, 20), matPatty);
  bPatty.position.y = 0.715;
  centerTable.add(bPatty);

  const bLettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.025, 16), m.matLettuce);
  bLettuce.position.y = 0.745;
  centerTable.add(bLettuce);

  const bTopBun = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    m.matBun
  );
  bTopBun.position.y = 0.76;
  bTopBun.castShadow = true;
  centerTable.add(bTopBun);

  // Tom in Cook Dress
  const tomRoot = new THREE.Group();
  root.add(tomRoot);

  const tomBodyTilt = new THREE.Group();
  tomBodyTilt.position.set(0, 0.56, 0);
  tomBodyTilt.rotation.x = 0.34;
  tomRoot.add(tomBodyTilt);

  const tomDressBodice = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.52, 24), m.matChefWhite);
  tomDressBodice.position.set(0, 0.39, 0);
  tomDressBodice.castShadow = true;
  tomBodyTilt.add(tomDressBodice);

  const tomDressSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.53, 0.48, 28), m.matChefWhite);
  tomDressSkirt.position.set(0, -0.05, 0);
  tomDressSkirt.castShadow = true;
  tomBodyTilt.add(tomDressSkirt);

  const tomDressHem = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 10, 32), m.matTrimRed);
  tomDressHem.rotation.x = Math.PI / 2;
  tomDressHem.position.set(0, -0.28, 0);
  tomBodyTilt.add(tomDressHem);

  const tomWaistSash = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.325, 0.09, 24), m.matTrimRed);
  tomWaistSash.position.set(0, 0.17, 0);
  tomBodyTilt.add(tomWaistSash);

  const bowLeft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 12), m.matTrimRed);
  bowLeft.position.set(-0.085, 0.17, -0.34);
  bowLeft.rotation.z = Math.PI / 2 - 0.25;
  tomBodyTilt.add(bowLeft);

  const bowRight = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 12), m.matTrimRed);
  bowRight.position.set(0.085, 0.17, -0.34);
  bowRight.rotation.z = -Math.PI / 2 + 0.25;
  tomBodyTilt.add(bowRight);

  const tomScarf = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.052, 12, 24), m.matTrimRed);
  tomScarf.rotation.x = Math.PI / 2 + 0.12;
  tomScarf.position.set(0, 0.65, 0.02);
  tomBodyTilt.add(tomScarf);

  const tomHeadGroup = new THREE.Group();
  tomHeadGroup.position.set(0, 0.94, 0.05);
  tomBodyTilt.add(tomHeadGroup);

  const tomHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 20), matTomFur);
  tomHead.scale.set(1.06, 0.96, 1.0);
  tomHead.castShadow = true;
  tomHeadGroup.add(tomHead);

  [-0.09, 0.09].forEach((mx) => {
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 14), matTomCream);
    muzzle.position.set(mx, -0.07, 0.25);
    muzzle.scale.set(1.08, 0.85, 0.85);
    tomHeadGroup.add(muzzle);
  });

  const tomNose = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 12), m.matPink);
  tomNose.position.set(0, -0.01, 0.36);
  tomHeadGroup.add(tomNose);

  [-1, 1].forEach((side) => {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.21, 0.25, -0.02);
    earGroup.rotation.z = -side * 0.32;
    tomHeadGroup.add(earGroup);

    const outerEar = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.25, 14), matTomFur);
    earGroup.add(outerEar);
    const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.17, 10), m.matPink);
    innerEar.position.set(0, -0.02, 0.036);
    earGroup.add(innerEar);
  });

  [-0.11, 0.11].forEach((ex) => {
    const eyeBg = new THREE.Mesh(new THREE.SphereGeometry(0.084, 14, 14), matEyeYellow);
    eyeBg.position.set(ex, 0.08, 0.265);
    eyeBg.scale.set(0.9, 1.25, 0.55);
    tomHeadGroup.add(eyeBg);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), m.matDark);
    pupil.position.set(ex, 0.075, 0.302);
    pupil.scale.set(0.85, 1.2, 0.5);
    tomHeadGroup.add(pupil);
  });

  const tomHatGroup = new THREE.Group();
  tomHatGroup.position.set(0, 0.27, -0.04);
  tomHatGroup.rotation.x = -0.18;
  tomHeadGroup.add(tomHatGroup);

  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.21, 0.17, 20), m.matChefWhite);
  hatBand.position.set(0, 0.08, 0);
  tomHatGroup.add(hatBand);

  const hatCrown = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), m.matChefWhite);
  hatCrown.position.set(0, 0.26, 0);
  hatCrown.scale.set(1.05, 0.86, 1.05);
  tomHatGroup.add(hatCrown);

  const tomLeftLegPivot = new THREE.Group();
  tomLeftLegPivot.position.set(-0.15, -0.21, 0);
  tomBodyTilt.add(tomLeftLegPivot);
  const tomRightLegPivot = new THREE.Group();
  tomRightLegPivot.position.set(0.15, -0.21, 0);
  tomBodyTilt.add(tomRightLegPivot);

  [tomLeftLegPivot, tomRightLegPivot].forEach((legPivot) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.24, 6, 10), matTomFur);
    leg.position.set(0, -0.15, 0);
    legPivot.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 12), matTomCream);
    paw.position.set(0, -0.3, 0.07);
    paw.scale.set(0.95, 0.62, 1.45);
    legPivot.add(paw);
  });

  const tomRightArmPivot = new THREE.Group();
  tomRightArmPivot.position.set(0.31, 0.55, 0.02);
  tomBodyTilt.add(tomRightArmPivot);

  const rArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.34, 6, 10), matTomFur);
  rArm.position.set(0.06, -0.12, 0.15);
  rArm.rotation.x = 1.0;
  tomRightArmPivot.add(rArm);

  const panHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.34, 10), m.matWood);
  panHandle.rotation.x = Math.PI / 2;
  panHandle.position.set(0.08, -0.16, 0.52);
  tomRightArmPivot.add(panHandle);

  const panBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.08, 22), m.matPan);
  panBody.position.set(0.08, -0.16, 0.8);
  panBody.castShadow = true;
  tomRightArmPivot.add(panBody);

  const tomLeftArmPivot = new THREE.Group();
  tomLeftArmPivot.position.set(-0.31, 0.55, 0.02);
  tomBodyTilt.add(tomLeftArmPivot);
  const lArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.34, 6, 10), matTomFur);
  lArm.position.set(-0.06, -0.14, 0.14);
  lArm.rotation.x = 0.85;
  tomLeftArmPivot.add(lArm);

  const tomTailPivot = new THREE.Group();
  tomTailPivot.position.set(0, -0.12, -0.36);
  tomBodyTilt.add(tomTailPivot);
  const tailShaft = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.52, 6, 10), matTomFur);
  tailShaft.position.set(0, 0.14, -0.22);
  tailShaft.rotation.x = -0.85;
  tomTailPivot.add(tailShaft);

  // Jerry running ahead clutching cheese
  const jerryRoot = new THREE.Group();
  root.add(jerryRoot);

  const jerryBodyTilt = new THREE.Group();
  jerryBodyTilt.position.set(0, 0.25, 0);
  jerryBodyTilt.rotation.x = 0.38;
  jerryRoot.add(jerryBodyTilt);

  const jerryTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.165, 0.2, 8, 16), matJerryFur);
  jerryTorso.position.set(0, 0.18, 0);
  jerryTorso.castShadow = true;
  jerryBodyTilt.add(jerryTorso);

  const jerryHeadGroup = new THREE.Group();
  jerryHeadGroup.position.set(0, 0.44, 0.04);
  jerryBodyTilt.add(jerryHeadGroup);

  const jerryHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), matJerryFur);
  jerryHead.castShadow = true;
  jerryHeadGroup.add(jerryHead);

  const jerrySnout = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), matJerryTan);
  jerrySnout.position.set(0, -0.038, 0.19);
  jerryHeadGroup.add(jerrySnout);

  const jerryNose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), m.matDark);
  jerryNose.position.set(0, -0.02, 0.258);
  jerryHeadGroup.add(jerryNose);

  [-1, 1].forEach((side) => {
    const earOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.034, 18), matJerryFur);
    earOuter.rotation.x = Math.PI / 2;
    earOuter.rotation.y = side * 0.22;
    earOuter.position.set(side * 0.21, 0.18, -0.03);
    jerryHeadGroup.add(earOuter);

    const earInner = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.038, 14), m.matPink);
    earInner.rotation.x = Math.PI / 2;
    earInner.rotation.y = side * 0.22;
    earInner.position.set(side * 0.21, 0.18, -0.022);
    jerryHeadGroup.add(earInner);
  });

  [-0.072, 0.072].forEach((ex) => {
    const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), m.matWhite);
    eyeW.position.set(ex, 0.06, 0.168);
    jerryHeadGroup.add(eyeW);
    const eyeP = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), m.matDark);
    eyeP.position.set(ex, 0.06, 0.192);
    jerryHeadGroup.add(eyeP);
  });

  const jerryLeftLegPivot = new THREE.Group();
  jerryLeftLegPivot.position.set(-0.085, 0.02, 0);
  jerryBodyTilt.add(jerryLeftLegPivot);
  const jerryRightLegPivot = new THREE.Group();
  jerryRightLegPivot.position.set(0.085, 0.02, 0);
  jerryBodyTilt.add(jerryRightLegPivot);

  [jerryLeftLegPivot, jerryRightLegPivot].forEach((legPivot) => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 10), matJerryTan);
    foot.position.set(0, -0.14, 0.04);
    foot.scale.set(0.88, 0.6, 1.4);
    legPivot.add(foot);
  });

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
  const stolenCheese = new THREE.Mesh(cheeseGeo, m.matCheese);
  stolenCheese.position.set(-0.08, 0.26, 0.26);
  stolenCheese.rotation.y = 0.2;
  jerryBodyTilt.add(stolenCheese);

  const hole = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), matCheeseHole);
  hole.position.set(0.08, 0.34, 0.33);
  jerryBodyTilt.add(hole);

  const jerryTail = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.34, 6, 8), m.matPink);
  jerryTail.position.set(0, 0.08, -0.22);
  jerryTail.rotation.x = -1.05;
  jerryBodyTilt.add(jerryTail);

  const tomDustPuffs: {mesh: THREE.Mesh; offset: number}[] = [];
  const dustGeo = new THREE.SphereGeometry(0.08, 8, 8);
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(dustGeo, m.matDust.clone());
    root.add(puff);
    tomDustPuffs.push({mesh: puff, offset: i / 4});
  }

  const trackRx = 1.65;
  const trackRz = 0.98;

  return {
    group: root,
    update: (t: number) => {
      const chaseAngle = t * 1.45;
      const tomAngle = chaseAngle - 0.55;
      const jerryAngle = chaseAngle + 0.35 + Math.sin(t * 2.2) * 0.08;

      const tomX = Math.sin(tomAngle) * trackRx;
      const tomZ = Math.cos(tomAngle) * trackRz;
      const tomDx = Math.cos(tomAngle) * trackRx;
      const tomDz = -Math.sin(tomAngle) * trackRz;

      const tomStrideSpeed = t * 12.0;
      const tomStride = Math.sin(tomStrideSpeed);

      tomRoot.position.set(tomX, 0.02 + Math.abs(tomStride) * 0.15, tomZ);
      tomRoot.rotation.y = Math.atan2(tomDx, tomDz);

      tomLeftLegPivot.rotation.x = tomStride * 1.2;
      tomRightLegPivot.rotation.x = -tomStride * 1.2;

      const panWhack = Math.sin(t * 7.2);
      tomRightArmPivot.rotation.x = -0.85 + panWhack * 1.15;
      tomRightArmPivot.rotation.z = Math.cos(t * 7.2) * 0.22;
      tomLeftArmPivot.rotation.x = tomStride * 0.85;
      tomBodyTilt.rotation.z = Math.sin(tomStrideSpeed) * 0.1;
      tomHatGroup.rotation.x = -0.24 - Math.abs(tomStride) * 0.15;
      tomHatGroup.rotation.z = Math.sin(tomStrideSpeed - 0.6) * 0.12;
      tomTailPivot.rotation.y = Math.sin(t * 9) * 0.4;

      const dodgeWeave = Math.sin(t * 6.5) * 0.32;
      const jerryRx = trackRx + dodgeWeave;
      const jerryRz = trackRz + dodgeWeave * 0.75;
      const jerryX = Math.sin(jerryAngle) * jerryRx;
      const jerryZ = Math.cos(jerryAngle) * jerryRz;
      const jerryDx = Math.cos(jerryAngle) * jerryRx + Math.sin(jerryAngle) * Math.cos(t * 6.5) * 0.6;
      const jerryDz = -Math.sin(jerryAngle) * jerryRz + Math.cos(jerryAngle) * Math.cos(t * 6.5) * 0.45;

      const jerryStride = Math.sin(t * 16.5);
      const dodgeLeap = Math.max(0, Math.sin(t * 7.2 - 0.4)) * 0.24;

      jerryRoot.position.set(jerryX, 0.02 + Math.abs(jerryStride) * 0.07 + dodgeLeap, jerryZ);
      jerryRoot.rotation.y = Math.atan2(jerryDx, jerryDz);
      jerryBodyTilt.rotation.z = -Math.cos(t * 6.5) * 0.25;
      jerryLeftLegPivot.rotation.x = jerryStride * 1.25;
      jerryRightLegPivot.rotation.x = -jerryStride * 1.25;
      jerryHeadGroup.rotation.y = -0.35 - (Math.sin(t * 2.8) + 1) * 0.85;
      jerryTail.rotation.z = Math.sin(t * 11) * 0.35;

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
        (puff.mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(phase * Math.PI) * 0.42;
      }
    },
  };
}

// ============================================================================
// SCENE 2: CHEF WOK / WRAP PAN FLIP (Tossing sizzling wraps & veggies in air!)
// ============================================================================
function buildChefWokFlipScene(m: SharedMaterials): BuiltIntroScene {
  const root = new THREE.Group();

  const matCounter = new THREE.MeshStandardMaterial({color: 0xc29b6c, roughness: 0.75, metalness: 0.02});
  const matTomato = new THREE.MeshStandardMaterial({color: 0xd9382e, roughness: 0.45, metalness: 0.02});
  const matWrap = new THREE.MeshStandardMaterial({color: 0xecc482, roughness: 0.7, metalness: 0.0});
  const matFlame = new THREE.MeshStandardMaterial({
    color: 0xf59e2d,
    emissive: 0xe65c19,
    emissiveIntensity: 0.75,
    roughness: 0.4,
  });

  // Kitchen Counter & Stove Burner
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 1.0), matCounter);
  counter.position.set(0, 0.38, 0.35);
  counter.castShadow = true;
  counter.receiveShadow = true;
  root.add(counter);

  const stoveRing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.05, 24), m.matDark);
  stoveRing.position.set(0, 0.78, 0.35);
  root.add(stoveRing);

  const flameRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 20), matFlame);
  flameRing.rotation.x = Math.PI / 2;
  flameRing.position.set(0, 0.81, 0.35);
  root.add(flameRing);

  // Chef Character behind counter
  const chefGroup = new THREE.Group();
  chefGroup.position.set(0, 0.02, -0.45);
  root.add(chefGroup);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.92, 22), m.matChefWhite);
  torso.position.y = 0.85;
  torso.castShadow = true;
  chefGroup.add(torso);

  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.65, 0.06), m.matTrimRed);
  apron.position.set(0, 0.78, 0.36);
  chefGroup.add(apron);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.54, 0);
  chefGroup.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 22, 18), m.matSkin);
  head.castShadow = true;
  headGroup.add(head);

  // Mustache + Eyes
  [-0.08, 0.08].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), m.matDark);
    eye.position.set(ex, 0.05, 0.26);
    headGroup.add(eye);
  });
  [-0.065, 0.065].forEach((mx) => {
    const stache = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.08, 6, 8), m.matDark);
    stache.position.set(mx, -0.06, 0.27);
    stache.rotation.z = mx < 0 ? 1.25 : -1.25;
    headGroup.add(stache);
  });

  const chefHat = new THREE.Group();
  chefHat.position.set(0, 0.22, 0);
  headGroup.add(chefHat);
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.21, 0.16, 20), m.matChefWhite);
  hatBand.position.y = 0.08;
  chefHat.add(hatBand);
  const hatPuff = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), m.matChefWhite);
  hatPuff.position.y = 0.28;
  hatPuff.scale.set(1.05, 0.82, 1.05);
  chefHat.add(hatPuff);

  // Flipping Arm + Sizzling Skillet
  const armPivot = new THREE.Group();
  armPivot.position.set(0.38, 1.15, 0.15);
  chefGroup.add(armPivot);

  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.42, 6, 10), m.matChefWhite);
  arm.position.set(0, -0.1, 0.26);
  arm.rotation.x = 1.1;
  armPivot.add(arm);

  const panGroup = new THREE.Group();
  panGroup.position.set(-0.38, -0.22, 0.72);
  armPivot.add(panGroup);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.42, 10), m.matWood);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0.24, 0, -0.2);
  handle.rotation.z = -0.3;
  panGroup.add(handle);

  const skillet = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.12, 24), m.matPan);
  skillet.castShadow = true;
  panGroup.add(skillet);

  // Tossed Wraps & Veggies flying above the pan
  const tossedItems: {mesh: THREE.Mesh; phaseOffset: number; radius: number}[] = [];
  const wrapPiece1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.22, 6, 10), matWrap);
  wrapPiece1.rotation.z = Math.PI / 2;
  const wrapPiece2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.2, 6, 10), matWrap);
  wrapPiece2.rotation.z = Math.PI / 2;
  const tomatoCube = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), matTomato);
  const lettuceLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), m.matLettuce);

  [wrapPiece1, wrapPiece2, tomatoCube, lettuceLeaf].forEach((mesh, idx) => {
    root.add(mesh);
    tossedItems.push({mesh, phaseOffset: idx * 0.25, radius: 0.14});
  });

  // Rising Steam Puffs
  const steams: {mesh: THREE.Mesh; offset: number}[] = [];
  const steamGeo = new THREE.SphereGeometry(0.075, 8, 8);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(steamGeo, m.matDust.clone());
    root.add(s);
    steams.push({mesh: s, offset: i / 5});
  }

  return {
    group: root,
    update: (t: number) => {
      const flipCycle = t * 3.4;
      const toss = Math.max(0, Math.sin(flipCycle));

      chefGroup.position.y = 0.02 + Math.abs(Math.sin(flipCycle * 0.5)) * 0.08;
      headGroup.rotation.x = Math.sin(flipCycle) * 0.12;
      chefHat.rotation.z = Math.sin(flipCycle * 0.8) * 0.1;
      armPivot.rotation.x = -0.25 - toss * 0.45;
      flameRing.scale.setScalar(1 + Math.sin(t * 14) * 0.08);

      tossedItems.forEach((item, idx) => {
        const arc = Math.abs(Math.sin(flipCycle + item.phaseOffset * Math.PI));
        const angle = t * 2.5 + idx * 1.6;
        item.mesh.position.set(
          Math.cos(angle) * item.radius,
          1.05 + arc * 0.95,
          0.32 + Math.sin(angle) * item.radius
        );
        item.mesh.rotation.x = t * 5 + idx;
        item.mesh.rotation.y = t * 4;
      });

      for (const s of steams) {
        const phase = (t * 0.85 + s.offset) % 1;
        s.mesh.position.set(
          Math.sin(t * 2 + s.offset * 6) * 0.18,
          1.1 + phase * 1.15,
          0.35 + Math.cos(t * 1.8 + s.offset * 4) * 0.1
        );
        const sc = 0.6 + phase * 1.2;
        s.mesh.scale.set(sc, sc, sc);
        (s.mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(phase * Math.PI) * 0.35;
      }

      root.rotation.y = Math.sin(t * 0.65) * 0.14;
    },
  };
}

// ============================================================================
// SCENE 3: PIZZA DOUGH SPINNER (Chef spinning giant pizza in mid-air!)
// ============================================================================
function buildPizzaSpinnerScene(m: SharedMaterials): BuiltIntroScene {
  const root = new THREE.Group();

  const matSauce = new THREE.MeshStandardMaterial({color: 0xd1382c, roughness: 0.48, metalness: 0.02});
  const matDough = new THREE.MeshStandardMaterial({color: 0xeec888, roughness: 0.72, metalness: 0.0});

  const chefGroup = new THREE.Group();
  chefGroup.position.set(0, 0.02, 0);
  root.add(chefGroup);

  // Boots + Pants
  [-0.16, 0.16].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.3, 6, 10), m.matDark);
    leg.position.set(lx, 0.24, 0);
    leg.castShadow = true;
    chefGroup.add(leg);
  });

  // White Chef Coat + Red Scarf
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.78, 22), m.matChefWhite);
  torso.position.y = 0.82;
  torso.castShadow = true;
  chefGroup.add(torso);

  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 10, 22), m.matTrimRed);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.22;
  chefGroup.add(scarf);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.48, 0);
  chefGroup.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 18), m.matSkin);
  head.castShadow = true;
  headGroup.add(head);

  [-0.08, 0.08].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), m.matDark);
    eye.position.set(ex, 0.04, 0.25);
    headGroup.add(eye);
  });

  const chefHat = new THREE.Group();
  chefHat.position.set(0, 0.22, -0.03);
  headGroup.add(chefHat);
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.15, 20), m.matChefWhite);
  hatBand.position.y = 0.07;
  chefHat.add(hatBand);
  const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), m.matChefWhite);
  hatTop.position.y = 0.26;
  hatTop.scale.set(1.05, 0.84, 1.05);
  chefHat.add(hatTop);

  // Raised Arm spinning the Pizza!
  const spinArmPivot = new THREE.Group();
  spinArmPivot.position.set(0.34, 1.12, 0.08);
  chefGroup.add(spinArmPivot);

  const rArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.45, 6, 10), m.matChefWhite);
  rArm.position.set(0.05, 0.25, 0.08);
  rArm.rotation.z = -0.2;
  spinArmPivot.add(rArm);

  const lArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.36, 6, 10), m.matChefWhite);
  lArm.position.set(-0.4, 0.96, 0.14);
  lArm.rotation.z = 0.9;
  chefGroup.add(lArm);

  // Giant Spinning Pizza Dough + Sauce + Melted Cheese + Toppings above Chef's finger
  const pizzaSpinner = new THREE.Group();
  pizzaSpinner.position.set(0.45, 1.85, 0.18);
  root.add(pizzaSpinner);

  const pizzaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.72, 0.07, 32), matDough);
  pizzaBase.castShadow = true;
  pizzaSpinner.add(pizzaBase);

  const pizzaSauce = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.076, 28), matSauce);
  pizzaSpinner.add(pizzaSauce);

  const pizzaCheese = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.082, 28), m.matCheese);
  pizzaSpinner.add(pizzaCheese);

  // Toppings on spinning pizza
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.09, 14), m.matTrimRed);
    pep.position.set(Math.cos(a) * 0.34, 0.005, Math.sin(a) * 0.34);
    pizzaSpinner.add(pep);
  }

  return {
    group: root,
    update: (t: number) => {
      const bounce = Math.abs(Math.sin(t * 4.5));
      chefGroup.position.y = 0.02 + bounce * 0.12;
      chefGroup.rotation.y = Math.sin(t * 2.2) * 0.28;
      headGroup.rotation.x = -0.18 + Math.sin(t * 4.5) * 0.08;
      chefHat.rotation.z = Math.sin(t * 4.5) * 0.08;

      const tossHeight = Math.abs(Math.sin(t * 2.6)) * 0.55;
      pizzaSpinner.position.set(
        0.42 * Math.cos(chefGroup.rotation.y),
        1.82 + bounce * 0.12 + tossHeight,
        0.16 - 0.42 * Math.sin(chefGroup.rotation.y)
      );
      pizzaSpinner.rotation.y = t * 9.5;
      pizzaSpinner.rotation.x = Math.sin(t * 3.5) * 0.16;
      pizzaSpinner.rotation.z = Math.cos(t * 3.5) * 0.14;
    },
  };
}

// ============================================================================
// SCENE 4: EXPRESS DELIVERY SCOOTER (Zooming with hot Al Arabian food box!)
// ============================================================================
function buildDeliveryScooterScene(m: SharedMaterials): BuiltIntroScene {
  const root = new THREE.Group();

  const matScooterRed = new THREE.MeshStandardMaterial({color: 0xd9382e, roughness: 0.32, metalness: 0.25});
  const matChrome = new THREE.MeshStandardMaterial({color: 0xd8dce0, roughness: 0.2, metalness: 0.85});
  const matHelmet = new THREE.MeshStandardMaterial({color: 0xf5c23b, roughness: 0.35, metalness: 0.15});

  // Animated road stripe markers beneath the scooter
  const roadStripes: THREE.Mesh[] = [];
  const stripeGeo = new THREE.BoxGeometry(0.45, 0.02, 0.1);
  for (let i = 0; i < 5; i++) {
    const stripe = new THREE.Mesh(stripeGeo, m.matWhite);
    stripe.position.set(-2.0 + i * 1.0, 0.02, 0);
    root.add(stripe);
    roadStripes.push(stripe);
  }

  const scooterRoot = new THREE.Group();
  scooterRoot.position.set(0, 0.02, 0);
  root.add(scooterRoot);

  // Wheels
  const wheels: THREE.Group[] = [];
  [-0.65, 0.68].forEach((wx) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, 0.26, 0);
    scooterRoot.add(wheelGroup);

    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 12, 24), m.matDark);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), matChrome);
    rim.rotation.x = Math.PI / 2;
    wheelGroup.add(rim);

    wheels.push(wheelGroup);
  });

  // Scooter Chassis + Front Shield + Handlebars
  const floorboard = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.09, 0.36), m.matDark);
  floorboard.position.set(0, 0.28, 0);
  scooterRoot.add(floorboard);

  const rearBody = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.42), matScooterRed);
  rearBody.position.set(-0.55, 0.48, 0);
  rearBody.castShadow = true;
  scooterRoot.add(rearBody);

  const frontStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.72, 16), matScooterRed);
  frontStem.position.set(0.54, 0.62, 0);
  frontStem.rotation.z = 0.22;
  frontStem.castShadow = true;
  scooterRoot.add(frontStem);

  const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), m.matCheese);
  headlight.position.set(0.62, 0.88, 0);
  scooterRoot.add(headlight);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 10), matChrome);
  handlebar.rotation.x = Math.PI / 2;
  handlebar.position.set(0.48, 0.96, 0);
  scooterRoot.add(handlebar);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.34), m.matDark);
  seat.position.set(-0.22, 0.68, 0);
  scooterRoot.add(seat);

  // Hot Food Delivery Box on Back Rack!
  const foodBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.48), m.matChefWhite);
  foodBox.position.set(-0.78, 0.92, 0);
  foodBox.castShadow = true;
  scooterRoot.add(foodBox);

  const boxLid = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.08, 0.51), matScooterRed);
  boxLid.position.set(-0.78, 1.16, 0);
  scooterRoot.add(boxLid);

  // Cute Cartoon Rider wearing Chef Coat + Yellow Helmet
  const rider = new THREE.Group();
  rider.position.set(-0.14, 0.74, 0);
  scooterRoot.add(rider);

  const riderTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.52, 16), m.matChefWhite);
  riderTorso.position.y = 0.28;
  riderTorso.rotation.z = -0.18;
  riderTorso.castShadow = true;
  rider.add(riderTorso);

  const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 16), m.matSkin);
  riderHead.position.set(0.08, 0.68, 0);
  rider.add(riderHead);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
    matHelmet
  );
  helmet.position.set(0.08, 0.71, 0);
  helmet.rotation.z = -0.1;
  rider.add(helmet);

  // Fluttering Red Scarf behind rider
  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.14), matScooterRed);
  scarf.position.set(-0.18, 0.52, 0);
  rider.add(scarf);

  // Rider Arm reaching handlebar
  const riderArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 6, 8), m.matChefWhite);
  riderArm.position.set(0.34, 0.34, 0.18);
  riderArm.rotation.z = 1.15;
  rider.add(riderArm);

  // Speed Dust Puffs behind rear wheel
  const dustPuffs: {mesh: THREE.Mesh; offset: number}[] = [];
  const dustGeo = new THREE.SphereGeometry(0.085, 8, 8);
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(dustGeo, m.matDust.clone());
    root.add(puff);
    dustPuffs.push({mesh: puff, offset: i / 4});
  }

  return {
    group: root,
    update: (t: number) => {
      // Wheelie bounce + slight cruising weave
      const bounce = Math.abs(Math.sin(t * 9.5)) * 0.06;
      scooterRoot.position.y = 0.02 + bounce;
      scooterRoot.position.x = Math.sin(t * 1.6) * 0.22;
      scooterRoot.rotation.z = Math.sin(t * 3.2) * 0.05;
      scooterRoot.rotation.y = Math.sin(t * 0.9) * 0.25 - 0.15;

      for (const w of wheels) {
        w.rotation.z = -t * 14;
      }

      scarf.rotation.z = Math.sin(t * 15) * 0.25;
      scarf.rotation.y = Math.cos(t * 11) * 0.18;

      // Scrolling road stripes right-to-left to convey fast forward speed!
      roadStripes.forEach((stripe, idx) => {
        const x = ((2.5 - t * 3.8 + idx * 1.0) % 5.0 + 5.0) % 5.0 - 2.5;
        stripe.position.x = x;
      });

      for (const puff of dustPuffs) {
        const phase = (t * 2.2 + puff.offset) % 1;
        puff.mesh.position.set(
          scooterRoot.position.x - 0.95 - phase * 1.1,
          0.14 + phase * 0.28,
          (puff.offset - 0.5) * 0.22
        );
        const s = 0.55 + phase * 1.15;
        puff.mesh.scale.set(s, s, s);
        (puff.mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(phase * Math.PI) * 0.45;
      }
    },
  };
}

export function buildIntroScene(sceneId: IntroSceneId): BuiltIntroScene {
  const m = createSharedMaterials();
  switch (sceneId) {
    case 'wok-flip':
      return buildChefWokFlipScene(m);
    case 'pizza-spin':
      return buildPizzaSpinnerScene(m);
    case 'scooter-dash':
      return buildDeliveryScooterScene(m);
    case 'tom-jerry-chase':
    default:
      return buildTomAndJerryScene(m);
  }
}
