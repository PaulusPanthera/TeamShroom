fetch('teamshowcase.json')
  .then(response => response.json())
  .then(data => {
    window.teamShowcase = data;
    // If showcase.js is already loaded, you may want to trigger a re-render here.
    if (window.setupShowcaseSearchAndSort && window.teamMembers) {
      // e.g. re-render the gallery if needed
      window.setupShowcaseSearchAndSort(window.teamMembers, window.renderShowcaseGallery, "alphabetical");
    }
  });
