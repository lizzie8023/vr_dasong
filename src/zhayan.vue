 

<template>
 
 <div class="container">
     <div class="webgl" id="webgl"></div>
 
 </div>
 
</template>


<script>


import * as THREE from 'three';
import { gsap } from 'gsap'




export default {
    data() {

    },
    mounted() {
        // 建立场景，相机和渲染器
        var scene = new THREE.Scene();

        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        var renderer = new THREE.WebGLRenderer();

        // 设置尺寸和位置
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);


        //假设textureUpper和textureLower为你的两个圆弧形贴图
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
        upperEyelid.position.y = -5;

        lowerEyelid.position.y = 5;
        camera.position.z = 5;
        scene.add(upperEyelid, lowerEyelid);

        setTimeout(() => {
            scene.background = new THREE.Color(0xffffff);
        }, 500);

        gsap.to(upperEyelid.position, {
            duration: 4,
            y: 3.5,
            repeat: 2,
            yoyo: true,
            ease: "power2.inOut",
            onUpdate: function () {
                lowerEyelid.position.y = -upperEyelid.position.y;
            }
        });


        // 渲染
        function animate(time) {
            requestAnimationFrame(animate);

            renderer.render(scene, camera);
        }
        animate();
    },

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
