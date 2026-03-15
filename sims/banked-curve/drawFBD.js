import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow } from "../../shared/vectors.js";

export function drawFBDView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const origin = { x: width * 0.44, y: height * 0.63 };
  const angle = physics.thetaRadians;
  const frictionDirection = Math.sign(physics.frictionActualSigned || physics.frictionRequiredSigned || 0);
  const mainScale = createForceScaler(Math.min(width, height) * 0.46, 46, 18000, state.scaleVectorsByMagnitude);
  const componentScale = createForceScaler(Math.min(width, height) * 0.46, 0, 18000, state.scaleVectorsByMagnitude);
  const normalLength = mainScale(physics.normalForce);
  const weightLength = mainScale(physics.weight);
  const frictionLength = mainScale(Math.abs(physics.frictionActualSigned));
  const normalXLength = componentScale(physics.normalForce * Math.sin(angle));
  const normalYLength = componentScale(physics.normalForce * Math.cos(angle));
  const frictionXLength = componentScale(Math.abs(physics.frictionActualSigned * Math.cos(angle)));
  const frictionYLength = componentScale(Math.abs(physics.frictionActualSigned * Math.sin(angle)));

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

  drawConfiguredVector(ctx, origin, { x: 0, y: weightLength }, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, origin, { x: Math.sin(angle) * normalLength, y: -Math.cos(angle) * normalLength }, "normal", vectorMeta, "FN");

  if (state.frictionEnabled) {
    drawConfiguredVector(ctx, origin, { x: Math.cos(angle) * frictionLength * frictionDirection, y: Math.sin(angle) * frictionLength * frictionDirection }, "friction", vectorMeta, "Ff");
  }

  drawAngleArc(ctx, origin.x, origin.y, Math.max(28, normalLength * 0.28), -Math.PI / 2, -Math.PI / 2 + angle, "θ", {
    labelOffset: 12,
  });

  if (vectorMeta.normalComponents?.visible) {
    drawComponentVector(ctx, origin, { x: 0, y: -normalYLength }, vectorMeta.normalComponents.color, "FNy");
    drawComponentVector(ctx, { x: origin.x, y: origin.y - normalYLength }, { x: normalXLength, y: 0 }, vectorMeta.normalComponents.color, "FNx");
  }

  if (state.frictionEnabled && vectorMeta.frictionComponents?.visible) {
    drawComponentVector(ctx, origin, { x: frictionXLength * frictionDirection, y: 0 }, vectorMeta.frictionComponents.color, "Ffx");
    drawComponentVector(ctx, origin, { x: 0, y: frictionYLength * frictionDirection }, vectorMeta.frictionComponents.color, "Ffy");
  }
}

function createForceScaler(maxLength, minLength, referenceForce, useMagnitudeScaling) {
  return (force) => {
    if (!useMagnitudeScaling) {
      return maxLength * 0.82;
    }

    const scaled = (Math.abs(force) / referenceForce) * maxLength;
    return Math.min(maxLength, Math.max(minLength, scaled));
  };
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
    alpha: 0.88,
  });
}
