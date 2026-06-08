// ==========================================
// TERMS OF USE PAGE CONTROLLER - FIXED SYNC THEME
// (Đồng bộ hoàn toàn với core.js và home.js)
// ==========================================

(function() {
  'use strict';

  // --- DOM Cache ---
  const TermsDOM = {
    themeToggle: document.getElementById('themeToggleBtn'),
    mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
    desktopNavLinks: document.querySelectorAll('.desktop-nav .nav-link'),
    searchInputs: document.querySelectorAll('.js-search-input'),
    metaThemeColor: document.getElementById('themeColorMeta')
  };

  // --- HÀM ĐỒNG BỘ THEME (DÙNG CHUNG VỚI CORE.JS) ---
  function applyTheme(isDark) {
    // Áp dụng class lên body
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Cập nhật meta theme-color
    if (TermsDOM.metaThemeColor) {
      TermsDOM.metaThemeColor.setAttribute('content', isDark ? '#0b1120' : '#f8fafc');
    }
    // Cập nhật icon trên nút toggle
    if (TermsDOM.themeToggle) {
      const icon = TermsDOM.themeToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-moon', 'fa-sun');
        icon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
      }
    }
  }

  // --- KHỞI TẠO THEME (ƯU TIÊN DÙNG CORE.JS NẾU CÓ) ---
  function initTheme() {
    // Thử gọi hàm initTheme từ core.js (nếu tồn tại)
    if (window.core && typeof window.core.initTheme === 'function') {
      window.core.initTheme();
      // Sau khi core khởi tạo, đồng bộ lại giao diện cho trang terms
      const isDark = document.body.classList.contains('dark-mode');
      applyTheme(isDark);
      return;
    }

    // Nếu không có core.js, tự xử lý dựa trên localStorage
    const savedTheme = localStorage.getItem('filmxem-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    applyTheme(isDark);
    localStorage.setItem('filmxem-theme', isDark ? 'dark' : 'light');
  }

  // --- TOGGLE THEME (GỌI HÀM TỪ CORE NẾU CÓ, KHÔNG THÌ TỰ XỬ LÝ) ---
  function toggleTheme() {
    if (window.core && typeof window.core.toggleTheme === 'function') {
      window.core.toggleTheme();
      // Cập nhật lại trạng thái sau khi core thực hiện
      setTimeout(() => {
        const isDark = document.body.classList.contains('dark-mode');
        applyTheme(isDark);
      }, 10);
    } else {
      const isDark = !document.body.classList.contains('dark-mode');
      applyTheme(isDark);
      localStorage.setItem('filmxem-theme', isDark ? 'dark' : 'light');
    }
  }

  // --- LẮNG NGHE THAY ĐỔI THEME TỪ TAB KHÁC (QUAN TRỌNG ĐỂ ĐỒNG BỘ) ---
  function listenToStorageChanges() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'filmxem-theme') {
        const isDark = e.newValue === 'dark';
        applyTheme(isDark);
      }
    });
  }

  // --- THIẾT LẬP NÚT TOGGLE ---
  function setupThemeToggle() {
    if (!TermsDOM.themeToggle) return;
    TermsDOM.themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }

  // --- MOBILE NAVIGATION (GIỮ NGUYÊN) ---
  function setupMobileNavigation() {
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
    initTheme();       
    setupThemeToggle();      
    setupMobileNavigation();
    updateNavActiveState();  
    hideSearchInputs();  
    listenToStorageChanges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();