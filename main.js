import './style.css'
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";


if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// basic environment setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
const render = new THREE.WebGLRenderer({canvas: document.querySelector('#bg'),});
render.setPixelRatio(window.devicePixelRatio);
render.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);
render.render(scene, camera);
function reRender(){
    render.setPixelRatio(window.devicePixelRatio);
    render.setSize(window.innerWidth, window.innerHeight);
}

document.body.onresize = reRender;

// calculating window and camera bounds for sync
const visibleHeightAtZDepth = ( depth, camera ) => {
    // compensate for cameras not positioned at z=0
    const cameraOffset = camera.position.z;
    if ( depth < cameraOffset ) depth -= cameraOffset;
    else depth += cameraOffset;

    // vertical fov in radians
    const vFOV = camera.fov * Math.PI / 180;

    // Math.abs to ensure the result is always positive
    return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
};

const visibleWidthAtZDepth = ( depth, camera ) => {
    const height = visibleHeightAtZDepth( depth, camera );
    return height * camera.aspect;
}

let threeWidth = visibleWidthAtZDepth(30, camera)*0.34;
let threeHeight = visibleHeightAtZDepth(30, camera)*0.34;
console.log(threeWidth, threeHeight);
const body = document.body;
const html = document.documentElement;
const docHeight = Math.max( body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight );
const offAmount = docHeight * 0.005;
const heightMinusBuff = docHeight * 0.89;
body.scrollTop = heightMinusBuff * 0.5;
html.scrollTop = heightMinusBuff * 0.5;
window.scrollTo(0, heightMinusBuff * 0.5);

// setting up scene basics
const box = new THREE.BoxGeometry(threeWidth, threeHeight, threeHeight);
const geometry = new THREE.TorusGeometry(5, 0.5, 16, 100);
const blueWireMat = new THREE.MeshStandardMaterial({color: 0x4287f5, wireframe: true});
const torus = new THREE.Mesh(geometry, blueWireMat);
torus.position.set(0, 0, 20);
const greenFlatMat = new THREE.MeshStandardMaterial({color: 0x0bceaf})
const matbox = new THREE.Mesh(box, greenFlatMat);
matbox.position.set(0,0, 0);
const keyLight = new THREE.PointLight(0xffffff);
keyLight.position.set(5, 15, 30);
keyLight.intensity = 0.75;
const fillLight = new THREE.PointLight(0xffffff);
fillLight.position.set(-5, 15, 30);
fillLight.intensity = 0.5;
const ambiLight = new THREE.AmbientLight(0xffffff);

//scene.add(torus);
//scene.add(matbox);
scene.add(keyLight);
scene.add(fillLight);
scene.add(ambiLight);

const point = new THREE.CapsuleGeometry;
const blackWire = new THREE.MeshStandardMaterial({color: 0xc200ab, wireframe: true});
const nMesh = new THREE.Mesh(point, blackWire);
nMesh.position.set(0, threeHeight/2, 20);
//nMesh.rotation.set(0, 1.57, 0);
nMesh.scale.set(20, 2, 0.125);
nMesh.visible = false;
scene.add(nMesh);
const color = 0x4287f5;
const density = 0.085;
scene.fog = new THREE.FogExp2(color, density);

function createTri(){
    const tri = new THREE.ConeGeometry(1, 1, 3);
    const star = new THREE.Mesh(tri, blackWire);

    const [tx, ty, tz] = Array(3)
        .fill()
        .map(() => THREE.MathUtils.randFloatSpread(100));

    //star.position.set(tx, ty, tz);
    scene.add(star);
    return {actor: star, mark: [tx, ty, tz]};
}

let bangArray;
function loadBigBang(){
    let aLen = 200;
    bangArray = new Array(aLen);
    for (let i = 0; i < aLen; i++) {
        bangArray[i] = createTri();
    }
}

// loading custom meshes
const loader = new GLTFLoader();
let face = {scene: {visible: false}};
function loadME() {
    loader.load('assets/me3d test.glb', function (gltf) {
        gltf.scene.position.set(0, 0, 20);
        gltf.scene.scale.set(2, 2, 2);
        gltf.scene.visible = false;
        scene.add(gltf.scene);
        face = gltf;
    }, undefined, function (error) {
        console.error(error);
    });
}

let glasses = {scene: {visible: false}};
function loadGlass() {
    loader.load('assets/glasses.glb', function (glas) {
        glas.scene.position.set(0, 0, 25);
        glas.scene.rotation.set(0, -1.57, 0);
        glas.scene.visible = false;
        scene.add(glas.scene);
        glasses = glas;
        //console.log(glas.parser.getDependencies('material').then(function (mats) {mats[3] = greenFlatMat}));
        //console.log(glas.parser.getDependencies('material'));
    }, undefined, function (error) {
        console.error(error);
    });
}

let umA = {scene: {visible: false}};
function loadUm() {
    loader.load('assets/umActually.v1.U.glb', function (actually) {
        actually.scene.position.set(1.8, -2.6, 31)
        actually.scene.rotation.set(0.23, -1.2, 0)
        actually.scene.visible = false;
        scene.add(actually.scene);
        umA = actually;
    }, undefined, function (error) {
        console.error(error);
    });
}

const fbxLoader = new FBXLoader();
let sign = {scene: {visible: false}};
function loadSign() {
    fbxLoader.load( 'assets/A&ASigns.fbx', function ( fbx ) {
        fbx.position.set(-5, -2, 20);
        fbx.rotation.set(1.57, 3.14, 3.14);
        fbx.scale.set(0.125, 0.125, 0.125);
        fbx.scene.visible = false;
        scene.add( fbx );
        sign = fbx.scene;
    }, undefined, function ( error ) {
        console.error( error );
    } );
}

let vids;
function loadVids(){
    fetch('videoSection.html')
    .then ( (r) => { return r.text();  } )
    .then ( (s) => {
        vids = document.querySelector("#sec7");
        vids.innerHTML = s;
    });
}

let pics;
function loadPics(){
    fetch('picSection.html')
        .then ( (r) => { return r.text();  } )
        .then ( (s) => {
            pics = document.querySelector("#sec3");
            pics.innerHTML = s;
        });
}

let rollTop;
let rollBottom;
function loadRollover(){
    fetch('rollSection.html')
        .then ( (r) => { return r.text();  } )
        .then ( (s) => {
            rollTop = document.querySelector("#sec1top");
            rollTop.innerHTML = s;
            rollBottom = document.querySelector("#sec9last");
            rollBottom.innerHTML = s;
        });
}

// handling the scroll and translating it to a circle
let moveMuch = 0; // 0 - 359 percent of page (y=50)=0 (y=max)=359
function moveThisMuch() {
    let y = window.scrollY; // distance from top
    //console.log(t, y);
    let hold = 360 * y / heightMinusBuff; // translation to degrees
    //console.log(hold, diff, moveMuch);
    if (hold < 1) {
        moveMuch = 360;
        console.log('bottom up')
        body.scrollTop = heightMinusBuff;
        html.scrollTop = heightMinusBuff;
    }
    if (hold > 360) {
        moveMuch = 0;
        console.log('to the top');
        body.scrollTop = offAmount;
        html.scrollTop = offAmount;
    }
    //if (hold > 100 && !umA){loadUm();}
    moveMuch = 360 * y / heightMinusBuff;
    progressCircle(moveMuch);
}

document.body.onscroll = moveThisMuch;

// changing glasses material on button press
function changeMat(){
    console.log(glasses.scene.children[0].children[3]);
    glasses.scene.children[0].children[3].material = greenFlatMat
}
document.addEventListener('keydown', changeMat, false)

// keeping track the circle of section animations and progress
let aPlaceTop = 0.0; // 0 - 1 reping % of section complete
let bPlace3d = 0.0;
let cPlaceVid = 0.0;
let dPlace3d = 0.0;
let ePlaceStart = 0.0;
let fPlace3d = 0.0;
let gPlaceStory = 0.0;
let hPlace3d = 0.0;
let iPlaceBottom = 0.0;

let umLoad = true;
let vidLoad = true;
let picLoad = true;
let rollLoad = true;
let headLoad = true;
let glassLoad = true;
let bangLoad = true;
function progressCircle(degrees){
    console.log(degrees);
    if (0 <= degrees && degrees < 40) {
        aPlaceTop = degrees * 100 / 4000;
        if (umLoad){
            umLoad = false;
            loadUm();
        }
        upAtTheTop(aPlaceTop);
    }
    else if (40 <= degrees && degrees < 80) {
        bPlace3d = (degrees - 40) * 100 / 4000;
        move3dSet(bPlace3d);
        if (rollLoad) {
            rollLoad = false;
            loadRollover();
        }
        if (picLoad){
            picLoad = false;
            loadPics();
        }
    }
    else if (80 <= degrees && degrees < 135) {
        cPlaceVid = (degrees - 80) * 100 / 4000;
        if (umLoad){
            umLoad = false;
            loadUm();
        }
        behindPics(cPlaceVid);
    }
    else if (135 <= degrees && degrees < 180) {
        dPlace3d = (degrees - 135) * 100 / 4500;
        if (picLoad){
            picLoad = false;
            loadPics();
        }
        upFromStart(dPlace3d);
    }
    else if (180 <= degrees && degrees < 220) {
        ePlaceStart = (degrees - 180) * 100 / 4000;
        startPlacesHidden(ePlaceStart);
        if (headLoad) {
            headLoad = false;
            loadME();
        }
    }
    else if (220 <= degrees && degrees < 260) {
        fPlace3d = (degrees - 220) * 100 / 4000;
        if (vidLoad) {
            vidLoad = false;
            loadVids();
        }
        downFromStart(fPlace3d);
    }
    else if (260 <= degrees && degrees < 300) {
        gPlaceStory = (degrees - 260) * 100 / 4000;
        if (headLoad) {
            headLoad = false;
            loadME();
        }
        if(bangLoad){
            bangLoad = false;
            loadBigBang();
        }
        throughVideos(gPlaceStory);
    }
    else if (300 <= degrees && degrees < 340) {
        hPlace3d = (degrees - 300) * 100 / 4000;
        if (vidLoad) {
            vidLoad = false;
            loadVids();
        }
        if (rollLoad) {
            rollLoad = false;
            loadRollover();
        }
        bigBang(hPlace3d);
    }
    else if (340 <= degrees && degrees < 360) {
        iPlaceBottom = (degrees - 340) * 100 / 4000;
        if(bangLoad){
            bangLoad = false;
            loadBigBang();
        }
        hideBangLow(iPlaceBottom);
    }
    else {console.log('circle out of bounds!!!');}
    umA.scene.visible = 30 <= degrees && degrees < 100;
    face.scene.visible = 190 <= degrees && degrees < 270;
    nMesh.visible = 100 <= degrees && degrees < 190;
    if (284 <= degrees && degrees < 288){
        let bangHidePlace = (degrees - 284) * 100 / 400;
        hideBangHigh(bangHidePlace);
    }
    //console.log(firstSecPlace, secondSecPlace, thirdSecPlace, fourthSecPlace);
}

const flyInFromOffLeft = [-threeWidth/2, 0];
const flyInFromOffRight = [threeWidth/2, 0];
const umRotate = [-0.2, -1.2];
const umMoveX = [-1.8, 1.8];
const techScale = [100, .125];
const techScaleX = [2, 20]
const techY = [0, threeHeight/2];
const headRot = [12.56, 0];
const fogUp = [0.085, 0];
const fogDown = [0, 0.085];
const fog2Up = [0.02, 0];
const fog2Down = [0, 0.02];

function percentToValue(percent, current, vRange){
    console.log(percent);
    let x = percent * (vRange[1] - vRange[0]) + vRange[0];
    return x - current
}

function startPlacesHidden(place) {
    scene.fog.density += percentToValue(place, scene.fog.density, fogUp);
}

function upFromStart(place) {
//    torus.position.x += percentToValue(place, torus.position.x, flyInFromOffLeft);
    nMesh.scale.z += percentToValue(place, nMesh.scale.z, techScale);
    nMesh.position.y += percentToValue(place, nMesh.position.y, techY);
    nMesh.scale.x += percentToValue(place, nMesh.scale.x, techScaleX);
}

function downFromStart(place) {
    matbox.position.x += percentToValue(place, matbox.position.x, flyInFromOffRight);
    moveMyHead(place);
}

function throughVideos(place) {
    scene.fog.density += percentToValue(place, scene.fog.density, fog2Down);
}

function behindPics(place){
    scene.fog.density += percentToValue(place, scene.fog.density, fogDown);
}

function move3dSet(place){
    umA.scene.rotation.y += percentToValue(place, umA.scene.rotation.y, umRotate);
    umA.scene.position.x += percentToValue(place, umA.scene.position.x, umMoveX);
}

function moveMyHead(place){
    face.scene.rotation.y += percentToValue(place, face.scene.rotation.y, headRot);
}

function bigBang(place){
    bangArray.forEach(tri => {
        tri.actor.position.x += percentToValue(place, tri.actor.position.x, [0, tri.mark[0]]);
        tri.actor.position.y += percentToValue(place, tri.actor.position.y, [0, tri.mark[1]]);
        tri.actor.position.z += percentToValue(place, tri.actor.position.z, [0, tri.mark[2]]);
        tri.actor.rotation.x += THREE.MathUtils.randFloat(0, 0.07);
        tri.actor.rotation.y += THREE.MathUtils.randFloat(0, 0.07);
        tri.actor.rotation.z += THREE.MathUtils.randFloat(0, 0.07);
    })
}

function hideBangLow(place){
    bangArray.forEach(tri => {
        tri.actor.position.y += percentToValue(place, tri.actor.position.y, [tri.mark[1], 200]);
    })
}

function hideBangHigh(place){
    bangArray.forEach(tri => {
        tri.actor.position.y += percentToValue(place, tri.actor.position.y, [1000, 0]);
    })
}

function upAtTheTop(place){
    scene.fog.density += percentToValue(place, scene.fog.density, fog2Up);
}

function moveCamera(diff){
    camera.position.z += diff * .01;
}

// animation for continuous looping
function animate() {
    requestAnimationFrame(animate);/*
    torus.rotation.x += 0.0;
    torus.rotation.y += 0.01;
    torus.rotation.z += 0.01;*/
    //if (!headLoad && face) {face.scene.rotation.y += 0.05;}
    //controls.update();
    render.render(scene, camera);
}
animate()

