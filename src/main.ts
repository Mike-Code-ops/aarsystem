import * as THREE from 'three'
import { WelcomeScene } from './scenes/WelcomeScene'
import { OperationScene } from './scenes/OperationScene'
import { GameScene } from './scenes/GameScene'

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

document.body.style.cssText = 'margin:0; overflow:hidden; background:#000;'

type SceneWrapper = { render: () => void; dispose: () => void }
let currentScene: SceneWrapper

function goToGame(op: 'addition' | 'subtraction' | 'multiplication' | 'division') {
  currentScene = new GameScene(renderer, op, goToOperationSelect)
}

function goToOperationSelect() {
  currentScene = new OperationScene(renderer, goToGame)
}

currentScene = new WelcomeScene(renderer, goToOperationSelect)

function animate() {
  requestAnimationFrame(animate)
  currentScene.render()
}

animate()