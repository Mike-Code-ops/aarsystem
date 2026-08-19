import * as THREE from 'three'
import { WelcomeScene } from './scenes/WelcomeScene'

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

// Estilos base
document.body.style.cssText = 'margin:0; overflow:hidden; background:#000;'

let currentScene: WelcomeScene

function startGame() {
  console.log('Arrancando juego...')
  // Aquí después cargamos la siguiente escena
}

currentScene = new WelcomeScene(renderer, startGame)

function animate() {
  requestAnimationFrame(animate)
  currentScene.render()
}

animate()