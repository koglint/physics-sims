import { drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow, scaleVectorByMagnitude } from "../../shared/vectors.js";

export function drawRoadView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const centerX = width * 0.52;
  const centerY = height * 0.7;
  const roadLength = Math.min(width, height) * 0.52;
  const carWidth = roadLength * 0.16;
  const carHeight = roadLength * 0.07;
  const angle = -physics.thetaRadians;

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

  drawLabel(ctx, `${state.theta.toFixed(0)} deg bank`, width * 0.13, height * 0.12, {
    color: "#225e51",
    size: 18,
    weight: 700,
  });

  const origin = { x: centerX, y: centerY - roadLength * 0.07 };
  const maxForce = Math.max(physics.weight, physics.normalForce, Math.abs(physics.frictionActualSigned), physics.centripetalForce, 1);
  const baseScale = Math.min(width, height) * 0.25;
  const weightVector = { x: 0, y: getLength(physics.weight, maxForce, 24, baseScale, state.scaleVectorsByMagnitude) };
  const normalLength = getLength(physics.normalForce, maxForce, 24, baseScale, state.scaleVectorsByMagnitude);
  const normalVector = {
    x: Math.sin(physics.thetaRadians) * normalLength,
    y: -Math.cos(physics.thetaRadians) * normalLength,
  };
  const frictionLength = getLength(
    Math.abs(physics.frictionActualSigned),
    maxForce,
    18,
    baseScale * 0.85,
    state.scaleVectorsByMagnitude,
  );
  const frictionDirection = Math.sign(physics.frictionActualSigned || physics.frictionRequiredSigned || 0);
  const frictionVector = {
    x: Math.cos(physics.thetaRadians) * frictionLength * frictionDirection,
    y: Math.sin(physics.thetaRadians) * frictionLength * frictionDirection,
  };
  const centripetalVector = {
    x: getLength(physics.centripetalForce, maxForce, 18, baseScale, state.scaleVectorsByMagnitude),
    y: 0,
  };

  drawConfiguredVector(ctx, origin, weightVector, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, origin, normalVector, "normal", vectorMeta, "FN");

  if (state.frictionEnabled) {
    drawConfiguredVector(ctx, origin, frictionVector, "friction", vectorMeta, "Ff");
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
