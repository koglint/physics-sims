import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow } from "../../shared/vectors.js";
import { RANGE_CONFIG } from "./constants.js";

const THETA = "\u03b8";
const DEGREE = "\u00b0";
const FORCE_REFERENCE = RANGE_CONFIG.mass.max * RANGE_CONFIG.g.max;

export function drawSlopeView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const baseX = width * 0.18;
  const baseY = height * 0.78;
  const slopeLength = Math.min(width, height) * 0.7;
  const angle = physics.thetaRadians;
  const topX = baseX + Math.cos(angle) * slopeLength;
  const topY = baseY - Math.sin(angle) * slopeLength;
  const boxWidth = slopeLength * 0.15;
  const boxHeight = slopeLength * 0.11;
  const boxCenter = {
    x: baseX + Math.cos(angle) * slopeLength * 0.42 - Math.sin(angle) * boxHeight * 0.42,
    y: baseY - Math.sin(angle) * slopeLength * 0.42 - Math.cos(angle) * boxHeight * 0.42,
  };
  const lengths = getForceLengths(bounds, state, physics);
  const planeNormal = { x: -Math.sin(angle), y: -Math.cos(angle) };
  const downslope = { x: -Math.cos(angle), y: Math.sin(angle) };
  const weightVector = { x: 0, y: lengths.weight };
  const normalVector = { x: planeNormal.x * lengths.normal, y: planeNormal.y * lengths.normal };
  const frictionVector = { x: -downslope.x * lengths.friction, y: -downslope.y * lengths.friction };
  const parallelVector = { x: downslope.x * lengths.parallel, y: downslope.y * lengths.parallel };
  const perpendicularVector = { x: -planeNormal.x * lengths.perpendicular, y: -planeNormal.y * lengths.perpendicular };
  const parallelOrigin = {
    x: boxCenter.x + perpendicularVector.x,
    y: boxCenter.y + perpendicularVector.y,
  };

  drawSlopeBase(ctx, baseX, baseY, topX, topY, boxCenter, boxWidth, boxHeight, angle);
  drawLabel(ctx, "Slope view", width * 0.12, height * 0.12, {
    color: "#225e51",
    size: 20,
    weight: 700,
  });

  drawConfiguredVector(ctx, boxCenter, weightVector, "weight", vectorMeta);
  drawConfiguredVector(ctx, boxCenter, normalVector, "normal", vectorMeta);
  drawConfiguredVector(ctx, boxCenter, frictionVector, "friction", vectorMeta);
  drawConfiguredVector(ctx, parallelOrigin, parallelVector, "parallelComponent", vectorMeta);

  if (vectorMeta.perpendicularComponent?.visible) {
    drawComponentVector(ctx, boxCenter, perpendicularVector, vectorMeta.perpendicularComponent.color);
  }

  drawVectorLabel(ctx, boxCenter, weightVector, vectorMeta.weight, "mg", {
    along: 0.58,
    normalOffset: -18,
  });
  drawVectorLabel(ctx, boxCenter, normalVector, vectorMeta.normal, "F_N", {
    along: 0.74,
    normalOffset: -22,
  });
  drawVectorLabel(ctx, boxCenter, frictionVector, vectorMeta.friction, "F_f", {
    along: 0.52,
    normalOffset: 20,
  });
  drawVectorLabel(ctx, parallelOrigin, parallelVector, vectorMeta.parallelComponent, `mg sin ${THETA}`, {
    along: 0.58,
    normalOffset: -18,
  });
  drawVectorLabel(ctx, boxCenter, perpendicularVector, vectorMeta.perpendicularComponent, `mg cos ${THETA}`, {
    along: 0.55,
    normalOffset: -24,
  });

  if (vectorMeta.weight.visible && vectorMeta.perpendicularComponent.visible) {
    drawAngleArc(
      ctx,
      boxCenter.x,
      boxCenter.y,
      Math.max(26, lengths.weight * 0.18),
      Math.PI / 2 - angle,
      Math.PI / 2,
      `${state.theta.toFixed(0)}${DEGREE}`,
      { labelOffset: 10 },
    );
  }

  drawAngleArc(
    ctx,
    baseX + 10,
    baseY - 2,
    Math.max(30, slopeLength * 0.12),
    -angle,
    0,
    `${state.theta.toFixed(0)}${DEGREE}`,
    { labelOffset: 12 },
  );
}

function drawSlopeBase(ctx, baseX, baseY, topX, topY, boxCenter, boxWidth, boxHeight, angle) {
  ctx.save();
  ctx.fillStyle = "#eadfca";
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(topX, topY);
  ctx.lineTo(topX, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#5e5a55";
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(topX, topY);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(boxCenter.x, boxCenter.y);
  ctx.rotate(-angle);
  ctx.fillStyle = "#fefae0";
  ctx.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
  ctx.strokeStyle = "#102a2a";
  ctx.lineWidth = 2;
  ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
  ctx.restore();
}

function getForceLengths(bounds, state, physics) {
  const maxLength = Math.min(bounds.width, bounds.height) * 0.42;
  const minLength = 54;

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

function drawConfiguredVector(ctx, origin, vector, key, vectorMeta) {
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
  });
}

function drawComponentVector(ctx, origin, vector, color) {
  drawArrow(ctx, {
    x: origin.x,
    y: origin.y,
    dx: vector.x,
    dy: vector.y,
    color,
    dashed: true,
    width: 3,
    head: 11,
    alpha: 1,
  });
}

function drawVectorLabel(ctx, origin, vector, config, text, options = {}) {
  if (!config?.visible) {
    return;
  }

  const { along = 0.65, normalOffset = 0 } = options;
  const length = Math.hypot(vector.x, vector.y) || 1;
  const directionX = vector.x / length;
  const directionY = vector.y / length;
  const normalX = -directionY;
  const normalY = directionX;
  const x = origin.x + vector.x * along + normalX * normalOffset;
  const y = origin.y + vector.y * along + normalY * normalOffset;

  drawLabel(ctx, text, x, y, {
    color: config.color,
    size: 16,
    weight: 700,
  });
}
