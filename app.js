// app.js - Inicialização
const container = document.getElementById("canvas-container");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a24);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
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

window.addEventListener("resize", () => {
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
controls.update();

const PALETTES = {
  standard: {
    U: 0xffffff,
    D: 0xffd500, 
    L: 0xff5800,
    R: 0xb71234,
    F: 0x009b48,
    B: 0x0046ad,
  },
  neon: {
    U: 0xffffff,
    D: 0xffff00,
    L: 0xff007f,
    R: 0xff3300,
    F: 0x00ff66,
    B: 0x00ffff,
  },
  pastel: {
    U: 0xf0f0f0,
    D: 0xffeab0,
    L: 0xffb3ba,
    R: 0xffdfba,
    F: 0xbaffc9,
    B: 0xbae1ff,
  },
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
    new THREE.MeshStandardMaterial({ color: palette.B, roughness: 0.3 }), // Back
  ];
}

const CUBE_SIZE = 1;
const CUBE_GAP = 0.05;
const OFFSET = CUBE_SIZE + CUBE_GAP;

const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

const cubies = [];

function createRubiksCube() {
  const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const materials = getFaceMaterials(currentPalette);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const cubie = new THREE.Mesh(geometry, materials);
        cubie.position.set(x * OFFSET, y * OFFSET, z * OFFSET);
        cubie.userData = {
          initialPos: new THREE.Vector3(x * OFFSET, y * OFFSET, z * OFFSET),
        };

        cubeGroup.add(cubie);
        cubies.push(cubie);
      }
    }
  }
}

createRubiksCube();

function getCubiesForFace(face) {
  const threshold = OFFSET * 0.5;
  return cubies.filter((cubie) => {
    const pos = new THREE.Vector3();
    cubie.getWorldPosition(pos);

    switch (face) {
      case "U":
        return pos.y > threshold;
      case "D":
        return pos.y < -threshold;
      case "R":
        return pos.x > threshold;
      case "L":
        return pos.x < -threshold;
      case "F":
        return pos.z > threshold;
      case "B":
        return pos.z < -threshold;
      default:
        return false;
    }
  });
}

let isAnimating = false;

function rotateFace(
  face,
  angle = Math.PI / 2,
  duration = 300,
  onComplete = null,
) {
  if (isAnimating) return;
  isAnimating = true;

  const faceCubies = getCubiesForFace(face);
  const pivot = new THREE.Group();
  scene.add(pivot);

  // Anexa cubinhos ao pivô mantendo transformações
  faceCubies.forEach((cubie) => pivot.attach(cubie));

  const axisMap = {
    U: new THREE.Vector3(0, 1, 0),
    D: new THREE.Vector3(0, -1, 0),
    R: new THREE.Vector3(1, 0, 0),
    L: new THREE.Vector3(-1, 0, 0),
    F: new THREE.Vector3(0, 0, 1),
    B: new THREE.Vector3(0, 0, -1),
  };

  const axis = axisMap[face];
  let startTime = null;

  function animateRotation(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);

    // Interpolação suave (easeOutQuad)
    const easedProgress = progress * (2 - progress);
    pivot.setRotationFromAxisAngle(axis, angle * easedProgress);

    if (progress < 1) {
      requestAnimationFrame(animateRotation);
    } else {
      pivot.setRotationFromAxisAngle(axis, angle);
      pivot.updateMatrixWorld();

      // Devolve cubinhos para a cena raiz e limpa o pivô
      faceCubies.forEach((cubie) => {
        cubeGroup.attach(cubie);
        // Ajuste de precisão para evitar arredondamentos numéricos
        cubie.position.x = Math.round(cubie.position.x / OFFSET) * OFFSET;
        cubie.position.y = Math.round(cubie.position.y / OFFSET) * OFFSET;
        cubie.position.z = Math.round(cubie.position.z / OFFSET) * OFFSET;
      });

      scene.remove(pivot);
      isAnimating = false;
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(animateRotation);
}

let moveCount = 0;

function makeMove(face) {
  if (isAnimating) return;
  rotateFace(face, Math.PI / 2, 250, () => {
    moveCount++;
    document.getElementById("move-count").innerText = moveCount;
    checkWinCondition();
  });
}

function scrambleCube(numMoves = 15) {
  if (isAnimating) return;
  const faces = ["U", "D", "L", "R", "F", "B"];
  let currentMove = 0;

  function executeNextScrambleMove() {
    if (currentMove < numMoves) {
      const randomFace = faces[Math.floor(Math.random() * faces.length)];
      rotateFace(randomFace, Math.PI / 2, 100, () => {
        currentMove++;
        executeNextScrambleMove();
      });
    } else {
      moveCount = 0;
      document.getElementById("move-count").innerText = moveCount;
    }
  }
  executeNextScrambleMove();
}
