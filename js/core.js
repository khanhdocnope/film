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

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // Mobile search opening click listener
  const btnTabSearch = document.getElementById("btnTabSearch");
  const mobileSearchOverlay = document.getElementById("mobileSearchOverlay");
  const mobileSearchInput = document.getElementById("mobileSearchInput");
  const closeMobileSearch = document.getElementById("closeMobileSearch");

  if (btnTabSearch && mobileSearchOverlay) {
    btnTabSearch.addEventListener("click", () => {
      mobileSearchOverlay.classList.add("active");
      if (mobileSearchInput) {
        setTimeout(() => mobileSearchInput.focus(), 100);
      }
    });
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
        window.location.href = "search.html?q=" + encodeURIComponent(input.value.trim());
      }
    });
  });

  // Khởi tạo CSS cho gợi ý tìm kiếm gợi ý (Autocomplete Suggestions)
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
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      z-index: 99999;
      max-height: 320px;
      overflow-y: auto;
      margin-top: 6px;
      display: none;
    }
    .search-suggestions-dropdown.active {
      display: block;
    }
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid var(--border-color);
      text-decoration: none;
      color: inherit;
    }
    .suggestion-item:last-child {
      border-bottom: none;
    }
    .suggestion-item:hover {
      background-color: var(--accent-light);
    }
    .suggestion-poster {
      width: 38px;
      height: 52px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }
    .suggestion-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .suggestion-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .suggestion-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .suggestion-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 2px;
      font-size: 0.7rem;
    }
    .suggestion-rating {
      color: var(--accent);
      font-weight: bold;
    }
    .suggestion-year {
      color: var(--text-muted);
    }
    .suggestion-empty {
      padding: 16px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
  `;
  document.head.appendChild(style);

  // Tạo và thiết lập dropdown gợi ý cho tất cả các ô tìm kiếm
  const allSearchInputs = document.querySelectorAll(".js-search-input");
  allSearchInputs.forEach(input => {
    const parentBox = input.closest('.search-box') || input.closest('.mobile-search-box');
    if (!parentBox) return;

    parentBox.style.position = 'relative';

    let dropdown = parentBox.querySelector('.search-suggestions-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'search-suggestions-dropdown';
      parentBox.appendChild(dropdown);
    }

    input.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      if (!val) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      const matches = typeof MOVIE_DATABASE !== 'undefined' ? MOVIE_DATABASE.filter(movie => 
        (movie.title && movie.title.toLowerCase().includes(val)) ||
        (movie.originalTitle && movie.originalTitle.toLowerCase().includes(val))
      ).slice(0, 5) : [];

      if (matches.length === 0) {
        dropdown.innerHTML = '<div class="suggestion-empty">Không tìm thấy phim phù hợp</div>';
      } else {
        dropdown.innerHTML = matches.map(movie => {
          return `
            <a href="detail.html?id=${movie.id}" class="suggestion-item">
              <img class="suggestion-poster" src="${movie.poster}" alt="${movie.title}">
              <div class="suggestion-info">
                <div class="suggestion-title">${movie.title}</div>
                <div class="suggestion-subtitle">${movie.originalTitle}</div>
                <div class="suggestion-meta">
                  <span class="suggestion-rating"><i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}</span>
                  <span class="suggestion-year">${movie.year}</span>
                </div>
              </div>
            </a>
          `;
        }).join('');
      }
      dropdown.classList.add('active');
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
      })
      .catch((err) => {
        console.error('Đăng ký Service Worker thất bại:', err);
      });
  });
}
