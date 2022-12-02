import './style.css'
import * as THREE from 'three';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const render = new THREE.WebGLRenderer({canvas: document.querySelector('#bg'),});

render.setPixelRatio(window.devicePixelRatio);
render.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

render.render(scene, camera);
const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({color: 0x4287f5});
const torus = new THREE.Mesh(geometry, material);
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);
const ambiLight = new THREE.AmbientLight(0xffffff);

scene.add(torus);
scene.add(pointLight);
scene.add(ambiLight);

const controls = new OrbitControls(camera, render.domElement);

function animate() {
    requestAnimationFrame(animate);
    torus.rotation.x += 0.01;
    torus.rotation.y += 0.005;
    torus.rotation.z += 0.01;
    controls.update();
    render.render(scene, camera);
}
animate()
