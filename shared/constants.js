export const PHYSICS_DEFAULTS = {
  theta: 20,
  velocity: 15,
  mass: 1200,
  radius: 50,
  mu: 0.4,
  frictionEnabled: true,
  g: 9.81,
  diagramMode: "road",
  showPrediction: true,
  solveFor: "velocity",
  scaleVectorsByMagnitude: true,
  showComponents: true,
  sigFigs: 3,
};

export const RANGE_CONFIG = {
  theta: { min: 0, max: 90, step: 1, unit: "deg" },
  velocity: { min: 2, max: 45, step: 0.5, unit: "m.s⁻¹" },
  mass: { min: 500, max: 2500, step: 10, unit: "kg" },
  radius: { min: 15, max: 200, step: 1, unit: "m" },
  mu: { min: 0, max: 1, step: 0.01, unit: "" },
  g: { min: 1.6, max: 15, step: 0.01, unit: "m.s⁻²" },
};

export const VECTOR_DEFAULTS = {
  weight: { visible: true, color: "#b23a48" },
  normal: { visible: true, color: "#226f54" },
  friction: { visible: true, color: "#f4a261" },
  centripetal: { visible: true, color: "#2a4d9b" },
  velocity: { visible: true, color: "#7a3ec8" },
  normalComponents: { visible: true, color: "#425466" },
  frictionComponents: { visible: false, color: "#6c757d" },
};

export const DIAGRAM_MODES = [
  { value: "road", label: "Road View" },
  { value: "fbd", label: "Free-Body Diagram" },
  { value: "top", label: "Top-Down View" },
];

export const SOLVE_OPTIONS = [
  { value: "velocity", label: "velocity" },
  { value: "bank angle", label: "bank angle" },
  { value: "radius", label: "radius" },
];

export const PRESETS = {
  ideal: (state) => ({
    theta: 20,
    velocity: Math.sqrt(state.radius * state.g * Math.tan(toRadians(20))),
    mu: 0,
    frictionEnabled: false,
  }),
  slow: () => ({
    theta: 26,
    velocity: 9,
    mu: 0.4,
    frictionEnabled: true,
  }),
  fast: () => ({
    theta: 18,
    velocity: 24,
    mu: 0.35,
    frictionEnabled: true,
  }),
  friction: () => ({
    theta: 22,
    velocity: 20,
    mu: 0.8,
    frictionEnabled: true,
  }),
  equilibrium: (state) => ({
    velocity: Math.sqrt(Math.max(0, state.radius * state.g * Math.tan(toRadians(state.theta)))),
  }),
};

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}
