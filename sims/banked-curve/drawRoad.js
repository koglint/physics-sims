import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow, scaleVectorByMagnitude } from "../../shared/vectors.js";

export function drawRoadView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const centerX = width * 0.52;
  const centerY = height * 0.7;
  const roadLength = Math.min(width, height) * 0.52;
  const carWidth = roadLength * 0.16;
  const carHeight = roadLength * 0.07;
  const angle = physics.thetaRadians;
  const leftEnd = {
    x: centerX - Math.cos(angle) * roadLength * 0.55,
    y: centerY - Math.sin(angle) * roadLength * 0.55,
  };

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  ctx.strokeStyle = "#5e5a55";
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-roadLength * 0.55, 0);
  ctx.lineTo(roadLength * 0.55, 0);
  ctx.stroke();

  ctx.fillStyle = "#fefae0";
  ctx.fillRect(-carWidth / 2, -carHeight - 10, carWidth, carHeight);
  ctx.strokeStyle = "#102a2a";
  ctx.lineWidth = 2;
  ctx.strokeRect(-carWidth / 2, -carHeight - 10, carWidth, carHeight);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#8f877b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftEnd.x - roadLength * 0.1, leftEnd.y);
  ctx.lineTo(leftEnd.x + roadLength * 0.48, leftEnd.y);
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, `${state.theta.toFixed(0)} deg bank`, width * 0.13, height * 0.12, {
    color: "#225e51",
    size: 18,
    weight: 700,
  });

  drawAngleArc(
    ctx,
    leftEnd.x + roadLength * 0.03,
    leftEnd.y,
    Math.max(28, roadLength * 0.14),
    0,
    physics.thetaRadians,
    "theta",
    { labelOffset: 12 },
  );

  const origin = { x: centerX, y: centerY - roadLength * 0.07 };
  const maxForce = 22000;
  const baseScale = Math.min(width, height) * 0.34;
  const weightVector = { x: 0, y: getLength(physics.weight, maxForce, 42, baseScale, state.scaleVectorsByMagnitude) };
  const normalLength = getLength(physics.normalForce, maxForce, 42, baseScale, state.scaleVectorsByMagnitude);
  const normalVector = {
    x: Math.sin(physics.thetaRadians) * normalLength,
    y: -Math.cos(physics.thetaRadians) * normalLength,
  };
  const frictionLength = getLength(
    Math.abs(physics.frictionActualSigned),
    maxForce,
    24,
    baseScale * 0.92,
    state.scaleVectorsByMagnitude,
  );
  const frictionDirection = Math.sign(physics.frictionActualSigned || physics.frictionRequiredSigned || 0);
  const frictionVector = {
    x: Math.cos(physics.thetaRadians) * frictionLength * frictionDirection,
    y: Math.sin(physics.thetaRadians) * frictionLength * frictionDirection,
  };
  const centripetalVector = {
    x: getLength(physics.centripetalForce, maxForce, 28, baseScale, state.scaleVectorsByMagnitude),
    y: 0,
  };

  drawConfiguredVector(ctx, origin, weightVector, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, origin, normalVector, "normal", vectorMeta, "FN");

  if (state.frictionEnabled) {
    drawConfiguredVector(ctx, origin, frictionVector, "friction", vectorMeta, "Ff");
  }

  if (vectorMeta.normalComponents?.visible) {
    drawComponentVector(ctx, origin, { x: normalVector.x, y: 0 }, vectorMeta.normalComponents.color, "FNx");
    drawComponentVector(ctx, origin, { x: 0, y: normalVector.y }, vectorMeta.normalComponents.color, "FNy");
  }

  if (state.frictionEnabled && vectorMeta.frictionComponents?.visible) {
    drawComponentVector(ctx, origin, { x: frictionVector.x, y: 0 }, vectorMeta.frictionComponents.color, "Ffx");
    drawComponentVector(ctx, origin, { x: 0, y: frictionVector.y }, vectorMeta.frictionComponents.color, "Ffy");
  }

  drawConfiguredVector(ctx, origin, centripetalVector, "centripetal", vectorMeta, "Fc");
}

function getLength(value, maxForce, minLength, maxLength, useMagnitudeScaling) {
  return useMagnitudeScaling ? scaleVectorByMagnitude(value, maxForce, minLength, maxLength) : maxLength * 0.72;
}

function drawConfiguredVector(ctx, origin, vector, key, vectorMeta, label) {
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
  });
}

function drawComponentVector(ctx, origin, vector, color, label) {
  drawArrow(ctx, {
    x: origin.x,
    y: origin.y,
    dx: vector.x,
    dy: vector.y,
    color,
    label,
    dashed: true,
    width: 2,
    alpha: 0.9,
  });
}
