// ==========================================
// HOMEPAGE CONTROLLER
// ==========================================
let currentGenre = "Tất cả";
let searchQuery = "";
let currentView = "home"; // "home" or "saved"

const HomeDOM = {
  moviesGrid: document.getElementById("moviesGrid"),
  genresScroll: document.getElementById("genresScroll"),
  heroBanner: document.getElementById("heroBanner"),
  heroContent: document.getElementById("heroContent"),
  sectionTitle: document.getElementById("sectionTitle"),
  searchInputs: document.querySelectorAll(".js-search-input"),
  mobileSearchOverlay: document.getElementById("mobileSearchOverlay"),
  closeMobileSearch: document.getElementById("closeMobileSearch"),
  mobileNavItems: document.querySelectorAll(".mobile-nav-item"),
  desktopNavLinks: document.querySelectorAll(".nav-link")
};

// 1. Render Featured Banner Movie
function renderFeaturedMovie() {
  if (!HomeDOM.heroBanner || !HomeDOM.heroContent) return;

  const featured = MOVIE_DATABASE.find(movie => movie.isFeatured) || MOVIE_DATABASE[0];
  if (!featured) return;

  HomeDOM.heroBanner.style.backgroundImage = `url('${featured.banner}')`;

  const isSaved = isBookmarked(featured.id);

  HomeDOM.heroContent.innerHTML = `
    <div class="hero-badge">
      <i class="fa-solid fa-fire"></i> Nổi bật hôm nay
    </div>
    <h1 class="hero-title">${featured.title}</h1>
    <div class="hero-meta">
      <span class="meta-item rating">
        <i class="fa-solid fa-star"></i> ${featured.rating.toFixed(1)}
      </span>
      <span class="meta-item">
        <i class="fa-solid fa-calendar"></i> ${featured.year}
      </span>
      <span class="meta-item">
        <i class="fa-solid fa-clock"></i> ${featured.duration}
      </span>
    </div>
    <p class="hero-desc">${featured.description}</p>
    <div class="hero-actions">
      <a href="detail?id=${featured.id}" class="btn btn-primary">
        <i class="fa-solid fa-play"></i> Xem ngay
      </a>
      <button class="btn btn-secondary js-hero-bookmark" data-id="${featured.id}">
        <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> 
        ${isSaved ? 'Đã lưu' : 'Lưu phim'}
      </button>
    </div>
  `;

  // Add bookmark listener inside hero
  const heroBookmarkBtn = HomeDOM.heroContent.querySelector(".js-hero-bookmark");
  if (heroBookmarkBtn) {
    heroBookmarkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = heroBookmarkBtn.getAttribute("data-id");
      toggleBookmark(id, (status) => {
        heroBookmarkBtn.innerHTML = `
          <i class="${status ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> 
          ${status ? 'Đã lưu' : 'Lưu phim'}
        `;
      });
    });
  }
}

// 2. Render Genres list bar
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

  // Bind click listeners - GIỮ NGUYÊN currentView (không reset về home)
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
}

// 3. Filter and Render Movie Cards Grid
function filterAndRenderMovies() {
  if (!HomeDOM.moviesGrid) return;

  let movies = MOVIE_DATABASE;

  // Filter by Saved
  if (currentView === "saved") {
    movies = movies.filter(m => isBookmarked(m.id));
  }

  // Filter by Genre - Áp dụng cho cả home và saved (chỉ bỏ qua nếu genre = "Tất cả")
  if (currentGenre !== "Tất cả") {
    movies = movies.filter(m => m.genres.includes(currentGenre));
  }

  // Filter by Search Query
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase().trim();
    movies = movies.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.originalTitle.toLowerCase().includes(query) ||
      m.genres.some(g => g.toLowerCase().includes(query))
    );
  }

  // Cập nhật tiêu đề section
  if (currentView === "saved") {
    if (searchQuery.trim() !== "") {
      HomeDOM.sectionTitle.textContent = `Kết quả tìm kiếm trong tủ sách: "${searchQuery}"`;
    } else if (currentGenre !== "Tất cả") {
      HomeDOM.sectionTitle.textContent = `Tủ sách phim - Thể loại: ${currentGenre}`;
    } else {
      HomeDOM.sectionTitle.textContent = "Phim đã lưu của bạn";
    }
  } else {
    // Home view
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

// 4. Update Navigation States
function updateNavStates() {
  // Mobile Nav Active State
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

  // Desktop Nav Active State
  HomeDOM.desktopNavLinks.forEach(link => {
    const view = link.getAttribute("data-view");
    if (view === currentView) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// 5. Setup Event Listeners
function setupHomeListeners() {
  // Search Inputs
  HomeDOM.searchInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      searchQuery = e.target.value;

      // Sync other search inputs
      HomeDOM.searchInputs.forEach(i => {
        if (i !== e.target) i.value = searchQuery;
      });

      currentView = "home";
      filterAndRenderMovies();
    });
  });

  // Mobile Search Close click overrides
  if (HomeDOM.closeMobileSearch) {
    HomeDOM.closeMobileSearch.addEventListener("click", () => {
      if (searchQuery !== "") {
        searchQuery = "";
        HomeDOM.searchInputs.forEach(input => input.value = "");
        filterAndRenderMovies();
      }
    });
  }

  // Desktop Nav Links click
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

      // Scroll to content
      window.scrollTo({
        top: HomeDOM.genresScroll.offsetTop - 100,
        behavior: "smooth"
      });
    });
  });

  // Mobile Bottom Nav Tabs Click
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

  // Listen for bookmarks updates from other elements (like modals/watchpages)
  window.addEventListener("bookmarkChanged", () => {
    if (currentView === "saved") {
      filterAndRenderMovies();
    }
  });
}

// 6. Initialize Homepage
document.addEventListener("DOMContentLoaded", () => {
  // Parse URL queries on load (like search redirects)
  const params = new URLSearchParams(window.location.search);
  const searchParam = params.get("search");
  const viewParam = params.get("view");

  if (searchParam) {
    searchQuery = decodeURIComponent(searchParam);
    HomeDOM.searchInputs.forEach(input => input.value = searchQuery);
  }

  if (viewParam === "saved") {
    currentView = "saved";
  }

  renderFeaturedMovie();
  renderGenres();
  filterAndRenderMovies();
  updateNavStates();
  setupHomeListeners();
});