import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow } from "../../shared/vectors.js";

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
  const downslope = { x: Math.cos(angle), y: Math.sin(angle) };

  drawSlopeBase(ctx, baseX, baseY, topX, topY, boxCenter, boxWidth, boxHeight, angle);
  drawLabel(ctx, "Slope view", width * 0.12, height * 0.12, {
    color: "#225e51",
    size: 20,
    weight: 700,
  });

  drawConfiguredVector(ctx, boxCenter, { x: 0, y: lengths.weight }, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, boxCenter, { x: planeNormal.x * lengths.normal, y: planeNormal.y * lengths.normal }, "normal", vectorMeta, "F_N");
  drawConfiguredVector(ctx, boxCenter, { x: -downslope.x * lengths.friction, y: -downslope.y * lengths.friction }, "friction", vectorMeta, "F_f", -16);
  drawConfiguredVector(ctx, boxCenter, { x: downslope.x * lengths.parallel, y: downslope.y * lengths.parallel }, "parallelComponent", vectorMeta, "mg sin theta", -18);

  if (vectorMeta.perpendicularComponent?.visible) {
    drawComponentVector(
      ctx,
      boxCenter,
      { x: planeNormal.x * lengths.perpendicular, y: planeNormal.y * lengths.perpendicular },
      vectorMeta.perpendicularComponent.color,
      "mg cos theta",
      18,
    );
  }

  drawAngleArc(ctx, baseX + 16, baseY - 2, Math.max(30, slopeLength * 0.12), -Math.PI / 2, -Math.PI / 2 + angle, `${state.theta.toFixed(0)} deg`, {
    labelOffset: 12,
  });
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
  const maxLength = Math.min(bounds.width, bounds.height) * 0.28;
  const minLength = 34;
  const reference = Math.max(physics.weight, physics.normalForce, physics.parallelComponent, physics.frictionForce, 1);
  const scale = (value) => {
    if (!state.scaleVectorsByMagnitude) {
      return maxLength * 0.88;
    }

    const scaled = (Math.abs(value) / reference) * maxLength;
    return Math.min(maxLength, Math.max(minLength, scaled));
  };

  return {
    weight: scale(physics.weight),
    normal: scale(physics.normalForce),
    friction: scale(physics.frictionForce),
    parallel: scale(physics.parallelComponent),
    perpendicular: scale(physics.perpendicularComponent),
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
