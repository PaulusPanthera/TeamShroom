// src/app/routes.js
// v2.0.0-beta
// Route parsing + active nav highlighting

function setActiveNav(page) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));

  const map = {
    home: 'nav-home',
    hitlist: 'nav-hitlist',
    showcase: 'nav-showcase',
    shinyweekly: 'nav-shinyweekly',
    donators: 'nav-donators'
  };

  document.getElementById(map[page])?.classList.add('active');
}

function getRoute() {
  const raw = String(location.hash || '').trim();
  if (!raw || raw === '#') return { page: 'hitlist' };

  const lower = raw.toLowerCase();

  if (lower.startsWith('#home')) return { page: 'home' };

  if (lower.startsWith('#home')) return { page: 'home' };

  if (lower.startsWith('#hitlist') || lower.startsWith('#pokedex')) {
    return { page: 'hitlist' };
  }

  if (lower.startsWith('#showcase')) return { page: 'showcase' };
  if (lower.startsWith('#donators')) return { page: 'donators' };
  if (lower.startsWith('#shinyweekly')) return { page: 'shinyweekly' };

  return { page: 'hitlist' };
}

export { getRoute, setActiveNav };
