import { SOLVE_OPTIONS } from "./constants.js";
import { solveEquation } from "./physics.js";
import { parseNumber } from "../../shared/ui.js";

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

  if (state.solveFor === "normal force") {
    const normalForce = solveEquation("normal force", state);
    return {
      symbolic: "F_N = m g cos &theta;",
      substitution: `F_N = ${formatSigFigs(state.mass, figs)} kg x ${formatSigFigs(state.g, figs)} m.s<sup>-2</sup> x cos ${formatSigFigs(state.theta, figs)}&deg;`,
      html: `F_N = <strong>${formatSigFigs(normalForce, figs)}</strong> N perpendicular to the plane`,
      patch: {},
    };
  }

  if (state.solveFor === "parallel force") {
    const parallelForce = solveEquation("parallel force", state);
    return {
      symbolic: "F_parallel = m g sin &theta;",
      substitution: `F_parallel = ${formatSigFigs(state.mass, figs)} kg x ${formatSigFigs(state.g, figs)} m.s<sup>-2</sup> x sin ${formatSigFigs(state.theta, figs)}&deg;`,
      html: `F_parallel = <strong>${formatSigFigs(parallelForce, figs)}</strong> N down the slope`,
      patch: {},
    };
  }

  const angle = solveEquation("angle", state);
  return {
    symbolic: "&theta; = sin<sup>-1</sup>(F_parallel / (m g))",
    substitution: `&theta; = sin<sup>-1</sup>(${formatSigFigs(state.parallelForce, figs)} / (${formatSigFigs(state.mass, figs)} x ${formatSigFigs(state.g, figs)}))`,
    html: `&theta; = <strong>${formatSigFigs(angle, figs)}</strong> &deg;`,
    patch: { theta: angle },
  };
}

function getFieldsForSolve(state) {
  if (state.solveFor === "angle") {
    return [
      { key: "parallelForce", label: "F_parallel =", unit: "N", step: "0.1", value: state.parallelForce ?? 0 },
      { key: "mass", label: "m =", unit: "kg", step: "0.1", value: state.mass },
      { key: "g", label: "g =", unit: "m.s^-2", step: "0.01", value: state.g },
    ];
  }

  return [
    { key: "mass", label: "m =", unit: "kg", step: "0.1", value: state.mass },
    { key: "g", label: "g =", unit: "m.s^-2", step: "0.01", value: state.g },
    { key: "theta", label: "&theta; =", unit: "deg", step: "0.1", value: state.theta },
  ];
}

function formatSigFigs(value, sigFigs) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return Number(value).toPrecision(sigFigs).replace(/\.0+e/, "e").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
