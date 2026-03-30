export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function calculatePhysics(state) {
  const theta = toRadians(state.theta);
  const weight = state.mass * state.g;
  const normalForce = weight * Math.cos(theta);
  const parallelComponent = weight * Math.sin(theta);
  const frictionLimit = Math.max(0, state.mu * normalForce);
  const frictionForce = Math.min(parallelComponent, frictionLimit);
  const netForce = parallelComponent - frictionForce;
  const acceleration = state.mass > 0 ? netForce / state.mass : 0;
  const isStatic = netForce <= 1e-6;
  const boxState = isStatic ? "at rest" : "would slide down";

  return {
    thetaRadians: theta,
    weight,
    normalForce,
    parallelComponent,
    perpendicularComponent: normalForce,
    frictionLimit,
    frictionForce,
    netForce,
    acceleration,
    isStatic,
    boxState,
    slopeRatio: Math.tan(theta),
  };
}

export function solveEquation(selection, values) {
  const theta = toRadians(values.theta);

  if (selection === "normal force") {
    return values.mass * values.g * Math.cos(theta);
  }

  if (selection === "parallel force") {
    return values.mass * values.g * Math.sin(theta);
  }

  const ratio = values.mass * values.g;
  if (ratio <= 0) {
    return 0;
  }

  const bounded = clamp(values.parallelForce / ratio, -1, 1);
  return toDegrees(Math.asin(bounded));
}
