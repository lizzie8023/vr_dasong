 import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { VitePWA } from "vite-plugin-pwa";

const fs = require('fs')
const path = require('path')

export default defineConfig({
   plugins: [
       vue(),
       vueJsx(),
       VitePWA({
           manifest: {
               name: "大宋VR",
               description: "我的第一个VR项目",
               theme_color: "#00bd7e",
               icons: [
               {
                   src: "/App_icon192.png",
                   sizes: "192x192",
                   type: "image/png",
               },
               {
                   src: "/App_icon512.png",
                   sizes: "512x512",
                   type: "image/png",
               },
               {
                   src: "/App_icon60.png",
                   sizes: "60x60",
                   type: "image/png",
               },
               ],
           },
           shortcuts: [
               {
                   name: "大宋VR",
                   short_name: "大宋VR",
                   description: "我的第一个VR项目",
                   url: "/about",
                   icons: [{ src: "/App_icon192.png", sizes: "192x192" }],
               },
               {
                   name: "大宋VR",
                   short_name: "大宋VR",
                   description: "我的第一个VR项目",
                   url: "/report",
                   icons: [{ src: "/App_icon192.png", sizes: "192x192" }],
               },
               ],
           registerType: "autoUpdate",
           devOptions: {
               enabled: true,
           },
           workbox: {
               globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
               maximumFileSizeToCacheInBytes: 500000000
           },
           workboxPluginMode: 'GenerateSW',
            workboxOptions: {
            // swDest is the file output path for the generated service worker.
            swDest: 'service-worker.js',
            // other workbox options...
            }
       })],
    resolve: {
       alias: {
           '@': fileURLToPath(new URL('./src', import.meta.url))
       }
    },

//     server: {
//         https: {
//         // 主要是下面两行的配置文件，不要忘记引入 fs 和 path 两个对象
//         cert: fs.readFileSync(path.join(__dirname, 'src/ssl/cert.crt')),
//         key: fs.readFileSync(path.join(__dirname, 'src/ssl/cert.key'))
//         },
//         host: "10.11.6.37",
//         // https: false,//是否启用 http 2
//         cors: true,//为开发服务器配置 CORS , 默认启用并允许任何源
//         open: true,//服务启动时自动在浏览器中打开应用
//         // port: "8023",
//         strictPort: false, //设为true时端口被占用则直接退出，不会尝试下一个可用端口
//         force: true,//是否强制依赖预构建
//         hmr: false,//禁用或配置 HMR 连接
//         // 传递给 chockidar 的文件系统监视器选项
//   },
})