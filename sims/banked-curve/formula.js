import { SOLVE_OPTIONS } from "../../shared/constants.js";
import { parseNumber } from "../../shared/ui.js";
import { solveIdealEquation } from "./physics.js";

export function createFormulaPanel(state, onApply) {
  const solveForSelect = document.querySelector("#solve-for");
  const sigFigsSelect = document.querySelector("#sig-figs");
  const inputsContainer = document.querySelector("#formula-inputs");
  const resultElement = document.querySelector("#formula-result");
  const substitutionElement = document.querySelector("#formula-substitution");
  const symbolicElement = document.querySelector("#formula-symbolic");

  if (!solveForSelect.dataset.ready) {
    SOLVE_OPTIONS.forEach((option) => {
      const item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      solveForSelect.append(item);
    });
    solveForSelect.dataset.ready = "true";
  }

  const render = () => {
    solveForSelect.value = state.solveFor;
    sigFigsSelect.value = String(state.sigFigs);
    inputsContainer.innerHTML = "";

    getFieldsForSolve(state).forEach((field) => {
      const wrapper = document.createElement("div");
      wrapper.className = "formula-row";

      const label = document.createElement("label");
      label.className = "label-strong";
      label.htmlFor = `formula-${field.key}`;
      label.innerHTML = field.label;

      const input = document.createElement("input");
      input.id = `formula-${field.key}`;
      input.type = "number";
      input.step = field.step;
      input.value = field.value;
      input.dataset.key = field.key;

      const unit = document.createElement("span");
      unit.className = "small-copy formula-unit";
      unit.textContent = field.unit;

      wrapper.append(label, input, unit);
      inputsContainer.append(wrapper);
    });

    const result = calculateFormulaResult(state);
    symbolicElement.innerHTML = result.symbolic;
    substitutionElement.innerHTML = result.substitution;
    resultElement.innerHTML = result.html;
  };

  if (!solveForSelect.dataset.bound) {
    solveForSelect.addEventListener("change", () => {
      state.solveFor = solveForSelect.value;
      render();
    });

    sigFigsSelect.addEventListener("change", () => {
      state.sigFigs = Number.parseInt(sigFigsSelect.value, 10);
      render();
    });

    inputsContainer.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const key = target.dataset.key;
      state[key] = parseNumber(target.value, state[key]);
      const result = calculateFormulaResult(state);
      onApply(result.patch);
      symbolicElement.innerHTML = result.symbolic;
      substitutionElement.innerHTML = result.substitution;
      resultElement.innerHTML = result.html;
    });

    solveForSelect.dataset.bound = "true";
  }

  render();
  return { render };
}

function calculateFormulaResult(state) {
  const figs = state.sigFigs;

  if (state.solveFor === "velocity") {
    const velocity = solveIdealEquation("velocity", {
      theta: state.theta,
      radius: state.radius,
      g: state.g,
    });
    return {
      symbolic: "v = &radic;(r g tan &theta;)",
      substitution: `v = &radic;(${formatSigFigs(state.radius, figs)} m &times; ${formatSigFigs(state.g, figs)} m.s<sup>-2</sup> &times; tan ${formatSigFigs(state.theta, figs)}&deg;)`,
      html: `v = <strong>${formatSigFigs(velocity, figs)}</strong> m.s<sup>-1</sup> tangent to the curve`,
      patch: { velocity },
    };
  }

  if (state.solveFor === "bank angle") {
    const theta = solveIdealEquation("bank angle", {
      velocity: state.velocity,
      radius: state.radius,
      g: state.g,
    });
    return {
      symbolic: "&theta; = tan<sup>-1</sup>(v<sup>2</sup> / (r g))",
      substitution: `&theta; = tan<sup>-1</sup>(${formatSigFigs(state.velocity, figs)}<sup>2</sup> / (${formatSigFigs(state.radius, figs)} m &times; ${formatSigFigs(state.g, figs)} m.s<sup>-2</sup> downward))`,
      html: `&theta; = <strong>${formatSigFigs(theta, figs)}</strong> &deg; above the horizontal`,
      patch: { theta },
    };
  }

  const radius = solveIdealEquation("radius", {
    velocity: state.velocity,
    theta: state.theta,
    g: state.g,
  });
  return {
    symbolic: "r = v<sup>2</sup> / (g tan &theta;)",
    substitution: `r = ${formatSigFigs(state.velocity, figs)}<sup>2</sup> / (${formatSigFigs(state.g, figs)} m.s<sup>-2</sup> downward &times; tan ${formatSigFigs(state.theta, figs)}&deg;)`,
    html: `r = <strong>${formatSigFigs(radius, figs)}</strong> m`,
    patch: { radius },
  };
}

function getFieldsForSolve(state) {
  if (state.solveFor === "velocity") {
    return [
      { key: "radius", label: "r =", unit: "m", step: "0.1", value: state.radius },
      { key: "theta", label: "&theta; =", unit: "°", step: "0.1", value: state.theta },
      { key: "g", label: "g =", unit: "m.s⁻² downward", step: "0.01", value: state.g },
    ];
  }

  if (state.solveFor === "bank angle") {
    return [
      { key: "velocity", label: "v =", unit: "m.s⁻¹ tangent", step: "0.1", value: state.velocity },
      { key: "radius", label: "r =", unit: "m", step: "0.1", value: state.radius },
      { key: "g", label: "g =", unit: "m.s⁻² downward", step: "0.01", value: state.g },
    ];
  }

  return [
    { key: "velocity", label: "v =", unit: "m.s⁻¹ tangent", step: "0.1", value: state.velocity },
    { key: "theta", label: "&theta; =", unit: "°", step: "0.1", value: state.theta },
    { key: "g", label: "g =", unit: "m.s⁻² downward", step: "0.01", value: state.g },
  ];
}

function formatSigFigs(value, sigFigs) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return Number(value).toPrecision(sigFigs).replace(/\.0+e/, "e").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
