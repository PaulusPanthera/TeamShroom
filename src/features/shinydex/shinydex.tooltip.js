// v2.0.0-alpha.1
// src/features/shinydex/shinydex.tooltip.js
// Owners Tooltip — delegated hover + freeze mode

var TOOLTIP_ID = 'dex-owner-tooltip';
var PAGE_SIZE = 8;
var AUTO_MS = 3000;

export function bindDexOwnerTooltip() {
  // avoid double-binding
  if (document.body && document.body.dataset && document.body.dataset.dexOwnerTooltipBound === '1') return;
  if (document.body && document.body.dataset) document.body.dataset.dexOwnerTooltipBound = '1';

  var tooltip = document.getElementById(TOOLTIP_ID);
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.className = 'dex-owner-tooltip';
    tooltip.innerHTML = `
      <div class="owners-title"></div>
      <div class="owners-list"></div>
      <div class="owners-footer">
        <span class="owners-page"></span>
        <button class="owners-next" type="button">Next</button>
      </div>
    `;
    document.body.appendChild(tooltip);
  }

  var titleEl = tooltip.querySelector('.owners-title');
  var listEl = tooltip.querySelector('.owners-list');
  var pageEl = tooltip.querySelector('.owners-page');
  var nextBtn = tooltip.querySelector('.owners-next');

  var currentCard = null;
  var owners = [];
  var page = 0;
  var timer = null;
  var frozen = false;

  function uniq(arr) {
    var map = {};
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var k = String(arr[i] || '').trim();
      if (!k) continue;
      if (map[k]) continue;
      map[k] = 1;
      out.push(k);
    }
    return out;
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (frozen) return;

    var pages = Math.max(1, Math.ceil(owners.length / PAGE_SIZE));
    if (pages <= 1) return;

    timer = setInterval(function () {
      page = (page + 1) % pages;
      renderPage(true);
    }, AUTO_MS);
  }

  function anchorToCard() {
    if (!currentCard) return;

    var r = currentCard.getBoundingClientRect();
    var x = r.right + 12;
    var y = r.top + 12;

    // keep inside viewport
    var maxX = window.innerWidth - tooltip.offsetWidth - 8;
    var maxY = window.innerHeight - tooltip.offsetHeight - 8;

    if (x > maxX) x = Math.max(8, r.left - tooltip.offsetWidth - 12);
    if (y > maxY) y = Math.max(8, maxY);

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function renderPage(withFade) {
    var totalPages = Math.max(1, Math.ceil(owners.length / PAGE_SIZE));
    if (page >= totalPages) page = 0;

    var start = page * PAGE_SIZE;
    var chunk = owners.slice(start, start + PAGE_SIZE);

    if (withFade) tooltip.classList.add('page-fade');
    setTimeout(function () {
      listEl.textContent = chunk.join('\n');
      pageEl.textContent = totalPages > 1 ? ('Page ' + (page + 1) + ' / ' + totalPages) : '';
      tooltip.classList.remove('page-fade');
    }, withFade ? 120 : 0);
  }

  function showFor(card, pokemonName, ownersList) {
    currentCard = card;
    owners = uniq(ownersList || []);
    page = 0;
    frozen = false;

    tooltip.classList.remove('frozen');
    nextBtn.style.display = 'none';

    titleEl.textContent = 'Owners — ' + pokemonName;
    renderPage(false);

    tooltip.classList.add('show');
    anchorToCard();
    startTimer();
  }

  function hide() {
    stopTimer();
    currentCard = null;
    owners = [];
    page = 0;
    frozen = false;

    tooltip.classList.remove('show');
    tooltip.classList.remove('frozen');
    nextBtn.style.display = 'none';
  }

  function toggleFreeze() {
    if (!tooltip.classList.contains('show')) return;

    frozen = !frozen;

    if (frozen) {
      stopTimer();
      tooltip.classList.add('frozen');
      nextBtn.style.display = owners.length > PAGE_SIZE ? 'inline-block' : 'none';
      anchorToCard();
    } else {
      tooltip.classList.remove('frozen');
      nextBtn.style.display = 'none';
      startTimer();
    }
  }

  // "Next" manual paging
  nextBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!owners.length) return;

    var pages = Math.max(1, Math.ceil(owners.length / PAGE_SIZE));
    if (pages <= 1) return;

    page = (page + 1) % pages;
    renderPage(true);
  });

  // delegated hover on cards
  document.addEventListener('mouseover', function (e) {
    var card = e.target && e.target.closest ? e.target.closest('.unified-card[data-card-type="pokemon"]') : null;
    if (!card) return;

    var wrap = card.closest ? card.closest('.dex-card-wrap') : null;
    if (!wrap) return;

    var ownersRaw = wrap.getAttribute('data-owners') || '';
    if (!ownersRaw) return;

    var pokemonName = wrap.getAttribute('data-pokemon-name') || card.getAttribute('data-name') || 'Pokémon';
    var list = ownersRaw.split('|');

    showFor(card, pokemonName, list);
  });

  document.addEventListener('mousemove', function () {
    if (!tooltip.classList.contains('show')) return;
    if (frozen) return;
    anchorToCard();
  });

  document.addEventListener('mouseout', function (e) {
    if (!tooltip.classList.contains('show')) return;

    var card = e.target && e.target.closest ? e.target.closest('.unified-card[data-card-type="pokemon"]') : null;
    if (!card) return;

    // if moving into tooltip, do nothing
    if (e.relatedTarget && tooltip.contains(e.relatedTarget)) return;

    // if frozen, keep it
    if (frozen) return;

    hide();
  });

  // freeze mode: LEFT CLICK on the card toggles freeze
  document.addEventListener('click', function (e) {
    var card = e.target && e.target.closest ? e.target.closest('.unified-card[data-card-type="pokemon"]') : null;
    if (!card) return;

    if (!tooltip.classList.contains('show')) return;
    if (!currentCard) return;
    if (card !== currentCard) return;

    e.preventDefault();
    e.stopPropagation();
    toggleFreeze();
  });

  // escape closes tooltip even if frozen
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });

  // resize: re-anchor
  window.addEventListener('resize', function () {
    if (!tooltip.classList.contains('show')) return;
    anchorToCard();
  });
}
