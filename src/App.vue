 

<template>
 
 <div class="container">
     <div class="webgl" id="webgl"></div>
 
 </div>
 
</template>


<script>


import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Octree } from 'three/addons/math/Octree.js';
import { gsap } from 'gsap'
import { Capsule } from 'three/addons/math/Capsule.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import {
  VRButton
} from 'three/addons/webxr/VRButton.js';


let playerCollider, playerVelocity, playerDirection, worldOctree;
let controller1, controller2;
let GRAVITY = 30;
let STEPS_PER_FRAME = 5;

export default {
  data() {
    return {
      playerOnFloor: false,
      isInDreaming: false,
      keyStates: {},
      scaleValue: 200,
      radius: 1,
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
    }
  },
  mounted() {



    this.init();



    this.renderer.setAnimationLoop(this.render);
    this.addEventListener();
    this.addController();


    this.renderer.xr.addEventListener('sessionstart', (event) => {
      console.log("Session started", event);
      this.showOriginalPainting();
    });

    this.renderer.xr.addEventListener('sessionend', (event) => {

      console.log("Session ended", event);

    });


    setInterval(() => {

      console.log('camera', this.camera.position, this.camera.rotation)
    }, 3000);


  },
  methods: {
    init() {

      this.stageWidth = window.innerWidth;
      this.stageHeight = window.innerHeight;

      this.canvas = document.getElementById('webgl');

      // renderer
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setClearColor(0x000000);
      this.renderer.setSize(this.stageWidth, this.stageHeight);
      this.canvas.appendChild(this.renderer.domElement);
      // retina
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

      this.renderer.xr.enabled = true;
      this.renderer.xr.setReferenceSpaceType('local');

      document.body.appendChild(VRButton.createButton(this.renderer));

      // camera
      this.camera = new THREE.PerspectiveCamera(
        70,
        this.stageWidth / this.stageHeight,
        0.1,
        100000
      );
      // this.camera.position.set(0, 0, 1200);

      // scene
      this.scene = new THREE.Scene();
      this.clock = new THREE.Clock();

      worldOctree = new Octree();

      playerCollider = new Capsule(new THREE.Vector3(this.startPos.x, this.startPos.y, this.startPos.z), new THREE.Vector3(this.endPos.x, this.endPos.y, this.endPos.z), this.radius);



      playerVelocity = new THREE.Vector3();
      playerDirection = new THREE.Vector3();



      this.user = new THREE.Object3D();

      this.scene.add(this.user);
      this.user.add(this.camera);

    },
    addController() {

      const controllerModelFactory = new XRControllerModelFactory();
      controller1 = this.renderer.xr.getController(0);  // 获取第一个控制器
      controller1.add(controllerModelFactory.createControllerModel(controller1));  // 创建控制器模型并添加到控制器对象中
      this.scene.add(controller1);

      controller2 = this.renderer.xr.getController(1);
      controller2.add(controllerModelFactory.createControllerModel(controller2));  // 创建控制器模型并添加到控制器对象中
      this.scene.add(controller2);

    },
    showBlinking() {

      this.user.rotation.x = this.startRotationt.x;
      this.user.rotation.y = this.startRotationt.y;
      this.user.rotation.z = this.startRotationt.z;
      this.user.position.set(this.startPos.x, this.userH, this.startPos.z);

      this.camera.position.z = 5;
      this.camera.rotation.y = -(Math.PI * 0.45)
      this.camera.rotation.order = 'YXZ';
      this.isInDreaming = true;

      let textureUpper = new THREE.TextureLoader().load('public/upperEyelid.png')
      let textureLower = new THREE.TextureLoader().load('public/lowerEyelid.png')

      textureUpper.wrapS = THREE.RepeatWrapping
      textureLower.wrapS = THREE.RepeatWrapping


      textureUpper.wrapT = THREE.RepeatWrapping
      textureLower.wrapT = THREE.RepeatWrapping


      let materialUpper = new THREE.MeshBasicMaterial({ map: textureUpper, transparent: true });
      let materialLower = new THREE.MeshBasicMaterial({ map: textureLower, transparent: true });

      let upperEyelid = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), materialUpper);
      let lowerEyelid = upperEyelid.clone();
      lowerEyelid.material = materialLower;


      // 初始化眼睑位置
      upperEyelid.position.y = this.camera.position.y - 5;
      upperEyelid.position.z = -1;
      lowerEyelid.position.y = this.camera.position.y + 5;
      lowerEyelid.position.z = -1;

      this.user.add(upperEyelid, lowerEyelid);


      gsap.to(upperEyelid.position, {
        duration: 3,
        y: this.camera.position.y,
        repeat: 2,
        yoyo: true,
        ease: "power2.inOut",
        onComplete: () => {
          this.user.remove(upperEyelid);
          this.user.remove(lowerEyelid);

          materialUpper.dispose();
          materialLower.dispose();
          textureUpper.dispose();
          textureLower.dispose();

          setTimeout(() => {
            this.startStoryLine();
          }, 1000);
        }
      });

      gsap.to(lowerEyelid.position, {
        duration: 3,
        y: this.camera.position.y,
        repeat: 2,
        yoyo: true,
        ease: "power2.inOut",

      });



    },
    startStoryLine() {
      this.goToPoint(
        {
          x: -198.93,
          y: 10.39,
          z: -48.65
        }, 10,
        () => {

        }
      );





    },
    showOriginalPainting() {

      const geometryParm = {
        width: 8000,
        height: 840,
        widthSegments: 100,
        heightSegments: 100
      };

      // geometry
      const geometry = new THREE.PlaneBufferGeometry(
        geometryParm.width,
        geometryParm.height,
        geometryParm.widthSegments,
        geometryParm.heightSegments
      );
      const count = geometry.attributes.position.count;
      const randoms = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        randoms[i] = Math.random();
      }

      geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

      // material
      const material = new THREE.RawShaderMaterial({
        vertexShader: `precision mediump float;
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                attribute vec3 position;
                attribute vec2 uv;
                varying vec2 vUv;
                uniform float mouseValue;
                attribute float aRandom;
                const float PI = 3.1415926535897932384626433832795;

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    vec2 uvCurve = vUv;
                    vec3 curve = vec3(
                        sin(uvCurve.y * PI) * mouseValue,
                        0,
                        0.
                    );
                    pos += curve * aRandom * 2.0;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
                    `,
        fragmentShader: `
                precision mediump float;
                varying vec2 vUv;
                uniform sampler2D uTexture;
                uniform float mouseValue;

                void main() {
                    //final color
                    vec4 defaultColor = texture2D(uTexture, vUv);
                    vec4 redColor = texture2D(uTexture, vUv + vec2(mouseValue * -0.003,0.0));
                    vec4 greenColor = texture2D(uTexture, vUv + vec2(mouseValue * -0.002,0.0));
                    vec4 blueColor = texture2D(uTexture, vUv + vec2(mouseValue * -0.005,0.0));

                    gl_FragColor = vec4(redColor.r , greenColor.g , blueColor.b , defaultColor.a) ;
                }
            `,
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { type: "f", value: 0.0 },
          uTexture: { type: "t", value: null },
          mouseValue: { type: 'f', value: null }
        }
      });

      const texture = new THREE.TextureLoader().load('public/original_painting.png');

      material.uniforms.uTexture.value = texture;

      // mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = 5000;
      mesh.position.z = -1200;

      this.scene.add(mesh);

      const timeValue = 2;

      gsap.to(mesh.position, {
        duration: timeValue,
        x: -2000,
        repeat: 0,

      });

      setTimeout(() => {
        this.intervalTemp = setInterval(() => {

          const mouseX = Math.floor(Math.random() * 61) - 30;
          const mouseY = Math.floor(Math.random() * 61) - 30;

          const x = this.startX - mouseX;
          const y = this.startY - mouseY;

          this.startX = mouseX;
          this.startY = mouseY;
          material.uniforms.mouseValue.value = (x + y) / 2;

        }, 30);

        setTimeout(() => {
          clearInterval(this.intervalTemp);

          this.scene.remove(mesh);
          material.dispose();
          geometry.dispose();
          texture.dispose();
          this.showBlinking();
          this.loadModel('/models/7/scene.gltf', (model) => {
            model.scene.scale.set(this.scaleValue, this.scaleValue, this.scaleValue)
            this.scene.add(model.scene);

            worldOctree.fromGraphNode(model.scene);
          });

          setTimeout(() => {
            this.loadShips();
          }, 1000);

        }, 2000);

      }, timeValue * 1000);

    },
    loadShips() {

      this.loadModel('/models/boat/boat.FBX', (model) => {
        model.scale.set(0.004, 0.004, 0.004)
        model.position.set(0, -5, 3)
        model.rotation.y = Math.PI * 180;
        this.user.add(model);


      })


    },
    goToPoint(point, duration, doneBlock) {



      gsap.to(this.user.position, {
        duration: duration,
        x: point.x,
        y: point.y,
        z: point.z,
        repeat: 0,
        yoyo: true,
        ease: "power2.inOut",
        onComplete: () => {
          doneBlock();
        }
      });

    },
    loadModel(url, addBlock) {


      const modelURl = url;


      // 加载模型
      const format = modelURl.split('.').pop().toLowerCase();

      switch (format) {
        case 'gltf':
        case 'glb':
          this.loader = new GLTFLoader();
          this.loader.load(modelURl, (model) => {

            addBlock(model);
          },
          );
          break;
        case 'obj':
          this.loader = new OBJLoader();
          this.loader.load(modelURl, (model) => {
            addBlock(model);
          },

          );
          break;
        case 'stl':
          this.loader = new STLLoader();
          this.loader.load(modelURl, (model) => {
            addBlock(model);
          },);
          break;
        case 'fbx':
          this.loader = new FBXLoader();
          this.loader.load(modelURl, (model) => {
            addBlock(model);
          },);
          break;
        default:
          console.error(`Unsupported model format: ${format}`);
          return;
      }
    },
    onResize() {
      this.stageWidth = window.innerWidth;
      this.stageHeight = window.innerHeight;
      this.renderer.setSize(this.stageWidth, this.stageHeight);
      this.camera.aspect = this.stageWidth / this.stageHeight;
      this.camera.updateProjectionMatrix();
    },
    addEventListener() {


      window.addEventListener('resize', this.onResize);
    },
    render(time) {

      this.renderer.render(this.scene, this.camera);



    },


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
