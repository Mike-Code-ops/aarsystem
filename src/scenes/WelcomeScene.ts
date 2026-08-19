import * as THREE from 'three'

export class WelcomeScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private onStart: () => void

  constructor(renderer: THREE.WebGLRenderer, onStart: () => void) {
    this.renderer = renderer
    this.onStart = onStart
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 2, 5)

    this.buildScene()
    this.buildUI()
    this.handleResize()
  }

  private buildScene() {
    // Cielo
    this.scene.background = new THREE.Color(0x87ceeb)

    // Luz
    const ambient = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xffffff, 1)
    sun.position.set(5, 10, 5)
    this.scene.add(sun)

    // Pasto
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshLambertMaterial({ color: 0x4caf50 })
    )
    ground.rotation.x = -Math.PI / 2
    this.scene.add(ground)
  }

  private buildUI() {
    // Panel flotante (fondo blanco semitransparente simulado con un plano)
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 1.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
    )
    panel.position.set(0, 3, 0)
    this.scene.add(panel)

    // Botón Start en HTML (overlay)
    const btn = document.createElement('button')
    btn.innerText = 'Start'
    btn.style.cssText = `
      position: absolute;
      bottom: 35%;
      left: 50%;
      transform: translateX(-50%);
      padding: 14px 40px;
      font-size: 1.4rem;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    `
    btn.onclick = () => {
  this.dispose()
  this.onStart()
}
    document.body.appendChild(btn)

    // Título en HTML (overlay)
    const title = document.createElement('h1')
    title.innerText = 'AARSystem'
    title.style.cssText = `
      position: absolute;
      top: 33%;
      width: 100%;
      text-align: center;
      color: white;
      font-size: 3rem;
      font-family: sans-serif;
      text-shadow: 2px 2px 6px rgba(0,0,0,0.5);
      margin: 0;
    `
    document.body.appendChild(title)

    // Guardamos referencias para limpiar después
    ;(this as any)._uiElements = [title, btn]
  }

  private handleResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  public render() {
    this.renderer.render(this.scene, this.camera)
  }

  public dispose() {
    const els = (this as any)._uiElements as HTMLElement[]
    els?.forEach(el => el.remove())
  }
}