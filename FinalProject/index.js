import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let renderer, scene, camera, controls, car, ground, light, keys, enemies;
let frames = 0;
let spawnRate = 300;

let enemySpawnCooldown = 300; // Waktu yang diperlukan untuk membuat enemy pertama kali
let enemySpawnRate = 300; // Waktu antara setiap spawn enemy
let enemySpeed = 0.005; // Kecepatan enemy awal
let timeElapsed = 0; // Waktu yang telah berlalu
let increaseSpeedTime = 3000; // Waktu ketika kecepatan bertambah (contoh: setelah 3 detik)
let score = 0;
let isPaused = false; //status animasi

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(4.61, 2.74, 8);
// camera.position.set(0, 0, 0);
camera.lookAt(0, 0, 1);

loadSkybox();

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);

  keys = {
    ArrowLeft: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowDown: { pressed: false },
    ArrowUp: { pressed: false }
  };

  enemies = [];

  const textureLoader = new THREE.TextureLoader();
  const roadTexture = textureLoader.load('./assets/road.jpg'); // Gantikan 'path_to_your_road_texture.jpg' dengan path ke gambar jalan Anda
  roadTexture.minFilter = THREE.LinearFilter;
  roadTexture.wrapS = THREE.RepeatWrapping;
  roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(5, 1); // Anda bisa menyesuaikan angka ini untuk mengulang tekstur sesuai kebutuhan
  roadTexture.rotation = Math.PI / 2;  // Rotasi tekstur 90 derajat
  
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      if (!isPaused) {
        isPaused = true;
        cancelAnimationFrame(animationId);
      } else {
        isPaused = false;
        animate();
      }
    } else {
  
    switch (event.code) {
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true;
        break;
      case 'ArrowRight':
        keys.ArrowRight.pressed = true;
        break;
      case 'ArrowDown':
        keys.ArrowDown.pressed = true;
        break;
      case 'ArrowUp':
        keys.ArrowUp.pressed = true;
        break;
      case 'Space':
        car.velocity.y = 0.08;
        break;
    }
  }
});

  window.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = false;
        break;
      case 'ArrowRight':
        keys.ArrowRight.pressed = false;
        break;
      case 'ArrowDown':
        keys.ArrowDown.pressed = false;
        break;
      case 'ArrowUp':
        keys.ArrowUp.pressed = false;
        break;
    
      
    }
  });

  light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.y = 3;
  light.position.z = 1;
  light.castShadow = true;
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  

// Load the 3D car model and apply the external texture
loadCarModelAndApplyTexture();

// Buat ground dengan tekstur jalan
    ground = new Box({
    width: 10,
    height: 0.5,
    depth: 50,
    texture: roadTexture, // gunakan texture di sini
    position: { x: 0, y: -0.9, z: 0 }
  });
  ground.receiveShadow = true;
  scene.add(ground);

  camera.position.z = 5
//   console.log(ground.top)
//   console.log(car.bottom)

  animate();
}

class Box extends THREE.Mesh {
    constructor({
      width,
      height,
      depth,
      color = null,
      texture = null,
      velocity = { x: 0, y: 0, z: 0 },
      position = { x: 0, y: 0, z: 0 },
      zAcceleration = false
    }) {
        const material = texture ? new THREE.MeshStandardMaterial({ map: texture }) : new THREE.MeshStandardMaterial({ color });
      super(
        new THREE.BoxGeometry(width, height, depth),
        material
      );
  
      this.width = width;
      this.height = height;
      this.depth = depth;
  
      this.position.set(position.x, position.y, position.z);
  
      this.right = this.position.x + this.width / 2;
      this.left = this.position.x - this.width / 2;
  
      this.bottom = this.position.y - this.height / 2;
      this.top = this.position.y + this.height / 2;
  
      this.front = this.position.z + this.depth / 2;
      this.back = this.position.z - this.depth / 2;
  
      this.velocity = velocity;
      this.gravity = -0.002;
  
      this.zAcceleration = zAcceleration;
    }
  
    updateSides() {
      this.right = this.position.x + this.width / 2;
      this.left = this.position.x - this.width / 2;
  
      this.bottom = this.position.y - this.height / 2;
      this.top = this.position.y + this.height / 2;
  
      this.front = this.position.z + this.depth / 2;
      this.back = this.position.z - this.depth / 2;
    }
  
    update(ground) {
      this.updateSides();
  
      if (this.zAcceleration) this.velocity.z += 0.0003;
  
      this.position.x += this.velocity.x;
      this.position.z += this.velocity.z;
  
      this.applyGravity(ground);
    }
  
    applyGravity(ground) {
      this.velocity.y += this.gravity;
  
      // This is where we hit the ground
      if (boxCollision({ box1: this, box2: ground })) {
        const friction = 0.5;
        this.velocity.y *= friction;
        this.velocity.y = -this.velocity.y;
      } else this.position.y += this.velocity.y;
    }
  }

  function boxCollision({ box1, box2 }) {
    const xCollision = box1.right >= box2.left && box1.left <= box2.right;
    const yCollision =
      box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
    const zCollision = box1.front >= box2.back && box1.back <= box2.front;
  
    return xCollision && yCollision && zCollision;
  }

function animate() {
  if (isPaused) {
    return;
  }

  const animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);

  timeElapsed += 1;

  if (car) { // Check if car is defined
//     car.velocity = car.velocity || { x: 0, y: 0, z: 0 }; // Initialize velocity if not defined
    car.velocity.x = 0;
    car.velocity.z = 0;
    if (keys.ArrowLeft.pressed) car.velocity.x = -0.05;
    else if (keys.ArrowRight.pressed) car.velocity.x = 0.05;

    if (keys.ArrowDown.pressed) car.velocity.z = 0.05;
    else if (keys.ArrowUp.pressed) car.velocity.z = -0.05;

    // car.update(car, ground);
    updateCarSides(car); // Update the car's sides
    updateCarPosition(car, ground);

    enemies.forEach((enemy) => {
      enemy.update(ground);
      if (boxCollision({ box1: car, box2: enemy })) {
        cancelAnimationFrame(animationId);
      
       let vibrationMagnitude = 0.1;
        let vibrationSpeed = 0.1;
        let vibrationDuration = 50;
        let originalPosition = { ...car.position };
        let vibrationStartTime = Date.now();

        const shakeCar = () => {
          let elapsed = Date.now() - vibrationStartTime;
          if (elapsed < vibrationDuration) {
            car.position.x = originalPosition.x + Math.sin(elapsed * vibrationSpeed) * vibrationMagnitude;
            car.position.z = originalPosition.z + Math.cos(elapsed * vibrationSpeed) * vibrationMagnitude;
            requestAnimationFrame(shakeCar);
          } else {
            car.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
          }
        };
        shakeCar();

      }
    });
  }

  timeElapsed += 1; // Meningkatkan waktu yang telah berlalu dalam setiap frame
  
  score = Math.floor(frames / 60);

  // Logika peningkatan kecepatan setelah beberapa waktu
  if (timeElapsed > increaseSpeedTime) {
    enemySpeed *= 1.1; // Meningkatkan kecepatan enemy sebanyak 10%
    timeElapsed = 0; // Mengatur ulang waktu yang telah berlalu
  }
  
  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 20;
    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      position: { x: (Math.random() - 0.5) * 10, y: 0, z: -20 },
      velocity: { x: 0, y: 0, z: enemySpeed },
      color: '#FFE87C',
      zAcceleration: true
    });
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }
  frames++;

  displayScore(score);
}

function loadSkybox() {
    const loader = new GLTFLoader();
    loader.load('./assets/free_-_skybox_space_nebula.glb', (gltf) => {
      const skybox = gltf.scene;
      scene.add(skybox);
    });
  }

function displayScore(score) {
    const scoreElement = document.getElementById('score');
    scoreElement.innerText = `Score: ${score}`;
  }
  

function updateCarSides(car) {
    car.right = car.position.x + car.scale.x;
    car.left = car.position.x - car.scale.x;
    car.bottom = car.position.y - car.scale.y;
    car.top = car.position.y + car.scale.y;
    car.front = car.position.z + car.scale.z;
    car.back = car.position.z - car.scale.z;
  }
  
  function updateCarPosition(car, ground) {
    car.position.x += car.velocity.x;
    car.position.z += car.velocity.z;
    applyCarGravity(car, ground);
  }
  
  function applyCarGravity(car, ground) {
    car.velocity.y += car.gravity;
    
    // Check if the car hits the ground
    if (boxCollision({ box1: car, box2: ground })) {
      const friction = 0.5;
      car.velocity.y *= friction;
      car.velocity.y = -car.velocity.y;
    } else {
      car.position.y += car.velocity.y;
    }
  }

function loadCarModelAndApplyTexture() {
  const loader = new GLTFLoader();
  loader.load('/FinalProject/assets/25-mclaren-senna/mobil.glb', (gltf) => {
    car = gltf.scene;
    car.rotation.y = Math.PI;
    car.position.set(0, -0.61, 0);
    car.scale.set(1, 1, 1);
    car.velocity = { x: 0, y: 0, z: 0.05 };
    car.gravity = -0.002; // Add gravity property to the car
    car.scale.set(0.5, 0.5, 0.5); // Mobil sekarang setengah dari ukuran aslinya

    scene.add(car);
    
  });
  }

// Cek apakah di peramban web sebelum menjalankan fungsi init
if (typeof window !== 'undefined') {
  window.addEventListener('load', init);
}
