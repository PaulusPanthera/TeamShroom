// v2.0.0-alpha.5
// src/features/shinydex/shinydex.help.js
// Shiny Dex — Help Tooltip (Search Legend)

let cleanup = null;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function setupShinyDexHelp({ buttonEl, controlsRoot }) {
  if (!buttonEl || !controlsRoot) return;

  if (cleanup) cleanup();

  if (getComputedStyle(controlsRoot).position === 'static') {
    controlsRoot.style.position = 'relative';
  }

  let tooltip = controlsRoot.querySelector('.dex-help-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'dex-help-tooltip';
    controlsRoot.appendChild(tooltip);
  }

  tooltip.style.display = 'none';

  tooltip.innerHTML = `
    <div class="dex-help-title">Search Help</div>
    <div class="dex-help-rows">
      <div class="help-row">
        <div class="help-k">Name</div>
        <div class="help-v"><code>bulba</code></div>
      </div>

      <div class="help-row">
        <div class="help-k">Owner</div>
        <div class="help-v"><code>ot:willy</code></div>
      </div>

      <div class="help-row">
        <div class="help-k">Region</div>
        <div class="help-v"><code>r:kanto</code> / <code>region:un</code></div>
      </div>

      <div class="help-row">
        <div class="help-k">Tier</div>
        <div class="help-v"><code>tier:0</code> / <code>t:0</code> … <code>tier:lm</code> / <code>t:lm</code></div>
      </div>

      <div class="help-row">
        <div class="help-k">Flags</div>
        <div class="help-v"><code>unclaimed</code> / <code>unowned</code> / <code>claimed</code> / <code>owned</code></div>
      </div>
    </div>
  `;

  function positionUnderButton() {
    const rootRect = controlsRoot.getBoundingClientRect();
    const btnRect = buttonEl.getBoundingClientRect();

    const pad = 8;
    const desiredLeft = btnRect.left - rootRect.left;
    const maxLeft = controlsRoot.clientWidth - tooltip.offsetWidth - pad;

    const left = clamp(desiredLeft, pad, Math.max(pad, maxLeft));
    const top = btnRect.bottom - rootRect.top + pad;

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function close() {
    tooltip.style.display = 'none';
    buttonEl.classList.remove('active');
  }

  function open() {
    tooltip.style.display = 'block';
    buttonEl.classList.add('active');
    positionUnderButton();
  }

  function toggle() {
    if (tooltip.style.display === 'none') open();
    else close();
  }

  const onButtonClick = e => {
    e.preventDefault();
    toggle();
  };

  const onDocClick = e => {
    if (tooltip.style.display === 'none') return;
    if (tooltip.contains(e.target)) return;
    if (buttonEl.contains(e.target)) return;
    close();
  };

  const onKeyDown = e => {
    if (e.key === 'Escape') close();
  };

  const onResize = () => {
    if (tooltip.style.display === 'none') return;
    positionUnderButton();
  };

  buttonEl.addEventListener('click', onButtonClick);
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);

  cleanup = () => {
    buttonEl.removeEventListener('click', onButtonClick);
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
  };
}
