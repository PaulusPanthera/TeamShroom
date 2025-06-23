fetch('teamshowcase.json')
  .then(response => response.json())
  .then(data => {
    window.teamShowcase = data;
    // Optionally, trigger a re-render here if your site supports live updating
    if (window.setupShowcaseSearchAndSort && window.teamMembers) {
      window.setupShowcaseSearchAndSort(window.teamMembers, window.renderShowcaseGallery, "alphabetical");
    }
  });
