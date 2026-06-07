// ==========================================
// WATCHPAGE CONTROLLER - HỖ TRỢ IFRAME NHÚNG (KHÔNG CHO NHẬP LINK NGOÀI)
// ==========================================
let currentMovie = null;
let currentEpisodeIndex = 0;
let currentVideoBlobUrl = null;

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

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function loadMovieDetails() {
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

  document.title = `Xem phim ${currentMovie.title} - FilmXem`;
  WatchDOM.movieTitle.textContent = currentMovie.title;
  WatchDOM.movieOriginalTitle.textContent = currentMovie.originalTitle;
  WatchDOM.movieDesc.textContent = currentMovie.description;
  WatchDOM.metaRating.innerHTML = `<i class="fa-solid fa-star" style="color: #fbbf24"></i> ${currentMovie.rating.toFixed(1)} / 10`;
  WatchDOM.metaYear.textContent = currentMovie.year;
  WatchDOM.metaDuration.textContent = currentMovie.duration;

  WatchDOM.metaGenres.innerHTML = currentMovie.genres.map(g => `<span class="modal-meta-tag">${g}</span>`).join("");

  const watchBackBtn = document.getElementById("watchBackBtn");
  if (watchBackBtn) watchBackBtn.href = `detail?id=${currentMovie.id}`;

  updateBookmarkButton();
  renderEpisodes();
  renderRelatedMovies();
  adjustPlaylistPosition();
}
// Trước khi truyền link vào Player, hãy giải mã nó
function getDecryptedUrl(encryptedUrl) {
    const SECRET_KEY = 'MySuperSecretKey123!'; // Phải trùng với key lúc mã hóa
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedUrl, SECRET_KEY);
        const originalUrl = bytes.toString(CryptoJS.enc.Utf8);
        return originalUrl; // Trả về link Google Drive gốc cho Player
    } catch (e) {
        console.error("Giải mã thất bại:", e);
        return null;
    }
}
// ========== XỬ LÝ VIDEO / IFRAME (ĐÃ CẢI TẠO HỖ TRỢ GOOGLE DRIVE) ==========

// 1. Kiểm tra xem link có phải định dạng cần nhúng iframe hay không
function isIframeEmbedUrl(url) {
  if (!url) return false;
  
  const isFcloud = url.includes('fcloud.live/cinema/') && url.includes('.');
  const isGoogleDrive = url.includes('drive.google.com');
  
  return isFcloud || isGoogleDrive;
}

// ========== XỬ LÝ VIDEO / IFRAME ==========

// 1. Kiểm tra xem đường liên kết có thuộc diện nhúng iframe hay không
function isIframeEmbedUrl(url) {
  if (!url) return false;
  
  const isFcloud = url.includes('fcloud.live/cinema/') && url.includes('.');
  const isGoogleDrive = url.includes('drive.google.com');
  
  return isFcloud || isGoogleDrive;
}

// 2. Chuyển đổi link Google Drive thông thường sang cấu trúc nhúng (/preview)
function formatGoogleDriveEmbedUrl(url) {
  if (!url || !url.includes('drive.google.com')) return url;
  
  if (url.includes('/file/d/')) {
    const parts = url.split('/file/d/');
    if (parts[1]) {
      // Bóc tách lấy ID độc nhất của file video
      const fileId = parts[1].split('/')[0].split('?')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  return url;
}

// 3. Khởi tạo cấu trúc thẻ iframe
function createIframeFromUrl(embedUrl, title = 'Video player') {
  // Tự động ép link về dạng chuẩn hiển thị trước khi gán vào src
  const finalUrl = formatGoogleDriveEmbedUrl(embedUrl);
  
  const iframe = document.createElement('iframe');
  iframe.src = finalUrl;
  iframe.title = title;
  iframe.className = 'watch-iframe';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('allowfullscreen', 'true');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  return iframe;
}

async function getPlayableUrl(originalUrl) {
  if (!originalUrl || !originalUrl.includes('fcloud.live') || originalUrl.includes('/cinema/')) {
    return originalUrl;
  }
  try {
    const response = await fetch(originalUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    if (currentVideoBlobUrl && currentVideoBlobUrl !== blobUrl) {
      URL.revokeObjectURL(currentVideoBlobUrl);
    }
    currentVideoBlobUrl = blobUrl;
    return blobUrl;
  } catch (error) {
    console.warn('Không thể fetch blob, fallback gốc:', error);
    return originalUrl;
  }
}

async function isVideoUrlAccessible(url) {
  if (url.startsWith('blob:')) return true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok || response.status === 206;
  } catch {
    return false;
  }
}

// HIỂN THỊ LỖI - CHỈ CÓ NÚT THỬ LẠI, KHÔNG CHO NHẬP LINK
function showVideoErrorOnlyRetry(originalUrl) {
  const wrapper = document.querySelector('.watch-player-wrapper');
  if (!wrapper) return;
  let errorOverlay = wrapper.querySelector('.video-error-overlay');
  if (!errorOverlay) {
    errorOverlay = document.createElement('div');
    errorOverlay.className = 'video-error-overlay';
    errorOverlay.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: white;
      z-index: 10;
      backdrop-filter: blur(4px);
    `;
    wrapper.style.position = 'relative';
    wrapper.appendChild(errorOverlay);
  }
  errorOverlay.innerHTML = `
    <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: #f97316;"></i>
    <p style="margin: 0; font-weight: bold;"> Không thể tải video </p>
    <button id="retryCurrentBtn" class="btn btn-primary" style="background:#f97316; border:none; margin-top: 8px;">
      <i class="fa-solid fa-rotate-right"></i> Thử lại
    </button>
  `;
  const retryBtn = errorOverlay.querySelector('#retryCurrentBtn');
  retryBtn.onclick = () => {
    renderPlayerForUrl(originalUrl);
    errorOverlay.remove();
  };
}

// Hàm chính render player
async function renderPlayerForUrl(videoUrl, episodeTitle = '') {
  const wrapper = document.querySelector('.watch-player-wrapper');
  if (!wrapper) return;
  let container = document.getElementById('playerContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'playerContainer';
    container.style.width = '100%';
    container.style.height = '100%';
    const oldVideo = WatchDOM.videoPlayer;
    if (oldVideo && oldVideo.parentNode === wrapper) {
      wrapper.innerHTML = '';
      wrapper.appendChild(container);
      container.appendChild(oldVideo);
    } else {
      wrapper.innerHTML = '';
      wrapper.appendChild(container);
    }
  }
  container.innerHTML = '';
  const oldOverlay = wrapper.querySelector('.video-error-overlay');
  if (oldOverlay) oldOverlay.remove();

  if (isIframeEmbedUrl(videoUrl)) {
    const iframe = createIframeFromUrl(videoUrl, episodeTitle);
    container.appendChild(iframe);
  } else {
    const video = document.createElement('video');
    video.id = 'videoPlayer';
    video.className = 'watch-video';
    video.controls = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.height = '100%';
    let playableUrl = videoUrl;
    if (videoUrl.includes('fcloud.live') && !videoUrl.includes('/cinema/')) {
      playableUrl = await getPlayableUrl(videoUrl);
    }
    video.src = playableUrl;
    container.appendChild(video);
    const onError = async () => {
      if (video.hasAttribute('data-error-handled')) return;
      video.setAttribute('data-error-handled', 'true');
      const accessible = await isVideoUrlAccessible(video.src);
      if (!accessible) showVideoErrorOnlyRetry(videoUrl);
      else showVideoErrorOnlyRetry(videoUrl);
    };
    video.addEventListener('error', onError);
    video.load();
    try {
      await video.play();
    } catch (e) { console.log('Auto-play bị chặn:', e); }
  }
}

function renderEpisodes() {
  if (!WatchDOM.episodesList) return;
  const episodes = currentMovie.episodes || [];
  if (episodes.length === 0) {
    WatchDOM.episodesList.innerHTML = `<p style="color: var(--text-secondary);">Thông tin tập phim đang được cập nhật...</p>`;
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
  WatchDOM.episodesList.querySelectorAll(".episode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"));
      changeEpisode(idx);
    });
  });
  changeEpisode(currentEpisodeIndex);
}

async function changeEpisode(index) {
  currentEpisodeIndex = index;
  const episodes = currentMovie.episodes || [];
  if (!episodes[index]) return;
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
  const episode = episodes[index];
  await renderPlayerForUrl(episode.videoUrl, episode.title);
}

function updateBookmarkButton() {
  if (!WatchDOM.bookmarkBtn) return;
  const saved = isBookmarked(currentMovie.id);
  WatchDOM.bookmarkBtn.innerHTML = saved ? '<i class="fa-solid fa-bookmark"></i> Đã Lưu Thư Viện' : '<i class="fa-regular fa-bookmark"></i> Lưu Vào Thư Viện';
  if (saved) WatchDOM.bookmarkBtn.classList.add("saved");
  else WatchDOM.bookmarkBtn.classList.remove("saved");
}

function renderRelatedMovies() {
  if (!WatchDOM.relatedGrid) return;
  const currentGenres = currentMovie.genres;
  let related = MOVIE_DATABASE.filter(m => m.id !== currentMovie.id && m.genres.some(g => currentGenres.includes(g)));
  if (related.length < 4) {
    const others = MOVIE_DATABASE.filter(m => m.id !== currentMovie.id && !related.includes(m));
    related = [...related, ...others].slice(0, 4);
  } else related = related.slice(0, 4);
  WatchDOM.relatedGrid.innerHTML = related.map(movie => `
    <a href="detail?id=${movie.id}" class="movie-card">
      <div class="card-poster-wrapper">
        <img class="card-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
        <div class="card-badges">
          <span class="card-badge badge-quality">HD</span>
          <span class="card-badge badge-rating"><i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}</span>
        </div>
        <div class="card-hover-overlay"><div class="play-circle"><i class="fa-solid fa-play"></i></div></div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${movie.title}</h3>
        <p class="card-title-sub">${movie.originalTitle}</p>
      </div>
    </a>
  `).join("");
}

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
      if (tab === "home") window.location.href = "./";
      else if (tab === "genres") window.location.href = "./?focus=genres";
      else if (tab === "saved") window.location.href = "./?view=saved";
    });
  });
  if (WatchDOM.bookmarkBtn) {
    WatchDOM.bookmarkBtn.addEventListener("click", () => {
      toggleBookmark(currentMovie.id, () => updateBookmarkButton());
    });
  }
}

function adjustPlaylistPosition() {
  const isMobile = window.innerWidth <= 991;
  const playlistCard = document.querySelector('.playlist-card');
  const watchSidebarCol = document.getElementById('watchSidebarCol');
  const watchMainCol = document.getElementById('watchMainCol');
  const watchDetailsCard = document.getElementById('watchDetailsCard');
  const recommendationsSection = document.getElementById('recommendationsSection');
  if (!playlistCard || !watchSidebarCol || !watchMainCol) return;
  if (isMobile) {
    if (!playlistCard.classList.contains('moved-to-main')) {
      playlistCard.classList.add('moved-to-main');
      if (watchDetailsCard && recommendationsSection) {
        watchMainCol.insertBefore(playlistCard, recommendationsSection);
        playlistCard.style.marginTop = '24px';
        playlistCard.style.marginBottom = '0';
      }
      watchSidebarCol.style.display = 'none';
    }
  } else {
    if (playlistCard.classList.contains('moved-to-main')) {
      watchSidebarCol.appendChild(playlistCard);
      playlistCard.classList.remove('moved-to-main');
      playlistCard.style.marginTop = '';
      watchSidebarCol.style.display = '';
    }
  }
}

window.addEventListener('beforeunload', () => {
  if (currentVideoBlobUrl) URL.revokeObjectURL(currentVideoBlobUrl);
});
window.addEventListener('resize', () => setTimeout(adjustPlaylistPosition, 100));

document.addEventListener("DOMContentLoaded", () => {
  loadMovieDetails();
  setupNavigation();
});