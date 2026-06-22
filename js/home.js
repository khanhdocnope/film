// ==========================================
// HOMEPAGE CONTROLLER (FULLY FIXED)
// ==========================================
let currentGenre = "Tất cả";
let searchQuery = "";
let currentView = "home"; // "home" or "saved"

// Pagination variables
let currentPage = 1;
let lastColumns = 4;

// Carousel variables
let autoSlideInterval = null;
let currentSlide = 0;

const HomeDOM = {
  moviesGrid: document.getElementById("moviesGrid"),
  genresScroll: document.getElementById("genresScroll"),
  heroBanner: document.getElementById("heroBanner"),
  sectionTitle: document.getElementById("sectionTitle"),
  searchInputs: document.querySelectorAll(".js-search-input"),
  mobileSearchOverlay: document.getElementById("mobileSearchOverlay"),
  closeMobileSearch: document.getElementById("closeMobileSearch"),
  mobileNavItems: document.querySelectorAll(".mobile-nav-item"),
  desktopNavLinks: document.querySelectorAll(".nav-link"),
  paginationContainer: document.getElementById("paginationContainer")
};

// ========== CAROUSEL CHO NHIỀU PHIM NỔI BẬT ==========
function renderFeaturedMovies() {
  if (!HomeDOM.heroBanner) return;

  // Lấy danh sách phim nổi bật (isFeatured === true)
  let featuredMovies = MOVIE_DATABASE.filter(movie => movie.isFeatured === true);
  if (featuredMovies.length === 0) {
    // Nếu không có phim nào đánh dấu nổi bật, lấy 5 phim đầu
    featuredMovies = MOVIE_DATABASE.slice(0, 5);
  }
  if (featuredMovies.length === 0) return;

  // Tạo cấu trúc carousel
  HomeDOM.heroBanner.innerHTML = `
    <div class="carousel-container">
      <div class="carousel-slides" id="carouselSlides">
        ${featuredMovies.map((movie, idx) => `
          <div class="carousel-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
            <div class="carousel-slide-bg" style="background-image: url('${movie.banner}');"></div>
            <div class="hero-overlay">
              <div class="hero-content">
                <div class="hero-badge">
                  <i class="fa-solid fa-fire"></i> Nổi bật hôm nay
                </div>
                <h1 class="hero-title">${escapeHtml(movie.title)}</h1>
                <div class="hero-meta">
                  <span class="meta-item rating">
                    <i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}
                  </span>
                  <span class="meta-item">
                    <i class="fa-solid fa-calendar"></i> ${movie.year}
                  </span>
                  <span class="meta-item">
                    <i class="fa-solid fa-clock"></i> ${movie.duration}
                  </span>
                </div>
                <p class="hero-desc">${escapeHtml(movie.description)}</p>
                <div class="hero-actions">
                  <a href="detail?id=${movie.id}" class="btn btn-primary">
                    <i class="fa-solid fa-play"></i> Xem ngay
                  </a>
                  <button class="btn btn-secondary js-hero-bookmark" data-id="${movie.id}">
                    <i class="${isBookmarked(movie.id) ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> 
                    ${isBookmarked(movie.id) ? 'Đã lưu' : 'Lưu phim'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="carousel-btn prev"><i class="fa-solid fa-chevron-left"></i></button>
      <button class="carousel-btn next"><i class="fa-solid fa-chevron-right"></i></button>
      <div class="carousel-dots">
        ${featuredMovies.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`).join('')}
      </div>
    </div>
  `;

  // Gắn sự kiện cho carousel
  const slidesContainer = document.getElementById('carouselSlides');
  const prevBtn = HomeDOM.heroBanner.querySelector('.prev');
  const nextBtn = HomeDOM.heroBanner.querySelector('.next');
  const dots = HomeDOM.heroBanner.querySelectorAll('.dot');
  const totalSlides = featuredMovies.length;
  if (!slidesContainer) return;

  function updateCarousel(index) {
    currentSlide = (index + totalSlides) % totalSlides;
    slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
    
    // Cập nhật class active cho slides để trigger animation
    const slides = slidesContainer.querySelectorAll('.carousel-slide');
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });
  }

  function nextSlide() { updateCarousel(currentSlide + 1); }
  function prevSlide() { updateCarousel(currentSlide - 1); }

  if (prevBtn) prevBtn.addEventListener('click', () => { resetAutoSlide(); nextSlide(); startAutoSlide(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { resetAutoSlide(); prevSlide(); startAutoSlide(); });
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      resetAutoSlide();
      const idx = parseInt(e.target.getAttribute('data-index'));
      updateCarousel(idx);
      startAutoSlide();
    });
  });

  // Xử lý bookmark cho tất cả nút trong carousel
  HomeDOM.heroBanner.querySelectorAll('.js-hero-bookmark').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      toggleBookmark(id, (status) => {
        btn.innerHTML = `<i class="${status ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${status ? 'Đã lưu' : 'Lưu phim'}`;
      });
    });
  });

  // Auto slide
  function startAutoSlide() {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => {
      nextSlide();
    }, 5000);
  }
  function resetAutoSlide() {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
  }
  startAutoSlide();

  // Dừng auto khi hover vào banner
  HomeDOM.heroBanner.addEventListener('mouseenter', resetAutoSlide);
  HomeDOM.heroBanner.addEventListener('mouseleave', startAutoSlide);
}

// Helper tránh XSS
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ========== RENDER GENRES ==========
function renderGenres() {
  if (!HomeDOM.genresScroll) return;

  HomeDOM.genresScroll.innerHTML = GENRES.map(genre => {
    const isActive = genre === currentGenre;
    return `
      <button class="genre-badge ${isActive ? 'active' : ''}" data-genre="${genre}">
        ${genre}
      </button>
    `;
  }).join("");

  // Bind click listeners
  HomeDOM.genresScroll.querySelectorAll(".genre-badge").forEach(badge => {
    badge.addEventListener("click", () => {
      currentGenre = badge.getAttribute("data-genre");
      searchQuery = "";
      HomeDOM.searchInputs.forEach(i => i.value = "");
      currentPage = 1;

      updateNavStates();
      renderGenres();
      filterAndRenderMovies();
    });
  });

  // Kích hoạt scroll ngang nếu cần (cho mobile)
  checkAndEnableGenresScroll();
}

// ========== HELPER: TẠO HTML CHO CARD PHIM ==========
function createMovieCardHTML(movie, type = "normal", index = 0) {
  const mainGenre = movie.genres[0] || "";
  const progress = getMovieProgress(movie.id);
  let progressBadgeHTML = "";
  let progressBarHTML = "";

  const totalEpisodes = movie.episodes && movie.episodes.length > 0 ? movie.episodes.length : 0;
  let latestEpisodeBadgeHTML = "";
  if (totalEpisodes > 0) {
    latestEpisodeBadgeHTML = `
      <span class="card-badge badge-latest-episode" style="top: 26px !important; left: 0 !important; background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 800; border: 1px solid rgba(255,255,255,0.1);">
        Tập ${totalEpisodes}
      </span>
    `;
  }

  if (progress) {
    const lastEpIdx = progress.lastWatchedEpisodeIndex !== undefined ? progress.lastWatchedEpisodeIndex : 0;
    const epText = `Tập ${lastEpIdx + 1}`;
    const topOffset = totalEpisodes > 0 ? "52px" : "26px";
    progressBadgeHTML = `
      <span class="card-badge badge-progress" style="top: ${topOffset} !important; left: 0 !important; background: var(--accent); color: white; font-weight: 700;">
        <i class="fa-solid fa-clock"></i> ${epText}
      </span>
    `;
    const epProgress = progress.episodes ? progress.episodes[lastEpIdx] : null;
    if (epProgress && epProgress.time > 0 && epProgress.duration > 0) {
      const percent = Math.min(100, Math.max(0, (epProgress.time / epProgress.duration) * 100));
      progressBarHTML = `
        <div class="card-progress-bar-container" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: rgba(255, 255, 255, 0.2); z-index: 5; border-radius: 0 0 var(--radius-sm) var(--radius-sm); overflow: hidden;">
          <div class="card-progress-bar" style="width: ${percent}%; height: 100%; background: var(--accent);"></div>
        </div>
      `;
    }
  }

  // Nút hành động nhanh ở góc poster (chỉ dành cho trang thư viện)
  let actionBtnHTML = "";
  if (type === "watching") {
    actionBtnHTML = `
      <button class="btn-quick-action btn-clear-progress" data-id="${movie.id}" title="Xóa tiến trình xem">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
  } else if (type === "saved") {
    actionBtnHTML = `
      <button class="btn-quick-action btn-remove-bookmark" data-id="${movie.id}" title="Bỏ lưu khỏi thư viện">
        <i class="fa-solid fa-bookmark"></i>
      </button>
    `;
  }

  return `
    <a href="detail?id=${movie.id}" class="movie-card" style="animation-delay: ${index * 0.05}s;">
      <div class="card-poster-wrapper">
        <img class="card-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
        <div class="card-badges">
          <span class="card-badge badge-quality">HD</span>
          <span class="card-badge badge-rating"><i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}</span>
          <span class="card-badge badge-year">${movie.year}</span>
          ${latestEpisodeBadgeHTML}
          ${progressBadgeHTML}
        </div>
        ${progressBarHTML}
        ${actionBtnHTML}
        <div class="card-hover-overlay"><div class="play-circle"><i class="fa-solid fa-play"></i></div></div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${movie.title}</h3>
        <p class="card-title-sub">${movie.originalTitle}</p>
        <div class="card-tags">
          <span class="card-tag">${mainGenre}</span>
          <span class="card-tag">${movie.duration}</span>
        </div>
      </div>
    </a>
  `;
}

// ========== RENDER THƯ VIỆN CÁ NHÂN (TIẾN TRÌNH & ĐÃ LƯU) ==========
function renderLibraryView() {
  HomeDOM.moviesGrid.className = "library-wrapper";
  HomeDOM.moviesGrid.style.cssText = "display: flex; flex-direction: column; gap: 40px; width: 100%;";

  // Lấy dữ liệu phim đang xem và phim đã lưu
  let watchingMovies = MOVIE_DATABASE.filter(m => getMovieProgress(m.id) !== null);
  let savedMovies = MOVIE_DATABASE.filter(m => isBookmarked(m.id));

  // Áp dụng bộ lọc thể loại & tìm kiếm nếu có
  if (currentGenre !== "Tất cả") {
    watchingMovies = watchingMovies.filter(m => m.genres.includes(currentGenre));
    savedMovies = savedMovies.filter(m => m.genres.includes(currentGenre));
  }
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase().trim();
    const filterFn = m =>
      m.title.toLowerCase().includes(query) ||
      m.originalTitle.toLowerCase().includes(query) ||
      m.genres.some(g => g.toLowerCase().includes(query));
    watchingMovies = watchingMovies.filter(filterFn);
    savedMovies = savedMovies.filter(filterFn);
  }

  // Cập nhật tiêu đề thư viện
  if (searchQuery.trim() !== "") {
    HomeDOM.sectionTitle.textContent = `Kết quả tìm kiếm trong thư viện: "${searchQuery}"`;
  } else if (currentGenre !== "Tất cả") {
    HomeDOM.sectionTitle.textContent = `Thư viện - Thể loại: ${currentGenre}`;
  } else {
    HomeDOM.sectionTitle.textContent = "Thư viện cá nhân của bạn";
  }

  const watchingGridHTML = watchingMovies.length > 0
    ? `<div class="movies-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 24px; width: 100%;">${watchingMovies.map((m, index) => createMovieCardHTML(m, "watching", index)).join("")}</div>`
    : `<p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 10px; margin-bottom: 20px;"><i class="fa-solid fa-circle-info"></i> Bạn chưa có phim nào đang xem dở.</p>`;

  const savedGridHTML = savedMovies.length > 0
    ? `<div class="movies-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 24px; width: 100%;">${savedMovies.map((m, index) => createMovieCardHTML(m, "saved", index)).join("")}</div>`
    : `<p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 10px; margin-bottom: 20px;"><i class="fa-solid fa-circle-info"></i> Thư viện phim đang trống.</p>`;

  HomeDOM.moviesGrid.innerHTML = `
    <div class="library-section" style="display: flex; flex-direction: column; width: 100%;">
      <h3 class="library-section-title">
        <i class="fa-solid fa-clock-rotate-left"></i> TIẾP TỤC XEM
      </h3>
      ${watchingGridHTML}
    </div>
    <div class="library-section" style="display: flex; flex-direction: column; width: 100%; margin-top: 20px;">
      <h3 class="library-section-title">
        <i class="fa-solid fa-bookmark"></i> PHIM ĐÃ LƯU
      </h3>
      ${savedGridHTML}
    </div>
  `;

  setupLibraryActionListeners();
}

// ========== THIẾT LẬP LẮNG NGHE SỰ KIỆN CHO THƯ VIỆN ==========
function setupLibraryActionListeners() {
  HomeDOM.moviesGrid.querySelectorAll(".btn-clear-progress").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      try {
        const allProgress = JSON.parse(localStorage.getItem("filmXem_progress")) || {};
        if (allProgress[id]) {
          delete allProgress[id];
          localStorage.setItem("filmXem_progress", JSON.stringify(allProgress));
          showToast("Đã xóa tiến trình xem của phim.");
          filterAndRenderMovies();
        }
      } catch (err) {
        console.error(err);
      }
    });
  });

  HomeDOM.moviesGrid.querySelectorAll(".btn-remove-bookmark").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      toggleBookmark(id, () => {
        showToast("Đã bỏ lưu khỏi thư viện.");
        filterAndRenderMovies();
      });
    });
  });
}

// ========== HELPER: LẤY SỐ CỘT CỦA GRID PHIM ==========
function getGridColumns() {
  const grid = HomeDOM.moviesGrid;
  if (!grid) return 4;

  const gridComputedStyle = window.getComputedStyle(grid);
  const gridTemplateColumns = gridComputedStyle.getPropertyValue("grid-template-columns");
  if (gridTemplateColumns && gridTemplateColumns !== "none") {
    const cols = gridTemplateColumns.trim().split(/\s+/).length;
    if (cols > 0) return cols;
  }

  // Fallback
  const width = grid.clientWidth;
  if (width > 0) {
    if (window.innerWidth <= 768) return 2;
    const cols = Math.floor((width + 24) / (160 + 24));
    return cols > 0 ? cols : 2;
  }
  
  return window.innerWidth <= 768 ? 2 : 4;
}

// ========== RENDER DANH SÁCH PHIM BÌNH THƯỜNG ==========
function renderNormalMovies() {
  HomeDOM.moviesGrid.className = "movies-grid";
  HomeDOM.moviesGrid.style.cssText = "";

  let movies = MOVIE_DATABASE;

  if (currentGenre !== "Tất cả") {
    movies = movies.filter(m => m.genres.includes(currentGenre));
  }

  HomeDOM.sectionTitle.textContent = currentGenre === "Tất cả" ? "Phim mới cập nhật" : `Thể loại: ${currentGenre}`;

  if (movies.length === 0) {
    HomeDOM.moviesGrid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-video-slash"></i>
        <p>Không tìm thấy bộ phim nào phù hợp.</p>
      </div>
    `;
    if (HomeDOM.paginationContainer) HomeDOM.paginationContainer.innerHTML = "";
    return;
  }

  const cols = getGridColumns();
  const moviesPerPage = cols * 4;

  const totalMovies = movies.length;
  const totalPages = Math.ceil(totalMovies / moviesPerPage);

  if (currentPage > totalPages) {
    currentPage = totalPages || 1;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const paginatedMovies = movies.slice(startIndex, endIndex);

  HomeDOM.moviesGrid.innerHTML = paginatedMovies.map((movie, index) => createMovieCardHTML(movie, "normal", index)).join("");
  
  renderPagination(totalMovies, moviesPerPage);
}

// ========== RENDER PAGINATION ==========
function renderPagination(totalMovies, moviesPerPage) {
  const container = HomeDOM.paginationContainer;
  if (!container) return;

  const totalPages = Math.ceil(totalMovies / moviesPerPage);

  if (currentView !== "home" || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const pageRange = getPageRange(currentPage, totalPages);

  container.innerHTML = `
    <div class="pagination-wrapper">
      <div class="pagination-pages">
        <button class="page-btn prev-page" ${currentPage === 1 ? 'disabled' : ''} aria-label="Trang trước">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        
        ${pageRange.map(page => {
          if (page === '...') {
            return `<span class="page-ellipsis">...</span>`;
          }
          return `
            <button class="page-btn page-num ${page === currentPage ? 'active' : ''}" data-page="${page}">
              ${page}
            </button>
          `;
        }).join('')}
        
        <button class="page-btn next-page" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Trang sau">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      
      <div class="pagination-input-row">
        <div class="page-go-to">
          <input type="number" class="page-input" placeholder="Trang..." min="1" max="${totalPages}" value="${currentPage}">
          <button class="page-submit-btn" aria-label="Đi tới trang"><i class="fa-solid fa-arrow-right"></i></button>
        </div>
        <div class="page-indicator">
          ${currentPage} / ${totalPages}
        </div>
      </div>
    </div>
  `;

  // Bind events
  const prevBtn = container.querySelector(".prev-page");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        filterAndRenderMovies();
        scrollToMoviesHeader();
      }
    });
  }

  const nextBtn = container.querySelector(".next-page");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        filterAndRenderMovies();
        scrollToMoviesHeader();
      }
    });
  }

  container.querySelectorAll(".page-num").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = parseInt(btn.getAttribute("data-page"));
      if (page !== currentPage) {
        currentPage = page;
        filterAndRenderMovies();
        scrollToMoviesHeader();
      }
    });
  });

  const pageInput = container.querySelector(".page-input");
  const submitBtn = container.querySelector(".page-submit-btn");

  const handleGoToPage = () => {
    const val = parseInt(pageInput.value);
    if (val >= 1 && val <= totalPages && val !== currentPage) {
      currentPage = val;
      filterAndRenderMovies();
      scrollToMoviesHeader();
    } else {
      pageInput.value = currentPage; // Reset if invalid
    }
  };

  if (submitBtn && pageInput) {
    submitBtn.addEventListener("click", handleGoToPage);
    pageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleGoToPage();
      }
    });
  }
}

function scrollToMoviesHeader() {
  const target = document.getElementById("moviesSection");
  if (target) {
    const offset = 80;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = target.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
}

function getPageRange(current, total) {
  const range = [];
  const delta = 2; // Show 2 pages before and after active page

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }
  return range;
}

// ========== FILTER & RENDER MOVIES ==========
function filterAndRenderMovies() {
  if (!HomeDOM.moviesGrid) return;
  if (currentView === "saved") {
    renderLibraryView();
    if (HomeDOM.paginationContainer) HomeDOM.paginationContainer.innerHTML = "";
  } else {
    renderNormalMovies();
  }
}

// ========== UPDATE NAVIGATION STATES ==========
function updateNavStates() {
  // Mobile nav
  HomeDOM.mobileNavItems.forEach(item => {
    const tab = item.getAttribute("data-tab");
    if (currentView === "saved" && tab === "saved") {
      item.classList.add("active");
    }
    else if (currentView === "home" && tab === "home" && currentGenre === "Tất cả" && searchQuery === "") {
      item.classList.add("active");
    }
    else if (currentView === "home" && currentGenre !== "Tất cả" && tab === "genres") {
      item.classList.add("active");
    }
    else {
      item.classList.remove("active");
    }
  });

  // Desktop nav
  HomeDOM.desktopNavLinks.forEach(link => {
    const view = link.getAttribute("data-view");
    if (view === currentView) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// ========== GENRES SCROLL (MOBILE) ==========
function checkAndEnableGenresScroll() {
  const genresScroll = HomeDOM.genresScroll;
  if (!genresScroll) return;
  genresScroll.classList.remove('scrollable');
  setTimeout(() => {
    const containerHeight = genresScroll.offsetHeight;
    const firstBadge = genresScroll.querySelector('.genre-badge');
    if (!firstBadge) return;
    const badgeHeight = firstBadge.offsetHeight;
    if (containerHeight > badgeHeight * 1.5) {
      genresScroll.classList.add('scrollable');
    }
  }, 50);
}

// ========== SETUP EVENT LISTENERS ==========
function setupHomeListeners() {
  // Search inputs
  HomeDOM.searchInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      HomeDOM.searchInputs.forEach(i => { if (i !== e.target) i.value = searchQuery; });
    });
  });

  // Mobile search close
  if (HomeDOM.closeMobileSearch) {
    HomeDOM.closeMobileSearch.addEventListener("click", () => {
      searchQuery = "";
      HomeDOM.searchInputs.forEach(input => input.value = "");
    });
  }

  // Desktop nav links
  HomeDOM.desktopNavLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.getAttribute("data-view");
      currentView = view;
      currentGenre = "Tất cả";
      searchQuery = "";
      currentPage = 1;
      HomeDOM.searchInputs.forEach(input => input.value = "");
      updateNavStates();
      renderGenres();
      filterAndRenderMovies();
      window.scrollTo({ top: HomeDOM.genresScroll.offsetTop - 100, behavior: "smooth" });
    });
  });

  // Mobile bottom nav
  HomeDOM.mobileNavItems.forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.getAttribute("data-tab");
      currentPage = 1;
      if (tab === "home") {
        currentView = "home";
        currentGenre = "Tất cả";
        searchQuery = "";
        HomeDOM.searchInputs.forEach(i => i.value = "");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (tab === "genres") {
        currentView = "home";
        window.scrollTo({ top: HomeDOM.genresScroll.offsetTop - 80, behavior: "smooth" });
      } else if (tab === "saved") {
        currentView = "saved";
        searchQuery = "";
        HomeDOM.searchInputs.forEach(i => i.value = "");
        window.scrollTo({ top: HomeDOM.genresScroll.offsetTop - 80, behavior: "smooth" });
      }
      updateNavStates();
      filterAndRenderMovies();
    });
  });

  // Lắng nghe sự kiện bookmark thay đổi
  window.addEventListener("bookmarkChanged", () => {
    if (currentView === "saved") filterAndRenderMovies();
  });

  // Resize cho genres scroll và cập nhật số hàng phim hiển thị
  let resizeTimeout;
  window.addEventListener('resize', () => {
    checkAndEnableGenresScroll();
    
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (currentView === "home") {
        const oldCols = lastColumns;
        const oldMoviesPerPage = oldCols * 4;
        const firstMovieIndex = (currentPage - 1) * oldMoviesPerPage;
        
        const newCols = getGridColumns();
        const newMoviesPerPage = newCols * 4;
        
        currentPage = Math.floor(firstMovieIndex / newMoviesPerPage) + 1;
        lastColumns = newCols;
        
        filterAndRenderMovies();
      }
    }, 100);
  });
}

// ========== INITIALIZE ==========
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");

  if (viewParam === "saved") currentView = "saved";

  renderFeaturedMovies();   // Carousel nhiều phim nổi bật
  renderGenres();
  
  // Lấy số cột ban đầu
  lastColumns = getGridColumns();
  
  filterAndRenderMovies();
  updateNavStates();
  setupHomeListeners();
});