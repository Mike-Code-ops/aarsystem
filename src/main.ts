import * as THREE from 'three'
import { WelcomeScene } from './scenes/WelcomeScene'
import { OperationScene } from './scenes/OperationScene'

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

document.body.style.cssText = 'margin:0; overflow:hidden; background:#000;'

type SceneWrapper = { render: () => void; dispose: () => void }
let currentScene: SceneWrapper

function goToOperationSelect() {
  currentScene = new OperationScene(renderer, (op) => {
    console.log('Operación seleccionada:', op)
    // Aquí después cargamos la escena del juego
  })
}

currentScene = new WelcomeScene(renderer, goToOperationSelect)

function animate() {
  requestAnimationFrame(animate)
  currentScene.render()
}

animate()