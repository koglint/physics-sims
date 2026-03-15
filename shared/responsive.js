import { debounceFrame } from "./ui.js";

export function watchCanvasResize(canvas, container, onResize) {
  const resizeObserver = new ResizeObserver(
    debounceFrame(() => {
      onResize(canvas, container);
    }),
  );

  resizeObserver.observe(container);
  window.addEventListener("orientationchange", () => onResize(canvas, container));

  return resizeObserver;
}

export function applyViewportMode(root) {
  const mobileQuery = window.matchMedia("(max-width: 42rem)");
  const tabletQuery = window.matchMedia("(max-width: 72rem)");

  const update = () => {
    root.dataset.viewport = mobileQuery.matches ? "phone" : tabletQuery.matches ? "tablet" : "desktop";
  };

  update();
  mobileQuery.addEventListener("change", update);
  tabletQuery.addEventListener("change", update);
}
