// Reading touches on the pet: a tap, quick taps (a tickle), a stroke across
// it, a long press (a cuddle), and a scrub (back and forth). The reader is
// plain logic fed with pointer positions and times, so it can be tested
// without a screen; `petGestures` wires it to an element.

export interface GestureHandlers {
  ontap?: () => void;
  /** Quick taps: the count so far in this burst (from 5). */
  ontickle?: (taps: number) => void;
  onstroke?: () => void;
  oncuddle?: (holding: boolean) => void;
  onscrub?: () => void;
}

export const TICKLE_FROM = 5;
const BURST_MS = 1500;
const HOLD_MS = 550;
const MOVE_SLOP = 12;
const STROKE_DISTANCE = 60;
const SCRUB_TURNS = 4;

interface Press {
  x: number;
  y: number;
  at: number;
  lastX: number;
  travelled: number;
  dir: number;
  turns: number;
  moved: boolean;
  stroked: boolean;
  scrubbed: boolean;
  holding: boolean;
}

export class GestureReader {
  private press: Press | null = null;
  private taps: number[] = [];
  private holdTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private handlers: GestureHandlers) {}

  update(handlers: GestureHandlers): void {
    this.handlers = handlers;
  }

  down(x: number, y: number, at: number): void {
    this.press = {
      x,
      y,
      at,
      lastX: x,
      travelled: 0,
      dir: 0,
      turns: 0,
      moved: false,
      stroked: false,
      scrubbed: false,
      holding: false,
    };
    clearTimeout(this.holdTimer);
    this.holdTimer = setTimeout(() => this.hold(), HOLD_MS);
  }

  move(x: number, y: number): void {
    const p = this.press;
    if (!p || p.holding) return;
    const dx = x - p.lastX;
    if (!p.moved && Math.hypot(x - p.x, y - p.y) > MOVE_SLOP) {
      p.moved = true;
      clearTimeout(this.holdTimer);
    }
    if (!p.moved || dx === 0) return;
    p.travelled += Math.abs(dx);
    const dir = Math.sign(dx);
    // A turn counts once the finger has gone a little way the other direction.
    if (p.dir !== 0 && dir !== p.dir && Math.abs(dx) > 2) p.turns += 1;
    if (Math.abs(dx) > 2) p.dir = dir;
    p.lastX = x;
    if (!p.scrubbed && p.turns >= SCRUB_TURNS) {
      p.scrubbed = true;
      this.handlers.onscrub?.();
    }
    if (
      !p.stroked &&
      p.turns < 2 &&
      p.travelled >= STROKE_DISTANCE &&
      Math.abs(x - p.x) >= STROKE_DISTANCE * 0.8
    ) {
      p.stroked = true;
      this.handlers.onstroke?.();
    }
  }

  up(at: number): void {
    const p = this.press;
    this.press = null;
    clearTimeout(this.holdTimer);
    if (!p) return;
    if (p.holding) return this.handlers.oncuddle?.(false);
    if (p.moved) return;
    this.taps = [...this.taps.filter((t) => at - t < BURST_MS), at];
    if (this.taps.length >= TICKLE_FROM)
      this.handlers.ontickle?.(this.taps.length);
    else this.handlers.ontap?.();
  }

  cancel(): void {
    const holding = this.press?.holding;
    this.press = null;
    clearTimeout(this.holdTimer);
    if (holding) this.handlers.oncuddle?.(false);
  }

  private hold(): void {
    const p = this.press;
    if (!p || p.moved) return;
    p.holding = true;
    this.taps = [];
    this.handlers.oncuddle?.(true);
  }
}

/** Svelte action: reads gestures on the element. Keyboard Enter and Space count as a tap. */
export function petGestures(node: HTMLElement, handlers: GestureHandlers) {
  const reader = new GestureReader(handlers);
  const down = (e: PointerEvent) => {
    if (e.button !== 0) return;
    node.setPointerCapture?.(e.pointerId);
    reader.down(e.clientX, e.clientY, e.timeStamp);
  };
  const move = (e: PointerEvent) => reader.move(e.clientX, e.clientY);
  const up = (e: PointerEvent) => reader.up(e.timeStamp);
  const cancel = () => reader.cancel();
  const key = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      reader.down(0, 0, e.timeStamp);
      reader.up(e.timeStamp);
    }
  };
  const menu = (e: Event) => e.preventDefault();
  node.addEventListener("pointerdown", down);
  node.addEventListener("pointermove", move);
  node.addEventListener("pointerup", up);
  node.addEventListener("pointercancel", cancel);
  node.addEventListener("keydown", key);
  node.addEventListener("contextmenu", menu);
  return {
    update(next: GestureHandlers) {
      reader.update(next);
    },
    destroy() {
      reader.cancel();
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", cancel);
      node.removeEventListener("keydown", key);
      node.removeEventListener("contextmenu", menu);
    },
  };
}
