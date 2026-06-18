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

// Page Transition Loader
function initPageTransition() {
  const loader = document.createElement("div");
  loader.className = "page-loader";
  loader.innerHTML = `
    <div class="loader-spinner"></div>
    <div class="loader-logo">FilmXem</div>
  `;
  document.body.appendChild(loader);

  // Fade out loader on load
  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("fade-out");
    }, 250);
  });

  // Fallback: fade out after 2s anyway if load event is missed
  setTimeout(() => {
    loader.classList.add("fade-out");
  }, 2000);

  // Intercept link clicks for transition out
  document.addEventListener("click", (e) => {
    const anchor = e.target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || anchor.getAttribute("target") === "_blank" || e.metaKey || e.ctrlKey) {
      return;
    }

    // Skip custom actions / tabs
    if (anchor.classList.contains("btn-quick-action") || anchor.closest(".js-hero-bookmark") || anchor.classList.contains("btn-autoplay")) {
      return;
    }

    const isLocal = href.indexOf(":") === -1 || href.startsWith(window.location.origin);
    if (isLocal) {
      e.preventDefault();
      loader.classList.remove("fade-out");
      setTimeout(() => {
        window.location.href = href;
      }, 400);
    }
  });
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initPageTransition();
  initTheme();

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
});

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
