// ==========================================
// HOMEPAGE CONTROLLER (FULLY FIXED)
// ==========================================
let currentGenre = "Tất cả";
let searchQuery = "";
let currentView = "home"; // "home" or "saved"

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
  desktopNavLinks: document.querySelectorAll(".nav-link")
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
          <div class="carousel-slide" data-index="${idx}" style="background-image: url('${movie.banner}');">
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

      updateNavStates();
      renderGenres();
      filterAndRenderMovies();
    });
  });

  // Kích hoạt scroll ngang nếu cần (cho mobile)
  checkAndEnableGenresScroll();
}

// ========== FILTER & RENDER MOVIES ==========
function filterAndRenderMovies() {
  if (!HomeDOM.moviesGrid) return;

  let movies = MOVIE_DATABASE;

  if (currentView === "saved") {
    movies = movies.filter(m => isBookmarked(m.id));
  }

  if (currentGenre !== "Tất cả") {
    movies = movies.filter(m => m.genres.includes(currentGenre));
  }

  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase().trim();
    movies = movies.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.originalTitle.toLowerCase().includes(query) ||
      m.genres.some(g => g.toLowerCase().includes(query))
    );
  }

  // Cập nhật tiêu đề
  if (currentView === "saved") {
    if (searchQuery.trim() !== "") {
      HomeDOM.sectionTitle.textContent = `Kết quả tìm kiếm trong tủ sách: "${searchQuery}"`;
    } else if (currentGenre !== "Tất cả") {
      HomeDOM.sectionTitle.textContent = `Tủ sách phim - Thể loại: ${currentGenre}`;
    } else {
      HomeDOM.sectionTitle.textContent = "Phim đã lưu của bạn";
    }
  } else {
    if (searchQuery.trim() !== "") {
      HomeDOM.sectionTitle.textContent = `Kết quả tìm kiếm cho "${searchQuery}"`;
    } else {
      HomeDOM.sectionTitle.textContent = currentGenre === "Tất cả" ? "Phim mới cập nhật" : `Thể loại: ${currentGenre}`;
    }
  }

  if (movies.length === 0) {
    HomeDOM.moviesGrid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-video-slash"></i>
        <p>Không tìm thấy bộ phim nào phù hợp.</p>
      </div>
    `;
    return;
  }

  HomeDOM.moviesGrid.innerHTML = movies.map(movie => {
    const mainGenre = movie.genres[0] || "";
    return `
      <a href="detail?id=${movie.id}" class="movie-card">
        <div class="card-poster-wrapper">
          <img class="card-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
          <div class="card-badges">
            <span class="card-badge badge-quality">HD</span>
            <span class="card-badge badge-rating">
              <i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}
            </span>
            <span class="card-badge badge-year">${movie.year}</span>
          </div>
          <div class="card-hover-overlay">
            <div class="play-circle">
              <i class="fa-solid fa-play"></i>
            </div>
          </div>
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
  }).join("");
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
      currentView = "home";
      filterAndRenderMovies();
    });
  });

  // Mobile search close
  if (HomeDOM.closeMobileSearch) {
    HomeDOM.closeMobileSearch.addEventListener("click", () => {
      if (searchQuery !== "") {
        searchQuery = "";
        HomeDOM.searchInputs.forEach(input => input.value = "");
        filterAndRenderMovies();
      }
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

  // Resize cho genres scroll
  window.addEventListener('resize', () => checkAndEnableGenresScroll());
}

// ========== INITIALIZE ==========
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const searchParam = params.get("search");
  const viewParam = params.get("view");

  if (searchParam) {
    searchQuery = decodeURIComponent(searchParam);
    HomeDOM.searchInputs.forEach(input => input.value = searchQuery);
  }
  if (viewParam === "saved") currentView = "saved";

  renderFeaturedMovies();   // Carousel nhiều phim nổi bật
  renderGenres();
  filterAndRenderMovies();
  updateNavStates();
  setupHomeListeners();
});