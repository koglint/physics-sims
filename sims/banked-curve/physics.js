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
  // Resolve the force balance in the cross-section of the banked turn.
  const theta = toRadians(state.theta);
  const centripetalAcceleration = (state.velocity ** 2) / state.radius;
  const weight = state.mass * state.g;
  const idealSpeed = Math.sqrt(Math.max(0, state.radius * state.g * safeTan(theta)));
  const normalForce = state.mass * (centripetalAcceleration * Math.sin(theta) + state.g * Math.cos(theta));
  const frictionRequiredSigned = state.mass * (centripetalAcceleration * Math.cos(theta) - state.g * Math.sin(theta));
  const frictionLimit = state.frictionEnabled ? Math.max(0, state.mu * normalForce) : 0;
  const frictionActualSigned = state.frictionEnabled
    ? clamp(frictionRequiredSigned, -frictionLimit, frictionLimit)
    : 0;
  const centripetalForce = state.mass * centripetalAcceleration;
  const providedCentripetal = normalForce * Math.sin(theta) + frictionActualSigned * Math.cos(theta);
  const frictionDirection = getFrictionDirection(frictionRequiredSigned, state.frictionEnabled);
  const skidState = Math.abs(frictionRequiredSigned) > frictionLimit + 1e-6
    ? frictionRequiredSigned > 0
      ? "slides up"
      : "slides down"
    : "holds";

  return {
    thetaRadians: theta,
    weight,
    normalForce,
    centripetalForce,
    centripetalAcceleration,
    providedCentripetal,
    frictionRequiredSigned,
    frictionActualSigned,
    frictionMagnitude: Math.abs(frictionActualSigned),
    frictionLimit,
    idealSpeed,
    frictionDirection,
    vmax: computeVmax(state.radius, state.g, theta, state.mu, state.frictionEnabled),
    vmin: computeVmin(state.radius, state.g, theta, state.mu, state.frictionEnabled),
    isAtIdealSpeed: Math.abs(state.velocity - idealSpeed) < 0.15,
    skidState,
  };
}

export function solveIdealEquation(selection, values) {
  const theta = toRadians(values.theta);

  if (selection === "velocity") {
    return Math.sqrt(Math.max(0, values.radius * values.g * safeTan(theta)));
  }

  if (selection === "bank angle") {
    const angle = Math.atan((values.velocity ** 2) / (values.radius * values.g));
    return toDegrees(angle);
  }

  const tanTheta = safeTan(theta);
  return tanTheta <= 1e-6 ? 0 : (values.velocity ** 2) / (values.g * tanTheta);
}

export function getFrictionDirection(frictionSigned, enabled) {
  if (!enabled) {
    return "No friction";
  }

  if (Math.abs(frictionSigned) < 1e-6) {
    return "No friction needed";
  }

  return frictionSigned > 0 ? "Down slope" : "Up slope";
}

export function getPredictionCopy(physics) {
  if (!physics || physics.frictionDirection === "No friction") {
    return "Friction is disabled, so only weight and normal force act along the surface.";
  }

  if (physics.isAtIdealSpeed) {
    return "At the ideal speed, friction is almost unnecessary because the bank angle alone provides the centripetal effect.";
  }

  return physics.frictionDirection === "Down slope"
    ? "The car is moving faster than the ideal speed, so friction acts down the slope toward the centre."
    : "The car is moving slower than the ideal speed, so friction acts up the slope away from the centre.";
}

function computeVmax(radius, g, theta, mu, enabled) {
  if (!enabled) {
    return Number.NaN;
  }

  const numerator = radius * g * (Math.sin(theta) + mu * Math.cos(theta));
  const denominator = Math.cos(theta) - mu * Math.sin(theta);
  return denominator <= 0 ? Number.POSITIVE_INFINITY : Math.sqrt(Math.max(0, numerator / denominator));
}

function computeVmin(radius, g, theta, mu, enabled) {
  if (!enabled) {
    return Number.NaN;
  }

  const numerator = radius * g * (Math.sin(theta) - mu * Math.cos(theta));
  const denominator = Math.cos(theta) + mu * Math.sin(theta);
  return numerator <= 0 || denominator <= 0 ? 0 : Math.sqrt(Math.max(0, numerator / denominator));
}

function safeTan(theta) {
  const limit = Math.PI / 2 - 0.001;
  return Math.tan(Math.min(theta, limit));
}
