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

// 2. Supabase Integration for Views
let supabaseClient = null;
const DEFAULT_SUPABASE_URL = "https://jqqelzvqglkkdlacuqoi.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcWVsenZxZ2xra2RsYWN1cW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDYyODQsImV4cCI6MjA5Nzc4MjI4NH0.z1oPhUi6BPrUQRdbbEH3VWzENzTg3sfzbVP9ycQv_NE";

async function getSupabaseConfig() {
  try {
    const res = await fetch('.env');
    if (!res.ok) throw new Error("Không thể tải file .env");
    const text = await res.text();
    const env = {};
    text.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
      }
    });
    return {
      url: env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
      key: env.API_Key_comment || DEFAULT_SUPABASE_KEY
    };
  } catch (e) {
    console.warn("Không tìm thấy file .env hoặc lỗi đọc file, dùng cấu trúc mặc định:", e);
    return {
      url: DEFAULT_SUPABASE_URL,
      key: DEFAULT_SUPABASE_KEY
    };
  }
}

async function initSupabase() {
  if (supabaseClient) return true;
  try {
    if (typeof supabase === 'undefined') {
      console.warn("Supabase SDK chưa được tải.");
      return false;
    }
    const config = await getSupabaseConfig();
    supabaseClient = supabase.createClient(config.url, config.key);
    return true;
  } catch (err) {
    console.error("Lỗi khi kết nối với Supabase:", err);
    return false;
  }
}

async function loadRealViews(movieId) {
  if (!supabaseClient) {
    const success = await initSupabase();
    if (!success) return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('episode_views')
      .select('views')
      .eq('movie_id', movieId);

    if (error) throw error;

    let totalRealViews = 0;
    if (data && data.length > 0) {
      totalRealViews = data.reduce((sum, item) => sum + parseInt(item.views || 0), 0);
    }

    if (DetailDOM.metaViews) {
      DetailDOM.metaViews.textContent = `${totalRealViews.toLocaleString()} Lượt Xem`;
    }
  } catch (e) {
    console.warn("Không thể tải lượt xem thực tế từ Supabase:", e);
    if (DetailDOM.metaViews) {
      DetailDOM.metaViews.textContent = `0 Lượt Xem`;
    }
  }
}

// 3. Compute stable mock stats based on movie ID for continuity
function generateMockStats(movie) {
  // Stable random-looking number based on character codes
  let hash = 0;
  for (let i = 0; i < movie.id.length; i++) {
    hash = movie.id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const members = Math.abs((hash % 1000) + 500); // 500 to 1500 voters
  
  // Extract number from year string (e.g. "năm 2024" -> 2024) to avoid NaN multiplication
  const yearNum = parseInt(movie.year.toString().replace(/\D/g, '')) || 2026;
  const views = Math.abs((hash % 800000) + 400000) + (yearNum * 200); // 400k to 1.2M views
  const matchPercent = Math.round(movie.rating * 10); // rating 9.1 -> 91%

  return {
    members,
    views: views.toLocaleString(),
    baseViewsRaw: views,
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
  DetailDOM.ratingPercent.style.setProperty('--rating-progress', `${stats.matchPercent}%`);
  DetailDOM.ratingPercent.innerHTML = `<span class="rating-circle-inner-text">${stats.matchPercent}%</span>`;
  DetailDOM.ratingText.textContent = `(Đánh giá ${currentMovie.rating.toFixed(1)}/10 từ ${stats.members} thành viên)`;
  DetailDOM.starsBox.innerHTML = renderRatingStars(currentMovie.rating);

  DetailDOM.metaDuration.textContent = currentMovie.duration;
  DetailDOM.metaYear.textContent = currentMovie.year;
  DetailDOM.metaViews.textContent = `0 Lượt Xem`;

  // Tải lượt xem thực tế từ database (bằng tổng lượt xem các tập của phim)
  loadRealViews(currentMovie.id);

  // Bookmark button setup
  updateBookmarkButton();

  // Related suggestions
  renderRelatedSuggestions();

  // Khôi phục tiến trình xem nếu có để cập nhật nút Xem Phim
  const progress = getMovieProgress(currentMovie.id);
  if (progress && DetailDOM.playBtn) {
    const lastEpIdx = progress.lastWatchedEpisodeIndex !== undefined ? progress.lastWatchedEpisodeIndex : 0;
    const epProgress = progress.episodes ? progress.episodes[lastEpIdx] : null;
    if (epProgress && epProgress.time > 0 && epProgress.duration > 0) {
      const percent = Math.round((epProgress.time / epProgress.duration) * 100);
      DetailDOM.playBtn.innerHTML = `<i class="fa-solid fa-play"></i> Tiếp Tục Xem (Tập ${lastEpIdx + 1} - ${percent}%)`;
    } else {
      DetailDOM.playBtn.innerHTML = `<i class="fa-solid fa-play"></i> Tiếp Tục Xem Tập ${lastEpIdx + 1}`;
    }
  }

  // Listeners for poster click & watch button click -> goes to watch.html
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

  DetailDOM.relatedGrid.innerHTML = related.map((movie, index) => {
    const mainGenre = movie.genres[0] || "";

    // Kiểm tra tiến trình xem
    const progress = getMovieProgress(movie.id);
    let progressBadgeHTML = "";
    let progressBarHTML = "";
    if (progress) {
      const lastEpIdx = progress.lastWatchedEpisodeIndex !== undefined ? progress.lastWatchedEpisodeIndex : 0;
      const epText = `Tập ${lastEpIdx + 1}`;
      progressBadgeHTML = `
        <span class="card-badge badge-progress" style="background: var(--accent); color: white; font-weight: 700;">
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

    return `
      <a href="detail?id=${movie.id}" class="movie-card" style="animation-delay: ${index * 0.08}s">
        <div class="card-poster-wrapper">
          <img class="card-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
          <div class="card-badges">
            <span class="card-badge badge-quality">HD</span>
            <span class="card-badge badge-rating">
              <i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}
            </span>
            ${progressBadgeHTML}
          </div>
          ${progressBarHTML}
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
