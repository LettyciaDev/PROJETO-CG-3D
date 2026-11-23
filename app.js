const container = document.getElementById("canvas-container");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e17);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(6, 5.5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Câmera: órbita com o mouse
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 20;

// Iluminação
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight1.position.set(10, 20, 15);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(-10, -10, -10);
scene.add(dirLight2);

// Loop de animação (controls.update precisa ficar aqui dentro por causa do damping)
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

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

// Ordem dos materiais no BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
const FACE_ORDER = ["R", "L", "U", "D", "F", "B"];
const FACE_NORMALS = {
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
};
const INNER_COLOR = 0x111111; // faces internas (que não aparecem) ficam pretas

// Construção do cubo (27 cubinhos)
const CUBE_SIZE = 1;
const CUBE_GAP = 0.06;
const OFFSET = CUBE_SIZE + CUBE_GAP;

const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

const cubies = [];

function createRubiksCube() {
  // Miolo preto: preenche as frestas entre os cubinhos
  const coreSize = 3 * CUBE_SIZE + 2 * CUBE_GAP - 0.02;
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(coreSize, coreSize, coreSize),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 }),
  );
  scene.add(core);

  const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Quais faces deste cubinho estão voltadas para fora do cubo
        const outer = {
          R: x === 1,
          L: x === -1,
          U: y === 1,
          D: y === -1,
          F: z === 1,
          B: z === -1,
        };

        // Cada cubinho tem seus próprios materiais (só as faces externas têm cor)
        const materials = FACE_ORDER.map(
          (face) =>
            new THREE.MeshStandardMaterial({
              color: outer[face] ? currentPalette[face] : INNER_COLOR,
              roughness: 0.3,
            }),
        );

        const cubie = new THREE.Mesh(geometry, materials);
        cubie.position.set(x * OFFSET, y * OFFSET, z * OFFSET);
        cubie.userData = {
          initialPos: new THREE.Vector3(x * OFFSET, y * OFFSET, z * OFFSET),
          // Letras das faces coloridas (adesivos) deste cubinho
          stickers: FACE_ORDER.filter((face) => outer[face]),
        };

        cubeGroup.add(cubie);
        cubies.push(cubie);
      }
    }
  }
}

createRubiksCube();

// Rotação de faces (com animação suave)
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

// Eixos escolhidos para que +90° seja sentido horário olhando de frente para a face
const AXIS_MAP = {
  U: new THREE.Vector3(0, -1, 0),
  D: new THREE.Vector3(0, 1, 0),
  R: new THREE.Vector3(-1, 0, 0),
  L: new THREE.Vector3(1, 0, 0),
  F: new THREE.Vector3(0, 0, -1),
  B: new THREE.Vector3(0, 0, 1),
};

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

  const axis = AXIS_MAP[face];
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

      // Devolve cubinhos para o grupo do cubo e limpa o pivô
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

// Movimentos, embaralhar, resolver, resetar
let moveCount = 0;

// Histórico de movimentos 
const moveHistory = [];

function recordMove(face) {
  moveHistory.push(face);
  // 4 giros seguidos da mesma face não mudam nada: remove do histórico
  const last4 = moveHistory.slice(-4);
  if (last4.length === 4 && last4.every((f) => f === face)) {
    moveHistory.splice(-4);
  }
}

function updateMoveCounter() {
  document.getElementById("move-count").innerText = moveCount;
}

function makeMove(face) {
  if (isAnimating) return;
  rotateFace(face, Math.PI / 2, 250, () => {
    recordMove(face);
    moveCount++;
    updateMoveCounter();
    checkWinCondition();
  });
}

function scrambleCube(numMoves = 20) {
  if (isAnimating) return;
  const faces = ["U", "D", "L", "R", "F", "B"];
  let currentMove = 0;

  function executeNextScrambleMove() {
    if (currentMove < numMoves) {
      const randomFace = faces[Math.floor(Math.random() * faces.length)];
      rotateFace(randomFace, Math.PI / 2, 100, () => {
        recordMove(randomFace);
        currentMove++;
        executeNextScrambleMove();
      });
    } else {
      moveCount = 0;
      updateMoveCounter();
    }
  }
  executeNextScrambleMove();
}

// Resolver: desfaz o histórico de trás para frente (giro de -90° em cada face)
function solveCube() {
  if (isAnimating) return;

  function undoNextMove() {
    if (moveHistory.length === 0) {
      moveCount = 0;
      updateMoveCounter();
      return;
    }
    const face = moveHistory.pop();
    rotateFace(face, -Math.PI / 2, 120, undoNextMove);
  }
  undoNextMove();
}

// Resetar: volta tudo ao estado inicial na hora (sem animação)
function resetCube() {
  if (isAnimating) return;
  cubies.forEach((cubie) => {
    cubie.position.copy(cubie.userData.initialPos);
    cubie.quaternion.identity();
  });
  moveHistory.length = 0;
  moveCount = 0;
  updateMoveCounter();
}

// Detecção de vitória
const _stickerDir = new THREE.Vector3();

function checkWinCondition() {
  if (moveCount === 0) return;

  const isSolved = cubies.every((cubie) =>
    cubie.userData.stickers.every((face) => {
      _stickerDir.copy(FACE_NORMALS[face]).applyQuaternion(cubie.quaternion);
      return _stickerDir.dot(FACE_NORMALS[face]) > 0.99;
    }),
  );

  if (isSolved) {
    moveHistory.length = 0;
    showToast(`Parabéns! Você resolveu o cubo em ${moveCount} movimentos!`);
  }
}

let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4500);
}

// Temas
function hexString(color) {
  return "#" + color.toString(16).padStart(6, "0");
}

// Pinta as cores da legenda com as cores do tema atual
function updateLegendColors() {
  document.querySelectorAll("[data-face]").forEach((chip) => {
    const dot = chip.querySelector(".dot");
    if (dot) dot.style.background = hexString(currentPalette[chip.dataset.face]);
  });
}

function changeTheme(themeName) {
  if (!PALETTES[themeName]) return;
  currentPalette = PALETTES[themeName];

  // Recolore só os adesivos de cada cubinho 
  cubies.forEach((cubie) => {
    cubie.userData.stickers.forEach((face) => {
      const materialIndex = FACE_ORDER.indexOf(face);
      cubie.material[materialIndex].color.setHex(currentPalette[face]);
    });
  });

  updateLegendColors();
}

// Teclado
window.addEventListener("keydown", (e) => {
  // Evita disparar movimento em atalhos como Ctrl+R (recarregar)
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

  const key = e.key.toUpperCase();
  if (["U", "D", "L", "R", "F", "B"].includes(key)) {
    makeMove(key);
  }
});

updateLegendColors();
animate();

console.log("Cubo Mágico 3D Three.js inicializado com sucesso!");