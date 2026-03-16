import { clamp } from "./canvasUtils.js";

export function magnitude(x, y) {
  return Math.hypot(x, y);
}

export function normalize(x, y) {
  const length = magnitude(x, y) || 1;
  return { x: x / length, y: y / length };
}

export function scaleVectorByMagnitude(value, maxValue, minLength, maxLength) {
  if (maxValue <= 0) {
    return minLength;
  }

  const scaled = (Math.abs(value) / maxValue) * maxLength;
  return clamp(scaled, minLength, maxLength);
}

export function drawArrow(ctx, options) {
  const {
    x,
    y,
    dx,
    dy,
    color,
    label,
    dashed = false,
    width = 3,
    head = 12,
    alpha = 1,
    labelPosition = "tip",
    labelOffset = 14,
  } = options;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(dashed ? [8, 6] : []);

  const endX = x + dx;
  const endY = y + dy;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const direction = normalize(dx, dy);
  const leftX = endX - direction.x * head - direction.y * (head * 0.55);
  const leftY = endY - direction.y * head + direction.x * (head * 0.55);
  const rightX = endX - direction.x * head + direction.y * (head * 0.55);
  const rightY = endY - direction.y * head - direction.x * (head * 0.55);

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.setLineDash([]);
    ctx.font = "600 16px 'Source Sans 3', sans-serif";
    if (labelPosition === "middle") {
      const direction = normalize(dx, dy);
      const normalX = -direction.y;
      const normalY = direction.x;
      const midX = x + dx * 0.5;
      const midY = y + dy * 0.5;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, midX + normalX * labelOffset, midY + normalY * labelOffset);
    } else {
      ctx.textAlign = dx >= 0 ? "left" : "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, endX + (dx >= 0 ? 8 : -8), endY - 6);
    }
  }

  ctx.restore();
}
