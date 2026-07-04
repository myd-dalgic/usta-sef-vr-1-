import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

// ============================================================
// TEMEL SAHNE
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecae6);
scene.fog = new THREE.Fog(0x8ecae6, 12, 26);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

// ============================================================
// IŞIKLANDIRMA
// ============================================================
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x5a4632, 1.1);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff2d6, 1.8);
sunLight.position.set(6, 9, 4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.left = -8;
sunLight.shadow.camera.right = 8;
sunLight.shadow.camera.top = 8;
sunLight.shadow.camera.bottom = -8;
sunLight.shadow.camera.far = 25;
scene.add(sunLight);

const kitchenLight = new THREE.PointLight(0xffcf8a, 1.2, 8, 2);
kitchenLight.position.set(0, 2.6, -3.5);
scene.add(kitchenLight);

// ============================================================
// OYUNCU RIG
// ============================================================
const playerRig = new THREE.Group();
playerRig.position.set(0, 0, 3);
scene.add(playerRig);
playerRig.add(camera);

// ============================================================
// ELDİVEN ELLER + TAŞINAN EŞYA YUVASI
// ============================================================
const controllerModelFactory = new XRControllerModelFactory();

function createGloveHand() {
  const group = new THREE.Group();
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const cuffMat = new THREE.MeshStandardMaterial({ color: 0x2a6f97, roughness: 0.6 });

  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), gloveMat);
  palm.scale.set(1.15, 0.85, 1.4);
  palm.position.set(0, 0, -0.04);
  palm.castShadow = true;
  group.add(palm);

  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.045, 2, 6), gloveMat);
    finger.rotation.x = Math.PI / 2;
    finger.position.set(-0.03 + i * 0.02, 0.01, -0.09);
    finger.castShadow = true;
    group.add(finger);
  }

  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.035, 2, 6), gloveMat);
  thumb.rotation.z = Math.PI / 3;
  thumb.position.set(-0.045, 0.005, -0.04);
  group.add(thumb);

  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12), cuffMat);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.set(0, 0, 0.03);
  group.add(cuff);

  const holdSlot = new THREE.Group();
  holdSlot.position.set(0, 0.02, -0.12);
  group.add(holdSlot);
  group.userData.holdSlot = holdSlot;

  return group;
}

const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
const glove1 = createGloveHand();
const glove2 = createGloveHand();
controller1.add(glove1);
controller2.add(glove2);
playerRig.add(controller1);
playerRig.add(controller2);
controller1.userData.holdSlot = glove1.userData.holdSlot;
controller2.userData.holdSlot = glove2.userData.holdSlot;
controller1.userData.isSelecting = false;
controller2.userData.isSelecting = false;
controller1.userData.carrying = null;
controller2.userData.carrying = null;

const grip1 = renderer.xr.getControllerGrip(0);
grip1.add(controllerModelFactory.createControllerModel(grip1));
playerRig.add(grip1);

const grip2 = renderer.xr.getControllerGrip(1);
grip2.add(controllerModelFactory.createControllerModel(grip2));
playerRig.add(grip2);

const controllers = [controller1, controller2];

// ============================================================
// ZEMİNLER
// ============================================================
const outsideFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 8),
  new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 1 })
);
outsideFloor.rotation.x = -Math.PI / 2;
outsideFloor.position.set(0, 0, 4);
outsideFloor.receiveShadow = true;
scene.add(outsideFloor);

const curbMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const curbGeo = new THREE.BoxGeometry(8, 0.05, 0.08);
for (let i = -1; i <= 1; i += 2) {
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.position.set(0, 0.03, 4 + i * 3.9);
  scene.add(curb);
}

const shopGroup = new THREE.Group();
scene.add(shopGroup);

const floorCanvas = document.createElement('canvas');
floorCanvas.width = 128; floorCanvas.height = 128;
const fctx = floorCanvas.getContext('2d');
fctx.fillStyle = '#c99a5b';
fctx.fillRect(0, 0, 128, 128);
fctx.fillStyle = '#b8874a';
fctx.fillRect(0, 0, 64, 64);
fctx.fillRect(64, 64, 64, 64);
const floorTex = new THREE.CanvasTexture(floorCanvas);
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(6, 5);

const shopFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 6),
  new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 })
);
shopFloor.rotation.x = -Math.PI / 2;
shopFloor.position.set(0, 0, -2);
shopFloor.receiveShadow = true;
shopGroup.add(shopFloor);

// ============================================================
// DÜKKAN DUVARLARI + TEZGAH + ÇATI
// ============================================================
const wallMat = new THREE.MeshStandardMaterial({ color: 0xf3e0b8, roughness: 0.95 });
function makeWall(w, h, d, x, y, z) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  shopGroup.add(wall);
  return wall;
}
makeWall(8, 3, 0.2, 0, 1.5, -5);
makeWall(0.2, 3, 6, -4, 1.5, -2);
makeWall(0.2, 3, 6, 4, 1.5, -2);

const counterMat = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.7 });
const counterTopMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.4 });
function makeCounterSegment(w, x) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, 0.4), counterMat);
  base.position.set(x, 0.45, 0.6);
  base.castShadow = true;
  base.receiveShadow = true;
  shopGroup.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.06, 0.45), counterTopMat);
  top.position.set(x, 0.93, 0.6);
  top.receiveShadow = true;
  shopGroup.add(top);
}
makeCounterSegment(2.6, -2.2);
makeCounterSegment(2.6, 2.2);

const roof = new THREE.Mesh(
  new THREE.BoxGeometry(8.2, 0.15, 3),
  new THREE.MeshStandardMaterial({ color: 0x9c2f2f, roughness: 0.8 })
);
roof.position.set(0, 3.05, -0.5);
roof.castShadow = true;
shopGroup.add(roof);

// Tabela
const signCanvas = document.createElement('canvas');
signCanvas.width = 512; signCanvas.height = 128;
const sctx = signCanvas.getContext('2d');
sctx.fillStyle = '#c0392b';
sctx.fillRect(0, 0, 512, 128);
sctx.fillStyle = '#ffffff';
sctx.font = 'bold 64px sans-serif';
sctx.textAlign = 'center';
sctx.textBaseline = 'middle';
sctx.fillText('USTAŞEF', 256, 64);
const signTex = new THREE.CanvasTexture(signCanvas);
const sign = new THREE.Mesh(
  new THREE.PlaneGeometry(2.4, 0.6),
  new THREE.MeshBasicMaterial({ map: signTex })
);
sign.position.set(0, 2.9, -4.89);
shopGroup.add(sign);

// ============================================================
// SKOR HUD
// ============================================================
let score = 0;
let tips = 0;

const hudCanvas = document.createElement('canvas');
hudCanvas.width = 512; hudCanvas.height = 128;
const hctx = hudCanvas.getContext('2d');
const hudTex = new THREE.CanvasTexture(hudCanvas);
function drawHUD() {
  hctx.clearRect(0, 0, 512, 128);
  hctx.fillStyle = 'rgba(20,20,20,0.85)';
  hctx.beginPath();
  hctx.roundRect(4, 4, 504, 120, 20);
  hctx.fill();
  hctx.fillStyle = '#ffd166';
  hctx.font = 'bold 44px sans-serif';
  hctx.textAlign = 'center';
  hctx.textBaseline = 'middle';
  hctx.fillText(`Puan: ${score}   Bahsis: ${tips}TL`, 256, 64);
  hudTex.needsUpdate = true;
}
drawHUD();
const hudPanel = new THREE.Mesh(
  new THREE.PlaneGeometry(1.6, 0.4),
  new THREE.MeshBasicMaterial({ map: hudTex, transparent: true })
);
hudPanel.position.set(0, 2.3, -4.85);
shopGroup.add(hudPanel);

// ============================================================
// METİN BALONU YARDIMCILARI
// ============================================================
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, cx, cy, maxWidth, lineHeight) {
  const words = text.split(' ');
  let lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? current + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight));
}

function makeTextSprite(text, opts = {}) {
  const canvas = document.createElement('canvas');
  const scaleFactor = 4;
  canvas.width = 256 * scaleFactor;
  canvas.height = 96 * scaleFactor;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.95)';
  roundRect(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 40);
  ctx.fill();
  ctx.strokeStyle = opts.border || '#333';
  ctx.lineWidth = 6;
  roundRect(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 40);
  ctx.stroke();

  ctx.fillStyle = opts.color || '#111';
  ctx.font = `bold ${34 * scaleFactor / 4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, text, canvas.width / 2, canvas.height / 2, canvas.width - 60, 40);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.9, 0.34, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function makeStatusSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.4, 0.4, 1);
  sprite.visible = false;
  sprite.userData.canvas = canvas;
  sprite.userData.ctx = canvas.getContext('2d');
  sprite.userData.tex = tex;
  return sprite;
}

function drawProgressRing(sprite, progress, color) {
  const ctx = sprite.userData.ctx;
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(64, 64, 50, -Math.PI / 2, -Math.PI / 2 + Math.max(0, Math.min(1, progress)) * Math.PI * 2);
  ctx.stroke();
  sprite.userData.tex.needsUpdate = true;
  sprite.visible = true;
}

function drawIcon(sprite, label, bg) {
  const ctx = sprite.userData.ctx;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 64, 68);
  sprite.userData.tex.needsUpdate = true;
  sprite.visible = true;
}

// ============================================================
// YEMEK MODELLERİ
// ============================================================
const FOOD_COLORS = {
  'Pizza': 0xe6b800,
  'Hamburger': 0x8b4513,
  'Patates Kızartması': 0xf4d35e,
  'İçecek': 0x3a6ea5,
};

function createFoodMesh(itemName) {
  const color = FOOD_COLORS[itemName] || 0xffffff;
  let geo;
  if (itemName === 'İçecek') geo = new THREE.CylinderGeometry(0.04, 0.035, 0.09, 10);
  else if (itemName === 'Pizza') geo = new THREE.CylinderGeometry(0.07, 0.07, 0.015, 16);
  else if (itemName === 'Hamburger') geo = new THREE.SphereGeometry(0.055, 10, 8);
  else geo = new THREE.BoxGeometry(0.05, 0.09, 0.05);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
  mesh.castShadow = true;
  return mesh;
}

// ============================================================
// MUTFAK İSTASYONLARI (etkileşimli)
// ============================================================
const COOK_TIME = 3.0;
const FIRE_CHANCE = 0.18;
const BREAK_CHANCE = 0.12;
const EXTINGUISH_HOLD = 1.4;
const REPAIR_HOLD = 1.8;
const INTERACT_RANGE = 1.35;

const stations = [];

function createStation(name, color, x, z, opts = {}) {
  const size = opts.size || [0.8, 0.9, 0.6];
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.15 })
  );
  body.position.y = size[1] / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const topAccent = new THREE.Mesh(
    new THREE.BoxGeometry(size[0] * 1.02, 0.03, size[2] * 1.02),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.4 })
  );
  topAccent.position.y = size[1] + 0.015;
  group.add(topAccent);

  const labelSprite = makeTextSprite(name, { bg: 'rgba(0,0,0,0.6)', color: '#fff', border: '#000' });
  labelSprite.scale.set(0.5, 0.19, 1);
  labelSprite.position.set(0, size[1] + 0.35, 0);
  group.add(labelSprite);

  const statusSprite = makeStatusSprite();
  statusSprite.position.set(0, size[1] + 0.7, 0);
  group.add(statusSprite);

  group.userData = {
    stationName: name,
    type: opts.type,
    produces: opts.produces,
    state: 'idle',
    progress: 0,
    useCount: 0,
    statusSprite,
    holdTimer: 0,
  };

  shopGroup.add(group);
  stations.push(group);
  return group;
}

createStation('Izgara', 0x8b3a3a, -3, -4, { type: 'cook', produces: 'Hamburger' });
createStation('Fritöz', 0xd2691e, -1.5, -4, { type: 'cook', produces: 'Patates Kızartması' });
createStation('Fırın (Pizza)', 0x5a3825, 0, -4, { type: 'cook', produces: 'Pizza', size: [0.9, 1.1, 0.7] });
createStation('İçecek Makinesi', 0x3a6ea5, 1.5, -4, { type: 'drink', produces: 'İçecek' });
createStation('Hazırlık Tezgahı', 0x777777, 3, -4, { type: 'prep', size: [1.2, 0.9, 0.6] });

const extinguisherStation = createStation('Yangın Tüpü', 0xcc0000, -3.6, -1, { type: 'tool', size: [0.25, 0.6, 0.25] });
const repairStation = createStation('Tamir Standı', 0x444444, 3.6, -1, { type: 'tool', size: [0.4, 0.6, 0.3] });
extinguisherStation.userData.state = 'tool';
repairStation.userData.state = 'tool';

function attachFire(station) {
  if (station.userData.fireMesh) return;
  const fire = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.35, 8),
    new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.85 })
  );
  fire.position.set(0, 1.1, 0);
  station.add(fire);
  station.userData.fireMesh = fire;
  const fireLight = new THREE.PointLight(0xff5500, 1.5, 2.5, 2);
  fireLight.position.set(0, 1.2, 0);
  station.add(fireLight);
  station.userData.fireLight = fireLight;
}
function removeFire(station) {
  if (station.userData.fireMesh) {
    station.remove(station.userData.fireMesh);
    station.remove(station.userData.fireLight);
    station.userData.fireMesh = null;
    station.userData.fireLight = null;
  }
}

// ============================================================
// MÜŞTERİ TİPLERİ (5 farklı görünüm + kendine özgü diyalog havuzu)
// ============================================================
const ORDER_ITEMS = ['Pizza', 'Hamburger', 'Patates Kızartması', 'İçecek'];

const CUSTOMER_TYPES = [
  {
    name: 'Aceleci Ofis Çalışanı',
    shirt: 0x264653, skin: 0xf1c27d, hair: 0x2b2b2b,
    lines: [
      'Çabuk olabilir miyiz, öğle molam bitiyor! {item} istiyorum.',
      'Bir {item}, hızlıca lütfen!',
      'Toplantıya geç kalıyorum, {item} verir misin?',
    ],
  },
  {
    name: 'Neşeli Öğrenci',
    shirt: 0xe9c46a, skin: 0xffddb0, hair: 0x6b4226,
    lines: [
      'Selam usta! Bir {item} alabilir miyim?',
      '{item} çok özledim, bir tane rica etsem?',
      'Arkadaşlarla buluşacağız, {item} lütfen!',
    ],
  },
  {
    name: 'Sakin Emekli',
    shirt: 0x8d99ae, skin: 0xe8b98a, hair: 0xcccccc,
    lines: [
      'Merhaba evladım, bir {item} rica edeceğim.',
      'Acelem yok, güzelce bir {item} hazırla yeter.',
      'Bugün canım {item} çekti de.',
    ],
  },
  {
    name: 'Sportmen Genç',
    shirt: 0x2a9d8f, skin: 0xc68642, hair: 0x1a1a1a,
    lines: [
      'Antrenmandan geliyorum, {item} lazım bana!',
      'Kaptan, bir {item} at şöyle!',
      'Enerjim bitti, {item} imdada yetişsin.',
    ],
  },
  {
    name: 'Meraklı Turist',
    shirt: 0xe76f51, skin: 0xffe0bd, hair: 0x4a3222,
    lines: [
      'Bir {item} istiyorum lütfen!',
      'Buranın ünlü {item}\'inden bir tane alabilir miyim?',
      'Tavsiyeniz {item} mi? Öyleyse onu deneyeyim!',
    ],
  },
];

const LEAVE_HAPPY_LINES = [
  'Teşekkürler, afiyet olsun bana!',
  'Harikaydı, tekrar gelirim!',
  'Eline sağlık usta!',
];
const LEAVE_ANGRY_LINES = [
  'Çok bekledim, vazgeçtim!',
  'Bu kadar sabrım yetmez...',
  'Başka yere gidiyorum!',
];
const LEAVE_WRONG_ITEM_LINES = [
  'Ben bunu istememiştim ama...',
  'Yanlış geldi galiba, neyse alayım.',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class Customer {
  constructor(spawnPos, queuePos) {
    this.typeIndex = Math.floor(Math.random() * CUSTOMER_TYPES.length);
    this.type = CUSTOMER_TYPES[this.typeIndex];

    this.group = new THREE.Group();
    this.group.position.copy(spawnPos);
    this.queuePos = queuePos;
    this.state = 'walking_in';
    this.waitTime = 0;
    this.maxWait = 28;
    this.order = randomFrom(ORDER_ITEMS);
    this.walkT = Math.random() * 10;

    this.buildBody();
    this.showBubble(randomFrom(this.type.lines).replace('{item}', this.order));

    scene.add(this.group);
  }

  buildBody() {
    const bodyMat = new THREE.MeshStandardMaterial({ color: this.type.shirt, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: this.type.skin, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: this.type.hair, roughness: 0.9 });

    this.torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), bodyMat);
    this.torso.position.y = 0.95;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skinMat);
    this.head.position.y = 1.55;
    this.head.castShadow = true;
    this.group.add(this.head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hair.position.y = 1.6;
    this.group.add(hair);

    const armGeo = new THREE.CapsuleGeometry(0.05, 0.35, 2, 6);
    this.armL = new THREE.Mesh(armGeo, bodyMat);
    this.armL.position.set(-0.28, 1.0, 0);
    this.armR = this.armL.clone();
    this.armR.position.set(0.28, 1.0, 0);
    this.group.add(this.armL, this.armR);

    const legGeo = new THREE.CapsuleGeometry(0.07, 0.45, 2, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2b2b40, roughness: 0.8 });
    this.legL = new THREE.Mesh(legGeo, legMat);
    this.legL.position.set(-0.1, 0.4, 0);
    this.legR = this.legL.clone();
    this.legR.position.set(0.1, 0.4, 0);
    this.group.add(this.legL, this.legR);

    this.orderIcon = createFoodMesh(this.order);
    this.orderIcon.position.set(0.3, 1.9, 0);
    this.orderIcon.scale.set(1.4, 1.4, 1.4);
    this.group.add(this.orderIcon);
  }

  showBubble(text) {
    if (this.bubble) this.group.remove(this.bubble);
    this.bubble = makeTextSprite(text);
    this.bubble.position.set(0, 2.05, 0);
    this.group.add(this.bubble);
  }

  update(dt) {
    this.walkT += dt;

    if (this.state === 'walking_in') {
      const dir = new THREE.Vector3().subVectors(this.queuePos, this.group.position);
      const dist = dir.length();
      if (dist > 0.05) {
        dir.normalize();
        this.group.position.addScaledVector(dir, Math.min(dist, dt * 1.1));
        this.group.lookAt(this.queuePos.x, this.group.position.y, this.queuePos.z);
        this.walkBob(true);
      } else {
        this.state = 'waiting';
      }
    } else if (this.state === 'waiting') {
      this.walkBob(false);
      this.waitTime += dt;
      if (this.waitTime > this.maxWait) {
        this.leave('angry');
      }
    } else if (this.state === 'leaving') {
      const exitPos = new THREE.Vector3(this.group.position.x, 0, 9);
      const dir = new THREE.Vector3().subVectors(exitPos, this.group.position);
      const dist = dir.length();
      if (dist > 0.1) {
        dir.normalize();
        this.group.position.addScaledVector(dir, dt * 1.3);
        this.group.lookAt(exitPos.x, this.group.position.y, exitPos.z);
        this.walkBob(true);
      } else {
        this.markForRemoval = true;
      }
    }
  }

  walkBob(active) {
    const t = this.walkT * 6;
    if (active) {
      this.group.position.y = Math.abs(Math.sin(t)) * 0.03;
      this.legL.rotation.x = Math.sin(t) * 0.5;
      this.legR.rotation.x = -Math.sin(t) * 0.5;
      this.armL.rotation.x = -Math.sin(t) * 0.4;
      this.armR.rotation.x = Math.sin(t) * 0.4;
    } else {
      const idle = Math.sin(this.walkT * 1.5) * 0.015;
      this.torso.position.y = 0.95 + idle;
      this.head.position.y = 1.55 + idle;
      this.legL.rotation.x = 0;
      this.legR.rotation.x = 0;
    }
  }

  serve(itemName) {
    if (this.state !== 'waiting') return false;
    const correct = itemName === this.order;
    if (correct) {
      score += 10;
      tips += Math.max(5, 20 - Math.floor(this.waitTime));
      this.showBubble(randomFrom(LEAVE_HAPPY_LINES));
    } else {
      score += 2;
      tips += 2;
      this.showBubble(randomFrom(LEAVE_WRONG_ITEM_LINES));
    }
    drawHUD();
    this.orderIcon.visible = false;
    this.state = 'leaving';
    return true;
  }

  leave(reason) {
    if (reason === 'angry') {
      this.showBubble(randomFrom(LEAVE_ANGRY_LINES));
    }
    this.state = 'leaving';
  }

  dispose() {
    scene.remove(this.group);
  }
}

const customers = [];
const QUEUE_SPOTS = [
  new THREE.Vector3(0, 0, 5),
  new THREE.Vector3(0, 0, 6.2),
  new THREE.Vector3(0, 0, 7.4),
];

for (let i = 0; i < QUEUE_SPOTS.length; i++) {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.35, 20),
    new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.copy(QUEUE_SPOTS[i]).setY(0.01);
  scene.add(marker);
}

let spawnCooldown = 3;
const SPAWN_INTERVAL = 8;

function trySpawnCustomer() {
  const occupied = customers.filter((c) => c.state === 'waiting' || c.state === 'walking_in').length;
  if (occupied >= QUEUE_SPOTS.length) return;
  const freeSpot = QUEUE_SPOTS[occupied];
  const spawnPos = new THREE.Vector3(0, 0, 10);
  customers.push(new Customer(spawnPos, freeSpot));
}

function getFrontCustomer() {
  return customers.find((c) => c.state === 'waiting');
}

// ============================================================
// İSTASYON ETKİLEŞİM MANTIĞI
// ============================================================
function distanceXZ(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function nearestStationTo(position, maxDist = INTERACT_RANGE) {
  let best = null, bestDist = Infinity;
  for (const st of stations) {
    const d = distanceXZ(position, st.position);
    if (d < maxDist && d < bestDist) { best = st; bestDist = d; }
  }
  return best;
}

function handleTriggerPress(controller) {
  const worldPos = new THREE.Vector3();
  controller.getWorldPosition(worldPos);

  if (controller.userData.carrying) {
    const front = getFrontCustomer();
    if (front) {
      const custDist = distanceXZ(worldPos, front.group.position);
      if (custDist < 2.2) {
        front.serve(controller.userData.carrying);
        clearCarry(controller);
        return;
      }
    }
    return;
  }

  const station = nearestStationTo(worldPos);
  if (!station) return;
  const data = station.userData;

  if (data.type === 'tool') return;

  if (data.state === 'idle') {
    data.state = 'cooking';
    data.progress = 0;
  } else if (data.state === 'ready') {
    giveCarry(controller, data.produces);
    data.state = 'idle';
    data.statusSprite.visible = false;
  }
}

function giveCarry(controller, itemName) {
  clearCarry(controller);
  const mesh = createFoodMesh(itemName);
  controller.userData.holdSlot.add(mesh);
  controller.userData.carrying = itemName;
  controller.userData.carryMesh = mesh;
}

function clearCarry(controller) {
  if (controller.userData.carryMesh) {
    controller.userData.holdSlot.remove(controller.userData.carryMesh);
    controller.userData.carryMesh = null;
  }
  controller.userData.carrying = null;
}

controllers.forEach((c) => {
  c.addEventListener('selectstart', () => {
    c.userData.isSelecting = true;
    handleTriggerPress(c);
  });
  c.addEventListener('selectend', () => {
    c.userData.isSelecting = false;
  });
});

function updateToolInteractions(dt) {
  let extinguishing = false;
  let repairing = false;

  for (const controller of controllers) {
    if (!controller.userData.isSelecting) continue;
    const worldPos = new THREE.Vector3();
    controller.getWorldPosition(worldPos);

    if (distanceXZ(worldPos, extinguisherStation.position) < INTERACT_RANGE + 0.3) {
      extinguishing = true;
    }
    if (distanceXZ(worldPos, repairStation.position) < INTERACT_RANGE + 0.3) {
      repairing = true;
    }
  }

  for (const st of stations) {
    const data = st.userData;
    if (data.state === 'fire') {
      if (extinguishing) {
        data.holdTimer += dt;
        drawProgressRing(data.statusSprite, 1 - data.holdTimer / EXTINGUISH_HOLD, '#3aa0ff');
        if (data.holdTimer >= EXTINGUISH_HOLD) {
          data.state = 'idle';
          data.holdTimer = 0;
          removeFire(st);
          data.statusSprite.visible = false;
        }
      } else {
        data.holdTimer = Math.max(0, data.holdTimer - dt * 0.5);
      }
    } else if (data.state === 'broken') {
      if (repairing) {
        data.holdTimer += dt;
        drawProgressRing(data.statusSprite, data.holdTimer / REPAIR_HOLD, '#8bd450');
        if (data.holdTimer >= REPAIR_HOLD) {
          data.state = 'idle';
          data.holdTimer = 0;
          data.statusSprite.visible = false;
        }
      } else {
        data.holdTimer = Math.max(0, data.holdTimer - dt * 0.5);
      }
    }
  }
}

function updateStations(dt) {
  for (const st of stations) {
    const data = st.userData;
    if (data.type === 'tool') continue;

    if (data.state === 'cooking') {
      data.progress += dt / COOK_TIME;
      drawProgressRing(data.statusSprite, data.progress, '#ffb703');
      if (data.progress >= 1) {
        data.useCount++;
        if (Math.random() < FIRE_CHANCE) {
          data.state = 'fire';
          data.holdTimer = 0;
          attachFire(st);
          drawIcon(data.statusSprite, 'YANGIN', '#ff5500');
        } else if (Math.random() < BREAK_CHANCE) {
          data.state = 'broken';
          data.holdTimer = 0;
          drawIcon(data.statusSprite, 'ARIZA', '#555555');
        } else {
          data.state = 'ready';
          drawIcon(data.statusSprite, 'HAZIR', '#2a9d8f');
        }
      }
    }
  }
}

// ============================================================
// RESIZE
// ============================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// VR GİRİŞ
// ============================================================
document.getElementById('vr-button-container').appendChild(
  VRButton.createButton(renderer, { optionalFeatures: ['local-floor', 'bounded-floor'] })
);

// ============================================================
// RENDER LOOP
// ============================================================
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);

  spawnCooldown -= dt;
  if (spawnCooldown <= 0) {
    trySpawnCustomer();
    spawnCooldown = SPAWN_INTERVAL;
  }

  for (let i = customers.length - 1; i >= 0; i--) {
    customers[i].update(dt);
    if (customers[i].markForRemoval) {
      customers[i].dispose();
      customers.splice(i, 1);
    }
  }

  updateStations(dt);
  updateToolInteractions(dt);

  const t = clock.elapsedTime;
  kitchenLight.intensity = 1.2 * (1 + Math.sin(t * 1.2) * 0.03);

  for (const st of stations) {
    if (st.userData.fireMesh) {
      st.userData.fireMesh.scale.setScalar(1 + Math.sin(t * 12) * 0.15);
    }
  }

  renderer.render(scene, camera);
});
