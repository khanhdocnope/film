// ==========================================
// PRIVACY POLICY PAGE CONTROLLER
// (Đồng bộ hoàn toàn với core.js)
// ==========================================

(function () {
  'use strict';

  // --- DOM Elements ---
  const dom = {
    mobileHome: document.getElementById('mobileHomeBtn'),
    mobileGenres: document.getElementById('mobileGenresBtn'),
    mobileSearch: document.getElementById('mobileSearchBtn'),
    mobileSaved: document.getElementById('mobileSavedBtn'),
    termsLink: document.getElementById('termsLink'),
    desktopNavLinks: document.querySelectorAll('.desktop-nav .nav-link')
  };

  // --- Setup mobile bottom navigation (redirect to main site) ---
  function setupMobileNav() {
    const redirectMap = [
      { element: dom.mobileHome, url: './' },
      { element: dom.mobileGenres, url: './' },
      { element: dom.mobileSearch, url: './' },
      { element: dom.mobileSaved, url: './?view=saved' }
    ];

    redirectMap.forEach(item => {
      if (item.element) {
        item.element.addEventListener('click', () => {
          window.location.href = item.url;
        });
      }
    });
  }

  // --- Handle "Terms of Use" link ---
  function setupTermsLink() {
    if (!dom.termsLink) return;
    dom.termsLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Điều khoản sử dụng sẽ được cập nhật sớm. Vui lòng quay lại sau hoặc liên hệ quản trị viên.');
    });
  }

  // --- Update active state for desktop navigation ---
  function updateDesktopNavActive() {
    const currentPath = window.location.pathname;
    const isPrivacyPage = currentPath.includes('privacy-policy.html');

    dom.desktopNavLinks.forEach(link => {
      link.classList.remove('active');
      if (isPrivacyPage) return;

      const href = link.getAttribute('href');
      if (href === './' && (currentPath === '/' || currentPath === '')) {
        link.classList.add('active');
      } else if (href === './?view=saved' && window.location.search.includes('view=saved')) {
        link.classList.add('active');
      }
    });
  }

  // --- Initialize everything when DOM is ready ---
  function init() {
    setupMobileNav();
    setupTermsLink();
    updateDesktopNavActive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();