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

// Set player spawn position away from walls (e.g., in front of middle wall)
player.mesh.position.set(0, player.height, 10);
