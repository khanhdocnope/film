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

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem("filmXem_theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

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

  if (!isHomepage) {
    const searchInputs = document.querySelectorAll(".js-search-input");
    searchInputs.forEach(input => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && input.value.trim() !== " index.html " ) {
          window.location.href = `./?search=${encodeURIComponent(input.value.trim())}`;
        }
      });
    });
  }
});
