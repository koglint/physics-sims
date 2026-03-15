import { SOLVE_OPTIONS } from "../../shared/constants.js";
import { parseNumber } from "../../shared/ui.js";
import { solveIdealEquation } from "./physics.js";

export function createFormulaPanel(state, onApply) {
  const solveForSelect = document.querySelector("#solve-for");
  const sigFigsSelect = document.querySelector("#sig-figs");
  const inputsContainer = document.querySelector("#formula-inputs");
  const resultElement = document.querySelector("#formula-result");
  const substitutionElement = document.querySelector("#formula-substitution");

  SOLVE_OPTIONS.forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    solveForSelect.append(item);
  });

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
      label.textContent = field.label;

      const input = document.createElement("input");
      input.id = `formula-${field.key}`;
      input.type = "number";
      input.step = field.step;
      input.value = field.value;
      input.dataset.key = field.key;

      wrapper.append(label, input);
      inputsContainer.append(wrapper);
    });

    const result = calculateFormulaResult(state);
    resultElement.innerHTML = result.html;
    substitutionElement.innerHTML = result.substitution;
  };

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
    resultElement.innerHTML = result.html;
    substitutionElement.innerHTML = result.substitution;
  });

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
      html: `v = <strong>${formatSigFigs(velocity, figs)}</strong> m/s`,
      substitution: `v = &radic;(${formatSigFigs(state.radius, figs)} × ${formatSigFigs(state.g, figs)} × tan ${formatSigFigs(state.theta, figs)}&deg;)`,
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
      html: `&theta; = <strong>${formatSigFigs(theta, figs)}</strong>&deg;`,
      substitution: `&theta; = tan<sup>-1</sup>(${formatSigFigs(state.velocity, figs)}<sup>2</sup> / (${formatSigFigs(state.radius, figs)} × ${formatSigFigs(state.g, figs)}))`,
      patch: { theta },
    };
  }

  const radius = solveIdealEquation("radius", {
    velocity: state.velocity,
    theta: state.theta,
    g: state.g,
  });
  return {
    html: `r = <strong>${formatSigFigs(radius, figs)}</strong> m`,
    substitution: `r = ${formatSigFigs(state.velocity, figs)}<sup>2</sup> / (${formatSigFigs(state.g, figs)} × tan ${formatSigFigs(state.theta, figs)}&deg;)`,
    patch: { radius },
  };
}

function getFieldsForSolve(state) {
  if (state.solveFor === "velocity") {
    return [
      { key: "radius", label: "Radius (m)", step: "0.1", value: state.radius },
      { key: "theta", label: "Bank angle θ (°)", step: "0.1", value: state.theta },
      { key: "g", label: "Gravity g (m/s^2)", step: "0.01", value: state.g },
    ];
  }

  if (state.solveFor === "bank angle") {
    return [
      { key: "velocity", label: "Velocity (m/s)", step: "0.1", value: state.velocity },
      { key: "radius", label: "Radius (m)", step: "0.1", value: state.radius },
      { key: "g", label: "Gravity g (m/s^2)", step: "0.01", value: state.g },
    ];
  }

  return [
    { key: "velocity", label: "Velocity (m/s)", step: "0.1", value: state.velocity },
    { key: "theta", label: "Bank angle θ (°)", step: "0.1", value: state.theta },
    { key: "g", label: "Gravity g (m/s^2)", step: "0.01", value: state.g },
  ];
}

function formatSigFigs(value, sigFigs) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return Number(value).toPrecision(sigFigs).replace(/\.0+e/, "e").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
