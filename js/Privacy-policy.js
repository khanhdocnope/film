// ==========================================
// PRIVACY POLICY PAGE CONTROLLER
// Xử lý giao diện tối/sáng, điều hướng mobile
// ==========================================

(function () {
  'use strict';

  // --- DOM Elements ---
  const dom = {
    themeToggle: document.getElementById('themeToggleBtn'),
    themeIcon: null,          // sẽ gán sau
    body: document.body,
    metaThemeColor: document.getElementById('themeColorMeta'),
    mobileHome: document.getElementById('mobileHomeBtn'),
    mobileGenres: document.getElementById('mobileGenresBtn'),
    mobileSearch: document.getElementById('mobileSearchBtn'),
    mobileSaved: document.getElementById('mobileSavedBtn'),
    termsLink: document.getElementById('termsLink'),
    desktopNavLinks: document.querySelectorAll('.desktop-nav .nav-link')
  };

  // Cập nhật icon theme sau khi có element
  if (dom.themeToggle) {
    dom.themeIcon = dom.themeToggle.querySelector('i');
  }

  // --- Helper: set theme (dark/light) ---
  function setTheme(isDark) {
    if (isDark) {
      dom.body.classList.add('dark-mode');
      if (dom.themeIcon) {
        dom.themeIcon.classList.remove('fa-moon');
        dom.themeIcon.classList.add('fa-sun');
      }
      if (dom.metaThemeColor) {
        dom.metaThemeColor.setAttribute('content', '#0b1120');
      }
      localStorage.setItem('filmxem-theme', 'dark');
    } else {
      dom.body.classList.remove('dark-mode');
      if (dom.themeIcon) {
        dom.themeIcon.classList.remove('fa-sun');
        dom.themeIcon.classList.add('fa-moon');
      }
      if (dom.metaThemeColor) {
        dom.metaThemeColor.setAttribute('content', '#f8fafc');
      }
      localStorage.setItem('filmxem-theme', 'light');
    }
  }

  // --- Initialize theme from localStorage or system preference ---
  function initTheme() {
    const savedTheme = localStorage.getItem('filmxem-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setTheme(isDark);
  }

  // --- Setup theme toggle button ---
  function setupThemeToggle() {
    if (!dom.themeToggle) return;
    dom.themeToggle.addEventListener('click', () => {
      const isDark = dom.body.classList.contains('dark-mode');
      setTheme(!isDark);
    });
  }

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

  // --- Handle "Terms of Use" link (tạm thời hiển thị thông báo) ---
  function setupTermsLink() {
    if (!dom.termsLink) return;
    dom.termsLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Điều khoản sử dụng sẽ được cập nhật sớm. Vui lòng quay lại sau hoặc liên hệ quản trị viên.');
    });
  }

  // --- Update active state for desktop navigation (chỉ mang tính thẩm mỹ) ---
  function updateDesktopNavActive() {
    const currentPath = window.location.pathname;
    const isPrivacyPage = currentPath.includes('privacy-policy.html');

    dom.desktopNavLinks.forEach(link => {
      // Mặc định không active
      link.classList.remove('active');

      if (isPrivacyPage) return; // privacy page không active nav nào

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
    initTheme();
    setupThemeToggle();
    setupMobileNav();
    setupTermsLink();
    updateDesktopNavActive();
  }

  // Khởi chạy sau khi DOM tải xong
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();