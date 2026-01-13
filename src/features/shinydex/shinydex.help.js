// v2.0.0-alpha.1
// src/features/shinydex/shinydex.help.js
// Help Tooltip — UI only

export function bindShinyDexHelp(opts) {
  var buttonEl = opts && opts.buttonEl;
  var inputEl = opts && opts.inputEl;

  if (!buttonEl) return;

  var tooltip = document.querySelector('.dex-help-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'dex-help-tooltip';
    tooltip.innerHTML = `
      <div class="help-title">Search Help</div>
      <div class="help-body">
        <div><b>Pokémon:</b> type a name (partial ok)</div>
        <div><b>Family:</b> <code>+name</code> or <code>name+</code></div>
        <div><b>Member:</b> <code>@name</code> (Hitlist: claimed-by • LivingDex: owners)</div>
        <div><b>Region:</b> <code>r:k</code> • <code>r:kan</code> • <code>region:uno</code></div>
        <div><b>Tier:</b> <code>tier:0</code> <code>tier:1</code> <code>tier:2</code> … <code>tier:lm</code></div>
        <div><b>Flags:</b> <code>unclaimed</code> <code>claimed</code> <code>unowned</code> <code>owned</code></div>
      </div>
    `;
    document.body.appendChild(tooltip);
  }

  function hide() {
    tooltip.classList.remove('show');
    buttonEl.classList.remove('active');
  }

  function show() {
    var r = buttonEl.getBoundingClientRect();

    // anchor under the button, inside viewport
    var x = Math.max(8, Math.min(window.innerWidth - 420, r.left - 10));
    var y = Math.max(8, r.bottom + 8);

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';

    tooltip.classList.add('show');
    buttonEl.classList.add('active');
  }

  buttonEl.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (tooltip.classList.contains('show')) hide();
    else show();
  });

  document.addEventListener('click', function (e) {
    if (!tooltip.classList.contains('show')) return;
    if (e.target === buttonEl || buttonEl.contains(e.target)) return;
    if (tooltip.contains(e.target)) return;
    hide();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });

  // optional: focus search when closing help
  tooltip.addEventListener('click', function () {
    if (inputEl) inputEl.focus();
  });
}
