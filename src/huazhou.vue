 

<template>
 
 <div class="container">
     <div class="webgl" id="webgl"></div>
 
 </div>
 
</template>


<script>


import * as THREE from 'three';
import { gsap } from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';



export default {
    data() {

    },
    mounted() {


        this.canvas = document.getElementById('webgl');

        this.stageWidth = window.innerWidth;
        this.stageHeight = window.innerHeight;



        // renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x000000);
        this.renderer.setSize(this.stageWidth, this.stageHeight);
        this.canvas.appendChild(this.renderer.domElement);

        // retina
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

        // camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.stageWidth / this.stageHeight,
            0.1,
            100000
        );
        this.camera.position.set(0, 0, 1200);

        // scene
        this.scene = new THREE.Scene();

        // // helper
        // this.scene.add(new THREE.GridHelper(5000, 100));
        // this.scene.add(new THREE.AxesHelper(500));

        // OrbitControls
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );

        this.geometryParm = {
            width: 8000,
            height: 840,
            widthSegments: 100,
            heightSegments: 100
        };

        // geometry
        this.geometry = new THREE.PlaneBufferGeometry(
            this.geometryParm.width,
            this.geometryParm.height,
            this.geometryParm.widthSegments,
            this.geometryParm.heightSegments
        );
        const count = this.geometry.attributes.position.count;
        const randoms = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            randoms[i] = Math.random();
        }

        this.geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

        // material
        this.material = new THREE.RawShaderMaterial({
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

        this.texture = new THREE.TextureLoader().load('public/original_painting.png');

        this.material.uniforms.uTexture.value = this.texture;

        // mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = 5000;
        this.scene.add(this.mesh);


        const timeValue = 30;

        gsap.to(this.mesh.position, {
            duration: 30,
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
                this.material.uniforms.mouseValue.value = (x + y) / 2;

            }, 30);

            setTimeout(() => {
                clearInterval(this.intervalTemp);
            }, 2000);

        }, timeValue * 1000);

        // resize
        window.addEventListener("resize", this.onResize.bind(this), {
            passive: true
        });

        // requestAnimationFrame
        this.render();


    },
    methods: {

        onResize() {
            this.stageWidth = window.innerWidth;
            this.stageHeight = window.innerHeight;
            this.renderer.setSize(this.stageWidth, this.stageHeight);
            this.camera.aspect = this.stageWidth / this.stageHeight;
            this.camera.updateProjectionMatrix();
        },

        render() {

            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(() => {
                this.render();
            });
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
