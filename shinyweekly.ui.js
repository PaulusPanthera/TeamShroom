// (excerpt) shinyweekly.ui.js — update showWeek to auto-scroll and focus active week
// ... earlier imports and helpers remain the same ...

function showWeek(week, triggeringButton = null) {
  titleEl.textContent = week.label || week.week || '';
  grid.innerHTML = ''; // clear

  (week.shinies || []).forEach(mon => {
    const name = prettifyPokemonName(mon.name || '');
    const imgUrl = getPokemonGif(mon.name || name) || '';
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="img-wrap">
        <img src="${PLACEHOLDER}" alt="${name}" data-src="${imgUrl}" loading="lazy" />
      </div>
      <div class="card-title">
        <div>
          <div class="name">${name}</div>
          <div class="member">${prettifyMemberName(mon.member || '')}</div>
        </div>
        <div></div>
      </div>
      <div class="badges">
        ${mon.secret ? '<span class="badge secret">secret</span>' : ''}
        ${mon.egg ? '<span class="badge egg">egg</span>' : ''}
        ${mon.safari ? '<span class="badge safari">safari</span>' : ''}
        ${mon.event ? '<span class="badge event">event</span>' : ''}
      </div>
    `;

    const img = card.querySelector('img');
    img.addEventListener('error', () => {
      if (img.dataset.src && img.dataset.src.includes('/anim/')) {
        img.src = img.dataset.src.replace('/anim/shiny/', '/sprites/black-white/').replace('.gif','.png');
      } else {
        img.src = PLACEHOLDER;
      }
    });
    img.addEventListener('click', () => {
      openModal(img.dataset.src || img.src, mon);
    });

    grid.appendChild(card);
    if (io && img.dataset.src) io.observe(img);
  });

  // Show back button
  backBtn.style.display = 'inline-block';
  backBtn.onclick = () => {
    titleEl.textContent = '';
    grid.innerHTML = '';
    weekList.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
    backBtn.style.display = 'none';
  };

  // If a triggeringButton (week button) was provided, ensure it's visible
  if (triggeringButton) {
    triggeringButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    triggeringButton.focus({ preventScroll: true });
  }

  // Make sure the cards area is visible (helpful on long pages)
  const cardsSection = container.querySelector('.weekly-cards');
  if (cardsSection) {
    cardsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// When constructing week-list buttons, pass the button to showWeek so it can scroll it into view.
// Example button handler (inside initial builder):
// btn.addEventListener('click', () => {
//   weekList.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
//   btn.classList.add('active');
//   showWeek(week, btn);
// });
