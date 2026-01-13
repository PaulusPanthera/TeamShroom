// v2.0.0-alpha.1
// src/features/shinydex/shinydex.help.js
// Help tooltip — UI only

export function bindShinyDexHelp(helpBtn) {
  if (!helpBtn) return;

  // singleton
  let tip = document.querySelector('.dex-help-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'dex-help-tooltip';
    tip.innerHTML = `
      <div class="help-title">Search Help</div>
      <div class="help-body">
        <div><b>Pokémon</b>: type a name (partial ok)</div>
        <div><b>Family</b>: <b>+name</b> or <b>name+</b> (shows whole family)</div>
        <div><b>Member</b>: <b>@name</b> (Hitlist: claimed-by • LivingDex: owners)</div>
        <div><b>Region</b>: <b>r:k</b> / <b>r:kan</b> / <b>region:un</b></div>
        <div><b>Tier</b>: <b>tier:0</b> <b>tier:1</b> <b>tier:2</b> … <b>tier:lm</b></div>
        <div><b>Flags</b>: <b>unclaimed</b> / <b>claimed</b> • <b>unowned</b> / <b>owned</b></div>
      </div>
    `;
    document.body.appendChild(tip);
  }

  function place() {
    const r = helpBtn.getBoundingClientRect();
    const pad = 10;
    tip.style.left = Math.min(r.left, window.innerWidth - 440) + 'px';
    tip.style.top = (r.bottom + pad) + 'px';
  }

  function show() {
    place();
    tip.classList.add('show');
  }

  function hide() {
    tip.classList.remove('show');
  }

  function toggle() {
    if (tip.classList.contains('show')) hide();
    else show();
  }

  helpBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', () => hide());
  window.addEventListener('resize', () => {
    if (tip.classList.contains('show')) place();
  });
  window.addEventListener('scroll', () => hide(), { passive: true });
}
