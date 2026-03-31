import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow } from "../../shared/vectors.js";
import { RANGE_CONFIG } from "./constants.js";

const THETA = "\u03b8";
const DEGREE = "\u00b0";
const FORCE_REFERENCE = RANGE_CONFIG.mass.max * RANGE_CONFIG.g.max;

export function drawFBDView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const origin = { x: width * 0.44, y: height * 0.62 };
  const angle = physics.thetaRadians;
  const lengths = getForceLengths(bounds, state, physics);
  const planeNormal = { x: -Math.sin(angle), y: -Math.cos(angle) };
  const downslope = { x: -Math.cos(angle), y: Math.sin(angle) };
  const perpendicularVector = {
    x: -planeNormal.x * lengths.perpendicular,
    y: -planeNormal.y * lengths.perpendicular,
  };
  const parallelOrigin = {
    x: origin.x + perpendicularVector.x,
    y: origin.y + perpendicularVector.y,
  };

  ctx.save();
  ctx.fillStyle = "#102a2a";
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawLabel(ctx, "Free-body diagram", width * 0.12, height * 0.12, {
    color: "#225e51",
    size: 20,
    weight: 700,
  });

  drawConfiguredVector(ctx, origin, { x: 0, y: lengths.weight }, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, origin, { x: planeNormal.x * lengths.normal, y: planeNormal.y * lengths.normal }, "normal", vectorMeta, "F_N");
  drawConfiguredVector(ctx, origin, { x: -downslope.x * lengths.friction, y: -downslope.y * lengths.friction }, "friction", vectorMeta, "F_f", -16);
  drawConfiguredVector(ctx, parallelOrigin, { x: downslope.x * lengths.parallel, y: downslope.y * lengths.parallel }, "parallelComponent", vectorMeta, `mg sin ${THETA}`, -18);

  if (vectorMeta.perpendicularComponent?.visible) {
    drawComponentVector(
      ctx,
      origin,
      perpendicularVector,
      vectorMeta.perpendicularComponent.color,
      `mg cos ${THETA}`,
      18,
    );
  }

  drawAngleArc(
    ctx,
    origin.x,
    origin.y,
    Math.max(28, lengths.normal * 0.34),
    -Math.PI / 2,
    -Math.PI / 2 + angle,
    `${state.theta.toFixed(0)}${DEGREE}`,
    { labelOffset: 12 },
  );
}

function getForceLengths(bounds, state, physics) {
  const maxLength = Math.min(bounds.width, bounds.height) * 0.32;
  const minLength = 36;

  const scale = (value) => {
    if (!state.scaleVectorsByMagnitude) {
      return maxLength * 0.88;
    }

    const scaled = (Math.abs(value) / FORCE_REFERENCE) * maxLength;
    return Math.min(maxLength, Math.max(minLength, scaled));
  };

  const weight = scale(physics.weight);

  return {
    weight,
    normal: scale(physics.normalForce),
    friction: scale(physics.frictionForce),
    parallel: weight * Math.sin(physics.thetaRadians),
    perpendicular: weight * Math.cos(physics.thetaRadians),
  };
}

function drawConfiguredVector(ctx, origin, vector, key, vectorMeta, label, labelOffset = 14) {
  const config = vectorMeta[key];
  if (!config?.visible) {
    return;
  }

  drawArrow(ctx, {
    x: origin.x,
    y: origin.y,
    dx: vector.x,
    dy: vector.y,
    color: config.color,
    label,
    labelPosition: "middle",
    labelOffset,
  });
}

function drawComponentVector(ctx, origin, vector, color, label, labelOffset = 14) {
  drawArrow(ctx, {
    x: origin.x,
    y: origin.y,
    dx: vector.x,
    dy: vector.y,
    color,
    label,
    dashed: true,
    width: 3,
    head: 11,
    alpha: 1,
    labelPosition: "middle",
    labelOffset,
  });
}
