import nipplejs from 'nipplejs'

const JOYSTICK_ZONE_SIZE = 120

export class TouchController {
  public aimX = 0
  public aimY = 0
  public readonly isMobile: boolean

  private onTap: (x: number, y: number) => void
  private zoneEl?: HTMLElement
  private manager?: ReturnType<typeof nipplejs.create>

  constructor(onTap: (x: number, y: number) => void) {
    this.onTap = onTap
    this.isMobile = 'ontouchstart' in window

    if (this.isMobile) {
      this.createJoystick()
      this.handleTouchEnd()
    }
  }

  private createJoystick() {
    this.zoneEl = document.createElement('div')
    this.zoneEl.style.cssText = `
      position: fixed;
      right: 0;
      bottom: 0;
      width: ${JOYSTICK_ZONE_SIZE}px;
      height: ${JOYSTICK_ZONE_SIZE}px;
      z-index: 30;
    `
    document.body.appendChild(this.zoneEl)

    this.manager = nipplejs.create({
      zone: this.zoneEl,
      mode: 'static',
      position: { top: '50%', left: '50%' },
      size: 80,
      color: 'white',
    })

    this.manager.on('move', (evt) => {
      this.aimX = evt.data.vector.x
      this.aimY = evt.data.vector.y
    })

    // Al soltar el joystick volvemos a apuntar al centro.
    this.manager.on('end', () => {
      this.aimX = 0
      this.aimY = 0
    })
  }

  private handleTouchEnd() {
    document.addEventListener('touchend', this.onTouchEnd)
  }

  private onTouchEnd = (event: TouchEvent) => {
    // Ignora los toques que sueltan el joystick para que apuntar no dispare.
    if (this.zoneEl && event.target instanceof Node && this.zoneEl.contains(event.target)) {
      return
    }

    const touch = event.changedTouches[0]
    if (!touch) return

    this.onTap(touch.clientX, touch.clientY)
  }

  public dispose() {
    this.manager?.destroy()
    this.zoneEl?.remove()
    document.removeEventListener('touchend', this.onTouchEnd)
  }
}
