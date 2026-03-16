import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow } from "../../shared/vectors.js";

export function drawFBDView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const origin = { x: width * 0.44, y: height * 0.63 };
  const angle = physics.thetaRadians;
  const angleLabel = `${state.theta.toFixed(0)}°`;
  const frictionDirection = Math.sign(physics.frictionActualSigned || physics.frictionRequiredSigned || 0);
  const mainScale = createForceScaler(Math.min(width, height) * 0.54, 42, 18000, state.scaleVectorsByMagnitude);
  const componentScale = createForceScaler(Math.min(width, height) * 0.54, 0, 18000, state.scaleVectorsByMagnitude);
  const weightLength = mainScale(physics.weight);
  const normalLength = mainScale(physics.normalForce);
  const frictionLength = mainScale(Math.abs(physics.frictionActualSigned));
  const normalDisplay = resolveNormalDisplay({
    angle,
    normalLength,
    weightLength,
    frictionEnabled: state.frictionEnabled,
  });
  const normalVector = normalDisplay.vector;
  const normalXLength = normalDisplay.xLength;
  const normalYLength = normalDisplay.yLength;
  const centripetalLength = state.frictionEnabled ? mainScale(physics.centripetalForce) : normalXLength;
  const frictionXLength = componentScale(Math.abs(physics.frictionActualSigned * Math.cos(angle)));
  const frictionYLength = componentScale(Math.abs(physics.frictionActualSigned * Math.sin(angle)));
  const frictionVector = {
    x: Math.cos(angle) * frictionLength * frictionDirection,
    y: Math.sin(angle) * frictionLength * frictionDirection,
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

  drawConfiguredVector(ctx, origin, { x: 0, y: weightLength }, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, origin, normalVector, "normal", vectorMeta, "FN");

  if (state.frictionEnabled) {
    drawConfiguredVector(ctx, origin, frictionVector, "friction", vectorMeta, "Ff");
  }

  drawConfiguredVector(ctx, origin, { x: centripetalLength, y: 0 }, "centripetal", vectorMeta, "Fc");

  drawAngleArc(ctx, origin.x, origin.y, Math.max(28, normalLength * 0.28), -Math.PI / 2, -Math.PI / 2 + angle, angleLabel, {
    labelOffset: 12,
  });

  if (vectorMeta.normalComponents?.visible) {
    drawComponentVector(ctx, origin, { x: 0, y: -normalYLength }, vectorMeta.normalComponents.color, "FNy", -14);
    drawComponentVector(ctx, { x: origin.x, y: origin.y - normalYLength }, { x: normalXLength, y: 0 }, vectorMeta.normalComponents.color, "FNx", -14);
  }

  if (state.frictionEnabled && vectorMeta.frictionComponents?.visible) {
    drawComponentVector(ctx, origin, { x: frictionXLength * frictionDirection, y: 0 }, vectorMeta.frictionComponents.color, "Ffx");
    drawComponentVector(ctx, origin, { x: 0, y: frictionYLength * frictionDirection }, vectorMeta.frictionComponents.color, "Ffy");
  }
}

function createForceScaler(maxLength, minLength, referenceForce, useMagnitudeScaling) {
  return (force) => {
    if (!useMagnitudeScaling) {
      return maxLength * 0.86;
    }

    const scaled = (Math.abs(force) / referenceForce) * maxLength;
    return Math.min(maxLength, Math.max(minLength, scaled));
  };
}

function resolveNormalDisplay({ angle, normalLength, weightLength, frictionEnabled }) {
  if (!frictionEnabled) {
    const yLength = weightLength;
    const xLength = Math.tan(angle) * yLength;
    return {
      xLength,
      yLength,
      vector: {
        x: xLength,
        y: -yLength,
      },
    };
  }

  return {
    xLength: Math.sin(angle) * normalLength,
    yLength: Math.cos(angle) * normalLength,
    vector: {
      x: Math.sin(angle) * normalLength,
      y: -Math.cos(angle) * normalLength,
    },
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
    labelPosition: "middle",
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
    width: 2,
    alpha: 0.88,
    labelPosition: "middle",
    labelOffset,
  });
}
