const simulations = [
  {
    title: "Banked Curve",
    href: "./sims/banked-curve/",
    tag: "Mechanics",
    description:
      "Investigate normal force, friction direction, and circular motion on a banked road with multiple diagram modes.",
  },
];

const grid = document.querySelector("#simulation-grid");

function createCard(simulation) {
  const link = document.createElement("a");
  link.className = "sim-card";
  link.href = simulation.href;

  const tag = document.createElement("span");
  tag.className = "sim-card-tag";
  tag.textContent = simulation.tag;

  const title = document.createElement("h3");
  title.textContent = simulation.title;

  const description = document.createElement("p");
  description.textContent = simulation.description;

  const footer = document.createElement("span");
  footer.className = "sim-card-footer";
  footer.textContent = "Open simulation";

  link.append(tag, title, description, footer);
  return link;
}

simulations.forEach((simulation) => {
  grid.append(createCard(simulation));
});
