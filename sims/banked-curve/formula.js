import { SOLVE_OPTIONS } from "../../shared/constants.js";
import { formatNumber, parseNumber } from "../../shared/ui.js";
import { solveIdealEquation } from "./physics.js";

export function createFormulaPanel(state, onApply) {
  const solveForSelect = document.querySelector("#solve-for");
  const inputsContainer = document.querySelector("#formula-inputs");
  const resultElement = document.querySelector("#formula-result");

  SOLVE_OPTIONS.forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    solveForSelect.append(item);
  });

  const render = () => {
    solveForSelect.value = state.solveFor;
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

    resultElement.textContent = calculateFormulaResult(state).text;
  };

  solveForSelect.addEventListener("change", () => {
    state.solveFor = solveForSelect.value;
    render();
  });

  inputsContainer.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const key = target.dataset.key;
    state[key] = parseNumber(target.value, state[key]);
    onApply(calculateFormulaResult(state).patch);
    resultElement.textContent = calculateFormulaResult(state).text;
  });

  render();
  return { render };
}

function calculateFormulaResult(state) {
  if (state.solveFor === "velocity") {
    const velocity = solveIdealEquation("velocity", {
      theta: state.theta,
      radius: state.radius,
      g: state.g,
    });
    return { text: `Velocity = ${formatNumber(velocity, 2)} m/s`, patch: { velocity } };
  }

  if (state.solveFor === "bank angle") {
    const theta = solveIdealEquation("bank angle", {
      velocity: state.velocity,
      radius: state.radius,
      g: state.g,
    });
    return { text: `Bank angle = ${formatNumber(theta, 2)} deg`, patch: { theta } };
  }

  const radius = solveIdealEquation("radius", {
    velocity: state.velocity,
    theta: state.theta,
    g: state.g,
  });
  return { text: `Radius = ${formatNumber(radius, 2)} m`, patch: { radius } };
}

function getFieldsForSolve(state) {
  if (state.solveFor === "velocity") {
    return [
      { key: "radius", label: "Radius (m)", step: "0.1", value: state.radius },
      { key: "theta", label: "Bank angle (deg)", step: "0.1", value: state.theta },
      { key: "g", label: "Gravity (m/s^2)", step: "0.01", value: state.g },
    ];
  }

  if (state.solveFor === "bank angle") {
    return [
      { key: "velocity", label: "Velocity (m/s)", step: "0.1", value: state.velocity },
      { key: "radius", label: "Radius (m)", step: "0.1", value: state.radius },
      { key: "g", label: "Gravity (m/s^2)", step: "0.01", value: state.g },
    ];
  }

  return [
    { key: "velocity", label: "Velocity (m/s)", step: "0.1", value: state.velocity },
    { key: "theta", label: "Bank angle (deg)", step: "0.1", value: state.theta },
    { key: "g", label: "Gravity (m/s^2)", step: "0.01", value: state.g },
  ];
}
