// ==========================================
// WATCHPAGE CONTROLLER
// ==========================================
let currentMovie = null;
let currentEpisodeIndex = 0;

const WatchDOM = {
  videoPlayer: document.getElementById("videoPlayer"),
  movieTitle: document.getElementById("movieTitle"),
  movieOriginalTitle: document.getElementById("movieOriginalTitle"),
  movieDesc: document.getElementById("movieDesc"),
  metaRating: document.getElementById("metaRating"),
  metaYear: document.getElementById("metaYear"),
  metaDuration: document.getElementById("metaDuration"),
  metaGenres: document.getElementById("metaGenres"),
  bookmarkBtn: document.getElementById("watchBookmarkBtn"),
  episodesList: document.getElementById("episodesList"),
  relatedGrid: document.getElementById("relatedMoviesGrid"),
  desktopNavLinks: document.querySelectorAll(".nav-link"),
  mobileNavItems: document.querySelectorAll(".mobile-nav-item")
};

// 1. Get query parameter by name
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 2. Load Movie Details
function loadMovieDetails() {
  const id = getQueryParam("id");
  if (!id) {
    // If no ID, redirect back to home page
    window.location.href = "index.html";
    return;
  }

  currentMovie = MOVIE_DATABASE.find(m => m.id === id);
  if (!currentMovie) {
    window.location.href = "index.html";
    return;
  }

  // Set Text Values
  document.title = `Xem phim ${currentMovie.title} - FilmXem`;
  WatchDOM.movieTitle.textContent = currentMovie.title;
  WatchDOM.movieOriginalTitle.textContent = currentMovie.originalTitle;
  WatchDOM.movieDesc.textContent = currentMovie.description;
  WatchDOM.metaRating.innerHTML = `<i class="fa-solid fa-star" style="color: #fbbf24"></i> ${currentMovie.rating.toFixed(1)} / 10`;
  WatchDOM.metaYear.textContent = currentMovie.year;
  WatchDOM.metaDuration.textContent = currentMovie.duration;

  // Genres badges
  WatchDOM.metaGenres.innerHTML = currentMovie.genres.map(g => `
    <span class="modal-meta-tag">${g}</span>
  `).join("");

  // Set Back Button Link
  const watchBackBtn = document.getElementById("watchBackBtn");
  if (watchBackBtn) {
    watchBackBtn.href = `detail?id=${currentMovie.id}`;
  }

  // Bookmarks status
  updateBookmarkButton();

  // Load Episodes List
  renderEpisodes();

  // Load Related Recommendations
  renderRelatedMovies();

  // Điều chỉnh vị trí playlist trên mobile
  adjustPlaylistPosition();
}

// 3. Render Playlist Episodes
function renderEpisodes() {
  if (!WatchDOM.episodesList) return;

  const episodes = currentMovie.episodes || [];
  if (episodes.length === 0) {
    WatchDOM.episodesList.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.9rem;">Thông tin tập phim đang được cập nhật...</p>`;
    return;
  }

  WatchDOM.episodesList.innerHTML = episodes.map((ep, index) => {
    const isActive = index === currentEpisodeIndex;
    return `
      <button class="episode-btn ${isActive ? 'active' : ''}" data-index="${index}">
        <span>${ep.title}</span>
        <i class="fa-solid ${isActive ? 'fa-circle-play' : 'fa-play'} episode-play-icon"></i>
      </button>
    `;
  }).join("");

  // Set Video Source
  WatchDOM.videoPlayer.src = episodes[currentEpisodeIndex].videoUrl;

  // Bind clicks
  WatchDOM.episodesList.querySelectorAll(".episode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"));
      changeEpisode(idx);
    });
  });
}

function changeEpisode(index) {
  currentEpisodeIndex = index;

  // Update Buttons UI
  const buttons = WatchDOM.episodesList.querySelectorAll(".episode-btn");
  buttons.forEach((btn, idx) => {
    if (idx === index) {
      btn.classList.add("active");
      btn.querySelector("i").className = "fa-solid fa-circle-play episode-play-icon";
    } else {
      btn.classList.remove("active");
      btn.querySelector("i").className = "fa-solid fa-play episode-play-icon";
    }
  });

  // Change Video Source & Play
  const episodes = currentMovie.episodes || [];
  if (episodes[index]) {
    WatchDOM.videoPlayer.src = episodes[index].videoUrl;
    WatchDOM.videoPlayer.play().catch(e => console.log("Auto-play blocked or error: ", e));
  }
}

// 4. Bookmark Button Actions
function updateBookmarkButton() {
  if (!WatchDOM.bookmarkBtn) return;

  const saved = isBookmarked(currentMovie.id);
  WatchDOM.bookmarkBtn.innerHTML = saved
    ? '<i class="fa-solid fa-bookmark"></i> Đã Lưu Thư Viện'
    : '<i class="fa-regular fa-bookmark"></i> Lưu Vào Thư Viện';

  if (saved) {
    WatchDOM.bookmarkBtn.classList.add("saved");
  } else {
    WatchDOM.bookmarkBtn.classList.remove("saved");
  }
}

// 5. Render Related Movie Suggestions (Bento Grid Cards)
function renderRelatedMovies() {
  if (!WatchDOM.relatedGrid) return;

  // Filter movies that share at least one genre, excluding current movie
  const currentGenres = currentMovie.genres;
  let related = MOVIE_DATABASE.filter(m =>
    m.id !== currentMovie.id &&
    m.genres.some(genre => currentGenres.includes(genre))
  );

  // If too few related, fill with any movies (excluding current)
  if (related.length < 4) {
    const others = MOVIE_DATABASE.filter(m => m.id !== currentMovie.id && !related.includes(m));
    related = [...related, ...others].slice(0, 4);
  } else {
    related = related.slice(0, 4);
  }

  WatchDOM.relatedGrid.innerHTML = related.map(movie => {
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

// 6. Navigation items setup (redirect to index.html with parameters)
function setupNavigation() {
  WatchDOM.desktopNavLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.getAttribute("data-view");
      window.location.href = `./?view=${view}`;
    });
  });

  WatchDOM.mobileNavItems.forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.getAttribute("data-tab");
      if (tab === "home") {
        window.location.href = "index.html";
      } else if (tab === "genres") {
        window.location.href = "index.html?focus=genres";
      } else if (tab === "saved") {
        window.location.href = "index.html?view=saved";
      }
    });
  });

  if (WatchDOM.bookmarkBtn) {
    WatchDOM.bookmarkBtn.addEventListener("click", () => {
      toggleBookmark(currentMovie.id, () => {
        updateBookmarkButton();
      });
    });
  }
}

// 7. Điều chỉnh vị trí playlist: trên mobile đưa xuống dưới mô tả, trước phần gợi ý
function adjustPlaylistPosition() {
  const isMobile = window.innerWidth <= 991;
  const playlistCard = document.querySelector('.playlist-card');
  const watchSidebarCol = document.getElementById('watchSidebarCol');
  const watchMainCol = document.getElementById('watchMainCol');
  const watchDetailsCard = document.getElementById('watchDetailsCard');
  const recommendationsSection = document.getElementById('recommendationsSection');

  if (!playlistCard || !watchSidebarCol || !watchMainCol) return;

  if (isMobile) {
    // Nếu playlist chưa được di chuyển vào main col
    if (!playlistCard.classList.contains('moved-to-main')) {
      playlistCard.classList.add('moved-to-main');
      // Di chuyển playlist vào sau details card, trước recommendations
      if (watchDetailsCard && recommendationsSection) {
        watchMainCol.insertBefore(playlistCard, recommendationsSection);
        // Thêm khoảng cách phù hợp
        playlistCard.style.marginTop = '24px';
        playlistCard.style.marginBottom = '0';
      }
      // Ẩn sidebar col đi vì nó đã rỗng
      watchSidebarCol.style.display = 'none';
    }
  } else {
    // Trên desktop, khôi phục nếu đã di chuyển
    if (playlistCard.classList.contains('moved-to-main')) {
      // Di chuyển lại vào sidebar
      watchSidebarCol.appendChild(playlistCard);
      playlistCard.classList.remove('moved-to-main');
      playlistCard.style.marginTop = '';
      watchSidebarCol.style.display = '';
    }
  }
}

// Lắng nghe sự kiện resize để cập nhật lại vị trí nếu cần
window.addEventListener('resize', () => {
  // Đợi một chút để layout ổn định rồi mới điều chỉnh
  setTimeout(adjustPlaylistPosition, 100);
});

// Initialize Watch Page
document.addEventListener("DOMContentLoaded", () => {
  loadMovieDetails();
  setupNavigation();
});