fetch('teamshowcase.json')
  .then(response => response.json())
  .then(data => {
    window.teamShowcase = data;
    window.teamMembers = (window.teamShowcase || []).map(entry => ({
      name: entry.name,
      shinies: Array.isArray(entry.shinies)
        ? entry.shinies.filter(mon => !mon.lost).length
        : 0,
      status: entry.status,
      donator: entry.donator
    }));
    // If your page is already loaded, re-render the showcase
    if (window.setupShowcaseSearchAndSort && document.getElementById('showcase-gallery-container')) {
      window.setupShowcaseSearchAndSort(window.teamMembers, window.renderShowcaseGallery, "alphabetical");
    }
  });
