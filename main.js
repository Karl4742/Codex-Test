import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88a7d6);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const overlay = document.querySelector("#overlay");

const hemi = new THREE.HemisphereLight(0xffffff, 0x3d4b2f, 0.95);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(6, 10, 2);
scene.add(sun);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.MeshStandardMaterial({ color: 0x5e5e5e, roughness: 0.9 })
);
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

const grid = new THREE.GridHelper(24, 24, 0x333333, 0x222222);
scene.add(grid);

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8f97, roughness: 0.95 });
const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x747d8c, roughness: 0.9 });

const colliders = [];

function addColliderBox(x, y, z, width, height, depth, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y + height / 2, z);
  scene.add(mesh);

  colliders.push({
    minX: x - width / 2,
    maxX: x + width / 2,
    minY: y,
    maxY: y + height,
    minZ: z - depth / 2,
    maxZ: z + depth / 2
  });
}

const roomHalf = 10;
const wallThickness = 1;
const wallHeight = 4;

addColliderBox(0, 0, -roomHalf, roomHalf * 2 + wallThickness * 2, wallHeight, wallThickness, wallMaterial);
addColliderBox(0, 0, roomHalf, roomHalf * 2 + wallThickness * 2, wallHeight, wallThickness, wallMaterial);
addColliderBox(-roomHalf, 0, 0, wallThickness, wallHeight, roomHalf * 2, wallMaterial);
addColliderBox(roomHalf, 0, 0, wallThickness, wallHeight, roomHalf * 2, wallMaterial);
addColliderBox(0, 0, 0, 2, wallHeight, 2, pillarMaterial);

const player = {
  radius: 0.35,
  height: 1.8,
  eyeOffset: 1.6,
  position: new THREE.Vector3(0, 0, 6),
  velocityY: 0,
  yaw: Math.PI,
  pitch: 0,
  onGround: false,
  speed: 5,
  jumpSpeed: 5.5,
  gravity: 14
};

camera.position.set(player.position.x, player.position.y + player.eyeOffset, player.position.z);

const heldHand = new THREE.Group();
const skin = new THREE.MeshStandardMaterial({ color: 0xe2b280, roughness: 0.8 });

const palm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.2), skin);
palm.position.set(0, 0, 0);
heldHand.add(palm);

for (let i = 0; i < 4; i++) {
  const finger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.09), skin);
  finger.position.set(-0.075 + i * 0.05, 0.04, -0.12);
  heldHand.add(finger);
}

const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.1), skin);
thumb.rotation.y = -0.6;
thumb.position.set(-0.13, -0.02, -0.03);
heldHand.add(thumb);

heldHand.position.set(0.35, -0.35, -0.55);
heldHand.rotation.set(-0.25, -0.55, 0.25);
camera.add(heldHand);
scene.add(camera);

const pressed = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  Space: false
};

window.addEventListener("keydown", (event) => {
  if (event.code in pressed) {
    pressed[event.code] = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code in pressed) {
    pressed[event.code] = false;
  }
});

overlay.addEventListener("click", () => {
  document.body.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  overlay.classList.toggle("hidden", document.pointerLockElement === document.body);
});

window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== document.body) {
    return;
  }

  player.yaw -= event.movementX * 0.0025;
  player.pitch -= event.movementY * 0.0025;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function intersectsCollider(x, y, z) {
  const minX = x - player.radius;
  const maxX = x + player.radius;
  const minY = y;
  const maxY = y + player.height;
  const minZ = z - player.radius;
  const maxZ = z + player.radius;

  return colliders.some(
    (c) =>
      maxX > c.minX &&
      minX < c.maxX &&
      maxY > c.minY &&
      minY < c.maxY &&
      maxZ > c.minZ &&
      minZ < c.maxZ
  );
}

const clock = new THREE.Clock();

function update() {
  const dt = Math.min(clock.getDelta(), 0.05);

  const forward = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const move = new THREE.Vector3();

  if (pressed.KeyW) move.add(forward);
  if (pressed.KeyS) move.sub(forward);
  if (pressed.KeyD) move.add(right);
  if (pressed.KeyA) move.sub(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(player.speed * dt);
  }

  const nextX = player.position.x + move.x;
  if (!intersectsCollider(nextX, player.position.y, player.position.z)) {
    player.position.x = nextX;
  }

  const nextZ = player.position.z + move.z;
  if (!intersectsCollider(player.position.x, player.position.y, nextZ)) {
    player.position.z = nextZ;
  }

  if (pressed.Space && player.onGround) {
    player.velocityY = player.jumpSpeed;
    player.onGround = false;
  }

  player.velocityY -= player.gravity * dt;
  let nextY = player.position.y + player.velocityY * dt;

  if (nextY <= 0) {
    nextY = 0;
    player.velocityY = 0;
    player.onGround = true;
  }

  if (!intersectsCollider(player.position.x, nextY, player.position.z)) {
    player.position.y = nextY;
  } else {
    if (player.velocityY < 0) {
      player.onGround = true;
    }
    player.velocityY = 0;
  }

  camera.position.set(player.position.x, player.position.y + player.eyeOffset, player.position.z);
  camera.rotation.set(player.pitch, player.yaw, 0, "YXZ");

  renderer.render(scene, camera);
  requestAnimationFrame(update);
}

update();
