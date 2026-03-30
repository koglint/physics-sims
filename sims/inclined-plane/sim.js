import { clearCanvas, fitCanvasToContainer } from "../../shared/canvasUtils.js";
import { applyViewportMode, watchCanvasResize } from "../../shared/responsive.js";
import { copyText, formatNumber, updateRangeValue } from "../../shared/ui.js";
import { DIAGRAM_MODES, INCLINED_DEFAULTS, RANGE_CONFIG, VECTOR_DEFAULTS } from "./constants.js";
import { drawComponentsView } from "./drawComponents.js";
import { drawFBDView } from "./drawFBD.js";
import { drawSlopeView } from "./drawSlope.js";
import { createFormulaPanel } from "./formula.js";
import { calculatePhysics } from "./physics.js";

const state = {
  ...INCLINED_DEFAULTS,
  vectors: structuredClone(VECTOR_DEFAULTS),
  parallelForce: 0,
};

const runtime = {
  physics: null,
  dirtyPhysics: true,
  dirtyRender: true,
  dirtyUi: true,
  canvasBox: null,
  animationFrame: 0,
  formulaPanel: null,
};

const controls = [
  { key: "theta", label: "Slope angle (theta)", description: "Angle between the plane and the horizontal" },
  { key: "mass", label: "Mass (m)", description: "Mass of the box" },
  { key: "mu", label: "Static friction coefficient (mu)", description: "Maximum grip available between box and plane" },
  { key: "g", label: "Gravity (g)", description: "Local gravitational field" },
];

initSimulation();

export function initSimulation() {
  loadStateFromUrl();
  buildSliderControls();
  buildVectorControls();
  populateDiagramModes();
  bindInputs();
  runtime.formulaPanel = createFormulaPanel(state, applyStatePatch);

  const canvas = document.querySelector("#sim-canvas");
  const container = document.querySelector("#canvas-container");
  runtime.canvasBox = fitCanvasToContainer(canvas, container);
  watchCanvasResize(canvas, container, () => {
    runtime.canvasBox = fitCanvasToContainer(canvas, container);
    markDirty("render");
  });

  applyViewportMode(document.querySelector("#sim-root"));
  updatePhysics();
  updateUI();
  renderFrame();
}

function updatePhysics() {
  runtime.physics = calculatePhysics(state);
  state.parallelForce = runtime.physics.parallelComponent;
  runtime.dirtyPhysics = false;
}

function renderFrame() {
  if (runtime.dirtyPhysics) {
    updatePhysics();
  }

  if (runtime.dirtyUi) {
    updateUI();
  }

  if (runtime.dirtyRender) {
    drawScene();
    runtime.dirtyRender = false;
  }

  runtime.animationFrame = requestAnimationFrame(renderFrame);
}

function updateUI() {
  controls.forEach(({ key }) => {
    updateRangeValue(key, state[key], RANGE_CONFIG[key].unit);
    const slider = document.querySelector(`#${key}`);
    if (slider) {
      slider.value = state[key];
    }
  });

  document.querySelector("#diagram-mode").value = state.diagramMode;
  document.querySelector("#status-pill").textContent = runtime.physics.isStatic ? "At rest" : "Sliding";
  document.querySelector("#mode-caption").textContent = DIAGRAM_MODES.find((mode) => mode.value === state.diagramMode)?.label ?? "Slope View";
  document.querySelector("#physics-caption").textContent = buildCaption(runtime.physics);
  document.querySelector("#diagram-hint").textContent = buildDiagramHint(state.diagramMode);
  updateModeButtons();

  document.querySelectorAll("[data-vector-key]").forEach((row) => {
    const key = row.getAttribute("data-vector-key");
    row.querySelector('input[type="color"]').value = state.vectors[key].color;
    row.classList.toggle("is-off", !state.vectors[key].visible);
    row.querySelector("[data-vector-toggle]").setAttribute("aria-pressed", String(state.vectors[key].visible));
  });

  document.querySelector("#metrics-grid").innerHTML = buildMetricsMarkup(runtime.physics);
  runtime.formulaPanel?.render();
  runtime.dirtyUi = false;
}

function resetSimulation() {
  Object.assign(state, INCLINED_DEFAULTS, {
    vectors: structuredClone(VECTOR_DEFAULTS),
    parallelForce: 0,
  });
  updateUrl();
  markDirty("all");
}

function buildSliderControls() {
  const container = document.querySelector("#slider-controls");

  controls.forEach(({ key, label, description }) => {
    const config = RANGE_CONFIG[key];
    const wrapper = document.createElement("div");
    wrapper.className = "control-group";
    wrapper.innerHTML = `
      <div class="control-header">
        <label for="${key}">${label}</label>
        <span class="control-value" data-value-for="${key}"></span>
      </div>
      <input class="slider-input" id="${key}" type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${state[key]}">
      <p class="hint">${description}</p>
    `;
    container.append(wrapper);
  });
}

function buildVectorControls() {
  const container = document.querySelector("#vector-controls");
  const labels = {
    weight: "Weight",
    normal: "Normal",
    friction: "Friction",
    parallelComponent: "Parallel component",
    perpendicularComponent: "Perpendicular component",
  };

  Object.entries(state.vectors).forEach(([key, config]) => {
    if (!(key in labels)) {
      return;
    }

    const row = document.createElement("div");
    row.className = "vector-row";
    row.dataset.vectorKey = key;
    row.innerHTML = `
      <input id="vector-color-${key}" type="color" value="${config.color}" aria-label="${labels[key]} colour">
      <button id="vector-${key}" type="button" class="vector-toggle label-strong" data-vector-toggle aria-pressed="${config.visible ? "true" : "false"}">${labels[key]}</button>
    `;
    container.append(row);
  });
}

function populateDiagramModes() {
  const hidden = document.querySelector("#diagram-mode");
  const row = document.querySelector("#diagram-mode-buttons");

  DIAGRAM_MODES.forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mode-button";
    button.dataset.mode = mode.value;
    button.textContent = mode.label;
    row.append(button);
  });

  hidden.value = state.diagramMode;
}

function bindInputs() {
  controls.forEach(({ key }) => {
    document.querySelector(`#${key}`).addEventListener("input", (event) => {
      state[key] = Number.parseFloat(event.target.value);
      markDirty("all");
    });
  });

  document.querySelector("#diagram-mode-buttons").addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) {
      return;
    }

    state.diagramMode = button.dataset.mode;
    document.querySelector("#diagram-mode").value = state.diagramMode;
    markDirty("all");
  });

  document.querySelector("#vector-controls").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-vector-toggle]");
    if (!toggle) {
      return;
    }

    const row = event.target.closest("[data-vector-key]");
    if (!row) {
      return;
    }

    const key = row.dataset.vectorKey;
    state.vectors[key].visible = !state.vectors[key].visible;
    markDirty("ui");
    markDirty("render");
  });

  document.querySelector("#vector-controls").addEventListener("input", (event) => {
    const row = event.target.closest("[data-vector-key]");
    if (!row) {
      return;
    }

    const key = row.dataset.vectorKey;
    if (event.target.type === "color") {
      state.vectors[key].color = event.target.value;
    }
    markDirty("render");
  });

  document.querySelector("#vectors-all-on").addEventListener("click", () => {
    setAllVectorVisibility(true);
  });

  document.querySelector("#vectors-all-off").addEventListener("click", () => {
    setAllVectorVisibility(false);
  });

  document.querySelector("#reset-button").addEventListener("click", resetSimulation);

  document.querySelector("#copy-link-button").addEventListener("click", async () => {
    const link = `${window.location.origin}${window.location.pathname}${buildQueryString()}`;
    await copyText(link);
    document.querySelector("#status-pill").textContent = "Link copied";
    window.setTimeout(() => {
      document.querySelector("#status-pill").textContent = runtime.physics.isStatic ? "At rest" : "Sliding";
    }, 1400);
  });

  document.querySelector("#mobile-controls-toggle").addEventListener("click", (event) => {
    const panel = document.querySelector("#controls-panel");
    panel.classList.toggle("is-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!panel.classList.contains("is-collapsed")));
  });
}

function applyStatePatch(patch) {
  Object.assign(state, patch);
  markDirty("all");
}

function setAllVectorVisibility(visible) {
  Object.keys(state.vectors).forEach((key) => {
    state.vectors[key].visible = visible;
  });

  markDirty("ui");
  markDirty("render");
}

function drawScene() {
  const canvas = document.querySelector("#sim-canvas");
  const container = document.querySelector("#canvas-container");
  runtime.canvasBox = fitCanvasToContainer(canvas, container);
  const { ctx, width, height } = runtime.canvasBox;
  clearCanvas(ctx, width, height);
  drawBackground(ctx, width, height);

  if (state.diagramMode === "slope") {
    drawSlopeView(ctx, { width, height }, state, runtime.physics, state.vectors);
  } else if (state.diagramMode === "fbd") {
    drawFBDView(ctx, { width, height }, state, runtime.physics, state.vectors);
  } else {
    drawComponentsView(ctx, { width, height }, state, runtime.physics, state.vectors);
  }
}

function drawBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(226, 239, 234, 0.9)");
  gradient.addColorStop(1, "rgba(255, 249, 240, 0.92)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(34, 94, 81, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += width / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

function buildMetricsMarkup(physics) {
  const entries = [
    ["Weight", `${formatNumber(physics.weight, 1)} N downward`],
    ["Normal force", `${formatNumber(physics.normalForce, 1)} N perpendicular to plane`],
    ["Parallel component", `${formatNumber(physics.parallelComponent, 1)} N down slope`],
    ["Static friction", `${formatNumber(physics.frictionForce, 1)} N up slope`],
    ["Friction limit", `${formatNumber(physics.frictionLimit, 1)} N maximum`],
    ["Acceleration", `${formatNumber(physics.acceleration, 2)} m.s^-2`],
  ];

  return entries.map(([label, value]) => `<div class="metric-row"><span>${label}</span><span>${value}</span></div>`).join("");
}

function buildCaption(physics) {
  return physics.isStatic
    ? "Static friction matches the downslope component of weight, so the box remains at rest."
    : "The downslope component is larger than the maximum static friction, so the box would slide down the plane.";
}

function buildDiagramHint(mode) {
  if (mode === "fbd") {
    return "Free-body view isolates the force vectors acting on the box.";
  }

  if (mode === "components") {
    return "Components view resolves weight into parts parallel and perpendicular to the slope.";
  }

  return "Slope view shows the box resting on the plane with all active vectors.";
}

function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const paramMap = {
    theta: "theta",
    m: "mass",
    mass: "mass",
    mu: "mu",
    g: "g",
  };

  Object.entries(paramMap).forEach(([paramKey, stateKey]) => {
    const value = Number.parseFloat(params.get(paramKey));
    if (Number.isFinite(value)) {
      state[stateKey] = value;
    }
  });

  if (params.has("diagramMode")) {
    state.diagramMode = params.get("diagramMode");
  }
}

function updateUrl() {
  const query = buildQueryString();
  window.history.replaceState({}, "", `${window.location.pathname}${query}`);
}

function buildQueryString() {
  const params = new URLSearchParams({
    theta: state.theta,
    m: state.mass,
    mu: state.mu,
    g: state.g,
    diagramMode: state.diagramMode,
  });
  return `?${params.toString()}`;
}

function markDirty(scope) {
  if (scope === "physics" || scope === "all") {
    runtime.dirtyPhysics = true;
  }
  if (scope === "render" || scope === "all") {
    runtime.dirtyRender = true;
  }
  if (scope === "ui" || scope === "all") {
    runtime.dirtyUi = true;
  }
  if (scope === "all") {
    updateUrl();
  }
}

function updateModeButtons() {
  document.querySelectorAll("#diagram-mode-buttons [data-mode]").forEach((button) => {
    const active = button.dataset.mode === state.diagramMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
