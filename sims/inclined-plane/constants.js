export const INCLINED_DEFAULTS = {
  theta: 25,
  mass: 12,
  mu: 0.6,
  g: 9.81,
  diagramMode: "slope",
  solveFor: "normal force",
  sigFigs: 3,
  scaleVectorsByMagnitude: true,
};

export const RANGE_CONFIG = {
  theta: { min: 0, max: 60, step: 1, unit: "deg" },
  mass: { min: 1, max: 50, step: 0.5, unit: "kg" },
  mu: { min: 0, max: 1.2, step: 0.01, unit: "" },
  g: { min: 1.6, max: 15, step: 0.01, unit: "m.s^-2" },
};

export const VECTOR_DEFAULTS = {
  weight: { visible: true, color: "#b23a48" },
  normal: { visible: true, color: "#226f54" },
  friction: { visible: true, color: "#f4a261" },
  parallelComponent: { visible: true, color: "#2a4d9b" },
  perpendicularComponent: { visible: true, color: "#425466" },
};

export const DIAGRAM_MODES = [
  { value: "slope", label: "Slope View" },
  { value: "fbd", label: "Free-Body Diagram" },
  { value: "components", label: "Components View" },
];

export const SOLVE_OPTIONS = [
  { value: "normal force", label: "normal force" },
  { value: "parallel force", label: "parallel force" },
  { value: "angle", label: "angle" },
];
