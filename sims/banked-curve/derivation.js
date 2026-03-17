import { drawLabel as drawSharedLabel, drawAngleArc as drawSharedAngleArc } from "../../shared/canvasUtils.js";
import { drawArrow as drawSharedArrow } from "../../shared/vectors.js";

const steps = Array.from(document.querySelectorAll(".derivation-step"));
const revealButton = document.querySelector("#reveal-next-step");
const revealAllButton = document.querySelector("#reveal-all-steps");
const resetButton = document.querySelector("#reset-steps");
const canvases = Array.from(document.querySelectorAll(".derivation-canvas"));

let visibleCount = 0;

function render() {
  steps.forEach((step, index) => {
    step.classList.toggle("is-hidden", index >= visibleCount);
  });

  revealButton.disabled = visibleCount >= steps.length;
  revealButton.textContent = visibleCount >= steps.length ? "All Lines Revealed" : "Reveal Next Line";
  revealAllButton.disabled = visibleCount >= steps.length;
  resetButton.disabled = visibleCount === 0;
  drawDiagrams();
}

revealButton.addEventListener("click", () => {
  if (visibleCount < steps.length) {
    visibleCount += 1;
    render();
  }
});

revealAllButton.addEventListener("click", () => {
  visibleCount = steps.length;
  render();
});

resetButton.addEventListener("click", () => {
  visibleCount = 0;
  render();
});

window.addEventListener("resize", drawDiagrams);

function drawDiagrams() {
  canvases.forEach((canvas) => {
    const card = canvas.closest(".derivation-step");
    if (card?.classList.contains("is-hidden")) {
      return;
    }

    drawStepDiagram(canvas, Number.parseInt(canvas.dataset.step, 10));
  });
}

function drawStepDiagram(canvas, stepNumber) {
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 220;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.max(1, Math.floor(width * ratio));
  canvas.height = Math.max(1, Math.floor(height * ratio));

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  drawStepCard(ctx, width, height);
  drawRoadScene(ctx, width, height, stepNumber);
}

function drawStepCard(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(226, 239, 234, 0.92)");
  gradient.addColorStop(1, "rgba(255, 249, 240, 0.96)");

  roundRect(ctx, 0, 0, width, height, 20);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(34, 94, 81, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += width / 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoadScene(ctx, width, height, stepNumber) {
  const angle = Math.PI / 4;
  const centerX = width * 0.45;
  const centerY = height * 0.7;
  const roadLength = Math.min(width, height) * 0.82;
  const carWidth = roadLength * 0.16;
  const carHeight = roadLength * 0.07;
  const carOffset = carHeight / 2 + 10;
  const carCenter = {
    x: centerX + Math.sin(angle) * carOffset,
    y: centerY - Math.cos(angle) * carOffset,
  };
  const rightEnd = {
    x: centerX + Math.cos(angle) * roadLength * 0.55,
    y: centerY + Math.sin(angle) * roadLength * 0.55,
  };
  const verticalLength = Math.min(width, height) * 0.28;
  const horizontalLength = Math.tan(angle) * verticalLength;
  const normalVector = { x: horizontalLength, y: -verticalLength };
  const componentLabels = getComponentLabels(stepNumber);

  drawRoadBase(ctx, centerX, centerY, roadLength, carWidth, carHeight, angle, rightEnd);

  if (stepNumber >= 1) {
    drawConfiguredArrow(ctx, carCenter, normalVector, "#226f54", "FN", 16);
    drawComponentArrow(ctx, carCenter, { x: 0, y: -verticalLength }, "#425466", componentLabels.vertical, componentLabels.verticalOffset, componentLabels.font);
    drawComponentArrow(ctx, { x: carCenter.x, y: carCenter.y - verticalLength }, { x: horizontalLength, y: 0 }, "#425466", componentLabels.horizontal, componentLabels.horizontalOffset, componentLabels.font);
    drawSharedAngleArc(ctx, carCenter.x, carCenter.y, Math.max(24, verticalLength * 0.32), -Math.PI / 2, -Math.PI / 2 + angle, "θ", {
      color: "#225e51",
      labelOffset: 10,
    });
  }

  if (stepNumber >= 2) {
    drawConfiguredArrow(ctx, carCenter, { x: 0, y: verticalLength }, "#b23a48", "mg", 14);
  }

  if (stepNumber >= 3) {
    drawConfiguredArrow(ctx, carCenter, { x: horizontalLength, y: 0 }, "#2a4d9b", "Fc", 14);
  }
}

function drawRoadBase(ctx, centerX, centerY, roadLength, carWidth, carHeight, angle, rightEnd) {
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

  drawSharedLabel(ctx, "45° bank", 20, 24, {
    color: "#225e51",
    size: 15,
    weight: 700,
  });
}

function drawConfiguredArrow(ctx, origin, vector, color, label, labelOffset) {
  drawSharedArrow(ctx, {
    x: origin.x,
    y: origin.y,
    dx: vector.x,
    dy: vector.y,
    color,
    label,
    labelPosition: "middle",
    labelOffset,
  });
}

function drawComponentArrow(ctx, origin, vector, color, label, labelOffset, labelFont) {
  drawSharedArrow(ctx, {
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
    labelFont,
  });
}

function getComponentLabels(stepNumber) {
  if (stepNumber === 4) {
    return {
      vertical: "FNy = FN cos θ",
      horizontal: "FNx = FN sin θ",
      verticalOffset: -18,
      horizontalOffset: -16,
      font: "600 13px 'Source Sans 3', sans-serif",
    };
  }

  if (stepNumber >= 5) {
    return {
      vertical: "FN cos θ",
      horizontal: "FN sin θ",
      verticalOffset: -16,
      horizontalOffset: -14,
      font: "600 14px 'Source Sans 3', sans-serif",
    };
  }

  return {
    vertical: "FNy",
    horizontal: "FNx",
    verticalOffset: -14,
    horizontalOffset: -14,
    font: "600 16px 'Source Sans 3', sans-serif",
  };
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

render();
