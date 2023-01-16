/*
    overlay of a single html section that appears when a collision happens in the game.
    the game should start over when a section is hit but the sections should all be
    different parts of my resume and cycle as the game is played
 */

import './style.css'
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

// basic environment setup
const canvas = document.querySelector('#app')
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
const render = new THREE.WebGLRenderer({canvas: canvas});
const loader = new GLTFLoader();
render.setPixelRatio(window.devicePixelRatio);
render.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);
scene.fog = new THREE.FogExp2(0xF2DEF5, 0.02);
render.render(scene, camera);
render.toneMapping = THREE.ACESFilmicToneMapping;
render.toneMappingExposure = 0.9;

// pull html elements
const pop = document.querySelector("#pop");
const nextBut = document.querySelector("#next");
const backBut = document.querySelector("#back");
nextBut.onclick = nextCard;
backBut.onclick = lastCard;
document.onkeydown = keyPress;
document.onkeyup = keyRelease;
canvas.ontouchstart = tStart;
canvas.ontouchmove = translate;
canvas.ontouchend = tEnd;

// calculating window and camera bounds for sync
const visHgtAtZDepth = ( depth, camera ) => {
    // compensate for cameras not positioned at z=0
    const cameraOffset = camera.position.z;
    if ( depth < cameraOffset ) depth -= cameraOffset;
    else depth += cameraOffset;

    // vertical fov in radians
    const vFOV = camera.fov * Math.PI / 180;

    // Math.abs to ensure the result is always positive
    return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
};

const visWidAtZDepth = ( depth, camera ) => {
    const height = visHgtAtZDepth( depth, camera );
    return height * camera.aspect;
}

// background sun and lighting
const background = new Sky();
const uniforms = background.material.uniforms;
uniforms[ 'turbidity' ].value = 0.8;
uniforms[ 'rayleigh' ].value = 0.75;
uniforms[ 'mieCoefficient' ].value = 0.08;
uniforms[ 'mieDirectionalG' ].value = 0.85;
const phi = THREE.MathUtils.degToRad( 90 - 3 ); // second value is elevation
const theta = THREE.MathUtils.degToRad( 150 );
const sun = new THREE.Vector3();
sun.setFromSphericalCoords( 2, phi, theta );
uniforms[ 'sunPosition' ].value.copy( sun );
background.scale.setScalar( 45000 );
const ambiLight = new THREE.AmbientLight(0xF2DEA5, 3);
const pointLight = new THREE.PointLight(0xF2DEA5, 3);
pointLight.position.set(25, 5, -20);
scene.add(ambiLight);
scene.add(pointLight);
scene.add(background);


let plain, plane, backClouds, propRight, propLeft;
let head = new THREE.Object3D();
const clouds = [];
const clMaxX = 20;  // cloud spawn limits
const clMinX = -20;
const clMaxY = 5;
const clMinY = -5;
let timer = 0;
let progress = 50;
let progMin = 10;
let play = true;  // play / pause
let sec = 0;
let normal = new THREE.Vector3();
let xPer = 0.5;  // view percentage for movement 0.5 is center 0 is left 1 is right
let yPer = 0.5;
let pXMax = visWidAtZDepth(25, camera) / 2;  // limits for plane movement
let pXMin = -pXMax;
let pYMax = visHgtAtZDepth(25, camera) / 2;
let pYMin = -pYMax;
let skyRotXMax = 0.15;  // animation start and stop points
let skyRotXMin = -0.15;
let skyRotYMax = 0.15;
let skyRotYMin = -0.15;
let grdRotXMax = -0.15;
let grdRotXMin = 0.15;
let grdRotYMax = -1.67;
let grdRotYMin = -1.47;
let camXMax = 0.25;
let camXMin = -0.25;
let camYMax = 0.15;
let camYMin = -0.15;
let keyUp = false;  // booleans for button presses
let keyDown = false;
let keyLeft = false;
let keyRight = false;
let keySpace = false;
let gameSpeed = 0.004;  // how fast the ship can move
let cloudSpeed = 0.4;
let turboTimer = 0;
let turboNow = false;
let turboSpeed = 0.008;
let lastX = 0;  // mobile touches
let lastY = 0;
let turboTouch = 3;
let touchMove = false;
let intro = true;

function loadMods(){
    loader.load('meHeadHair.glb', function (gltf) {
        gltf.scene.rotation.set(0, 0, 0);
        gltf.scene.scale.set(2, 2, 2);
        gltf.scene.visible = false;
        scene.add(gltf.scene);
        head = gltf.scene;
    }, undefined, function (error) {
        console.error(error);
    });

    loader.load('plain.glb', function (gltf) {
        gltf.scene.position.set(0, -8, 10);
        gltf.scene.rotation.set(0, -1.57, 0);
        //gltf.scene.scale.set(2, 2, 2);
        scene.add(gltf.scene);
        plain = gltf.scene;
    }, undefined, function (error) {
        console.error(error);
    });

    loader.load('backClouds.glb', function (gltf) {
        gltf.scene.position.set(0, -8, -15);
        gltf.scene.rotation.set(0, -1.57, 0);
        gltf.scene.scale.set(2, 2, 2);
        scene.add(gltf.scene);
        backClouds = gltf.scene;
    }, undefined, function (error) {
        console.error(error);
    });

    loader.load('prop.glb', function (gltf) {
        gltf.scene.position.set(0.34744, 0.31733, 24.904268);
        gltf.scene.rotation.set(0, 0, 0);
        scene.add(gltf.scene);
        propRight = gltf.scene;
        propLeft = propRight.clone();
        propLeft.position.x = -0.34744;
        scene.add(propLeft);
    }, undefined, function (error) {
        console.error(error);
    });

    loader.load('plane.glb', function (gltf) {
        gltf.scene.position.set(0, 0, 25);
        gltf.scene.rotation.set(0, 0, 0);
        scene.add(gltf.scene);
        plane = gltf.scene;
    }, undefined, function (error) {
        console.error(error);
    });
}

function newCloud() {
    //let cloud = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 10), whitMat);
    let cloud = head.clone();
    cloud.visible = true;
    cloud.alive = true;
    cloud.position.set(Math.random() * (clMaxX - clMinX) + clMinX,
        Math.random() * (clMaxY - clMinY) + clMinY, -10);
    setTimeout(function (){
        cloud.alive = false;
        scene.remove(cloud);
    }, 10000);
    clouds.push(cloud);
    scene.add(cloud)
}

function checkForCollision(cld){
    const offset = cld.children[2].geometry.boundingSphere.radius * 0.48;
    normal.copy( cld.position ).sub( plane.position );
    const distance = normal.length();
    if ( distance < 0.5 + offset ) {
        collision()
        return true
    }
    return false
}

function collision() {
    play = false;
    loadSec(sec);
    sec += 1;
    for (let i in clouds) {
        if (clouds[i] === undefined) continue;
        else {
            clouds[i].alive = false;
            scene.remove(clouds[i]);
        }
    }
}

collision();

function fetchHtml(html){
    fetch(html)
        .then ( (r) => { return r.text();  } )
        .then ( (s) => {
            pop.innerHTML = s;
            pop.style.visibility = "visible";
            if (intro) {intro = false}
            else {
                nextBut.style.visibility = "visible";
                backBut.style.visibility = "visible";
            }
        }).then(() => {
        document.querySelector(".reStart").onclick = reStartFunc;
    });
}

function loadSec(section){
    if (section === 0){
        backBut.innerHTML = 'Media';
        nextBut.innerHTML = 'Python';
        fetchHtml('intro.html');
    }
    if (section === 1){
        backBut.innerHTML = 'Intro';
        nextBut.innerHTML = 'Web';
        fetchHtml('python.html');
    }
    if (section === 2){
        backBut.innerHTML = 'Python';
        nextBut.innerHTML = 'Fab';
        fetchHtml('javascript.html');
    }
    if (section === 3){
        backBut.innerHTML = 'Web';
        nextBut.innerHTML = 'Media';
        fetchHtml('fabricator.html');
    }
    if (section === 4){
        backBut.innerHTML = 'Fab';
        nextBut.innerHTML = 'Intro'
        fetchHtml('media.html');
    }
}

function nextCard(){
    loadSec(sec)
    sec += 1;
    if (sec === 5){ sec = 0 }
}

function lastCard(){
    sec -= 2;
    if (sec < -1) { sec = 3}
    else if (sec < 0 ) { sec = 4}
    loadSec(sec);
    sec += 1;
    if (sec === 5){ sec = 0 }
}

function reStartFunc(){
    play = true;
    progress = 40;
    pop.style.visibility = "hidden";
    nextBut.style.visibility = "hidden";
    backBut.style.visibility = "hidden";
    animate();
}

function keyPress(event){
    if (event.which === 32){ keySpace = true; }
    if (event.which === 37){ keyLeft = true; }
    if (event.which === 38){ keyUp = true; }
    if (event.which === 39){ keyRight = true; }
    if (event.which === 40){ keyDown = true; }
}

function keyRelease(event){
    if (event.which === 32){ keySpace = false; }
    if (event.which === 37){ keyLeft = false; }
    if (event.which === 38){ keyUp = false; }
    if (event.which === 39){ keyRight = false; }
    if (event.which === 40){ keyDown = false; }
}

function arrowDown(){
    if (yPer < 1){
        if (turboNow){ yPer += turboSpeed; }
        else { yPer += gameSpeed; }
    }
}
function arrowUp(){
    if (yPer > 0) {
        if (turboNow){ yPer -= turboSpeed; }
        else { yPer -= gameSpeed; }
    }
}
function arrowLeft(){
    if (xPer > 0) {
        if (turboNow){ xPer -= turboSpeed; }
        else { xPer -= gameSpeed; }
    }
}
function arrowRight(){
    if (xPer < 1) {
        if (turboNow) { xPer += turboSpeed; }
        else { xPer += gameSpeed; }
    }
}

// for mobile touches
function tStart(event){
    lastX = event.changedTouches[0].screenX;
    lastY = event.changedTouches[0].screenY;
}

function translate(event){
    let x = event.changedTouches[0].screenX;
    let y = event.changedTouches[0].screenY;
    let diffX = (lastX - x) * 2;
    let diffY = (lastY - y) * 2;
    touchMove = true;
    if (Math.abs(diffX) > turboTouch || Math.abs(diffY) > turboTouch){ keySpace = true; }
    if (diffX > 0){ keyLeft = true;}
    else { keyRight = true;}
    if (diffY > 0){ keyUp = true;}
    else { keyDown = true; }
    lastX = x;
    lastY = y;
}

function tEnd(event){

}

function percentToValue(percent, current, vRange){
    let x = percent * (vRange[1] - vRange[0]) + vRange[0];
    return x - current
}

function move(){
    plane.position.x += percentToValue(xPer, plane.position.x, [pXMin, pXMax]);
    plane.position.y += percentToValue(yPer, plane.position.y, [pYMax, pYMin]);
    propLeft.position.x += percentToValue(xPer, propLeft.position.x, [pXMin - 0.34744, pXMax - 0.34744]);
    propRight.position.x += percentToValue(xPer, propRight.position.x, [pXMin + 0.34744, pXMax + 0.34744]);
    propLeft.position.y += percentToValue(yPer, propLeft.position.y, [pYMax + 0.31733, pYMin + 0.31733]);
    propRight.position.y += percentToValue(yPer, propRight.position.y, [pYMax + 0.31733, pYMin + 0.31733]);
    camera.rotation.x += percentToValue(yPer, camera.rotation.x, [camXMax, camXMin]);
    camera.rotation.y += percentToValue(xPer, camera.rotation.y, [camYMax, camYMin]);
    background.rotation.x += percentToValue(yPer, background.rotation.x, [skyRotXMax, skyRotXMin]);
    background.rotation.y += percentToValue(xPer, background.rotation.y, [skyRotYMax, skyRotYMin]);
    plain.rotation.x += percentToValue(yPer, plain.rotation.x, [grdRotXMax, grdRotXMin]);
    plain.rotation.y += percentToValue(xPer, plain.rotation.y, [grdRotYMax, grdRotYMin]);
}

loadMods();

function reRender(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    render.setSize(window.innerWidth, window.innerHeight);
}

document.body.onresize = reRender;

function animate() {
    if (play){// check all clouds for deletion or collision
        for (let i in clouds) {
            if (clouds[i] === undefined) continue;
            if (clouds[i].alive === false){
                clouds.splice(i, 1);
                continue;
            }
            clouds[i].position.z += cloudSpeed;
            if (clouds[i].position.z > 31){clouds[i].alive = false;}
            if (checkForCollision(clouds[i])) {break}
        }
        if (timer >= progress){
            if (progress > progMin){
                progress -= 1;
            }
            timer = 0;
            newCloud();
        }
        timer += 1;
        if (keySpace) {
            if (turboTimer < 100){
                turboTimer += 1;
                turboNow = true;
            }
            else {
                turboNow = false;
            }
        }
        else {
            if (turboTimer > 0){ turboTimer -= 1; }
            turboNow = false;
        }
        if (keyRight) { arrowRight(); }
        if (keyLeft) { arrowLeft(); }
        if (keyDown) { arrowDown(); }
        if (keyUp) { arrowUp(); }
        move();
        if (touchMove){
            touchMove = false;
            keySpace = false;
            keyDown = false;
            keyRight = false;
            keyLeft = false;
            keyUp = false;
        }
        if (turboNow){
            propRight.rotation.z += 0.09;
            propLeft.rotation.z += 0.1;
        }
        else {
            propRight.rotation.z += 0.03;
            propLeft.rotation.z += 0.04;
        }
    }

    requestAnimationFrame(animate);
    render.render(scene, camera);

}
animate()
