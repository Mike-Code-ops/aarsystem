import * as THREE from 'three'

type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division'

interface Exercise {
  a: number
  b: number
  correct: number
  options: number[]
}

export class GameScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private operation: Operation
  private exercise: Exercise
  private uiElements: HTMLElement[] = []
  private targets: THREE.Mesh[] = []
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2(0, 0)
  private crosshair!: HTMLElement
  private feedbackEl!: HTMLElement
  private panelEl!: HTMLElement
  private locked = false
  private clickListenerTimeout?: number

  constructor(renderer: THREE.WebGLRenderer, operation: Operation) {
    this.renderer = renderer
    this.operation = operation
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 1.6, 6)

    this.exercise = this.generateExercise()
    this.buildScene()
    this.buildUI()
    this.handleResize()
    this.handleMouseMove()
    this.handleClick()
  }

  private generateExercise(): Exercise {
    let a: number, b: number, correct: number

    switch (this.operation) {
      case 'addition':
        a = Math.floor(Math.random() * 10) + 1
        b = Math.floor(Math.random() * 10) + 1
        correct = a + b
        break
      case 'subtraction':
        a = Math.floor(Math.random() * 10) + 5
        b = Math.floor(Math.random() * a) + 1
        correct = a - b
        break
      case 'multiplication':
        a = Math.floor(Math.random() * 5) + 1
        b = Math.floor(Math.random() * 5) + 1
        correct = a * b
        break
      case 'division':
        b = Math.floor(Math.random() * 4) + 2
        correct = Math.floor(Math.random() * 5) + 1
        a = b * correct
        break
      default:
        a = 1; b = 1; correct = 2
    }

    const options = new Set<number>([correct])
    while (options.size < 4) {
      const d = correct + (Math.floor(Math.random() * 7) - 3)
      if (d !== correct && d > 0) options.add(d)
    }

    return { a, b, correct, options: Array.from(options).sort(() => Math.random() - 0.5) }
  }

  private makeTargetTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(128, 128, 128, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#c0392b'
    ctx.lineWidth = 20
    ctx.beginPath()
    ctx.arc(128, 128, 118, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#222222'
    ctx.font = 'bold 96px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 128)

    return new THREE.CanvasTexture(canvas)
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

    this.targets = []
    const positionsX = [-4.5, -1.5, 1.5, 4.5]
    positionsX.forEach((x, i) => {
      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.2, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x8B7355 })
      )
      pedestal.position.set(x, 0.6, 0)
      this.scene.add(pedestal)

      const texture = this.makeTargetTexture(String(this.exercise.options[i]))
      const target = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 64),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      )
      target.position.set(x, 1.95, 0)
      target.userData.answer = this.exercise.options[i]
      this.scene.add(target)
      this.targets.push(target)
    })
  }

  private buildUI() {
    const opSymbols: Record<Operation, string> = {
      addition: '+', subtraction: '−', multiplication: '×', division: '÷'
    }

    // Panel con la operación
    this.panelEl = document.createElement('div')
    this.panelEl.style.cssText = `
      position: absolute;
      top: 12%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.92);
      border-radius: 12px;
      padding: 16px 40px;
      text-align: center;
      font-family: sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    `
    this.panelEl.innerHTML = `
      <div style="font-size:2.5rem;font-weight:bold;color:#222;">
        ${this.exercise.a} ${opSymbols[this.operation]} ${this.exercise.b}
      </div>
      <div style="font-size:1rem;color:#888;margin-top:4px;">¿Cuál es la respuesta correcta?</div>
    `
    document.body.appendChild(this.panelEl)
    this.uiElements.push(this.panelEl)

    // Mira (crosshair)
    this.crosshair = document.createElement('div')
    this.crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-radius: 50%;
      pointer-events: none;
      box-shadow: 0 0 4px rgba(0,0,0,0.6);
    `
    // top/left arrancan centrados en pantalla; onMouseMove los sobreescribe
    // en píxeles siguiendo al ratón, manteniendo el transform de centrado.
    document.body.appendChild(this.crosshair)
    this.uiElements.push(this.crosshair)

    // Feedback
    this.feedbackEl = document.createElement('div')
    this.feedbackEl.style.cssText = `
      position: absolute;
      top: 62%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2rem;
      font-weight: bold;
      font-family: sans-serif;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.5);
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    `
    document.body.appendChild(this.feedbackEl)
    this.uiElements.push(this.feedbackEl)
  }

  private handleMouseMove() {
    window.addEventListener('mousemove', this.onMouseMove)
  }

  private onMouseMove = (event: MouseEvent) => {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.crosshair.style.left = `${event.clientX}px`
    this.crosshair.style.top = `${event.clientY}px`
  }

  private handleClick() {
    // Evita que el click del botón de la OperationScene, que se propaga
    // al montar esta escena, dispare el raycaster inmediatamente.
    this.clickListenerTimeout = window.setTimeout(() => {
      window.addEventListener('click', this.onClick)
    }, 800)
  }

  private onClick = () => {
    if (this.locked) return

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const hits = this.raycaster.intersectObjects(this.targets)

    if (hits.length === 0) return

    const hit = hits[0].object as THREE.Mesh
    const answer = hit.userData.answer as number
    const isCorrect = answer === this.exercise.correct

    this.locked = true
    this.showFeedback(isCorrect)

    setTimeout(() => {
      this.nextExercise()
    }, 1200)
  }

  private showFeedback(correct: boolean) {
    this.feedbackEl.innerText = correct ? '✓ ¡Correcto!' : '✗ Incorrecto'
    this.feedbackEl.style.color = correct ? '#27ae60' : '#c0392b'
    this.feedbackEl.style.opacity = '1'
  }

  private nextExercise() {
    // Limpiar dianas anteriores
    this.targets.forEach(t => this.scene.remove(t))
    this.targets = []

    // Limpiar pedestales — los removemos todos y reconstruimos la escena
    this.scene.clear()
    this.exercise = this.generateExercise()
    this.buildScene()

    // Resetear panel
    const opSymbols: Record<Operation, string> = {
      addition: '+', subtraction: '−', multiplication: '×', division: '÷'
    }
    this.panelEl.innerHTML = `
      <div style="font-size:2.5rem;font-weight:bold;color:#222;">
        ${this.exercise.a} ${opSymbols[this.operation]} ${this.exercise.b}
      </div>
      <div style="font-size:1rem;color:#888;margin-top:4px;">¿Cuál es la respuesta correcta?</div>
    `

    this.feedbackEl.style.opacity = '0'
    this.locked = false
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
    if (this.clickListenerTimeout !== undefined) {
      window.clearTimeout(this.clickListenerTimeout)
    }
    window.removeEventListener('click', this.onClick)
    window.removeEventListener('mousemove', this.onMouseMove)
    this.uiElements.forEach(el => el.remove())
  }
}