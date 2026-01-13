// v2.0.0-alpha.1
// src/features/shinydex/shinydex.help.js
// Help popup logic (no CSS dependency, inline-styled)

function ensureHelpPanel() {
  var el = document.getElementById('dex-help-panel');
  if (el) return el;

  el = document.createElement('div');
  el.id = 'dex-help-panel';

  // inline style so you don't need to touch CSS right now
  el.style.position = 'absolute';
  el.style.left = '12px';
  el.style.top = '52px';
  el.style.maxWidth = '860px';
  el.style.padding = '10px 12px';
  el.style.borderRadius = '12px';
  el.style.background = 'var(--bg-panel)';
  el.style.color = 'var(--text-main)';
  el.style.border = 'var(--border-soft)';
  el.style.boxShadow = 'var(--shadow-depth)';
  el.style.zIndex = '9999';
  el.style.display = 'none';

  el.innerHTML =
    '<div style="color:var(--accent);letter-spacing:1px;margin-bottom:6px;">Search</div>' +
    '<div style="line-height:1.6;">' +
      '<b>Pokémon</b>: type a name (partial ok)<br>' +
      '<b>Family</b>: <b>+name</b> or <b>name+</b> (partial ok)<br>' +
      '<b>Member</b>: <b>@name</b> or <b>member:name</b><br>' +
      '<b>Region</b>: <b>r:k</b>, <b>r:kan</b>, <b>r:uno</b> (prefix)<br>' +
      '<b>Tier</b>: <b>t:0</b>, <b>t:1</b>, <b>t:2</b> … <b>t:lm</b><br>' +
      '<b>Flags</b>: <b>unclaimed/unowned</b>, <b>claimed/owned</b>' +
    '</div>';

  return el;
}

export function attachDexHelp(helpButtonEl, controlsRootEl) {
  if (!helpButtonEl || !controlsRootEl) return;

  var panel = ensureHelpPanel();
  controlsRootEl.style.position = 'relative';
  controlsRootEl.appendChild(panel);

  function close() {
    panel.style.display = 'none';
    helpButtonEl.classList.remove('active');
  }

  function toggle() {
    var open = panel.style.display !== 'none';
    if (open) close();
    else {
      panel.style.display = 'block';
      helpButtonEl.classList.add('active');
    }
  }

  helpButtonEl.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', function () {
    close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
}
