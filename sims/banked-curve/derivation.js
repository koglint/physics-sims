const steps = Array.from(document.querySelectorAll(".derivation-step"));
const revealButton = document.querySelector("#reveal-next-step");
const resetButton = document.querySelector("#reset-steps");

let visibleCount = 0;

function render() {
  steps.forEach((step, index) => {
    step.classList.toggle("is-hidden", index >= visibleCount);
  });

  revealButton.disabled = visibleCount >= steps.length;
  revealButton.textContent = visibleCount >= steps.length ? "All Lines Revealed" : "Reveal Next Line";
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

render();
