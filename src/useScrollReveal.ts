export type AnimationStyle =
  | "fade-up"
  | "fade"
  | "scale"
  | "slide-left"
  | "slide-right"
  | "blur"
  | "flip"
  | "drop";

export const animationStyles: { id: AnimationStyle; label: string }[] = [
  { id: "fade-up", label: "Fade Up" },
  { id: "fade", label: "Fade" },
  { id: "scale", label: "Scale" },
  { id: "slide-left", label: "Slide Left" },
  { id: "slide-right", label: "Slide Right" },
  { id: "blur", label: "Blur" },
  { id: "flip", label: "Flip" },
  { id: "drop", label: "Drop" },
];

// Numeric representation of all animated properties — easy to lerp
interface AnimNums {
  opacity: number;
  ty: number;
  tx: number;
  scale: number;
  rotateX: number;
  blur: number;
}

const VIS: AnimNums = { opacity: 1, ty: 0, tx: 0, scale: 1, rotateX: 0, blur: 0 };

// Enter hidden state: where the element starts BEFORE scrolling into view (below viewport)
function getEnterHidden(style: AnimationStyle): AnimNums {
  switch (style) {
    case "fade-up":    return { opacity: 0, ty: 40,  tx: 0,   scale: 1,    rotateX: 0,  blur: 0 };
    case "fade":       return { opacity: 0, ty: 0,   tx: 0,   scale: 1,    rotateX: 0,  blur: 0 };
    case "scale":      return { opacity: 0, ty: 0,   tx: 0,   scale: 0.85, rotateX: 0,  blur: 0 };
    case "slide-left": return { opacity: 0, ty: 0,   tx: -120, scale: 1,    rotateX: 0,  blur: 0 };
    case "slide-right":return { opacity: 0, ty: 0,   tx: 120,  scale: 1,    rotateX: 0,  blur: 0 };
    case "blur":       return { opacity: 0, ty: 0,   tx: 0,   scale: 1,    rotateX: 0,  blur: 12 };
    case "flip":       return { opacity: 0, ty: 0,   tx: 0,   scale: 1,    rotateX: 15, blur: 0 };
    case "drop":       return { opacity: 0, ty: -30, tx: 0,   scale: 0.95, rotateX: 0,  blur: 0 };
  }
}

// Leave hidden state: where the element ends AFTER scrolling out of view (above viewport)
// Directions are flipped — element moves with the scroll direction (upward/away)
function getLeaveHidden(style: AnimationStyle): AnimNums {
  switch (style) {
    case "fade-up":    return { opacity: 0, ty: -40, tx: 0,   scale: 1,    rotateX: 0,   blur: 0 };
    case "fade":       return { opacity: 0, ty: 0,   tx: 0,   scale: 1,    rotateX: 0,   blur: 0 };
    case "scale":      return { opacity: 0, ty: 0,   tx: 0,   scale: 1.15, rotateX: 0,   blur: 0 };
    case "slide-left": return { opacity: 0, ty: 0,   tx: -120, scale: 1,    rotateX: 0,   blur: 0 };
    case "slide-right":return { opacity: 0, ty: 0,   tx: 120,  scale: 1,    rotateX: 0,   blur: 0 };
    case "blur":       return { opacity: 0, ty: 0,   tx: 0,   scale: 1,    rotateX: 0,   blur: 12 };
    case "flip":       return { opacity: 0, ty: 0,   tx: 0,   scale: 1,    rotateX: -15, blur: 0 };
    case "drop":       return { opacity: 0, ty: -40, tx: 0,   scale: 0.95, rotateX: 0,   blur: 0 };
  }
}

function lerpNum(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpAnim(from: AnimNums, to: AnimNums, t: number): AnimNums {
  return {
    opacity:  lerpNum(from.opacity, to.opacity, t),
    ty:       lerpNum(from.ty, to.ty, t),
    tx:       lerpNum(from.tx, to.tx, t),
    scale:    lerpNum(from.scale, to.scale, t),
    rotateX:  lerpNum(from.rotateX, to.rotateX, t),
    blur:     lerpNum(from.blur, to.blur, t),
  };
}

function applyToEl(el: HTMLElement, v: AnimNums) {
  el.style.opacity = String(v.opacity);
  el.style.transform =
    `translateY(${v.ty}px) translateX(${v.tx}px) scale(${v.scale}) perspective(800px) rotateX(${v.rotateX}deg)`;
  if (v.blur > 0.01) {
    el.style.filter = `blur(${v.blur}px)`;
  } else {
    el.style.filter = "";
  }
}

// Ease-out cubic for smoother scroll-position mapping
function ease(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function computeTarget(
  rect: DOMRect,
  vh: number,
  enterHidden: AnimNums,
  leaveHidden: AnimNums,
): AnimNums {
  // ENTER: track the element's BOTTOM edge entering the viewport
  // Starts when bottom reaches the viewport bottom, done at 50% of vh
  const enterStart = vh;       // bottom edge just enters viewport
  const enterEnd = vh * 0.70;  // bottom edge reaches 70% of viewport

  if (rect.bottom > enterStart) {
    return enterHidden;
  }
  if (rect.bottom > enterEnd) {
    const t = ease(1 - (rect.bottom - enterEnd) / (enterStart - enterEnd));
    return lerpAnim(enterHidden, VIS, t);
  }

  // EXIT: track the element's TOP edge leaving the viewport
  // Starts when top reaches 30% of vh, fully hidden when top leaves viewport
  const leaveStart = vh * 0.30;

  if (rect.top >= leaveStart) {
    return VIS;
  }

  if (rect.top > 0) {
    const t = ease(rect.top / leaveStart);
    return lerpAnim(leaveHidden, VIS, t);
  }

  return leaveHidden;
}

const LERP_FACTOR = 0.18; // Smoothing: 0 = frozen, 1 = instant. 0.15-0.2 is sweet spot
const THRESHOLD = 0.001;

// Manages all scroll-reveal elements from a single scroll listener + RAF loop
class ScrollRevealManager {
  private entries = new Map<HTMLElement, {
    enterStyle: AnimationStyle;
    leaveStyle: AnimationStyle;
    current: AnimNums;
    target: AnimNums;
  }>();
  private raf: number | null = null;
  private running = false;

  constructor() {
    this.onScroll = this.onScroll.bind(this);
    this.tick = this.tick.bind(this);
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onScroll, { passive: true });
  }

  register(el: HTMLElement, enterStyle: AnimationStyle, leaveStyle: AnimationStyle) {
    const target = this.computeForEl(el, enterStyle, leaveStyle);
    this.entries.set(el, {
      enterStyle,
      leaveStyle,
      current: { ...target },
      target,
    });
    el.style.willChange = "opacity, transform, filter";
    applyToEl(el, target);
  }

  update(el: HTMLElement, enterStyle: AnimationStyle, leaveStyle: AnimationStyle) {
    const entry = this.entries.get(el);
    if (entry) {
      entry.enterStyle = enterStyle;
      entry.leaveStyle = leaveStyle;
      this.onScroll();
    }
  }

  unregister(el: HTMLElement) {
    this.entries.delete(el);
    el.style.willChange = "";
    el.style.opacity = "";
    el.style.transform = "";
    el.style.filter = "";
  }

  private computeForEl(el: HTMLElement, enterStyle: AnimationStyle, leaveStyle: AnimationStyle): AnimNums {
    const rect = el.getBoundingClientRect();
    return computeTarget(rect, window.innerHeight, getEnterHidden(enterStyle), getLeaveHidden(leaveStyle));
  }

  private onScroll() {
    // Update all targets
    for (const [el, entry] of this.entries) {
      entry.target = this.computeForEl(el, entry.enterStyle, entry.leaveStyle);
    }
    this.startTick();
  }

  private startTick() {
    if (!this.running) {
      this.running = true;
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick() {
    let needsMore = false;

    for (const [el, entry] of this.entries) {
      const { current, target } = entry;
      let changed = false;

      for (const key of Object.keys(current) as (keyof AnimNums)[]) {
        const diff = target[key] - current[key];
        if (Math.abs(diff) > THRESHOLD) {
          current[key] += diff * LERP_FACTOR;
          needsMore = true;
          changed = true;
        } else if (current[key] !== target[key]) {
          current[key] = target[key];
          changed = true;
        }
      }

      if (changed) applyToEl(el, current);
    }

    if (needsMore) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.running = false;
    }
  }

  destroy() {
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onScroll);
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

// Singleton manager — one scroll listener for all elements
let manager: ScrollRevealManager | null = null;

export function getManager() {
  if (!manager) manager = new ScrollRevealManager();
  return manager;
}
