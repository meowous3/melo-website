import { useState, useRef, useCallback, Suspense, lazy } from "react";
import { ScrollReveal } from "../components/ScrollReveal";
import type { LandingTheme } from "../themes";

const LazyDemoApp = lazy(() => import("./DemoApp"));

// idle → loading → fading → collapsing → done
// done → closing → expanding → idle
type Phase = "idle" | "loading" | "fading" | "collapsing" | "done" | "closing" | "expanding";

export default function DemoSection({
  currentTheme,
  onThemeChange,
  onActivate,
  onClose,
}: {
  currentTheme: LandingTheme;
  onThemeChange: (t: LandingTheme) => void;
  onActivate?: () => void;
  onClose?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [previewHeight, setPreviewHeight] = useState(0);
  const skeletonRef = useRef<HTMLDivElement>(null);

  const handleLoad = useCallback((e: React.MouseEvent) => {
    const section = (e.target as HTMLElement).closest(".demo-section");
    if (section) setPreviewHeight(section.getBoundingClientRect().height);
    setPhase("loading");
  }, []);

  // Demo is fading in → fade out the skeleton at the same time
  const handleDemoReady = useCallback(() => {
    onActivate?.();
    const el = skeletonRef.current;
    if (!el) { setPhase("collapsing"); return; }
    setPhase("fading");
    el.style.transition = "opacity 400ms ease";
    el.style.opacity = "0";
    el.addEventListener("transitionend", () => setPhase("collapsing"), { once: true });
  }, [onActivate]);

  // Collapse the spacer once skeleton is gone
  const spacerCallback = useCallback((el: HTMLDivElement | null) => {
    if (!el || phase !== "collapsing") return;
    el.style.height = previewHeight + "px";
    el.style.overflow = "hidden";
    el.offsetHeight; // reflow
    el.style.transition = "height 600ms ease-in-out";
    el.style.height = "0";
    el.addEventListener("transitionend", () => {
      window.scrollBy(0, 1);
      setPhase("done");
    }, { once: true });
  }, [phase, previewHeight]);

  // Close the demo: fade it out, then expand skeleton back
  const handleClose = useCallback(() => {
    const demoEls = document.querySelectorAll<HTMLElement>(".demo-wrapper");
    const demoEl = demoEls[demoEls.length - 1];
    if (!demoEl) { setPhase("expanding"); onClose?.(); return; }
    demoEl.style.transition = "opacity 400ms ease";
    demoEl.style.opacity = "0";
    demoEl.addEventListener("transitionend", () => {
      onClose?.();
      setPhase("expanding");
    }, { once: true });
  }, [onClose]);

  // Expand skeleton back into view from 0 height
  const expandRef = useCallback((el: HTMLDivElement | null) => {
    if (!el || phase !== "expanding") return;
    // Is the expanding element above the viewport? If so, compensate scroll.
    const elPageTop = el.getBoundingClientRect().top + window.scrollY;
    const needsCompensation = elPageTop < window.scrollY;

    // Start at 0 height, expand to full
    el.style.height = "0";
    el.style.overflow = "hidden";
    el.style.opacity = "0";
    el.offsetHeight; // reflow
    el.style.transition = "height 600ms ease-in-out, opacity 400ms ease 200ms";
    el.style.height = previewHeight + "px";
    el.style.opacity = "1";

    if (needsCompensation) {
      let lastH = 0;
      const compensate = () => {
        const curH = el.getBoundingClientRect().height;
        const delta = curH - lastH;
        if (delta > 0) window.scrollBy(0, delta);
        lastH = curH;
        if (curH < previewHeight) requestAnimationFrame(compensate);
      };
      requestAnimationFrame(compensate);
    }

    el.addEventListener("transitionend", (e) => {
      if (e.propertyName !== "height") return;
      el.style.height = "";
      el.style.overflow = "";
      el.style.transition = "";
      setPhase("idle");
    }, { once: true });
  }, [phase, previewHeight]);

  const showSkeleton = phase === "idle" || phase === "loading" || phase === "fading";
  const showDemo = phase !== "idle" && phase !== "expanding";
  const showButton = phase === "idle";
  const showSpacer = phase === "collapsing";
  const showExpander = phase === "expanding";
  const showMinSpacer = phase === "done" || phase === "closing";

  return (
    <>
      {showSkeleton && (
        <section className="demo-section" id="demo">
          <ScrollReveal>
            <div className="demo-preview" ref={skeletonRef}>
              <div className="demo-preview-inner">
                <div className="demo-preview-mock">
                  <div className="demo-preview-titlebar" />
                  <div className="demo-preview-search" />
                  <div className="demo-preview-tabs">
                    <span /><span /><span />
                  </div>
                  <div className="demo-preview-tracks">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="demo-preview-track">
                        <div className="demo-preview-thumb" />
                        <div className="demo-preview-lines">
                          <div /><div />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="demo-preview-player" />
                </div>
                {showButton && (
                  <button className="demo-preview-btn" onClick={handleLoad}>
                    Load Interactive Demo
                  </button>
                )}
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}
      {showSpacer && <div ref={spacerCallback} />}
      {showExpander && (
        <section className="demo-section" id="demo">
          <div ref={expandRef}>
            <ScrollReveal>
              <div className="demo-preview">
                <div className="demo-preview-inner">
                  <div className="demo-preview-mock">
                    <div className="demo-preview-titlebar" />
                    <div className="demo-preview-search" />
                    <div className="demo-preview-tabs">
                      <span /><span /><span />
                    </div>
                    <div className="demo-preview-tracks">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="demo-preview-track">
                          <div className="demo-preview-thumb" />
                          <div className="demo-preview-lines">
                            <div /><div />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="demo-preview-player" />
                  </div>
                  <button className="demo-preview-btn" onClick={handleLoad}>
                    Load Interactive Demo
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}
      {showMinSpacer && <div id="demo" style={{ height: 60 }} />}
      {showDemo && (
        <Suspense fallback={null}>
          <LazyDemoApp currentTheme={currentTheme} onThemeChange={onThemeChange} onReady={handleDemoReady} onClose={handleClose} />
        </Suspense>
      )}
    </>
  );
}
