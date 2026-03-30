import { drawAngleArc, drawLabel } from "../../shared/canvasUtils.js";
import { drawArrow } from "../../shared/vectors.js";

export function drawComponentsView(ctx, bounds, state, physics, vectorMeta) {
  const { width, height } = bounds;
  const origin = { x: width * 0.35, y: height * 0.62 };
  const angle = physics.thetaRadians;
  const lengths = getForceLengths(bounds, state, physics);
  const downslope = { x: Math.cos(angle), y: Math.sin(angle) };
  const planeNormal = { x: -Math.sin(angle), y: -Math.cos(angle) };
  const parallelTip = {
    x: origin.x + downslope.x * lengths.parallel,
    y: origin.y + downslope.y * lengths.parallel,
  };

  drawLabel(ctx, "Resolved weight components", width * 0.12, height * 0.12, {
    color: "#225e51",
    size: 20,
    weight: 700,
  });

  drawSlopeGuide(ctx, width, height, angle);
  drawConfiguredVector(ctx, origin, { x: 0, y: lengths.weight }, "weight", vectorMeta, "mg");
  drawConfiguredVector(ctx, origin, { x: downslope.x * lengths.parallel, y: downslope.y * lengths.parallel }, "parallelComponent", vectorMeta, "mg sin θ", -18);

  if (vectorMeta.perpendicularComponent?.visible) {
    drawComponentVector(
      ctx,
      parallelTip,
      { x: planeNormal.x * lengths.perpendicular, y: planeNormal.y * lengths.perpendicular },
      vectorMeta.perpendicularComponent.color,
      "mg cos θ",
      18,
    );
  }

  drawAngleArc(ctx, width * 0.17, height * 0.79, Math.max(30, Math.min(width, height) * 0.12), -Math.PI / 2, -Math.PI / 2 + angle, `${state.theta.toFixed(0)}°`, {
    labelOffset: 12,
  });
}

function drawSlopeGuide(ctx, width, height, angle) {
  const baseX = width * 0.16;
  const baseY = height * 0.79;
  const slopeLength = Math.min(width, height) * 0.42;
  const topX = baseX + Math.cos(angle) * slopeLength;
  const topY = baseY - Math.sin(angle) * slopeLength;

  ctx.save();
  ctx.strokeStyle = "rgba(94, 90, 85, 0.3)";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(topX, topY);
  ctx.stroke();
  ctx.restore();
}

function getForceLengths(bounds, state, physics) {
  const maxLength = Math.min(bounds.width, bounds.height) * 0.32;
  const minLength = 36;
  const reference = Math.max(physics.weight, physics.parallelComponent, physics.perpendicularComponent, 1);
  const scale = (value) => {
    if (!state.scaleVectorsByMagnitude) {
      return maxLength * 0.88;
    }

    const scaled = (Math.abs(value) / reference) * maxLength;
    return Math.min(maxLength, Math.max(minLength, scaled));
  };

  return {
    weight: scale(physics.weight),
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
