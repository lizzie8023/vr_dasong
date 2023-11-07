 

<template>
 
 <div class="container">
     <div class="webgl" id="webgl"></div>

    <div class="loading-bar"></div>
 </div>
 
</template>


<script>


import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';

import { Capsule } from 'three/addons/math/Capsule.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { gsap } from 'gsap'
import { hasInjectionContext } from 'vue';



import {
  VRButton
} from 'three/addons/webxr/VRButton.js';


let clock, scene, camera, renderer, stats;
let textureLoader, loader, loadingManager;

let loadingBarElement, overlayMaterial;

let playerCollider, playerVelocity, playerDirection, worldOctree;

let GRAVITY = 30;

let arrow;

let STEPS_PER_FRAME = 5;

export default {
  data() {
    return {
      playerOnFloor: false,
      mouseTime: 0,
      sceneReady: false,
      keyStates: {},
      modelUrl: '7/scene.gltf',
      needShowTipArrow: false,
      arrow: null,
      radius: 1,
      currentIndex: -1,
      scaleValue: 200,

      userH: 7.5,
      startRotationt: {
        x: -0.072,
        y: -1.47,
        z: 0
      },
      startPos: {
        x: -293.36,
        y: 0.5,
        z: -30.34
      },
      endPos: {
        x: -293.36,
        y: 1,
        z: -30.34
      },
      allPos: [
        {
          x: -253.64,
          y: 2.3,
          z: -1.36
        },
        {
          x: -194.70,
          y: 2.3,
          z: -49.22
        },
        {
          x: -101.15,
          y: 2.3,
          z: -58.37
        },
        {
          x: 9.23,
          y: 2.3,
          z: -40.80
        },

      ]


    }
  },
  mounted() {
    this.init();

    this.addEventListener();
  },
  methods: {
    initGui() {
      const gui = new GUI({ width: 200 });
      gui.add({ debug: false }, 'debug').name('太空飞行模式')
        .onChange(function (value) {
          GRAVITY = value ? 0 : 30;
        });
      gui.add({ fog: false }, 'fog').name('开启迷雾效果')
        .onChange(function (value) {
          if (value) {
            scene.fog = new THREE.Fog('#88ccee', 0, 350);
          } else {
            scene.fog = null;
          }
        });

      gui.add({ value: 350 }, 'value').name('迷雾范围').min(0).max(10000).step(1).onChange(function (value) {
        if (scene.fog) {
          scene.fog.far = value;
        }
      })

      const innColor = new THREE.Color("#88ccee")
      gui.addColor({ color: innColor.getHexString() }, "color")
        .name("迷雾颜色")
        .onChange((hex) => {
          console.log(scene.fog)
          if (scene.fog) {
            scene.fog.color = new THREE.Color(hex);
          }
        })


    },

    addTipModel() {
      // 创建红色的箭头物体



      const boxWidth = 10;
      const boxHeight = 10;
      const boxDepth = 10;
      const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

      const material = new THREE.MeshPhongMaterial({ color: '#ffff00' });
      const tipModels = new THREE.Group();

      for (let index = 0; index < this.allPos.length; index++) {

        const cube = new THREE.Mesh(boxGeometry, material);

        cube.index = index;

        cube.position.x = this.allPos[index].x;
        cube.position.y = this.allPos[index].y + 10;
        cube.position.z = this.allPos[index].z + 5;

        cube.rotation.x = this.startRotationt.x;
        cube.rotation.y = this.startRotationt.y;
        cube.rotation.z = this.startRotationt.z;

        tipModels.add(cube);
      }


      scene.add(tipModels);





    },

    init() {



      this.playerOnFloor = false;
      this.mouseTime = 0;
      this.sceneReady = false;
      this.keyStates = {};


      clock = new THREE.Clock();

      scene = new THREE.Scene();
      // scene.background = new THREE.Color(0x88ccee);
      // 迷雾效果
      scene.fog = new THREE.Fog('#88ccee', 0, 350);


      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 5000);

      camera.rotation.y = -(Math.PI * 0.45)
      camera.rotation.order = 'YXZ';

      var user = new THREE.Group();

      user.position.set(0, this.userH, 0);
      scene.add(user);
      user.add(camera);

      this.initGui();
      this.initOverlay();
      this.initLoadingManager();
      this.initLoader();
      this.initRender();
      this.loadModel();


      // this.animate();
      renderer.setAnimationLoop(this.animate);


      setInterval(() => {
        if (camera.position.y == 2) return;
        console.log('camera', camera.position, camera.rotation)
      }, 3000);



    },
    addEventListener() {
      const container = document.getElementById('webgl');
      document.addEventListener('keydown', (event) => {

        this.keyStates[event.code] = true;

      });

      document.addEventListener('keyup', (event) => {

        this.keyStates[event.code] = false;

      });

      container.addEventListener('mousedown', () => {

        document.body.requestPointerLock();

        this.mouseTime = performance.now();

      });

      // document.addEventListener('mouseup', () => {

      //     if (document.pointerLockElement !== null) throwBall();

      // });

      document.body.addEventListener('mousemove', (event) => {

        if (document.pointerLockElement === document.body) {

          camera.rotation.y -= event.movementX / 500;
          camera.rotation.x -= event.movementY / 500;

        }

      });

      window.addEventListener('resize', this.onWindowResize);
    },

    initLoadingManager() {
      loadingBarElement = document.querySelector('.loading-bar')
      loadingManager = new THREE.LoadingManager(
        // Loaded
        () => {
          // Wait a little
          window.setTimeout(() => {
            // Animate overlay
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 })

            // Update loadingBarElement
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
          }, 500)

          window.setTimeout(() => {
            this.sceneReady = true
          }, 2000)
        },

        // Progress
        (itemUrl, itemsLoaded, itemsTotal) => {
          // Calculate the progress and update the loadingBarElement
          const progressRatio = itemsLoaded / itemsTotal
          loadingBarElement.style.transform = `scaleX(${progressRatio})`
        }
      )
    },
    initOverlay() {
      const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
      overlayMaterial = new THREE.ShaderMaterial({
        // wireframe: true,
        transparent: true,
        uniforms:
        {
          uAlpha: { value: 1 }
        },
        vertexShader: `
                        void main()
                        {
                            gl_Position = vec4(position, 1.0);
                        }
    `,
        fragmentShader: `
                            uniform float uAlpha;

                            void main()
                            {
                                gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
                            }
    `
      })
      const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
      scene.add(overlay)
    },
    initLoader() {
      textureLoader = new THREE.TextureLoader(loadingManager);

    },

    initRender() {



      const container = document.getElementById('webgl');

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local');


      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.VSMShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      container.appendChild(renderer.domElement);

      document.body.appendChild(VRButton.createButton(renderer));


      stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0px';
      container.appendChild(stats.domElement);



      this.spheres = [];
      this.sphereIdx = 0;



      worldOctree = new Octree();

      playerCollider = new Capsule(new THREE.Vector3(this.startPos.x, this.startPos.y, this.startPos.z), new THREE.Vector3(this.endPos.x, this.endPos.y, this.endPos.z), this.radius);



      playerVelocity = new THREE.Vector3();
      playerDirection = new THREE.Vector3();




    },
    getForwardVector() {

      camera.getWorldDirection(playerDirection);
      playerDirection.y = 0;
      playerDirection.normalize();

      return playerDirection;

    },
    getSideVector() {

      camera.getWorldDirection(playerDirection);
      playerDirection.y = 0;
      playerDirection.normalize();
      playerDirection.cross(camera.up);

      return playerDirection;

    },
    playerCollisions() {

      const result = worldOctree.capsuleIntersect(playerCollider);

      this.playerOnFloor = false;

      if (result) {

        this.playerOnFloor = result.normal.y > 0;

        if (!this.playerOnFloor) {

          playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));

        }

        playerCollider.translate(result.normal.multiplyScalar(result.depth));

      }

    },
    updatePlayer(deltaTime) {

      let damping = Math.exp(- 4 * deltaTime) - 1;

      if (!this.playerOnFloor) {

        playerVelocity.y -= GRAVITY * deltaTime;

        // small air resistance
        damping *= 0.1;

      }

      playerVelocity.addScaledVector(playerVelocity, damping);

      const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
      playerCollider.translate(deltaPosition);

      this.playerCollisions();

      camera.position.copy(playerCollider.end);

    },
    // 超出边界后重置位置
    teleportPlayerIfOob() {
      // console.log('teleportPlayerIfOob', camera.position.y);
      if (camera.position.y <= - 25) {

        playerCollider.start.set(this.startPos.x, this.startPos.y, this.startPos.z);
        playerCollider.end.set(this.endPos.x, this.endPos.y, this.endPos.z);
        playerCollider.radius = this.radius;
        camera.position.copy(playerCollider.end);
        camera.rotation.set(this.startRotationt.x, this.startRotationt.y, this.startRotationt.z);

      }

    },
    controls(deltaTime) {

      // gives a bit of air control
      const speedDelta = deltaTime * (this.playerOnFloor ? 25 : 8);

      if (this.keyStates['KeyW']) {

        playerVelocity.add(this.getForwardVector().multiplyScalar(speedDelta));

      }

      if (this.keyStates['KeyS']) {

        playerVelocity.add(this.getForwardVector().multiplyScalar(- speedDelta));

      }

      if (this.keyStates['KeyA']) {

        playerVelocity.add(this.getSideVector().multiplyScalar(- speedDelta));

      }

      if (this.keyStates['KeyD']) {

        playerVelocity.add(this.getSideVector().multiplyScalar(speedDelta));

      }

      if (this.playerOnFloor) {

        if (this.keyStates['Space']) {

          playerVelocity.y = 15;

        }

      }

    },
    animate(time) {

      const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
      time *= 0.001;

      for (let i = 0; i < STEPS_PER_FRAME; i++) {

        this.controls(deltaTime);

        this.updatePlayer(deltaTime);



        this.teleportPlayerIfOob();

      }

      renderer.render(scene, camera);

      stats.update();




    },
    loadModel() {
      const that = this;
      function addModel(model) {
        that.currentModel = model;

        model.scene.scale.set(that.scaleValue, that.scaleValue, that.scaleValue)
        scene.add(model.scene);
        that.addTipModel();

        worldOctree.fromGraphNode(model.scene);

        model.scene.traverse(child => {

          if (child.isMesh) {

            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material.map) {

              child.material.map.anisotropy = 4;

            }

          }

        });



      }

      const modelURl = '/models/7/scene.gltf';


      // 加载模型
      const format = modelURl.split('.').pop().toLowerCase();

      switch (format) {
        case 'gltf':
        case 'glb':
          loader = new GLTFLoader(loadingManager);
          loader.load(modelURl, (model) => {
            addModel(model);

          },
          );
          break;
        case 'obj':
          loader = new OBJLoader(loadingManager);
          loader.load(modelURl, (model) => {
            addModel(model);
          },

          );
          break;
        case 'stl':
          loader = new STLLoader(loadingManager);
          loader.load(modelURl, (model) => {
            addModel(model);
          },);
          break;
        case 'fbx':
          loader = new FBXLoader(loadingManager);
          loader.load(modelURl, (model) => {
            addModel(model);
          },);
          break;
        default:
          console.error(`Unsupported model format: ${format}`);
          return;
      }
    },

    onWindowResize() {

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

    }


  }
}
</script>

<style scoped>
.content {
  background-color: #111;
  overflow: hidden;
  display: inline;
}


.webgl {
  position: fixed;
  top: 0;
  left: 0;
  outline: none;
}

.loading-bar {
  position: absolute;
  top: 50%;
  width: 100%;
  height: 2px;
  background: #ffffff;
  transform: scaleX(0.3);
  transform-origin: top left;
  transition: transform 0.5s;
}

.loading-bar.ended {
  transform: scaleX(0);
  transform-origin: 100% 0;
  transition: transform 1.5s ease-in-out;
}
</style>
