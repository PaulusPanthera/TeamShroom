// src/features/shinydex/shinydex.help.js
// v2.0.0-beta
// Shiny Dex — Help Tooltip (Search Legend)
// Fixed-position overlay so sticky toolbars never clip it.

let cleanup = null;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function buildHelpHtml() {
  return `
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
}

export function setupShinyDexHelp({ buttonEl }) {
  if (!buttonEl) return;

  if (cleanup) cleanup();

  // Single tooltip instance owned by ShinyDex.
  let tooltip = document.querySelector('.dex-help-tooltip[data-shinydex-help="1"]');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'dex-help-tooltip';
    tooltip.dataset.shinydexHelp = '1';
    tooltip.setAttribute('role', 'dialog');
    tooltip.setAttribute('aria-label', 'Search Help');
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = buildHelpHtml();

  function positionNearButton() {
    const btnRect = buttonEl.getBoundingClientRect();
    const pad = 10;

    // Ensure we have a measurable box.
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    tooltip.style.maxWidth = '560px';

    const tipRect = tooltip.getBoundingClientRect();

    let left = btnRect.left;
    left = clamp(left, pad, window.innerWidth - tipRect.width - pad);

    let top = btnRect.bottom + pad;
    // If it would go off-screen, flip above.
    if (top + tipRect.height + pad > window.innerHeight) {
      top = btnRect.top - tipRect.height - pad;
    }
    top = clamp(top, pad, window.innerHeight - tipRect.height - pad);

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
    positionNearButton();
  }

  function toggle() {
    if (tooltip.style.display === 'none') open();
    else close();
  }

  const onButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  const onDocClick = (e) => {
    if (tooltip.style.display === 'none') return;
    if (tooltip.contains(e.target)) return;
    if (buttonEl.contains(e.target)) return;
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close();
  };

  const onViewportChange = () => {
    if (tooltip.style.display === 'none') return;
    positionNearButton();
  };

  buttonEl.addEventListener('click', onButtonClick);
  document.addEventListener('click', onDocClick, true);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('scroll', onViewportChange, { passive: true });
  window.addEventListener('resize', onViewportChange);

  cleanup = () => {
    buttonEl.removeEventListener('click', onButtonClick);
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('scroll', onViewportChange);
    window.removeEventListener('resize', onViewportChange);
  };
}
