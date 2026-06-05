// ==========================================
// MOVIE CARD DETAIL CONTROLLER
// ==========================================
let currentMovie = null;

const DetailDOM = {
  backdropWrapper: document.getElementById("detailBackdropWrapper"),
  posterWrapper: document.getElementById("detailPosterWrapper"),
  posterImg: document.getElementById("detailPosterImg"),
  movieTitle: document.getElementById("movieTitle"),
  movieOriginalTitle: document.getElementById("movieOriginalTitle"),
  movieDesc: document.getElementById("movieDesc"),
  ratingPercent: document.getElementById("ratingPercent"),
  ratingText: document.getElementById("ratingText"),
  starsBox: document.getElementById("starsBox"),
  metaDuration: document.getElementById("metaDuration"),
  metaYear: document.getElementById("metaYear"),
  metaViews: document.getElementById("metaViews"),
  bookmarkBtn: document.getElementById("detailBookmarkBtn"),
  playBtn: document.getElementById("detailPlayBtn"),
  relatedGrid: document.getElementById("relatedMoviesGrid"),
  desktopNavLinks: document.querySelectorAll(".nav-link"),
  mobileNavItems: document.querySelectorAll(".mobile-nav-item")
};

// 1. Get query parameters
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 2. Compute stable mock stats based on movie ID for continuity
function generateMockStats(movie) {
  // Stable random-looking number based on character codes
  let hash = 0;
  for (let i = 0; i < movie.id.length; i++) {
    hash = movie.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const members = Math.abs((hash % 1000) + 500); // 500 to 1500 voters
  const views = Math.abs((hash % 800000) + 400000) + (movie.year * 200); // 400k to 1.2M views
  const matchPercent = Math.round(movie.rating * 10); // rating 9.1 -> 91%
  
  return {
    members,
    views: views.toLocaleString(),
    matchPercent
  };
}

// 3. Render Stars (10 stars system matching screenshot)
function renderRatingStars(rating) {
  let starsHTML = "";
  const maxStars = 10;
  const ratingValue = rating; // e.g. 9.1
  
  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(ratingValue)) {
      starsHTML += '<i class="fa-solid fa-star"></i>';
    } else if (i === Math.ceil(ratingValue) && (ratingValue % 1) >= 0.4) {
      starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
    } else {
      starsHTML += '<i class="fa-regular fa-star"></i>';
    }
  }
  return starsHTML;
}

// 4. Load Movie details
function loadMovieCard() {
  const id = getQueryParam("id");
  if (!id) {
    window.location.href = "./";
    return;
  }
  
  currentMovie = MOVIE_DATABASE.find(m => m.id === id);
  if (!currentMovie) {
    window.location.href = "./";
    return;
  }
  
  // Set Background Banner & Poster
  DetailDOM.backdropWrapper.style.backgroundImage = `url('${currentMovie.banner}')`;
  DetailDOM.posterImg.src = currentMovie.poster;
  DetailDOM.posterImg.alt = currentMovie.title;
  
  // Title & Desc
  document.title = `${currentMovie.title} - Thư Viện FilmXem`;
  DetailDOM.movieTitle.textContent = currentMovie.title;
  DetailDOM.movieOriginalTitle.textContent = `${currentMovie.originalTitle}, ${currentMovie.title}`;
  DetailDOM.movieDesc.textContent = currentMovie.description;
  
  // Generate stats
  const stats = generateMockStats(currentMovie);
  DetailDOM.ratingPercent.textContent = `${stats.matchPercent}%`;
  DetailDOM.ratingText.textContent = `(Đánh giá ${currentMovie.rating.toFixed(1)}/10 từ ${stats.members} thành viên)`;
  DetailDOM.starsBox.innerHTML = renderRatingStars(currentMovie.rating);
  
  DetailDOM.metaDuration.textContent = currentMovie.duration;
  DetailDOM.metaYear.textContent = currentMovie.year;
  DetailDOM.metaViews.textContent = `${stats.views} Lượt Xem`;
  
  // Bookmark button setup
  updateBookmarkButton();
  
  // Related suggestions
  renderRelatedSuggestions();
  
  // Listeners for poster click & watch button click -> goes to /watch
  const watchUrl = `watch?id=${currentMovie.id}`;
  
  DetailDOM.posterWrapper.addEventListener("click", () => {
    window.location.href = watchUrl;
  });
  
  DetailDOM.playBtn.addEventListener("click", () => {
    window.location.href = watchUrl;
  });
  
  DetailDOM.bookmarkBtn.addEventListener("click", () => {
    toggleBookmark(currentMovie.id, () => {
      updateBookmarkButton();
    });
  });
}

// 5. Update Bookmark Button style
function updateBookmarkButton() {
  if (!DetailDOM.bookmarkBtn) return;
  const saved = isBookmarked(currentMovie.id);
  
  DetailDOM.bookmarkBtn.innerHTML = saved
    ? '<i class="fa-solid fa-bookmark"></i> Đã Lưu Thư Viện'
    : '<i class="fa-regular fa-bookmark"></i> Lưu Vào Thư Viện';
    
  if (saved) {
    DetailDOM.bookmarkBtn.classList.add("saved");
  } else {
    DetailDOM.bookmarkBtn.classList.remove("saved");
  }
}

// 6. Related Movies suggestions grid
function renderRelatedSuggestions() {
  if (!DetailDOM.relatedGrid) return;
  
  const currentGenres = currentMovie.genres;
  let related = MOVIE_DATABASE.filter(m => 
    m.id !== currentMovie.id && 
    m.genres.some(genre => currentGenres.includes(genre))
  );
  
  if (related.length < 4) {
    const others = MOVIE_DATABASE.filter(m => m.id !== currentMovie.id && !related.includes(m));
    related = [...related, ...others].slice(0, 4);
  } else {
    related = related.slice(0, 4);
  }
  
  DetailDOM.relatedGrid.innerHTML = related.map(movie => {
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
        </div>
      </a>
    `;
  }).join("");
}

// 7. Navigation redirection configs
function setupDetailNavigation() {
  DetailDOM.desktopNavLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.getAttribute("data-view");
      window.location.href = `./?view=${view}`;
    });
  });
  
  DetailDOM.mobileNavItems.forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.getAttribute("data-tab");
      if (tab === "home") {
        window.location.href = "./";
      } else if (tab === "genres") {
        window.location.href = "./?focus=genres";
      } else if (tab === "saved") {
        window.location.href = "./?view=saved";
      }
    });
  });
}

// Init Detail Page
document.addEventListener("DOMContentLoaded", () => {
  loadMovieCard();
  setupDetailNavigation();
});
