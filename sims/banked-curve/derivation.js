import { drawLabel as drawSharedLabel, drawAngleArc as drawSharedAngleArc } from "../../shared/canvasUtils.js";
import { drawArrow as drawSharedArrow } from "../../shared/vectors.js";

const steps = Array.from(document.querySelectorAll(".derivation-step"));
const revealButton = document.querySelector("#reveal-next-step");
const resetButton = document.querySelector("#reset-steps");
const canvases = Array.from(document.querySelectorAll(".derivation-canvas"));

let visibleCount = 0;

function render() {
  steps.forEach((step, index) => {
    step.classList.toggle("is-hidden", index >= visibleCount);
  });

  revealButton.disabled = visibleCount >= steps.length;
  revealButton.textContent = visibleCount >= steps.length ? "All Lines Revealed" : "Reveal Next Line";
  drawDiagrams();
}

revealButton.addEventListener("click", () => {
  if (visibleCount < steps.length) {
    visibleCount += 1;
    render();
  }
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
  const angle = (20 * Math.PI) / 180;
  const centerX = width * 0.34;
  const centerY = height * 0.67;
  const roadLength = Math.min(width, height) * 0.62;
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
  const verticalLength = Math.min(width, height) * 0.24;
  const horizontalLength = Math.tan(angle) * verticalLength;
  const normalVector = { x: horizontalLength, y: -verticalLength };
  const vectorTip = { x: carCenter.x + normalVector.x, y: carCenter.y + normalVector.y };

  drawRoadBase(ctx, centerX, centerY, roadLength, carWidth, carHeight, angle, rightEnd);

  const showTriangle = stepNumber >= 1;
  const showVerticalBalance = stepNumber >= 2;
  const showHorizontalBalance = stepNumber >= 3;

  if (showTriangle) {
    drawConfiguredArrow(ctx, carCenter, normalVector, "#226f54", "FN", 16);
    drawComponentArrow(ctx, carCenter, { x: 0, y: -verticalLength }, "#425466", "FNy", -14);
    drawComponentArrow(ctx, { x: carCenter.x, y: carCenter.y - verticalLength }, { x: horizontalLength, y: 0 }, "#425466", "FNx", -14);
    drawSharedAngleArc(ctx, carCenter.x, carCenter.y, Math.max(24, verticalLength * 0.3), -Math.PI / 2, -Math.PI / 2 + angle, "20°", {
      color: "#225e51",
      labelOffset: 10,
    });
  }

  if (showVerticalBalance) {
    drawConfiguredArrow(ctx, carCenter, { x: 0, y: verticalLength }, "#b23a48", "mg", 14);
  }

  if (showHorizontalBalance) {
    drawConfiguredArrow(ctx, carCenter, { x: horizontalLength, y: 0 }, "#2a4d9b", "Fc", 14);
  }

  drawStepAnnotation(ctx, stepNumber, width, height, {
    carCenter,
    vectorTip,
    verticalLength,
    horizontalLength,
  });
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

  drawSharedLabel(ctx, "20° bank", 20, 24, {
    color: "#225e51",
    size: 15,
    weight: 700,
  });
}

function drawStepAnnotation(ctx, stepNumber, width, height, geometry) {
  const annotations = {
    1: ["Resolve FN into a right triangle", "Components follow vertical and horizontal axes"],
    2: ["Vertical balance", "FNy = mg"],
    3: ["Horizontal balance", "FNx = Fc = mv²/r"],
    4: ["Use the two balances together", "Divide horizontal by vertical"],
    5: ["Form a ratio", "left side / right side"],
    6: ["Cancel common factors", "FN and m disappear, tan(theta) remains"],
    7: ["Rearrange for v²", "multiply both sides by r g"],
    8: ["Final result", "take the square root"],
  };

  drawAnnotationBox(ctx, width * 0.56, 16, width * 0.38, height - 32, annotations[stepNumber]);

  if (stepNumber >= 4) {
    drawEquationOverlay(ctx, width * 0.58, height * 0.47, width * 0.34, stepNumber);
  }

  if (stepNumber >= 4) {
    ctx.save();
    ctx.strokeStyle = "rgba(34, 94, 81, 0.2)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(geometry.vectorTip.x + 6, geometry.vectorTip.y + 8);
    ctx.lineTo(width * 0.56, height * 0.34);
    ctx.stroke();
    ctx.restore();
  }
}

function drawAnnotationBox(ctx, x, y, width, height, lines) {
  roundRect(ctx, x, y, width, height, 18);
  ctx.fillStyle = "rgba(255, 253, 247, 0.96)";
  ctx.strokeStyle = "rgba(34, 94, 81, 0.16)";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#102a2a";
  ctx.font = "700 15px 'Source Sans 3', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(lines[0], x + 14, y + 14);

  ctx.fillStyle = "#4f6b63";
  ctx.font = "600 14px 'Source Sans 3', sans-serif";
  wrapText(ctx, lines[1], x + 14, y + 42, width - 28, 18);
}

function drawEquationOverlay(ctx, x, y, width, stepNumber) {
  const rows = {
    4: ["FNx = mv²/r", "FNy = mg"],
    5: ["FNx / FNy", "= (mv²/r) / mg"],
    6: ["tan(theta)", "= v² / (r g)"],
    7: ["v²", "= r g tan(theta)"],
    8: ["v", "= sqrt(r g tan(theta))"],
  };

  const [left, right] = rows[stepNumber];
  roundRect(ctx, x, y, width, 52, 16);
  ctx.fillStyle = "rgba(241, 247, 244, 0.98)";
  ctx.strokeStyle = "rgba(34, 94, 81, 0.14)";
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#102a2a";
  ctx.font = "700 16px 'Space Grotesk', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(left, x + 14, y + 19);
  ctx.fillText(right, x + 14, y + 35);
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

function drawComponentArrow(ctx, origin, vector, color, label, labelOffset) {
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
  });
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

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
      return;
    }

    line = testLine;
  });

  if (line) {
    ctx.fillText(line, x, cursorY);
  }
}

render();
