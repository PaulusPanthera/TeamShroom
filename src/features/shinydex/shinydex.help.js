// v2.0.0-alpha.1
// src/features/shinydex/shinydex.help.js
// Shiny Dex — Help Tooltip (Search Legend)

export function setupShinyDexHelp({
  buttonEl,
  controlsRoot
}) {
  if (!buttonEl) return;

  let tooltip = controlsRoot.querySelector('.dex-help-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'dex-help-tooltip';
    tooltip.style.display = 'none';
    controlsRoot.appendChild(tooltip);
  }

  tooltip.innerHTML = `
    <div class="dex-help-title">Search Help</div>
    <div class="dex-help-body">
      <div><b>Pokémon</b>: type a name (partial ok)</div>
      <div><b>Family</b>: <b>+name</b> or <b>name+</b> (shows whole family)</div>
      <div><b>Member</b>: <b>@name</b> (Hitlist: claimed-by · LivingDex: owner)</div>
      <div><b>Region</b>: <b>r:k</b> / <b>r:kan</b> / <b>region:un</b></div>
      <div><b>Tier</b>: <b>tier:0</b> <b>tier:1</b> <b>tier:2</b> ... <b>tier:lm</b></div>
      <div><b>Flags</b>: <b>unclaimed</b> / <b>claimed</b> / <b>unowned</b> / <b>owned</b></div>
    </div>
  `;

  function close() {
    tooltip.style.display = 'none';
    buttonEl.classList.remove('active');
  }

  function toggle() {
    const open = tooltip.style.display !== 'none';
    if (open) {
      close();
      return;
    }
    tooltip.style.display = 'block';
    buttonEl.classList.add('active');
  }

  buttonEl.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', e => {
    if (!tooltip) return;
    if (tooltip.style.display === 'none') return;
    if (tooltip.contains(e.target)) return;
    if (buttonEl.contains(e.target)) return;
    close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
}
