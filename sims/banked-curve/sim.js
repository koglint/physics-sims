import { DIAGRAM_MODES, PHYSICS_DEFAULTS, PRESETS, RANGE_CONFIG, VECTOR_DEFAULTS } from "../../shared/constants.js";
import { clearCanvas, fitCanvasToContainer } from "../../shared/canvasUtils.js";
import { applyViewportMode, watchCanvasResize } from "../../shared/responsive.js";
import { copyText, formatNumber, updateRangeValue } from "../../shared/ui.js";
import { drawFBDView } from "./drawFBD.js";
import { createFormulaPanel } from "./formula.js";
import { drawRoadView } from "./drawRoad.js";
import { drawTopView } from "./drawTop.js";
import { calculatePhysics, getPredictionCopy } from "./physics.js";

const state = {
  ...PHYSICS_DEFAULTS,
  vectors: structuredClone(VECTOR_DEFAULTS),
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
  { key: "theta", label: "Bank angle (theta)", description: "Road tilt angle" },
  { key: "velocity", label: "Velocity (v)", description: "Car speed along the curve" },
  { key: "mass", label: "Mass (m)", description: "Vehicle mass" },
  { key: "radius", label: "Radius (r)", description: "Curve radius" },
  { key: "mu", label: "Friction coefficient (mu)", description: "Static friction limit" },
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
  renderFrame(performance.now());
}

export function updatePhysics() {
  runtime.physics = calculatePhysics(state);
  runtime.dirtyPhysics = false;
}

export function renderFrame(timestamp) {
  if (runtime.dirtyPhysics) {
    updatePhysics();
  }

  if (runtime.dirtyUi) {
    updateUI();
  }

  if (runtime.dirtyRender || state.diagramMode === "top") {
    drawScene(timestamp);
    runtime.dirtyRender = false;
  }

  runtime.animationFrame = requestAnimationFrame(renderFrame);
}

export function updateUI() {
  controls.forEach(({ key }) => {
    updateRangeValue(key, state[key], RANGE_CONFIG[key].unit);
    const slider = document.querySelector(`#${key}`);
    if (slider) {
      slider.value = state[key];
    }
  });

  document.querySelector("#friction-enabled").checked = state.frictionEnabled;
  document.querySelector("#show-components").checked = state.showComponents;
  document.querySelector("#prediction-toggle").checked = state.showPrediction;
  document.querySelector("#contrast-toggle").checked = state.highContrast;
  document.querySelector("#vector-scale-toggle").checked = state.scaleVectorsByMagnitude;
  document.querySelector("#diagram-mode").value = state.diagramMode;
  document.querySelector("#prediction-panel").classList.toggle("is-hidden", !state.showPrediction);
  document.querySelector("#friction-formulas").classList.toggle("is-hidden", !state.frictionEnabled);
  document.querySelector("#status-pill").textContent = runtime.physics?.skidState === "holds" ? "Balanced" : runtime.physics?.skidState ?? "Ready";
  document.querySelector("#mode-caption").textContent = DIAGRAM_MODES.find((mode) => mode.value === state.diagramMode)?.label ?? "Road View";
  document.querySelector("#physics-caption").textContent = buildCaption(runtime.physics);
  document.querySelector("#diagram-hint").textContent = buildDiagramHint(state.diagramMode);
  document.body.classList.toggle("high-contrast", state.highContrast);
  document.querySelector("#mu").disabled = !state.frictionEnabled;

  document.querySelectorAll("[data-vector-key]").forEach((row) => {
    const key = row.getAttribute("data-vector-key");
    row.querySelector('input[type="checkbox"]').checked = state.vectors[key].visible;
    row.querySelector('input[type="color"]').value = state.vectors[key].color;
    row.classList.toggle("is-hidden", key === "friction" && !state.frictionEnabled);
  });

  document.querySelector("#prediction-text").textContent = getPredictionCopy(runtime.physics);
  document.querySelector("#metrics-grid").innerHTML = buildMetricsMarkup(runtime.physics);
  runtime.formulaPanel?.render();
  runtime.dirtyUi = false;
}

export function resetSimulation() {
  Object.assign(state, PHYSICS_DEFAULTS, { vectors: structuredClone(VECTOR_DEFAULTS) });
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
    weight: "Weight vector",
    normal: "Normal force",
    friction: "Friction",
    centripetal: "Centripetal",
    velocity: "Velocity",
    components: "Components",
  };

  Object.entries(state.vectors).forEach(([key, config]) => {
    const row = document.createElement("div");
    row.className = "vector-row";
    row.dataset.vectorKey = key;
    row.innerHTML = `
      <label for="vector-${key}" class="label-strong">${labels[key]}</label>
      <input id="vector-${key}" type="checkbox" ${config.visible ? "checked" : ""}>
      <input id="vector-color-${key}" type="color" value="${config.color}" aria-label="${labels[key]} colour">
    `;
    container.append(row);
  });
}

function populateDiagramModes() {
  const select = document.querySelector("#diagram-mode");
  DIAGRAM_MODES.forEach((mode) => {
    const option = document.createElement("option");
    option.value = mode.value;
    option.textContent = mode.label;
    select.append(option);
  });
}

function bindInputs() {
  controls.forEach(({ key }) => {
    document.querySelector(`#${key}`).addEventListener("input", (event) => {
      if (key === "mu" && !state.frictionEnabled) {
        return;
      }

      state[key] = Number.parseFloat(event.target.value);
      markDirty("all");
    });
  });

  document.querySelector("#friction-enabled").addEventListener("change", (event) => {
    state.frictionEnabled = event.target.checked;
    state.mu = state.frictionEnabled ? Math.max(state.mu, PHYSICS_DEFAULTS.mu) : 0;
    markDirty("all");
  });

  document.querySelector("#show-components").addEventListener("change", (event) => {
    state.showComponents = event.target.checked;
    markDirty("all");
  });

  document.querySelector("#prediction-toggle").addEventListener("change", (event) => {
    state.showPrediction = event.target.checked;
    markDirty("ui");
  });

  document.querySelector("#contrast-toggle").addEventListener("change", (event) => {
    state.highContrast = event.target.checked;
    markDirty("ui");
  });

  document.querySelector("#vector-scale-toggle").addEventListener("change", (event) => {
    state.scaleVectorsByMagnitude = event.target.checked;
    markDirty("all");
  });

  document.querySelector("#diagram-mode").addEventListener("change", (event) => {
    state.diagramMode = event.target.value;
    markDirty("all");
  });

  document.querySelector("#vector-controls").addEventListener("input", (event) => {
    const target = event.target;
    const row = target.closest("[data-vector-key]");
    if (!row) {
      return;
    }

    const key = row.dataset.vectorKey;
    if (target.type === "checkbox") {
      state.vectors[key].visible = target.checked;
    }
    if (target.type === "color") {
      state.vectors[key].color = target.value;
    }
    markDirty("render");
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      applyStatePatch(PRESETS[button.dataset.preset](state));
    });
  });

  document.querySelector("#reset-button").addEventListener("click", resetSimulation);

  document.querySelector("#copy-link-button").addEventListener("click", async () => {
    const link = `${window.location.origin}${window.location.pathname}${buildQueryString()}`;
    await copyText(link);
    document.querySelector("#status-pill").textContent = "Link copied";
    window.setTimeout(() => {
      document.querySelector("#status-pill").textContent = runtime.physics?.skidState === "holds" ? "Balanced" : runtime.physics?.skidState ?? "Ready";
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

function drawScene(timestamp) {
  const canvas = document.querySelector("#sim-canvas");
  const container = document.querySelector("#canvas-container");
  runtime.canvasBox = fitCanvasToContainer(canvas, container);
  const { ctx, width, height } = runtime.canvasBox;
  clearCanvas(ctx, width, height);
  drawBackground(ctx, width, height);

  // The same state drives each diagram mode so classroom comparisons stay aligned.
  if (state.diagramMode === "road") {
    drawRoadView(ctx, { width, height }, state, runtime.physics, state.vectors);
  } else if (state.diagramMode === "fbd") {
    drawFBDView(ctx, { width, height }, state, runtime.physics, state.vectors);
  } else {
    drawTopView(ctx, { width, height }, state, runtime.physics, state.vectors, timestamp);
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
    ["Weight", `${formatNumber(physics.weight, 1)} N`],
    ["Normal force", `${formatNumber(physics.normalForce, 1)} N`],
    ["Friction force", `${formatNumber(physics.frictionMagnitude, 1)} N`],
    ["Centripetal force", `${formatNumber(physics.centripetalForce, 1)} N`],
    ["Ideal speed", `${formatNumber(physics.idealSpeed, 2)} m/s`],
    ["vmax", Number.isFinite(physics.vmax) ? `${formatNumber(physics.vmax, 2)} m/s` : "Infinity"],
    ["vmin", `${formatNumber(physics.vmin, 2)} m/s`],
  ];

  return entries.map(([label, value]) => `<div class="metric-row"><span>${label}</span><span>${value}</span></div>`).join("");
}

function buildCaption(physics) {
  if (!state.frictionEnabled) {
    return `Ideal speed is ${formatNumber(physics.idealSpeed, 2)} m/s with no friction contribution.`;
  }

  if (physics.skidState !== "holds") {
    return `Required friction exceeds the static limit, so the car ${physics.skidState}.`;
  }

  return `${physics.frictionDirection} friction keeps the motion in equilibrium.`;
}

function buildDiagramHint(mode) {
  if (mode === "fbd") {
    return "Free-body view isolates the forces and optional dashed components.";
  }

  if (mode === "top") {
    return "Top-down view focuses on circular motion, tangential velocity, and inward force.";
  }

  return "Road view shows the car on the banked track with all active force vectors.";
}

function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const paramMap = {
    theta: "theta",
    v: "velocity",
    velocity: "velocity",
    m: "mass",
    mass: "mass",
    r: "radius",
    radius: "radius",
    mu: "mu",
    g: "g",
  };

  Object.entries(paramMap).forEach(([paramKey, stateKey]) => {
    const value = Number.parseFloat(params.get(paramKey));
    if (Number.isFinite(value)) {
      state[stateKey] = value;
    }
  });

  if (params.has("frictionEnabled")) {
    state.frictionEnabled = params.get("frictionEnabled") === "true";
  }

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
    v: state.velocity,
    m: state.mass,
    r: state.radius,
    mu: state.frictionEnabled ? state.mu : 0,
    g: state.g,
    frictionEnabled: String(state.frictionEnabled),
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
