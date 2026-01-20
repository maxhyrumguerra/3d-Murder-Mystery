// ===== SCENE SETUP =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ===== LIGHT =====
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444));

// ===== PLAYER =====
const player = {
  height: 1.8,
  velocityY: 0,
  speed: 0.12,
  canJump: false,
  mesh: new THREE.Object3D()
};
scene.add(player.mesh);
camera.position.y = player.height;
player.mesh.add(camera); // camera is inside player for FP view

// ===== INPUT =====
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// Mouse look
document.body.addEventListener("click", () => document.body.requestPointerLock());
document.addEventListener("mousemove", e => {
  if(document.pointerLockElement === document.body) {
    player.mesh.rotation.y -= e.movementX * 0.002;
    camera.rotation.x -= e.movementY * 0.002;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
  }
});

// ===== FLOOR =====
const floorGeo = new THREE.BoxGeometry(50, 1, 50);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.y = -0.5;
scene.add(floor);

// ===== WALLS =====
const walls = [];
function createWall(x, z, w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const wall = new THREE.Mesh(geo, mat);
  wall.position.set(x, h/2, z);
  scene.add(wall);
  walls.push(wall);
}
createWall(0, -10, 40, 3, 1);  // back wall
createWall(0, 10, 40, 3, 1);   // front wall
createWall(-20, 0, 1, 3, 20);  // left wall
createWall(20, 0, 1, 3, 20);   // right wall
createWall(0, 0, 10, 3, 1);    // middle obstacle

// ===== NPCS =====
const npcs = [];
function createNPC(x, z, color) {
  const npc = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1, 4, 8),
    new THREE.MeshStandardMaterial({ color })
  );
  npc.position.set(x, player.height, z);
  scene.add(npc);
  npc.direction = new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize();
  npcs.push(npc);
}
createNPC
