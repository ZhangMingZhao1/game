export class InputManager {
  public keys = new Set<string>();
  public autoFire = true;
  public slowMove = false;
  public pointerActive = false;
  public pointerDeltaX = 0;
  public pointerDeltaY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private ultQueued = false;
  private transformQueued = false;
  public onPauseToggle: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyX' || e.code === 'KeyK') {
        this.ultQueued = true;
      }
      if (e.code === 'KeyC' && !e.repeat) {
        this.transformQueued = true;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.onPauseToggle) this.onPauseToggle();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointerActive = false;
    });

    // 触屏与鼠标相对拖动控制战机
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      this.pointerActive = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.pointerActive) return;
      this.pointerDeltaX += e.clientX - this.lastPointerX;
      this.pointerDeltaY += e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.pointerActive = false;
    });
  }

  public queueUltimate() {
    this.ultQueued = true;
  }

  public queueTransformation() {
    this.transformQueued = true;
  }

  public consumeTransformation(): boolean {
    if (!this.transformQueued) return false;
    this.transformQueued = false;
    return true;
  }

  public consumeUltimate(): boolean {
    if (this.ultQueued) {
      this.ultQueued = false;
      return true;
    }
    // 手柄按键检测
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      if (pad.buttons[1]?.pressed || pad.buttons[2]?.pressed || pad.buttons[5]?.pressed) {
        return true;
      }
    }
    return false;
  }

  public getMoveVector(scale: number): { dx: number; dy: number; rawDragX: number; rawDragY: number; slow: boolean } {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;

    // 手柄摇杆
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      const ax = pad.axes[0] || 0;
      const ay = pad.axes[1] || 0;
      if (Math.abs(ax) > 0.18) dx += ax;
      if (Math.abs(ay) > 0.18) dy += ay;
      if (pad.buttons[14]?.pressed) dx -= 1;
      if (pad.buttons[15]?.pressed) dx += 1;
      if (pad.buttons[12]?.pressed) dy -= 1;
      if (pad.buttons[13]?.pressed) dy += 1;
    }

    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }

    const rawDragX = this.pointerDeltaX / Math.max(0.25, scale);
    const rawDragY = this.pointerDeltaY / Math.max(0.25, scale);
    this.pointerDeltaX = 0;
    this.pointerDeltaY = 0;

    const slow = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    return { dx, dy, rawDragX, rawDragY, slow };
  }

  public isFiring(): boolean {
    if (this.autoFire) return true;
    return this.keys.has('KeyZ') || this.keys.has('Space') || this.keys.has('KeyJ') || this.pointerActive;
  }
}
