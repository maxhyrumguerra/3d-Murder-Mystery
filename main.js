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
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

// ===== PLAYER =====
const player = {
  mesh: new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  ),
  height: 1.8,
  velocityY: 0,
  speed: 0.12,
  canJump: false
};

player.mesh.position.set(0, player.height, 0);
scene.add(player.mesh);

camera.position.y = player.height;
camera.position.z = 5;

// ===== INPUT =====
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// Mouse look
document.body.addEventListener("click", () => document.body.requestPointerLock());
document.addEventListener("mousemove", e => {
  if(document.pointerLockElement === document.body) {
    camera.rotation.y -= e.movementX * 0.002;
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
createNPC(5, 5, 0x00ff00);
createNPC(-5, -5, 0x0000ff);

// ===== TASKS =====
const tasks = [];
function createTask(x, z, color) {
  const task = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.2, 1),
    new THREE.MeshStandardMaterial({ color })
  );
  task.position.set(x, 0.1, z);
  scene.add(task);
  tasks.push({mesh: task, color, completed: false});
}
createTask(3, 0, 0xff0000);
createTask(-3, 0, 0x00ff00);

// ===== GAME LOOP =====
const raycaster = new THREE.Raycaster();

function animate() {
  requestAnimationFrame(animate);

  // ===== PLAYER MOVEMENT =====
  const dir = new THREE.Vector3();
  if(keys["KeyW"]) dir.z -= 1;
  if(keys["KeyS"]) dir.z += 1;
  if(keys["KeyA"]) dir.x -= 1;
  if(keys["KeyD"]) dir.x += 1;
  dir.normalize();
  dir.applyAxisAngle(new THREE.Vector3(0,1,0), camera.rotation.y);
  player.mesh.position.addScaledVector(dir, player.speed);

  // Gravity
  player.velocityY -= 0.01;
  player.mesh.position.y += player.velocityY;

  // Raycast down
  raycaster.set(player.mesh.position, new THREE.Vector3(0,-1,0));
  const intersects = raycaster.intersectObject(floor);
  if(intersects.length>0 && intersects[0].distance < player.height) {
    player.mesh.position.y = player.height;
    player.velocityY = 0;
    player.canJump = true;
  }

  // Jump
  if(keys["Space"] && player.canJump) {
    player.velocityY = 0.2;
    player.canJump = false;
  }

  // ===== NPC MOVEMENT =====
  npcs.forEach(npc => {
    npc.position.addScaledVector(npc.direction, 0.05);
    // bounce off edges
    if(Math.abs(npc.position.x) > 20 || Math.abs(npc.position.z) > 20) npc.direction.negate();
  });

  // ===== TASK CHECK =====
  tasks.forEach(task => {
    if(!task.completed && player.mesh.position.distanceTo(task.mesh.position)<1.5) {
      task.completed = true;
      task.mesh.material.color.set(0xffffff); // mark as done
      console.log("Task completed! Color matched:", task.color.toString(16));
    }
  });

  // Camera follows player
  camera.position.x = player.mesh.position.x;
  camera.position.z = player.mesh.position.z + 5;
  camera.lookAt(player.mesh.position);

  renderer.render(scene, camera);
}

animate();
