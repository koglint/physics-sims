export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function fitCanvasToContainer(canvas, container, maxDevicePixelRatio = 2) {
  const ratio = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
  const width = container.clientWidth;
  const height = container.clientHeight;

  const targetWidth = Math.max(1, Math.floor(width * ratio));
  const targetHeight = Math.max(1, Math.floor(height * ratio));

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return {
    ctx,
    width,
    height,
    ratio,
  };
}

export function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

export function drawLabel(ctx, text, x, y, options = {}) {
  const { color = "#102a2a", align = "left", size = 16, weight = 600 } = options;
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px 'Source Sans 3', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawDashedCircle(ctx, x, y, radius, strokeStyle) {
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
