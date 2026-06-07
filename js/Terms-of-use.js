// ==========================================
// TERMS OF USE PAGE CONTROLLER
// (Cấu trúc và phong cách giống home.js)
// ==========================================

(function() {
  'use strict';

  // --- DOM Cache (giống HomeDOM) ---
  const TermsDOM = {
    themeToggle: document.getElementById('themeToggleBtn'),
    mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
    desktopNavLinks: document.querySelectorAll('.desktop-nav .nav-link'),
    searchInputs: document.querySelectorAll('.js-search-input'),
    metaThemeColor: document.getElementById('themeColorMeta')
  };

  // --- Hàm đồng bộ giao diện sáng/tối ---
  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      if (TermsDOM.metaThemeColor) {
        TermsDOM.metaThemeColor.setAttribute('content', '#0b1120');
      }
      localStorage.setItem('filmxem-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      if (TermsDOM.metaThemeColor) {
        TermsDOM.metaThemeColor.setAttribute('content', '#f8fafc');
      }
      localStorage.setItem('filmxem-theme', 'light');
    }

    // Cập nhật icon cho nút toggle
    if (TermsDOM.themeToggle) {
      const icon = TermsDOM.themeToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-moon', 'fa-sun');
        icon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
      }
    }
  }

  // --- Khởi tạo theme từ localStorage hoặc hệ thống ---
  function initTheme() {
    const savedTheme = localStorage.getItem('filmxem-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setTheme(isDark);
  }

  // --- Thiết lập sự kiện cho nút toggle theme ---
  function setupThemeToggle() {
    if (!TermsDOM.themeToggle) return;
    TermsDOM.themeToggle.addEventListener('click', () => {
      const isDark = !document.body.classList.contains('dark-mode');
      setTheme(isDark);
    });
  }

  // --- Điều hướng cho mobile bottom nav (chuyển về trang chính hoặc tủ sách) ---
  function setupMobileNavigation() {
    // Mapping giữa id nút và đường dẫn
    const navMap = {
      mobileHomeBtn: './',
      mobileGenresBtn: './',
      mobileSearchBtn: './',
      mobileSavedBtn: './?view=saved'
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

  // --- Cập nhật trạng thái active cho nav (desktop + mobile) dựa trên URL ---
  function updateNavActiveState() {
    const isSavedView = window.location.search.includes('view=saved');

    // Desktop nav
    TermsDOM.desktopNavLinks.forEach(link => {
      const view = link.getAttribute('data-view');
      if (view === 'saved' && isSavedView) {
        link.classList.add('active');
      } else if (view === 'home' && !isSavedView) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile nav (data-tab)
    TermsDOM.mobileNavItems.forEach(item => {
      const tab = item.getAttribute('data-tab');
      if (tab === 'saved' && isSavedView) {
        item.classList.add('active');
      } else if (tab === 'home' && !isSavedView) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // --- Ẩn thanh tìm kiếm trên trang terms (không cần chức năng tìm phim) ---
  function hideSearchInputs() {
    TermsDOM.searchInputs.forEach(input => {
      if (input) input.style.display = 'none';
    });
  }

  // --- Khởi chạy toàn bộ khi DOM sẵn sàng (giống home.js) ---
  function init() {
    initTheme();
    setupThemeToggle();
    setupMobileNavigation();
    updateNavActiveState();
    hideSearchInputs();
  }

  // Đảm bảo DOM đã tải xong mới chạy
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();