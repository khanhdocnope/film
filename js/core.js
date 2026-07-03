// Run immediately as script loads to prevent layout/animation flash
(function() {
  let mode = localStorage.getItem("filmXem_perfMode");
  if (!mode) {
    mode = window.innerWidth <= 768 ? "lite-mode" : "high-effects";
  }
  if (mode === "lite-mode") {
    document.documentElement.classList.add("performance-lite");
  }
})();

// ==========================================
// CORE SHARED UTILITIES
// ==========================================

// Bookmarks management
let bookmarkedMovies = JSON.parse(localStorage.getItem("filmXem_bookmarks")) || [];

function isBookmarked(movieId) {
  return bookmarkedMovies.includes(movieId);
}

function toggleBookmark(movieId, callback = null) {
  const index = bookmarkedMovies.indexOf(movieId);
  let status = false;
  if (index === -1) {
    bookmarkedMovies.push(movieId);
    status = true;
  } else {
    bookmarkedMovies.splice(index, 1);
  }

  localStorage.setItem("filmXem_bookmarks", JSON.stringify(bookmarkedMovies));

  if (callback) {
    callback(status);
  }

  showToast(status ? "Đã thêm phim vào thư viện!" : "Đã xóa phim khỏi thư viện.");

  // Custom event so other files can listen if needed
  window.dispatchEvent(new CustomEvent("bookmarkChanged", { detail: { movieId, isBookmarked: status } }));
}

// Progress Tracking management
function getMovieProgress(movieId) {
  try {
    const allProgress = JSON.parse(localStorage.getItem("filmXem_progress")) || {};
    return allProgress[movieId] || null;
  } catch (e) {
    console.error("Lỗi đọc tiến trình xem:", e);
    return null;
  }
}

function saveMovieProgress(movieId, episodeIndex, time = 0, duration = 0) {
  try {
    const allProgress = JSON.parse(localStorage.getItem("filmXem_progress")) || {};
    
    // Khởi tạo hoặc lấy tiến trình cũ của bộ phim
    const movieProgress = allProgress[movieId] || {
      lastWatchedEpisodeIndex: episodeIndex,
      episodes: {}
    };
    
    // Cập nhật tập phim xem gần nhất
    movieProgress.lastWatchedEpisodeIndex = episodeIndex;
    
    // Cập nhật thời gian của tập phim cụ thể đó
    movieProgress.episodes[episodeIndex] = {
      time: time,
      duration: duration
    };
    movieProgress.updatedAt = Date.now();
    
    allProgress[movieId] = movieProgress;

    // Chuyển thành mảng, sắp xếp theo thời gian cập nhật mới nhất giảm dần
    const entries = Object.entries(allProgress);
    entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt);

    // Chỉ giữ lại tối đa 4 bộ phim có tiến trình gần nhất
    const limitedProgress = {};
    entries.slice(0, 4).forEach(([key, val]) => {
      limitedProgress[key] = val;
    });

    localStorage.setItem("filmXem_progress", JSON.stringify(limitedProgress));
  } catch (e) {
    console.error("Lỗi lưu tiến trình xem:", e);
  }
}

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem("filmXem_theme");
  const isDark = savedTheme ? savedTheme === "dark" : true; // Default to dark mode

  if (isDark) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  updateThemeToggleIcon(isDark);
  updateThemeColorMeta(isDark);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("filmXem_theme", isDark ? "dark" : "light");
  updateThemeToggleIcon(isDark);
  updateThemeColorMeta(isDark);
}

function updateThemeToggleIcon(isDark) {
  const toggleBtn = document.getElementById("themeToggleBtn");
  if (toggleBtn) {
    toggleBtn.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }
}

function updateThemeColorMeta(isDark) {
  const meta = document.getElementById("themeColorMeta");
  if (meta) {
    meta.setAttribute("content", isDark ? "#07090e" : "#f8fafc");
  }
}

// Performance mode toggle (High Effects vs Lite Mode)
function initPerformanceMode() {
  let mode = localStorage.getItem("filmXem_perfMode");
  if (!mode) {
    // Khách truy cập lần đầu tiên
    const defaultMode = window.innerWidth <= 768 ? "lite-mode" : "high-effects";
    // Tạm thời áp dụng chế độ mặc định trước, nhưng chưa lưu vào localStorage để tránh mất popup nếu tải lại trang
    applyPerformanceMode(defaultMode, false);
    injectPerformanceToggleButton();
    
    // Hiển thị hộp thoại giới thiệu và lựa chọn
    showPerformanceOnboardingPopup(defaultMode);
  } else {
    applyPerformanceMode(mode, true);
    injectPerformanceToggleButton();
  }
}

function showPerformanceOnboardingPopup(defaultMode) {
  // Thêm style cho popup nếu chưa có
  if (!document.getElementById("perfPopupStyles")) {
    const style = document.createElement("style");
    style.id = "perfPopupStyles";
    style.innerHTML = `
      .perf-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(7, 5, 15, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .perf-popup-overlay.active {
        opacity: 1;
      }
      .perf-popup-card {
        background: #110e24;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 30px;
        max-width: 460px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        transform: translateY(20px) scale(0.95);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .perf-popup-overlay.active .perf-popup-card {
        transform: translateY(0) scale(1);
      }
      .perf-popup-title {
        font-size: 20px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .perf-popup-title i {
        color: var(--accent, #FFB000);
      }
      .perf-popup-text {
        font-size: 14px;
        line-height: 1.6;
        color: #9F9BB7;
        margin-bottom: 24px;
      }
      .perf-popup-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .perf-popup-btn {
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      .perf-popup-btn-lite {
        background: var(--accent, #FFB000);
        color: #07050F;
      }
      .perf-popup-btn-lite:hover {
        background: #ffc43d;
        transform: translateY(-2px);
      }
      .perf-popup-btn-full {
        background: rgba(255, 255, 255, 0.06);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .perf-popup-btn-full:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      .performance-lite .perf-popup-overlay,
      .performance-lite .perf-popup-card {
        transition: none !important;
        transform: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.className = "perf-popup-overlay";
  overlay.id = "perfOnboardingPopup";

  const recommendText = defaultMode === "lite-mode" ? " (Khuyên dùng cho thiết bị của bạn)" : "";

  overlay.innerHTML = `
    <div class="perf-popup-card">
      <div class="perf-popup-title">
        <i class="fa-solid fa-bolt"></i> Tối ưu hóa trải nghiệm
      </div>
      <p class="perf-popup-text">
        Chào mừng bạn đến với FilmXem! Chúng tôi hỗ trợ chế độ <strong>Tối ưu hiệu năng (Lite Mode)</strong> giúp tắt các chuyển động phức tạp, bộ lọc mờ nặng và tất nhiên bạn có thể thay đổi sau này.
      </p>
      <div class="perf-popup-buttons">
        <button class="perf-popup-btn perf-popup-btn-lite" id="perfPopupBtnLite">
          Bật Tối ưu hiệu năng
        </button>
        <button class="perf-popup-btn perf-popup-btn-full" id="perfPopupBtnFull">
          Trải nghiệm đầy đủ hiệu ứng
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add("active");
  }, 100);

  const btnLite = overlay.querySelector("#perfPopupBtnLite");
  const btnFull = overlay.querySelector("#perfPopupBtnFull");

  const closePopup = (selectedMode) => {
    applyPerformanceMode(selectedMode, true); // Lưu vào localStorage sau khi click chọn thực tế
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
    }, 300);
  };

  btnLite.addEventListener("click", () => closePopup("lite-mode"));
  btnFull.addEventListener("click", () => closePopup("high-effects"));
}

function applyPerformanceMode(mode, saveToStorage = true) {
  const plyrCss = document.querySelector('link[href*="plyr.css"]');
  if (mode === "lite-mode") {
    document.documentElement.classList.add("performance-lite");
    document.body.classList.add("performance-lite");
    if (plyrCss) plyrCss.disabled = true;
  } else {
    document.documentElement.classList.remove("performance-lite");
    document.body.classList.remove("performance-lite");
    if (plyrCss) plyrCss.disabled = false;
  }
  if (saveToStorage) {
    localStorage.setItem("filmXem_perfMode", mode);
  }
  updatePerformanceToggleIcon(mode === "lite-mode");
  window.dispatchEvent(new CustomEvent("performanceModeChanged", { detail: { mode } }));
}

function togglePerformanceMode() {
  const isLite = document.body.classList.contains("performance-lite");
  const newMode = isLite ? "high-effects" : "lite-mode";
  applyPerformanceMode(newMode);
  showToast(newMode === "lite-mode" ? "Đã bật chế độ Tối ưu Hiệu năng" : "Đã bật chế độ Đầy đủ Hiệu ứng");
}

function updatePerformanceToggleIcon(isLite) {
  const toggleBtn = document.getElementById("performanceToggleBtn");
  if (toggleBtn) {
    toggleBtn.innerHTML = isLite
      ? '<i class="fa-solid fa-bolt" style="color: var(--accent);"></i>'
      : '<i class="fa-solid fa-wand-magic-sparkles"></i>';
    toggleBtn.title = isLite
      ? "Chế độ Hiệu năng (Bật để dùng đầy đủ hiệu ứng)"
      : "Chế độ Đầy đủ hiệu ứng (Bật để tối ưu hiệu năng)";
  }
}

function injectPerformanceToggleButton() {
  const headerActions = document.getElementById("headerActions") || document.querySelector(".header-actions");
  if (headerActions && !document.getElementById("performanceToggleBtn")) {
    const btn = document.createElement("button");
    btn.className = "theme-toggle-btn";
    btn.id = "performanceToggleBtn";
    btn.ariaLabel = "Bật/Tắt hiệu ứng chuyển động";
    
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      headerActions.insertBefore(btn, themeBtn);
    } else {
      headerActions.appendChild(btn);
    }

    btn.addEventListener("click", togglePerformanceMode);
    const isLite = document.body.classList.contains("performance-lite");
    updatePerformanceToggleIcon(isLite);
  }
}

// Toast Notification
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background-color: rgba(15, 23, 42, 0.9);
      color: #fff;
      padding: 12px 24px;
      border-radius: 9999px;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 10000;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
      opacity: 0;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981"></i> ${message}`;

  // Animation Show
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(0)";
    toast.style.opacity = "1";
  }, 10);

  // Animation Hide after 2.5s
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(100px)";
    toast.style.opacity = "0";
  }, 2500);
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initPerformanceMode();

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // Tự động thêm nút tìm kiếm trên di động vào headerActions
  const headerActions = document.getElementById("headerActions");
  if (headerActions && !document.getElementById("mobileSearchTriggerBtn")) {
    const searchBtn = document.createElement("button");
    searchBtn.className = "theme-toggle-btn";
    searchBtn.id = "mobileSearchTriggerBtn";
    searchBtn.setAttribute("aria-label", "Mở tìm kiếm");
    searchBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    
    if (themeToggleBtn) {
      headerActions.insertBefore(searchBtn, themeToggleBtn);
    } else {
      headerActions.appendChild(searchBtn);
    }
  }

  // Mobile search opening click listener
  const btnTabSearch = document.getElementById("btnTabSearch");
  const mobileSearchOverlay = document.getElementById("mobileSearchOverlay");
  const mobileSearchInput = document.getElementById("mobileSearchInput");
  const closeMobileSearch = document.getElementById("closeMobileSearch");
  const mobileSearchTriggerBtn = document.getElementById("mobileSearchTriggerBtn");

  const openMobileSearchFunc = () => {
    if (mobileSearchOverlay) {
      mobileSearchOverlay.classList.add("active");
      if (mobileSearchInput) {
        setTimeout(() => mobileSearchInput.focus(), 100);
      }
    }
  };

  if (btnTabSearch && mobileSearchOverlay) {
    btnTabSearch.addEventListener("click", openMobileSearchFunc);
  }
  if (mobileSearchTriggerBtn && mobileSearchOverlay) {
    mobileSearchTriggerBtn.addEventListener("click", openMobileSearchFunc);
  }

  if (closeMobileSearch && mobileSearchOverlay) {
    closeMobileSearch.addEventListener("click", () => {
      mobileSearchOverlay.classList.remove("active");
    });
  }

  // Sticky Header Scroll effect
  const header = document.getElementById("mainHeader");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 30) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }

  // Search redirection logic if not on homepage
  const _p = window.location.pathname;
  const isHomepage = _p.endsWith("") ||
    _p.endsWith("/") ||
    (_p !== "/" && !_p.includes("detail") && !_p.includes("watch"));

  const searchInputsForNav = document.querySelectorAll(".js-search-input");
  searchInputsForNav.forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && input.value.trim() !== "") {
        window.location.href = "search?q=" + encodeURIComponent(input.value.trim());
      }
    });
  });

  // Khởi tạo CSS cho gợi ý tìm kiếm gợi ý (Autocomplete Suggestions) và nút Xóa nhanh
  const style = document.createElement("style");
  style.textContent = `
    .search-suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background: var(--bg-secondary);
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 99999;
      max-height: 350px;
      overflow-y: auto;
      margin-top: 6px;
      display: none;
      padding: 6px 0;
    }
    .search-suggestions-dropdown.active {
      display: block;
    }
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      text-decoration: none;
      color: inherit;
    }
    .suggestion-item:hover {
      background-color: var(--accent-light);
    }
    .suggestion-poster {
      width: 44px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }
    .suggestion-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .suggestion-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .suggestion-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .suggestion-empty {
      padding: 16px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .btn-clear-search {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0;
      font-size: 0.9rem;
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      outline: none;
      margin-left: 6px;
      margin-right: 2px;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    .btn-clear-search:hover {
      color: var(--accent);
      background-color: var(--border-color);
    }
  `;
  document.head.appendChild(style);

  // Tạo và thiết lập gợi ý + nút xóa nhanh cho tất cả các ô tìm kiếm
  const allSearchInputs = document.querySelectorAll(".js-search-input");
  allSearchInputs.forEach(input => {
    const parentBox = input.closest('.search-box') || input.closest('.mobile-search-box');
    if (!parentBox) return;

    parentBox.style.position = 'relative';

    // Tạo dropdown nếu chưa có
    let dropdown = parentBox.querySelector('.search-suggestions-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'search-suggestions-dropdown';
      parentBox.appendChild(dropdown);
    }

    // Tạo nút xóa nhanh (Clear Button) nếu chưa có
    let clearBtn = parentBox.querySelector('.btn-clear-search');
    if (!clearBtn) {
      clearBtn = document.createElement('button');
      clearBtn.className = 'btn-clear-search';
      clearBtn.type = 'button';
      clearBtn.setAttribute('aria-label', 'Xóa tìm kiếm');
      clearBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      // Chèn ngay sau ô input
      input.parentNode.insertBefore(clearBtn, input.nextSibling);
    }

    // Hàm hiển thị/ẩn nút xóa nhanh
    const toggleClearBtn = () => {
      if (input.value.trim() !== '') {
        clearBtn.style.display = 'flex';
      } else {
        clearBtn.style.display = 'none';
      }
    };

    // Khởi tạo trạng thái nút xóa nhanh lúc tải trang
    toggleClearBtn();

    input.addEventListener('input', (e) => {
      toggleClearBtn();
      const val = e.target.value.trim().toLowerCase();
      if (!val) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      const matches = typeof MOVIE_DATABASE !== 'undefined' ? MOVIE_DATABASE.filter(movie => 
        (movie.title && movie.title.toLowerCase().includes(val)) ||
        (movie.originalTitle && movie.originalTitle.toLowerCase().includes(val))
      ).slice(0, 6) : [];

      if (matches.length === 0) {
        dropdown.innerHTML = '<div class="suggestion-empty">Không tìm thấy phim phù hợp</div>';
      } else {
        dropdown.innerHTML = matches.map(movie => {
          let subtitleText = "Full VietSub";
          if (movie.episodes && movie.episodes.length > 1) {
            subtitleText = `Tập ${movie.episodes.length} VietSub`;
          } else if (movie.duration && movie.duration.includes("tập")) {
            subtitleText = `Full ${movie.duration.split(" ")[0]} VietSub`;
          }
          
          return `
            <a href="detail?id=${movie.id}" class="suggestion-item">
              <img class="suggestion-poster" src="${movie.poster}" alt="${movie.title}">
              <div class="suggestion-info">
                <div class="suggestion-title">${movie.title}</div>
                <div class="suggestion-subtitle">${subtitleText}</div>
              </div>
            </a>
          `;
        }).join('');
      }
      dropdown.classList.add('active');
    });

    // Bắt sự kiện click nút xóa
    clearBtn.addEventListener('click', () => {
      input.value = '';
      toggleClearBtn();
      dropdown.classList.remove('active');
      dropdown.innerHTML = '';
      input.focus();
      // Phát sự kiện input để cập nhật các thành phần liên quan nếu có
      input.dispatchEvent(new Event('input'));
    });

    // Ẩn dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
      if (!parentBox.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    // Ẩn dropdown khi nhấn Escape
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('active');
      }
    });
  });

  // Kiểm tra và thông báo tập phim mới cho các phim được theo dõi
  setTimeout(checkForNewEpisodes, 1500); // delay 1.5s để trang tải mượt mà
});

// Kiểm tra và hiển thị thông báo tập phim mới của các phim đang theo dõi
function checkForNewEpisodes() {
  // Đảm bảo trình duyệt hỗ trợ Notification và đã được cấp quyền
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const followed = JSON.parse(localStorage.getItem("followed_movies") || "{}");
  if (Object.keys(followed).length === 0) return;

  // Đảm bảo MOVIE_DATABASE đã được tải
  if (typeof MOVIE_DATABASE === 'undefined') return;

  let hasUpdates = false;
  let updatedMovies = [];

  for (const movieId in followed) {
    const followedMovie = followed[movieId];
    const databaseMovie = MOVIE_DATABASE.find(m => m.id === movieId);
    if (!databaseMovie) continue;

    const currentCount = databaseMovie.episodes ? databaseMovie.episodes.length : 0;
    const lastKnownCount = followedMovie.episodeCount || 0;

    if (currentCount > lastKnownCount) {
      hasUpdates = true;
      updatedMovies.push(databaseMovie.title);

      // Cập nhật lại số tập đã biết để không hiển thị thông báo trùng lặp lần sau
      followed[movieId].episodeCount = currentCount;
    }
  }

  if (hasUpdates) {
    localStorage.setItem("followed_movies", JSON.stringify(followed));
    
    // Gửi thông báo hệ thống (Native notification)
    const title = "FilmXem - Cập nhật tập phim mới! 🎉";
    const body = updatedMovies.length === 1 
      ? `Phim "${updatedMovies[0]}" đã cập nhật tập mới! Vào xem ngay nào.`
      : `Có ${updatedMovies.length} bộ phim bạn theo dõi đã có tập mới! Vào xem ngay nào.`;
    
    new Notification(title, {
      body: body,
      icon: "https://i.ibb.co/qMSpTGq1/gugugaga.png"
    });
  }
}

// Đăng ký Service Worker cho PWA (Bộ nhớ đệm thông minh)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => {
        console.log('PWA Service Worker đã đăng ký thành công:', reg.scope);
        // Kiểm tra cập nhật Service Worker ngay lập tức khi tải trang
        reg.update();
      })
      .catch((err) => {
        console.error('Đăng ký Service Worker thất bại:', err);
      });
  });

  // Tự động tải lại trang khi Service Worker mới được kích hoạt và kiểm soát trang
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
