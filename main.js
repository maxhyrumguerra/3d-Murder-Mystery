// ----- Scene setup -----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ----- Lighting -----
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

// ----- Player -----
const player = {
  height: 1.8,
  velocityY: 0,
  speed: 0.12,
  canJump: false,
  mesh: new THREE.Object3D()
};
scene.add(player.mesh);
camera.position.y = player.height;
player.mesh.add(camera); // Camera follows player mesh

// ----- Input -----
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// Pointer lock for mouse look
document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
});
document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === document.body) {
    player.mesh.rotation.y -= e.movementX * 0.002;
    camera.rotation.x -= e.movementY * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
  }
});

// ----- Floor -----
const floorGeo = new THREE.BoxGeometry(50, 1, 50);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.y = -0.5;
scene.add(floor);

// ----- Walls -----
const walls = [];
function createWall(x, z, w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const wall = new THREE.Mesh(geo, mat);
  wall.position.set(x, h / 2, z);
  scene.add(wall);
  walls.push(wall);
}
// Outer walls
createWall(0, -25, 50, 5, 1);
createWall(0, 25, 50, 5, 1);
createWall(-25, 0, 1, 5, 50);
createWall(25, 0, 1, 5, 50);
// Inner walls
createWall(0, 0, 10, 5, 1);
createWall(-10, 10, 1, 5, 10);
createWall(10, -10, 1, 5, 10);

// ----- NPCs -----
const npcs = [];
function createNPC(x, z, color) {
  const npc = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1, 4, 8),
    new THREE.MeshStandardMaterial({ color })
  );
  npc.position.set(x, player.height, z);
  scene.add(npc);
  npc.direction = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
  npcs.push(npc);
}
createNPC(5, 5, 0x00ff00);
createNPC(-5, -5, 0x0000ff);
createNPC(15, 10, 0xff00ff);

// ----- Tasks -----
const tasks = [];
function createTask(x, z, color) {
  const task = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.2, 1),
    new THREE.MeshStandardMaterial({ color })
  );
  task.position.set(x, 0.1, z);
  scene.add(task);
  tasks.push({ mesh: task, color, completed: false });
}
createTask(3, 0, 0xff0000);
createTask(-3, 0, 0x00ff00);
createTask(0, 10, 0x0000ff);

// ----- Raycaster for ground collision -----
const raycaster = new THREE.Raycaster();

// ----- Collision helper -----
function checkWallCollision(newPos) {
  for (let wall of walls) {
    const dx = Math.abs(newPos.x - wall.position.x);
    const dz = Math.abs(newPos.z - wall.position.z);
    const wallHalfX = wall.geometry.parameters.width / 2;
    const wallHalfZ = wall.geometry.parameters.depth / 2;
    if (dx < wallHalfX + 0.5 && dz < wallHalfZ + 0.5) {
      return true; // collision
    }
  }
  return false;
}

// ----- Animate loop -----
function animate() {
  requestAnimationFrame(animate);

  // Player movement vector
  const dir = new THREE.Vector3();
  if (keys["KeyW"]) dir.z -= 1;
  if (keys["KeyS"]) dir.z += 1;
  if (keys["KeyA"]) dir.x -= 1;
  if (keys["KeyD"]) dir.x += 1;
  dir.normalize();
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.mesh.rotation.y);

  // Check collisions with walls before moving
  const futurePos = player.mesh.position.clone().addScaledVector(dir, player.speed);
  if (!checkWallCollision(futurePos)) {
    player.mesh.position.copy(futurePos);
  }

  // Gravity
  player.velocityY -= 0.01;
  player.mesh.position.y += player.velocityY;

  // Raycast down to floor
  raycaster.set(player.mesh.position, new THREE.Vector3(0, -1, 0));
  const intersects = raycaster.intersectObject(floor);
  if (intersects.length > 0 && intersects[0].distance < player.height) {
    player.mesh.position.y = player.height;
    player.velocityY = 0;
    player.canJump = true;
  }

  // Jumping
  if (keys["Space"] && player.canJump) {
    player.velocityY = 0.2;
    player.canJump = false;
  }

  // NPC movement
  npcs.forEach(npc => {
    npc.position.addScaledVector(npc.direction, 0.05);

    // Bounce off walls and boundaries
    if (Math.abs(npc.position.x) > 24 || Math.abs(npc.position.z) > 24) npc.direction.negate();

    // Bounce off walls roughly
    walls.forEach(wall => {
      const dx = Math.abs(npc.position.x - wall.position.x);
      const dz = Math.abs(npc.position.z - wall.position.z);
      const wallHalfX = wall.geometry.parameters.width / 2;
      const wallHalfZ = wall.geometry.parameters.depth / 2;
      if (dx < wallHalfX + 0.5 && dz < wallHalfZ + 0.5) {
        npc.direction.negate();
      }
    });
  });

  // Check tasks proximity
  tasks.forEach(task => {
    if (!task.completed && player.mesh.position.distanceTo(task.mesh.position) < 1.5) {
      task.completed = true;
      task.mesh.material.color.set(0xffffff); // mark as done
      console.log(`Task completed! Color: #${task.color.toString(16)}`);
    }
  });

  // Respawn if fall off map
  if (player.mesh.position.y < -5) {
    player.mesh.position.set(0, player.height, 0);
    player.velocityY = 0;
  }

  renderer.render(scene, camera);
}

// Handle resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
