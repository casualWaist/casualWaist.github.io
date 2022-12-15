import './style.css'
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {FontLoader} from "three/addons/loaders/FontLoader.js";
import {TextGeometry} from "three/addons/geometries/TextGeometry.js";


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
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
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
const greenFlatMat = new THREE.MeshStandardMaterial({color: 0x0bceaf})
const matbox = new THREE.Mesh(box, greenFlatMat);
matbox.position.set(0,0, 0);
const keyLight = new THREE.PointLight(0xffffff);
keyLight.position.set(5, 15, 20);
keyLight.intensity = 0.75;
const fillLight = new THREE.PointLight(0xffffff);
fillLight.position.set(-5, 15, 20);
fillLight.intensity = 0.5;
const ambiLight = new THREE.AmbientLight(0xffffff);

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

function createTri(arrange){
    const tri = new THREE.ConeGeometry(1, 1, 3);
    const star = new THREE.Mesh(tri, blackWire);

    const [tx, ty, tz] = Array(3)
        .fill()
        .map(() => THREE.MathUtils.randFloatSpread(100));

    if (arrange){
        star.position.set(tx, ty, tz);
    }
    scene.add(star);
    return {actor: star, mark: [tx, ty, tz]};
}

let bangArray;
function loadBigBang(arrange){
    let aLen = 200;
    bangArray = new Array(aLen);
    for (let i = 0; i < aLen; i++) {
        bangArray[i] = createTri(arrange);
    }
}

// loading custom meshes
const loader = new GLTFLoader();
const fontLoader = new FontLoader();
let face = {scene: {visible: false}};
let sci1;
let sci2;
let torus = {scene: {visible: false}};
function loadME() {
    loader.load('gitDist/assets/ME3D.glb', function (gltf) {
        gltf.scene.position.set(10, 0.5, 20);
        gltf.scene.rotation.set(0, -1, 0);
        gltf.scene.scale.set(2, 2, 2);
        gltf.scene.visible = false;
        scene.add(gltf.scene);
        face = gltf;
        fontLoader.load('gitDist/assets/Karnivore_Regular.json', function (font){
            const sciGeo = new TextGeometry( 'SCIENCE RULES!!', {
                font: font,
                size: 8,
                height: 1,
                curveSegments: 1,
                bevelEnabled: false,
                bevelThickness: 1,
                bevelSize: 2,
                bevelOffset: 0,
                bevelSegments: 3
            } );
            sci1 = new THREE.Mesh(sciGeo, blackWire);
            sci2 = new THREE.Mesh(sciGeo, blackWire);
            sci1.position.set(25, 6, 10);
            sci2.position.set(-40, -7, 10);
            sci1.scale.set(0.2, 0.2, 0.2);
            sci2.scale.set(0.2, 0.2, 0.2);
            scene.add(sci1);
            scene.add(sci2);
            const geometry = new THREE.TorusGeometry(8, 0.5, 16, 50);
            const blueWireMat = new THREE.MeshStandardMaterial({color: 0x19325c, wireframe: true});
            torus = new THREE.Mesh(geometry, blueWireMat);
            torus.position.set(20, 0, 9);
            scene.add(torus);
        });
    }, undefined, function (error) {
        console.error(error);
    });
}

let glasses = {scene: {visible: false}};
function loadGlass() {
    loader.load('gitDist/assets/glasses.glb', function (glas) {
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

const imageTex = new THREE.TextureLoader().load('gitDist/assets/malDesk.jpg');
const altTex1 = new THREE.TextureLoader().load('gitDist/assets/blocksFin.jpg');
const altTex2 = new THREE.TextureLoader().load('gitDist/assets/deckCover.jpg');
const altText3 = new THREE.TextureLoader().load('gitDist/assets/islandFinished.jpg');
imageTex.flipY = false;
altTex1.flipY = false;
altTex2.flipY = false;
altText3.flipY = false;
let umA = {scene: {visible: false}};
let umMat;
function loadUm() {
    loader.load('gitDist/assets/umActually.v1.Web.glb', function (actually) {
        actually.scene.position.set(1.8, -2.6, 31)
        actually.scene.rotation.set(0.23, -1.2, 0)
        actually.scene.visible = false;
        scene.add(actually.scene);
        console.log(actually.scene.children);
        actually.scene.children[83].children[1].material = new THREE.MeshStandardMaterial({map: imageTex});
        umA = actually;
        umMat = actually.scene.children[83].children[1].material;
    }, undefined, function (error) {
        console.error(error);
    });
}

const fbxLoader = new FBXLoader();
let sign = {scene: {visible: false}};
function loadSign() {
    fbxLoader.load( 'gitDist/assets/A&ASigns.fbx', function ( fbx ) {
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
    fetch('gitDist/videoSection.html')
    .then ( (r) => { return r.text();  } )
    .then ( (s) => {
        vids = document.querySelector("#sec7");
        vids.innerHTML = s;
    });
}

let pics;
function loadPics(){
    fetch('gitDist/picSection.html')
        .then ( (r) => { return r.text();  } )
        .then ( (s) => {
            pics = document.querySelector("#sec3");
            pics.innerHTML = s;
        }).then(() => {let gal = pics.querySelector("#highGallery");
        gal.scroll({top: gal.scrollHeight}); });
}

let rollTop;
let rollBottom;
function loadRollover(){
    fetch('gitDist/rollSection.html')
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
    if (0 <= degrees && degrees < 30) {
        aPlaceTop = degrees * 100 / 3000;
        upAtTheTop(aPlaceTop);
    }
    else if (30 <= degrees && degrees < 90) {
        bPlace3d = (degrees - 30) * 100 / 6000;
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
    else if (90 <= degrees && degrees < 120) {
        cPlaceVid = (degrees - 90) * 100 / 3000;
        behindPics(cPlaceVid);
    }
    else if (120 <= degrees && degrees < 180) {
        dPlace3d = (degrees - 120) * 100 / 6000;
        if (picLoad){
            picLoad = false;
            loadPics();
        }
        upFromStart(dPlace3d);
    }
    else if (180 <= degrees && degrees < 210) {
        ePlaceStart = (degrees - 180) * 100 / 3000;
        startPlacesHidden(ePlaceStart);
        if (headLoad) {
            headLoad = false;
            loadME();
        }
    }
    else if (210 <= degrees && degrees < 270) {
        fPlace3d = (degrees - 210) * 100 / 6000;
        if (vidLoad) {
            vidLoad = false;
            loadVids();
        }
        downFromStart(fPlace3d);
    }
    else if (270 <= degrees && degrees < 300) {
        gPlaceStory = (degrees - 270) * 100 / 3000;
        if (headLoad) {
            headLoad = false;
            loadME();
        }
        if(bangLoad){
            bangLoad = false;
            loadBigBang(false);
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
            loadBigBang(true);
        }
        hideBangLow(iPlaceBottom);
    }
    else {console.log('circle out of bounds!!!');}
    umA.scene.visible = 30 <= degrees && degrees < 100;
    face.scene.visible = 200 <= degrees && degrees < 280;
    torus.visible = 200 <= degrees && degrees < 280;
    nMesh.visible = 100 <= degrees && degrees < 190;
    if (284 <= degrees && degrees < 288){
        let bangHidePlace = (degrees - 284) * 100 / 400;
        hideBangHigh(bangHidePlace);
    }
    if (0 <= degrees && degrees <= 130){
        if (umLoad){
            umLoad = false;
            loadUm();
        }
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
const headRot = [1, -1];
const headMove = [10, -10];
const torusRoll = [0, 10];
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
    //matbox.position.x += percentToValue(place, matbox.position.x, flyInFromOffRight);
    moveMyHead(place);
}

function throughVideos(place) {
    scene.fog.density += percentToValue(place, scene.fog.density, fog2Down);
}

function behindPics(place){
    scene.fog.density += percentToValue(place, scene.fog.density, fogDown);
    keyLight.position.y += percentToValue(place, keyLight.position.y, [5, 15]);
    fillLight.position.y += percentToValue(place, fillLight.position.y, [5, 15]);
}

function move3dSet(place){
    umA.scene.rotation.y += percentToValue(place, umA.scene.rotation.y, umRotate);
    umA.scene.position.x += percentToValue(place, umA.scene.position.x, umMoveX);

    if (0.25 <= place && place <= 0.35 && umMat.map !== imageTex) {
        umMat.map = imageTex;
        umMat.needsUpdate = true;
    }
    else if (0.35 <= place && place <= 0.5 && umMat.map !== altTex1) {
        umMat.map = altTex1;
        umMat.needsUpdate = true;
    }
    else if (0.5 <= place && place <= 0.65 && umMat.map !== altTex2) {
        umMat.map = altTex2;
        umMat.needsUpdate = true;
    }
    else if (0.65 <= place && place <= 0.8 && umMat.map !== altText3) {
        umMat.map = altText3;
        umMat.needsUpdate = true;
    }
}

function moveMyHead(place){
    face.scene.rotation.y += percentToValue(place, face.scene.rotation.y, headRot);
    face.scene.position.x += percentToValue(place, face.scene.position.x, headMove);
    sci1.position.x += percentToValue(place, sci1.position.x, [25, -50]);
    sci2.position.x += percentToValue(place, sci2.position.x, [-40, 20]);
    torus.position.x += percentToValue(place, torus.position.x, [20, -20]);
    torus.rotation.z += percentToValue(place, torus.rotation.z, torusRoll);
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
    keyLight.position.y += percentToValue(place, keyLight.position.y, [15, 5]);
    fillLight.position.y += percentToValue(place, fillLight.position.y, [15, 5]);
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

