// v2.0.0-alpha.1
// src/features/shinydex/shinydex.help.js
// ShinyDex Help Tooltip — controller-owned UI helper (DOM only)

const HELP_TEXT = [
  'Search',
  '',
  'Pokémon:',
  '- type a name (partial ok)',
  '- pokemon: name',
  '',
  'Family:',
  '- +name',
  '- name+',
  '- family: name',
  '',
  'Member:',
  '- @name',
  '- member: name',
  '',
  'Filters:',
  '- unclaimed / unowned',
  '- claimed / owned'
].join('\n');

function ensureHelpEl(root) {
  let el = root.querySelector('.dex-help-tooltip');
  if (el) return el;

  el = document.createElement('div');
  el.className = 'dex-help-tooltip';
  el.textContent = HELP_TEXT;
  root.appendChild(el);
  return el;
}

function position(el, anchor) {
  const r = anchor.getBoundingClientRect();
  const pr = anchor.closest('#page-content')?.getBoundingClientRect();

  const left = (r.left - (pr?.left || 0)) + r.width + 10;
  const top = (r.top - (pr?.top || 0));

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

export function setupShinyDexHelp(root) {
  const btn = root.querySelector('#dex-help');
  if (!btn) return;

  const tip = ensureHelpEl(root);

  function show() {
    position(tip, btn);
    tip.classList.add('show');
    btn.classList.add('active');
  }

  function hide() {
    tip.classList.remove('show');
    btn.classList.remove('active');
  }

  function toggle() {
    if (tip.classList.contains('show')) hide();
    else show();
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', e => {
    if (!tip.classList.contains('show')) return;
    if (root.contains(e.target)) {
      if (e.target === btn || btn.contains(e.target)) return;
      if (tip.contains(e.target)) return;
    }
    hide();
  });

  window.addEventListener('resize', () => {
    if (!tip.classList.contains('show')) return;
    position(tip, btn);
  });
}
