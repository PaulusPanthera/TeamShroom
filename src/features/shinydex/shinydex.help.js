// v2.0.0-alpha.1
// src/features/shinydex/shinydex.help.js
// Shiny Dex — Help Tooltip (Search Legend)

let cleanup = null;

export function setupShinyDexHelp({ buttonEl, controlsRoot }) {
  if (!buttonEl || !controlsRoot) return;

  if (cleanup) cleanup();

  let tooltip = controlsRoot.querySelector('.dex-help-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'dex-help-tooltip';
    controlsRoot.appendChild(tooltip);
  }

  tooltip.style.display = 'none';

  tooltip.innerHTML = `
    <div class="dex-help-title">Search Help</div>
    <div class="dex-help-body">
      <div><b>Name</b>: plain text (e.g. <b>bulba</b>)</div>
      <div><b>Owner</b>: <b>owner:willy</b> / <b>claimedby:willy</b></div>
      <div><b>Region</b>: <b>r:kanto</b> / <b>region:un</b></div>
      <div><b>Tier</b>: <b>tier:0</b> <b>tier:1</b> <b>tier:2</b> ... <b>tier:lm</b></div>
      <div><b>Flags</b>: <b>unclaimed</b> / <b>claimed</b> / <b>unowned</b> / <b>owned</b></div>
    </div>
  `;

  function close() {
    tooltip.style.display = 'none';
    buttonEl.classList.remove('active');
  }

  function open() {
    tooltip.style.display = 'block';
    buttonEl.classList.add('active');
  }

  function toggle() {
    if (tooltip.style.display === 'none') open();
    else close();
  }

  const onButtonClick = (e) => {
    e.preventDefault();
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

  buttonEl.addEventListener('click', onButtonClick);
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKeyDown);

  cleanup = () => {
    buttonEl.removeEventListener('click', onButtonClick);
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKeyDown);
  };
}
