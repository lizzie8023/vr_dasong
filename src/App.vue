 

<template>
 
 <div class="container">
     <div class="webgl" id="webgl"></div>
      <audio id="music" preload="auto" style="display: none">
        <source src="/audio/story1.ogg" type="audio/ogg">
   
	    </audio>
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
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import {
  VRButton
} from 'three/addons/webxr/VRButton.js';



export default {
  data() {
    return {
      playerOnFloor: false,
      isInDreaming: false,
      keyStates: {},
      scaleValue: 200,
      radius: 1,
      userH: 1,
      dollyH: 4.5,
      userPos: null,
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
    // console.log(111111)
    // if ('xr' in navigator) {

    //   navigator.xr.isSessionSupported('immersive-ar').then((supported) => {

    //     if (supported) {
    //       // const collection = document.getElementsByClassName("ar-button");
    //       alert('支持')
    //     } else { 
    //       alert('不支持')
    //     }

    //     console.log(supported)

    //   });

    // }
    // else {
    //   alert("not supported");
    // }


    this.init();
    this.renderer.setAnimationLoop(this.render);
    this.addEventListener();



    this.renderer.xr.addEventListener('sessionstart', (event) => {
      console.log("Session started", event);
      this.showOriginalPainting();

    });

    this.renderer.xr.addEventListener('sessionend', (event) => {

      console.log("Session ended", event);

    });



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
      // this.scene.background = new THREE.Color(0xffffff);
      this.clock = new THREE.Clock();



      this.dolly = new THREE.Object3D();
      this.user = new THREE.Object3D();
      this.user.position.y = this.userH;
      this.dolly.add(this.user)
      this.user.add(this.camera);
      this.scene.add(this.dolly);

    },

    showBlinking() {

      this.dolly.rotation.x = this.startRotationt.x;
      this.dolly.rotation.y = this.startRotationt.y;
      this.dolly.rotation.z = this.startRotationt.z;
      this.dolly.position.set(this.startPos.x, this.dollyH, this.startPos.z);


      this.camera.rotation.y = -(Math.PI * 0.45)
      this.camera.rotation.order = 'YXZ';
      this.isInDreaming = true;

      let textureUpper = new THREE.TextureLoader().load('/upperEyelid.png')
      let textureLower = new THREE.TextureLoader().load('/lowerEyelid.png')

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
      upperEyelid.position.y = this.user.position.y - 5;
      upperEyelid.position.z = -1;
      lowerEyelid.position.y = this.user.position.y + 5;
      lowerEyelid.position.z = -1;

      this.dolly.add(upperEyelid, lowerEyelid);

      this.tempInterval = setInterval(() => {

        upperEyelid.position.y += 0.1
        lowerEyelid.position.y -= 0.1


      }, 10);


      gsap.to(upperEyelid.position, {
        duration: 3,
        y: this.camera.position.y,
        repeat: 2,
        yoyo: true,
        ease: "power2.inOut",
        onComplete: () => {
          this.dolly.remove(upperEyelid);
          this.dolly.remove(lowerEyelid);

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
    initAudio() {

      const listener = new THREE.AudioListener();
      this.camera.add(listener);

      this.audioElement = document.getElementById('music');
      this.audioElement.play();

      const positionalAudio = new THREE.PositionalAudio(listener);
      positionalAudio.setMediaElementSource(this.audioElement);
      positionalAudio.setRefDistance(1);
      positionalAudio.setDirectionalCone(180, 230, 0.1);
      this.dolly.add(positionalAudio)
    },
    startStoryLine() {
      this.goToPoint(
        {
          x: -198.93,
          y: 10.39,
          z: -48.65
        }, 60,
        () => {

        }
      );





    },
    showOriginalPainting() {



      const baseReferenceSpace = this.renderer.xr.getReferenceSpace();

      const offsetPosition = this.camera.position;

      const offsetRotation = this.camera.quaternion;

      const transform = new XRRigidTransform(offsetPosition, { x: offsetRotation.x, y: -(offsetRotation.y), z: offsetRotation.z, w: offsetRotation.w });
      //const transform = new XRRigidTransform( offsetPosition, { x: offsetRotation.x, y: -(offsetRotation.y - 0.85), z: offsetRotation.z, w: offsetRotation.w } ); 
      const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace(transform);

      this.renderer.xr.setReferenceSpace(teleportSpaceOffset);



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

      new THREE.TextureLoader().load('/original_painting.png', (texture) => {

        this.initAudio();

        material.uniforms.uTexture.value = texture;

        // mesh
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.z = -600;

        this.scene.add(mesh);

        const timeValue = 13;

        this.userPos = new THREE.Vector3();
        this.userPos.copy(this.user.position);


        gsap.to(mesh.position, {
          duration: timeValue,
          x: -2000,
          repeat: 0,
          onComplete: () => {
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


              this.audioElement.pause();






              this.loadModel('/models/7/scene.gltf', (model) => {
                model.scene.scale.set(this.scaleValue, this.scaleValue, this.scaleValue)
                this.scene.add(model.scene);

                this.audioElement.play();
                this.showBlinking();
                setTimeout(() => {
                  this.loadShips();
                  this.loadruci();
                  this.loadGeese();
                }, 1000);

              });



            }, 2000);
          }
        });


      });



    },
    loadShips() {


      const boatScale = 0.003;
      this.loadModel('/models/boat/boat.FBX', (model) => {
        model.scale.set(boatScale, boatScale, boatScale)
        model.position.set(0, 0, 1.5)
        model.rotation.y += Math.PI;
        this.dolly.add(model);

      })

      const shutongScale = 0.000025;
      this.loadModel('/models/children/Shutong_Point.fbx', (model) => {

        model.scale.set(shutongScale, shutongScale, shutongScale)
        model.position.set(-1, 0.7, -3.5)
        model.rotation.y += Math.PI;
        this.dolly.add(model);
        this.mixer = new THREE.AnimationMixer(model);

        const animation = this.mixer.clipAction(model.animations[0])

        animation.play(); // 播放第一个动画
      })

      const yuwenScale = 0.0002;
      this.loadModel('/models/Fisherman/yu.fbx', (model) => {
        model.scale.set(yuwenScale, yuwenScale, yuwenScale)
        model.position.set(0, 0, 6.5)
        model.rotation.y += Math.PI;
        this.dolly.add(model);

      })


    },
    loadGeese() {


      const boxWidth = 10;
      const boxHeight = 10;
      const boxDepth = 10;
      const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

      const material = new THREE.MeshPhongMaterial({

        color: 0xFFFFFF, // 材质颜色
        specular: 0x050505, // 高光颜色
        shininess: 100, // 光泽度

        // 为了制作透明材质
        transparent: true, // 设置材质为透明
        opacity: 0.5 // 设置透明度。1为完全不透明，0为全透明
      });

      const cube = new THREE.Mesh(boxGeometry, material);
      cube.position.set(-70, 150, 200)
      this.scene.add(cube);

      const geeseScale = 0.5;
      this.loadModel('public/models/Geese/dayan.fbx', (model) => {
        model.scale.set(geeseScale, geeseScale, geeseScale)
        cube.add(model);
        // model.position.set(-70, 150, 200)
        // this.scene.add(model);

      })


      gsap.to(cube.position, {
        duration: 60,
        z: -600,
        repeat: 0,
        ease: "power2.inOut",
        onComplete: () => {

        }
      });

    },
    loadruci() {

      const ruciScale = 0.0003;
      this.loadModel('/models/cormorants/ruci.fbx', (model) => {
        model.scale.set(ruciScale, ruciScale, ruciScale)

        model.position.set(-202, 2.3, -70)
        model.rotation.y += Math.PI;
        this.scene.add(model);

      })


    },
    goToPoint(point, duration, doneBlock) {



      gsap.to(this.dolly.position, {
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
      const delta = this.clock.getDelta();
      gsap.ticker.tick(delta);
      if (this.mixer) {
        this.mixer.update(delta);
      }

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
