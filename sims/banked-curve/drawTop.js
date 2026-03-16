import { drawDashedCircle, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow, scaleVectorByMagnitude } from "../../shared/vectors.js";

export function drawTopView(ctx, bounds, state, physics, vectorMeta, animationTime) {
  const { width, height } = bounds;
  const centerX = width * 0.5;
  const centerY = height * 0.55;
  const minRadius = Math.min(width, height) * 0.14;
  const maxRadius = Math.min(width, height) * 0.34;
  const trackRadius = minRadius + ((state.radius - 15) / (200 - 15)) * (maxRadius - minRadius);
  const angularSpeed = state.radius > 0 ? state.velocity / state.radius : 0;
  const angle = (animationTime * angularSpeed) / 1000;
  const carX = centerX + Math.cos(angle) * trackRadius;
  const carY = centerY + Math.sin(angle) * trackRadius;
  const inward = { x: centerX - carX, y: centerY - carY };
  const tangent = { x: -Math.sin(angle), y: Math.cos(angle) };
  const maxForce = Math.max(physics.centripetalForce, state.velocity, 1);
  const baseScale = Math.min(width, height) * 0.24;

  drawDashedCircle(ctx, centerX, centerY, trackRadius, "#7a8f89");
  drawLabel(ctx, "Top-down view", width * 0.12, height * 0.12, {
    color: "#225e51",
    size: 20,
    weight: 700,
  });

  ctx.save();
  ctx.fillStyle = "#102a2a";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4d35e";
  ctx.beginPath();
  ctx.arc(carX, carY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#102a2a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const centripetalLength = getLength(physics.centripetalForce, maxForce, 24, baseScale, state.scaleVectorsByMagnitude);
  const velocityLength = getLength(state.velocity, Math.max(state.velocity, 1), 30, baseScale * 0.85, state.scaleVectorsByMagnitude);
  const frictionLength = getLength(
    Math.abs(physics.frictionActualSigned),
    maxForce,
    18,
    baseScale * 0.75,
    state.scaleVectorsByMagnitude,
  );
  const inwardNorm = normalize(inward.x, inward.y);
  const frictionDirection = Math.sign(physics.frictionActualSigned || physics.frictionRequiredSigned || 1);

  drawConfiguredVector(ctx, carX, carY, tangent.x * velocityLength, tangent.y * velocityLength, "velocity", vectorMeta, "v");
  drawConfiguredVector(ctx, carX, carY, inwardNorm.x * centripetalLength, inwardNorm.y * centripetalLength, "centripetal", vectorMeta, "Fc");

  if (state.frictionEnabled) {
    drawConfiguredVector(
      ctx,
      carX,
      carY,
      inwardNorm.x * frictionLength * frictionDirection,
      inwardNorm.y * frictionLength * frictionDirection,
      "friction",
      vectorMeta,
      "Ff",
    );
  }
}

function getLength(value, maxForce, minLength, maxLength, useMagnitudeScaling) {
  return useMagnitudeScaling ? scaleVectorByMagnitude(value, maxForce, minLength, maxLength) : maxLength * 0.72;
}

function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function drawConfiguredVector(ctx, x, y, dx, dy, key, vectorMeta, label) {
  const config = vectorMeta[key];
  if (!config?.visible) {
    return;
  }

  drawArrow(ctx, {
    x,
    y,
    dx,
    dy,
    color: config.color,
    label,
  });
}
