import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow } from "../../shared/vectors.js";

export function drawRoadView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const centerX = width * 0.34;
  const centerY = height * 0.66;
  const roadLength = Math.min(width, height) * 0.58;
  const carWidth = roadLength * 0.16;
  const carHeight = roadLength * 0.07;
  const angle = physics.thetaRadians;
  const carOffset = carHeight / 2 + 10;
  const carCenter = {
    x: centerX + Math.sin(angle) * carOffset,
    y: centerY - Math.cos(angle) * carOffset,
  };
  const rightEnd = {
    x: centerX + Math.cos(angle) * roadLength * 0.55,
    y: centerY + Math.sin(angle) * roadLength * 0.55,
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
  ctx.moveTo(rightEnd.x - roadLength * 0.56, rightEnd.y);
  ctx.lineTo(rightEnd.x + roadLength * 0.08, rightEnd.y);
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, `${state.theta.toFixed(0)} deg bank`, width * 0.13, height * 0.12, {
    color: "#225e51",
    size: 18,
    weight: 700,
  });

  drawAngleArc(ctx, rightEnd.x - roadLength * 0.01, rightEnd.y - 2, Math.max(32, roadLength * 0.15), -Math.PI, -Math.PI + angle, "θ", {
    labelOffset: 12,
  });

  const mainScale = createForceScaler(Math.min(width, height) * 0.54, 42, 18000, state.scaleVectorsByMagnitude);
  const componentScale = createForceScaler(Math.min(width, height) * 0.54, 0, 18000, state.scaleVectorsByMagnitude);
  const normalLength = mainScale(physics.normalForce);
  const weightLength = mainScale(physics.weight);
  const frictionLength = mainScale(Math.abs(physics.frictionActualSigned));
  const centripetalLength = mainScale(physics.centripetalForce);
  const frictionXLength = componentScale(Math.abs(physics.frictionActualSigned * Math.cos(angle)));
  const frictionYLength = componentScale(Math.abs(physics.frictionActualSigned * Math.sin(angle)));
  const frictionDirection = Math.sign(physics.frictionActualSigned || physics.frictionRequiredSigned || 0);

  const normalVector = {
    x: Math.sin(angle) * normalLength,
    y: -Math.cos(angle) * normalLength,
  };
  const normalXLength = normalVector.x;
  const normalYLength = -normalVector.y;
  const frictionVector = {
    x: Math.cos(angle) * frictionLength * frictionDirection,
    y: Math.sin(angle) * frictionLength * frictionDirection,
  };
  const normalYTip = { x: carCenter.x, y: carCenter.y - normalYLength };

  drawConfiguredVector(ctx, carCenter, { x: 0, y: weightLength }, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, carCenter, normalVector, "normal", vectorMeta, "FN");

  if (state.frictionEnabled) {
    drawConfiguredVector(ctx, carCenter, frictionVector, "friction", vectorMeta, "Ff");
  }

  if (vectorMeta.normalComponents?.visible) {
    drawComponentVector(ctx, carCenter, { x: 0, y: -normalYLength }, vectorMeta.normalComponents.color, "FNy");
    drawComponentVector(ctx, normalYTip, { x: normalXLength, y: 0 }, vectorMeta.normalComponents.color, "FNx");
    drawAngleArc(ctx, carCenter.x, carCenter.y, Math.max(24, normalLength * 0.28), -Math.PI / 2, -Math.PI / 2 + angle, "θ", {
      labelOffset: 10,
    });
  }

  if (state.frictionEnabled && vectorMeta.frictionComponents?.visible) {
    drawComponentVector(ctx, carCenter, { x: frictionXLength * frictionDirection, y: 0 }, vectorMeta.frictionComponents.color, "Ffx");
    drawComponentVector(ctx, carCenter, { x: 0, y: frictionYLength * frictionDirection }, vectorMeta.frictionComponents.color, "Ffy");
  }

  drawConfiguredVector(ctx, carCenter, { x: centripetalLength, y: 0 }, "centripetal", vectorMeta, "Fc");
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
    labelPosition: "middle",
  });
}
