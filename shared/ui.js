export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return Number(value).toFixed(digits).replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

export function updateRangeValue(id, value, unit = "") {
  const target = document.querySelector(`[data-value-for="${id}"]`);
  if (target) {
    target.textContent = `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
  }
}

export function parseNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function debounceFrame(callback) {
  let handle = 0;

  return (...args) => {
    if (handle) {
      cancelAnimationFrame(handle);
    }

    handle = requestAnimationFrame(() => callback(...args));
  };
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  document.body.append(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
  return Promise.resolve();
}
