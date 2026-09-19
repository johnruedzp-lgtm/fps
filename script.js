/* =====================================================
   STRIKEZONE FPS
   Browser 3D FPS Prototype
===================================================== */


/* =========================
   GAME CONFIG
========================= */

const CONFIG = {

  maxBots: 10,

  matchTime: 300,

  playerSpeed: 7,

  botSpeed: 2.2,

  gravity: 20,

  quality: "medium"

};


/* =========================
   WEAPONS
========================= */

const WEAPONS = {

  rifle: {
    name: "VX-7 ASSAULT RIFLE",
    damage: 28,
    fireRate: 115,
    magazine: 30,
    reserve: 120,
    spread: 0.018,
    range: 100
  },

  smg: {
    name: "RUSH-9 SMG",
    damage: 19,
    fireRate: 70,
    magazine: 36,
    reserve: 144,
    spread: 0.035,
    range: 70
  },

  shotgun: {
    name: "M12 SHOTGUN",
    damage: 12,
    pellets: 8,
    fireRate: 650,
    magazine: 8,
    reserve: 48,
    spread: 0.11,
    range: 45
  },

  sniper: {
    name: "FALCON SNIPER",
    damage: 95,
    fireRate: 900,
    magazine: 5,
    reserve: 30,
    spread: 0.004,
    range: 180
  },

  pistol: {
    name: "PX PISTOL",
    damage: 34,
    fireRate: 260,
    magazine: 15,
    reserve: 90,
    spread: 0.025,
    range: 70
  },

  lmg: {
    name: "TITAN LMG",
    damage: 24,
    fireRate: 145,
    magazine: 60,
    reserve: 180,
    spread: 0.045,
    range: 100
  }

};


/* =========================
   STATE
========================= */

let scene;
let camera;
let renderer;
let clock;

let player;

let enemies = [];

let bullets = [];

let effects = [];

let mapObjects = [];

let keys = {};

let mouseX = 0;
let mouseY = 0;

let yaw = 0;
let pitch = 0;

let running = false;
let paused = false;

let firing = false;
let aiming = false;
let reloading = false;

let lastShot = 0;

let matchSeconds = CONFIG.matchTime;

let blueScore = 0;
let redScore = 0;

let kills = 0;
let deaths = 0;

let currentMode = "tdm";
let currentWeapon = "rifle";

let ammo = 30;
let reserveAmmo = 120;

let health = 100;

let velocityY = 0;

let mobileForward = 0;
let mobileSide = 0;

let quality = "medium";


/* =========================
   DOM
========================= */

const menu =
  document.getElementById("menu");

const game =
  document.getElementById("game");

const canvas =
  document.getElementById("gameCanvas");

const startButton =
  document.getElementById("startButton");

const modeSelect =
  document.getElementById("modeSelect");

const mapSelect =
  document.getElementById("mapSelect");

const weaponSelect =
  document.getElementById("weaponSelect");

const characterSelect =
  document.getElementById("characterSelect");

const qualitySelect =
  document.getElementById("qualitySelect");

const healthText =
  document.getElementById("healthText");

const healthFill =
  document.getElementById("healthFill");

const ammoText =
  document.getElementById("ammoText");

const reserveText =
  document.getElementById("reserveText");

const weaponName =
  document.getElementById("weaponName");

const timer =
  document.getElementById("timer");

const blueScoreText =
  document.getElementById("blueScore");

const redScoreText =
  document.getElementById("redScore");

const modeName =
  document.getElementById("modeName");

const killFeed =
  document.getElementById("killFeed");

const gameMessage =
  document.getElementById("gameMessage");

const messageTitle =
  document.getElementById("messageTitle");

const messageSub =
  document.getElementById("messageSub");


/* =========================
   START GAME
========================= */

startButton.addEventListener("click", startGame);


function startGame() {

  currentMode = modeSelect.value;

  currentWeapon = weaponSelect.value;

  quality = qualitySelect.value;

  CONFIG.quality = quality;

  matchSeconds = CONFIG.matchTime;

  blueScore = 0;
  redScore = 0;

  kills = 0;
  deaths = 0;

  health = 100;

  reloading = false;

  firing = false;

  menu.style.display = "none";

  game.classList.add("active");

  initThree();

  createMap(mapSelect.value);

  createPlayer();

  createEnemies();

  updateHUD();

  running = true;

  clock.start();

  requestAnimationFrame(gameLoop);

  showMessage(
    "DEPLOYED",
    "ELIMINATE THE ENEMY"
  );

}


/* =========================
   THREE.JS
========================= */

function initThree() {

  scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(0x82a8bd);

  scene.fog =
    new THREE.Fog(
      0x82a8bd,
      35,
      quality === "low" ? 90 : 150
    );


  camera =
    new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.05,
      300
    );


  renderer =
    new THREE.WebGLRenderer({
      canvas,
      antialias: quality !== "low",
      powerPreference: "high-performance"
    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      quality === "ultra" ? 2 : 1.25
    )
  );


  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );


  renderer.shadowMap.enabled =
    quality === "high" ||
    quality === "ultra";


  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  clock =
    new THREE.Clock();


  /* Lighting */

  const hemi =
    new THREE.HemisphereLight(
      0xffffff,
      0x304050,
      2
    );

  scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xffffff,
      2.5
    );

  sun.position.set(
    30,
    60,
    20
  );

  sun.castShadow =
    quality === "high" ||
    quality === "ultra";

  scene.add(sun);


  window.addEventListener(
    "resize",
    resize
  );

}


/* =========================
   MAP
========================= */

function createMap(type) {

  /* Ground */

  const groundMaterial =
    new THREE.MeshStandardMaterial({
      color:
        type === "desert"
          ? 0xb99563
          : type === "forest"
          ? 0x304b32
          : 0x40464b,
      roughness: .9
    });


  const ground =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        200,
        200
      ),
      groundMaterial
    );


  ground.rotation.x =
    -Math.PI / 2;

  ground.receiveShadow = true;

  scene.add(ground);

  mapObjects.push(ground);


  /* Buildings */

  for (let i = 0; i < 18; i++) {

    const x =
      (Math.random() - .5) * 110;

    const z =
      (Math.random() - .5) * 110;


    if (
      Math.abs(x) < 15 &&
      Math.abs(z) < 15
    ) continue;


    const width =
      5 + Math.random() * 7;

    const height =
      3 + Math.random() * 8;

    const depth =
      5 + Math.random() * 7;


    const material =
      new THREE.MeshStandardMaterial({
        color:
          type === "desert"
            ? 0x8b6b48
            : type === "forest"
            ? 0x39473b
            : 0x59616a
      });


    const building =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width,
          height,
          depth
        ),
        material
      );


    building.position.set(
      x,
      height / 2,
      z
    );


    building.castShadow =
      quality !== "low";

    building.receiveShadow =
      true;


    scene.add(building);

    mapObjects.push(building);

  }


  /* Crates */

  for (let i = 0; i < 35; i++) {

    const size =
      .8 + Math.random() * 1.5;

    const crate =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          size,
          size,
          size
        ),
        new THREE.MeshStandardMaterial({
          color: 0x705136
        })
      );


    crate.position.set(
      (Math.random() - .5) * 110,
      size / 2,
      (Math.random() - .5) * 110
    );


    scene.add(crate);

    mapObjects.push(crate);

  }


  /* Trees for forest */

  if (type === "forest") {

    for (let i = 0; i < 35; i++) {

      createTree(
        (Math.random() - .5) * 130,
        (Math.random() - .5) * 130
      );

    }

  }


  /* Desert rocks */

  if (type === "desert") {

    for (let i = 0; i < 30; i++) {

      const rock =
        new THREE.Mesh(
          new THREE.DodecahedronGeometry(
            .5 + Math.random() * 1.5
          ),
          new THREE.MeshStandardMaterial({
            color: 0x6d604f
          })
        );


      rock.position.set(
        (Math.random() - .5) * 130,
        .5,
        (Math.random() - .5) * 130
      );


      scene.add(rock);

      mapObjects.push(rock);

    }

  }

}


function createTree(x, z) {

  const trunk =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .25,
        .35,
        3
      ),
      new THREE.MeshStandardMaterial({
        color: 0x5a3925
      })
    );


  trunk.position.set(
    x,
    1.5,
    z
  );


  scene.add(trunk);


  const leaves =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        1.8,
        8,
        6
      ),
      new THREE.MeshStandardMaterial({
        color: 0x255c36
      })
    );


  leaves.position.set(
    x,
    4,
    z
  );


  scene.add(leaves);

}


/* =========================
   PLAYER
========================= */

function createPlayer() {

  player = {

    position:
      new THREE.Vector3(
        0,
        1.7,
        10
      ),

    velocity:
      new THREE.Vector3(),

    onGround: true

  };


  camera.position.copy(
    player.position
  );

}


/* =========================
   ENEMIES
========================= */

function createEnemies() {

  enemies = [];

  for (
    let i = 0;
    i < CONFIG.maxBots;
    i++
  ) {

    const bot = createBot(i);

    enemies.push(bot);

    scene.add(bot.group);

  }

}


function createBot(index) {

  const group =
    new THREE.Group();


  const color =
    index % 2 === 0
      ? 0xd43c3c
      : 0xe27d35;


  /* Body */

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .8,
        1.2,
        .45
      ),
      new THREE.MeshStandardMaterial({
        color
      })
    );


  body.position.y = 1.1;

  group.add(body);


  /* Head */

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .32,
        8,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: 0xb97852
      })
    );


  head.position.y = 2;

  group.add(head);


  /* Weapon */

  const gun =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .12,
        .12,
        .8
      ),
      new THREE.MeshStandardMaterial({
        color: 0x15191c
      })
    );


  gun.position.set(
    .45,
    1.2,
    -.4
  );


  group.add(gun);


  const spawnAngle =
    Math.random() *
    Math.PI * 2;


  const radius =
    20 +
    Math.random() * 35;


  group.position.set(
    Math.cos(spawnAngle) * radius,
    0,
    Math.sin(spawnAngle) * radius
  );


  return {

    group,

    health: 100,

    alive: true,

    shootTimer:
      Math.random() * 2,

    speed:
      CONFIG.botSpeed *
      (.8 + Math.random() * .5),

    team:
      index % 2

  };

}


/* =========================
   INPUT
========================= */

document.addEventListener(
  "keydown",
  e => {

    keys[e.code] = true;

    if (e.code === "KeyR") {
      reload();
    }

    if (e.code === "ShiftLeft") {
      CONFIG.playerSpeed = 10;
    }

    if (e.code === "Space") {
      jump();
    }

  }
);


document.addEventListener(
  "keyup",
  e => {

    keys[e.code] = false;

    if (e.code === "ShiftLeft") {
      CONFIG.playerSpeed = 7;
    }

  }
);


/* Mouse */

document.addEventListener(
  "mousemove",
  e => {

    if (!running) return;

    if (
      document.pointerLockElement !== canvas
    ) return;

    yaw -= e.movementX * .002;

    pitch -= e.movementY * .002;

    pitch =
      Math.max(
        -1.45,
        Math.min(1.45, pitch)
      );

  }
);


canvas.addEventListener(
  "click",
  () => {

    if (!running) return;

    canvas.requestPointerLock?.();

  }
);


/* Mouse shooting */

document.addEventListener(
  "mousedown",
  e => {

    if (e.button === 0) {

      firing = true;

    }

  }
);


document.addEventListener(
  "mouseup",
  e => {

    if (e.button === 0) {

      firing = false;

    }

  }
);


/* =========================
   MOBILE JOYSTICK
========================= */

const joystick =
  document.getElementById("joystick");

const joystickKnob =
  document.getElementById("joystickKnob");

let joystickPointer = null;


joystick.addEventListener(
  "pointerdown",
  e => {

    joystickPointer = e.pointerId;

    joystick.setPointerCapture(
      e.pointerId
    );

  }
);


joystick.addEventListener(
  "pointermove",
  e => {

    if (
      joystickPointer !== e.pointerId
    ) return;


    const rect =
      joystick.getBoundingClientRect();


    const centerX =
      rect.left + rect.width / 2;

    const centerY =
      rect.top + rect.height / 2;


    let dx =
      e.clientX - centerX;

    let dy =
      e.clientY - centerY;


    const max =
      rect.width * .34;


    const distance =
      Math.hypot(dx, dy);


    if (distance > max) {

      dx =
        dx / distance * max;

      dy =
        dy / distance * max;

    }


    joystickKnob.style.transform =
      `translate(${dx}px, ${dy}px)`;


    mobileSide =
      dx / max;

    mobileForward =
      -dy / max;

  }
);


joystick.addEventListener(
  "pointerup",
  resetJoystick
);

joystick.addEventListener(
  "pointercancel",
  resetJoystick
);


function resetJoystick() {

  joystickPointer = null;

  mobileSide = 0;

  mobileForward = 0;

  joystickKnob.style.transform =
    "translate(0,0)";

}


/* Mobile buttons */

const fireButton =
  document.getElementById("fireButton");

fireButton.addEventListener(
  "pointerdown",
  () => {
    firing = true;
  }
);

fireButton.addEventListener(
  "pointerup",
  () => {
    firing = false;
  }
);

fireButton.addEventListener(
  "pointercancel",
  () => {
    firing = false;
  }
);


document
  .getElementById("reloadButton")
  .addEventListener(
    "click",
    reload
  );


document
  .getElementById("jumpButton")
  .addEventListener(
    "click",
    jump
  );


document
  .getElementById("aimButton")
  .addEventListener(
    "pointerdown",
    () => {
      aiming = true;
    }
  );


document
  .getElementById("aimButton")
  .addEventListener(
    "pointerup",
    () => {
      aiming = false;
    }
  );


/* =========================
   MOVEMENT
========================= */

function updatePlayer(delta) {

  if (!player) return;


  let forward = 0;

  let side = 0;


  if (keys["KeyW"])
    forward += 1;

  if (keys["KeyS"])
    forward -= 1;

  if (keys["KeyA"])
    side -= 1;

  if (keys["KeyD"])
    side += 1;


  forward += mobileForward;

  side += mobileSide;


  const length =
    Math.hypot(
      forward,
      side
    );


  if (length > 1) {

    forward /= length;
    side /= length;

  }


  const speed =
    CONFIG.playerSpeed *
    (aiming ? .55 : 1);


  const direction =
    new THREE.Vector3();


  camera.getWorldDirection(
    direction
  );


  direction.y = 0;

  direction.normalize();


  const right =
    new THREE.Vector3(
      direction.z,
      0,
      -direction.x
    );


  player.position.addScaledVector(
    direction,
    forward * speed * delta
  );


  player.position.addScaledVector(
    right,
    side * speed * delta
  );


  /* Jump / gravity */

  velocityY -=
    CONFIG.gravity * delta;


  player.position.y +=
    velocityY * delta;


  if (player.position.y <= 1.7) {

    player.position.y = 1.7;

    velocityY = 0;

    player.onGround = true;

  }


  /* World boundary */

  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -95,
      95
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -95,
      95
    );


  camera.position.copy(
    player.position
  );


  camera.rotation.order =
    "YXZ";


  camera.rotation.y =
    yaw;


  camera.rotation.x =
    pitch;


  const normalFOV =
    aiming ? 48 : 75;


  camera.fov =
    THREE.MathUtils.lerp(
      camera.fov,
      normalFOV,
      .15
    );


  camera.updateProjectionMatrix();

}


function jump() {

  if (
    player &&
    player.onGround
  ) {

    velocityY = 8;

    player.onGround = false;

  }

}


/* =========================
   SHOOTING
========================= */

function shoot() {

  if (!running || paused)
    return;

  if (reloading)
    return;


  const weapon =
    WEAPONS[currentWeapon];


  const now =
    performance.now();


  if (
    now - lastShot <
    weapon.fireRate
  ) return;


  if (ammo <= 0) {

    reload();

    return;

  }


  lastShot = now;

  ammo--;

  updateHUD();


  const pellets =
    weapon.pellets || 1;


  for (
    let i = 0;
    i < pellets;
    i++
  ) {

    fireBullet(weapon);

  }


  createMuzzleFlash();

}


function fireBullet(weapon) {

  const direction =
    new THREE.Vector3();


  camera.getWorldDirection(
    direction
  );


  direction.x +=
    (Math.random() - .5) *
    weapon.spread;

  direction.y +=
    (Math.random() - .5) *
    weapon.spread;

  direction.z +=
    (Math.random() - .5) *
    weapon.spread;


  direction.normalize();


  const ray =
    new THREE.Raycaster(
      camera.position,
      direction,
      0,
      weapon.range
    );


  const targets = [];


  enemies.forEach(
    enemy => {

      if (
        enemy.alive
      ) {

        enemy.group.traverse(
          obj => {

            if (
              obj.isMesh
            ) targets.push(obj);

          }
        );

      }

    }
  );


  const hits =
    ray.intersectObjects(
      targets,
      false
    );


  if (hits.length) {

    const object =
      hits[0].object;


    const enemy =
      enemies.find(
        e =>
          e.group ===
          object.parent ||
          e.group.children.includes(
            object
          )
      );


    if (enemy) {

      enemy.health -=
        weapon.damage;


      createHitEffect(
        hits[0].point
      );


      if (
        enemy.health <= 0
      ) {

        killEnemy(enemy);

      }

    }

  }

}


/* =========================
   ENEMY DEATH
========================= */

function killEnemy(enemy) {

  enemy.alive = false;

  kills++;

  blueScore++;

  updateScore();


  addKillFeed(
    "YOU",
    "ELIMINATED",
    "ENEMY"
  );


  showMessage(
    "ELIMINATION",
    "+100 XP"
  );


  setTimeout(
    () => respawnEnemy(enemy),
    1800
  );

}


function respawnEnemy(enemy) {

  const angle =
    Math.random() *
    Math.PI * 2;


  const radius =
    25 + Math.random() * 45;


  enemy.group.position.set(
    Math.cos(angle) * radius,
    0,
    Math.sin(angle) * radius
  );


  enemy.health = 100;

  enemy.alive = true;

}


/* =========================
   BOT AI
========================= */

function updateEnemies(delta) {

  enemies.forEach(
    enemy => {

      if (!enemy.alive)
        return;


      const target =
        player.position;


      const position =
        enemy.group.position;


      const direction =
        new THREE.Vector3()
          .subVectors(
            target,
            position
          );


      const distance =
        direction.length();


      if (distance > 8) {

        direction.normalize();

        position.addScaledVector(
          direction,
          enemy.speed * delta
        );

      }


      enemy.group.lookAt(
        target.x,
        1.2,
        target.z
      );


      enemy.shootTimer -=
        delta;


      if (
        distance < 45 &&
        enemy.shootTimer <= 0
      ) {

        enemyShoot(enemy);

        enemy.shootTimer =
          1.0 +
          Math.random() * 2;

      }

    }
  );

}


function enemyShoot(enemy) {

  if (!enemy.alive)
    return;


  const distance =
    enemy.group.position.distanceTo(
      player.position
    );


  const chance =
    Math.max(
      .15,
      1 -
      distance / 55
    );


  if (
    Math.random() > chance
  ) return;


  takeDamage(
    8 +
    Math.random() * 8
  );

}


/* =========================
   PLAYER DAMAGE
========================= */

function takeDamage(amount) {

  if (!running
