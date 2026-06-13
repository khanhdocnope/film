// ==========================================
// TERMS OF USE PAGE CONTROLLER
// (Đồng bộ hoàn toàn với core.js)
// ==========================================

(function() {
  'use strict';

  // --- DOM Cache ---
  const TermsDOM = {
    mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
    desktopNavLinks: document.querySelectorAll('.desktop-nav .nav-link'),
    searchInputs: document.querySelectorAll('.js-search-input')
  };

  // --- MOBILE NAVIGATION ---
  function setupMobileNavigation() {
    const navMap = {
      mobileHomeBtn: 'index.html',
      mobileGenresBtn: 'index.html',
      mobileSearchBtn: 'index.html',
      mobileSavedBtn: 'index.html?view=saved'
    };
    Object.keys(navMap).forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          window.location.href = navMap[id];
        });
      }
    });
  }

  // --- ACTIVE NAV STATE ---
  function updateNavActiveState() {
    const isSavedView = window.location.search.includes('view=saved');
    TermsDOM.desktopNavLinks.forEach(link => {
      const view = link.getAttribute('data-view');
      link.classList.toggle('active', (view === 'saved' && isSavedView) || (view === 'home' && !isSavedView));
    });
    TermsDOM.mobileNavItems.forEach(item => {
      const tab = item.getAttribute('data-tab');
      item.classList.toggle('active', (tab === 'saved' && isSavedView) || (tab === 'home' && !isSavedView));
    });
  }

  // --- ẨN SEARCH TRÊN TERMS PAGE ---
  function hideSearchInputs() {
    TermsDOM.searchInputs.forEach(input => {
      if (input) input.style.display = 'none';
    });
  }

  function init() {
    setupMobileNavigation();
    updateNavActiveState();  
    hideSearchInputs();  
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();