// ==========================================
// SEARCH RESULTS PAGE CONTROLLER
// ==========================================

const SearchDOM = {
  moviesGrid: document.getElementById("moviesGrid"),
  sectionTitle: document.getElementById("sectionTitle"),
  searchInputs: document.querySelectorAll(".js-search-input")
};

// ========== HELPER: TẠO HTML CHO CARD PHIM ==========
function createMovieCardHTML(movie) {
  const mainGenre = movie.genres[0] || "";
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
    <a href="detail.html?id=${movie.id}" class="movie-card" style="position: relative;">
      <div class="card-poster-wrapper">
        <img class="card-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
        <div class="card-badges">
          <span class="card-badge badge-quality">HD</span>
          <span class="card-badge badge-rating"><i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}</span>
          <span class="card-badge badge-year">${movie.year}</span>
          ${progressBadgeHTML}
        </div>
        ${progressBarHTML}
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

// ========== THỰC HIỆN TÌM KIẾM VÀ RENDER ==========
function performSearch() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  
  // Đồng bộ giá trị lên các ô tìm kiếm
  SearchDOM.searchInputs.forEach(input => {
    input.value = query;
  });

  if (!query.trim()) {
    SearchDOM.sectionTitle.textContent = "Vui lòng nhập từ khóa tìm kiếm";
    SearchDOM.moviesGrid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 12px;"></i>
        <p>Hãy gõ gì đó để tìm kiếm bộ phim yêu thích của bạn.</p>
      </div>
    `;
    return;
  }

  SearchDOM.sectionTitle.textContent = `Kết quả tìm kiếm cho "${query}"`;

  const cleanQuery = query.toLowerCase().trim();
  const results = MOVIE_DATABASE.filter(movie => 
    (movie.title && movie.title.toLowerCase().includes(cleanQuery)) ||
    (movie.originalTitle && movie.originalTitle.toLowerCase().includes(cleanQuery)) ||
    (movie.genres && movie.genres.some(g => g.toLowerCase().includes(cleanQuery))) ||
    (movie.description && movie.description.toLowerCase().includes(cleanQuery))
  );

  if (results.length === 0) {
    SearchDOM.moviesGrid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-video-slash" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 12px;"></i>
        <p>Không tìm thấy phim phù hợp với từ khóa "${query}".</p>
      </div>
    `;
    return;
  }

  SearchDOM.moviesGrid.innerHTML = results.map(movie => createMovieCardHTML(movie)).join("");
}

// ========== INITIALIZE ==========
document.addEventListener("DOMContentLoaded", () => {
  performSearch();
});
