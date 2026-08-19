import * as THREE from 'three'

type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division'

export class OperationScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private onSelect: (op: Operation) => void
  private uiElements: HTMLElement[] = []

  constructor(renderer: THREE.WebGLRenderer, onSelect: (op: Operation) => void) {
    this.renderer = renderer
    this.onSelect = onSelect
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 2, 5)

    this.buildScene()
    this.buildUI()
    this.handleResize()
  }

  private buildScene() {
    this.scene.background = new THREE.Color(0x87ceeb)

    const ambient = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xffffff, 1)
    sun.position.set(5, 10, 5)
    this.scene.add(sun)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshLambertMaterial({ color: 0x4caf50 })
    )
    ground.rotation.x = -Math.PI / 2
    this.scene.add(ground)
  }

  private buildUI() {
    // Contenedor del panel
    const panel = document.createElement('div')
    panel.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255,255,255,0.92);
      border-radius: 16px;
      padding: 32px 40px;
      text-align: center;
      min-width: 320px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    `

    // Título del panel
    const title = document.createElement('h2')
    title.innerText = 'What do you want to practice?'
    title.style.cssText = `
      font-family: sans-serif;
      font-size: 1.3rem;
      color: #333;
      margin: 0 0 8px 0;
    `

    const subtitle = document.createElement('p')
    subtitle.innerText = 'Choose an operation to start the session'
    subtitle.style.cssText = `
      font-family: sans-serif;
      font-size: 0.9rem;
      color: #888;
      margin: 0 0 24px 0;
    `

    // Grid de botones
    const grid = document.createElement('div')
    grid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    `

    const operations = [
      { label: '+', name: 'Addition', value: 'addition' as Operation },
      { label: '−', name: 'Subtraction', value: 'subtraction' as Operation },
      { label: '×', name: 'Multiplication', value: 'multiplication' as Operation },
      { label: '÷', name: 'Division', value: 'division' as Operation },
    ]

    operations.forEach(op => {
      const btn = document.createElement('button')
      btn.innerHTML = `<span style="font-size:1.8rem;display:block;">${op.label}</span><span style="font-size:0.85rem;">${op.name}</span>`
      btn.style.cssText = `
        padding: 18px 12px;
        background: #c0392b;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-family: sans-serif;
        transition: background 0.2s;
      `
      btn.onmouseover = () => btn.style.background = '#a93226'
      btn.onmouseleave = () => btn.style.background = '#c0392b'
      btn.onclick = () => {
        this.dispose()
        this.onSelect(op.value)
      }
      grid.appendChild(btn)
    })

    panel.appendChild(title)
    panel.appendChild(subtitle)
    panel.appendChild(grid)
    document.body.appendChild(panel)
    this.uiElements.push(panel)
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
    this.uiElements.forEach(el => el.remove())
  }
}