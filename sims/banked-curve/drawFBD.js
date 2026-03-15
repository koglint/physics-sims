import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow, scaleVectorByMagnitude } from "../../shared/vectors.js";

export function drawFBDView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const origin = { x: width * 0.48, y: height * 0.56 };
  const maxForce = 30000;
  const baseScale = Math.min(width, height) * 0.26;

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

  const normalLength = getLength(physics.normalForce, maxForce, 28, baseScale, state.scaleVectorsByMagnitude);
  const frictionLength = getLength(
    Math.abs(physics.frictionActualSigned),
    maxForce,
    18,
    baseScale * 0.9,
    state.scaleVectorsByMagnitude,
  );
  const weightLength = getLength(physics.weight, maxForce, 28, baseScale, state.scaleVectorsByMagnitude);
  const normalVector = {
    x: Math.sin(physics.thetaRadians) * normalLength,
    y: -Math.cos(physics.thetaRadians) * normalLength,
  };
  const weightVector = { x: 0, y: weightLength };
  const frictionDirection = Math.sign(physics.frictionActualSigned || physics.frictionRequiredSigned || 0);
  const frictionVector = {
    x: Math.cos(physics.thetaRadians) * frictionLength * frictionDirection,
    y: Math.sin(physics.thetaRadians) * frictionLength * frictionDirection,
  };

  drawConfiguredVector(ctx, origin, weightVector, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, origin, normalVector, "normal", vectorMeta, "FN");

  if (state.frictionEnabled) {
    drawConfiguredVector(ctx, origin, frictionVector, "friction", vectorMeta, "Ff");
  }

  drawAngleArc(
    ctx,
    origin.x,
    origin.y,
    Math.max(24, normalLength * 0.34),
    -Math.PI / 2,
    -Math.PI / 2 + physics.thetaRadians,
    "θ",
    { labelOffset: 12 },
  );

  if (state.showComponents && vectorMeta.normalComponents?.visible) {
    drawArrow(ctx, {
      x: origin.x,
      y: origin.y,
      dx: 0,
      dy: -Math.cos(physics.thetaRadians) * normalLength,
      color: vectorMeta.normalComponents.color,
      label: "FNy",
      dashed: true,
      width: 2,
    });
    drawArrow(ctx, {
        x: origin.x,
        y: origin.y,
        dx: Math.sin(physics.thetaRadians) * normalLength,
        dy: 0,
        color: vectorMeta.normalComponents.color,
        label: "FNx",
      dashed: true,
      width: 2,
    });
  }

  if (state.showComponents && state.frictionEnabled && vectorMeta.frictionComponents?.visible) {
      drawArrow(ctx, {
        x: origin.x,
        y: origin.y,
        dx: Math.cos(physics.thetaRadians) * frictionLength * frictionDirection,
        dy: 0,
        color: vectorMeta.frictionComponents.color,
        label: "Ffx",
        dashed: true,
        width: 2,
        alpha: 0.8,
      });
      drawArrow(ctx, {
        x: origin.x,
        y: origin.y,
        dx: 0,
        dy: Math.sin(physics.thetaRadians) * frictionLength * frictionDirection,
        color: vectorMeta.frictionComponents.color,
        label: "Ffy",
        dashed: true,
        width: 2,
        alpha: 0.8,
      });
  }
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
