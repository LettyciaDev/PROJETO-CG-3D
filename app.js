// app.js - Inicialização
const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a24);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(6, 6, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Adicionar OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight1.position.set(10, 20, 15);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(-10, -10, -10);
scene.add(dirLight2);

// Atualizar no loop de animação:
// controls.update();

const PALETTES = {
  standard: { U: 0xffffff, D: 0xffd500, L: 0xff5800, R: 0xb71234, F: 0x009b48, B: 0x0046ad },
  neon:     { U: 0xffffff, D: 0xffff00, L: 0xff007f, R: 0xff3300, F: 0x00ff66, B: 0x00ffff },
  pastel:   { U: 0xf0f0f0, D: 0xffeab0, L: 0xffb3ba, R: 0xffdfba, F: 0xbaffc9, B: 0xbae1ff }
};

let currentPalette = PALETTES.standard;

function getFaceMaterials(palette) {
  // Ordem dos materiais no BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
  return [
    new THREE.MeshStandardMaterial({ color: palette.R, roughness: 0.3 }), // Right
    new THREE.MeshStandardMaterial({ color: palette.L, roughness: 0.3 }), // Left
    new THREE.MeshStandardMaterial({ color: palette.U, roughness: 0.3 }), // Up
    new THREE.MeshStandardMaterial({ color: palette.D, roughness: 0.3 }), // Down
    new THREE.MeshStandardMaterial({ color: palette.F, roughness: 0.3 }), // Front
    new THREE.MeshStandardMaterial({ color: palette.B, roughness: 0.3 })  // Back
  ];
}