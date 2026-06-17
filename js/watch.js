// ==========================================
// WATCHPAGE CONTROLLER - HỖ TRỢ IFRAME NHÚNG (KHÔNG CHO NHẬP LINK NGOÀI)
// ==========================================
let currentMovie = null;
let currentEpisodeIndex = 0;
let currentVideoBlobUrl = null;
let autoplayTimer = null;
let autoplayOverlay = null;

// Episode pagination & search variables
let currentRangeIndex = 0;
let episodeQuery = "";

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

  // Khôi phục tập phim đã xem trước đó
  const progress = getMovieProgress(currentMovie.id);
  if (progress && progress.lastWatchedEpisodeIndex !== undefined) {
    const episodes = currentMovie.episodes || [];
    if (progress.lastWatchedEpisodeIndex < episodes.length) {
      currentEpisodeIndex = progress.lastWatchedEpisodeIndex;
    }
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
  
  // Reset pagination/search state
  window.hasInitializedRange = false;
  currentRangeIndex = 0;
  episodeQuery = "";
  const searchInput = document.getElementById("episodeSearchInput");
  if (searchInput) {
    searchInput.value = "";
  }

  renderEpisodes();
  changeEpisode(currentEpisodeIndex, true);
  renderRelatedMovies();
  adjustPlaylistPosition();
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
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Tăng thời gian lắng nghe lên 15 giây
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

// ========== HÀM BỔ TRỢ TỰ ĐỘNG CHUYỂN TẬP ==========
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cancelAutoplayCountdown() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  if (autoplayOverlay) {
    autoplayOverlay.remove();
    autoplayOverlay = null;
  }
}

function triggerAutoplayCountdown(nextEpIndex) {
  cancelAutoplayCountdown();

  const wrapper = document.querySelector('.watch-player-wrapper');
  if (!wrapper) return;

  const episodes = currentMovie.episodes || [];
  const nextEp = episodes[nextEpIndex];
  if (!nextEp) return;

  autoplayOverlay = document.createElement('div');
  autoplayOverlay.className = 'autoplay-next-overlay';

  let countdown = 10;

  autoplayOverlay.innerHTML = `
    <div class="autoplay-card">
      <div class="autoplay-info">
        <span class="autoplay-label">TẬP TIẾP THEO</span>
        <h4 class="autoplay-title">${escapeHtml(nextEp.title)}</h4>
      </div>
      <div class="autoplay-actions">
        <button class="btn-autoplay btn-cancel">Hủy</button>
        <button class="btn-autoplay btn-confirm">Phát ngay (${countdown}s)</button>
      </div>
    </div>
  `;

  wrapper.appendChild(autoplayOverlay);

  const cancelBtn = autoplayOverlay.querySelector('.btn-cancel');
  const confirmBtn = autoplayOverlay.querySelector('.btn-confirm');

  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    cancelAutoplayCountdown();
  });

  confirmBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    cancelAutoplayCountdown();
    changeEpisode(nextEpIndex);
  });

  autoplayTimer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      cancelAutoplayCountdown();
      changeEpisode(nextEpIndex);
    } else {
      if (confirmBtn) {
        confirmBtn.textContent = `Phát ngay (${countdown}s)`;
      }
    }
  }, 1000);
}

// Hàm chính render player
async function renderPlayerForUrl(videoUrl, episodeTitle = '') {
  const activeEpIndex = currentEpisodeIndex; // capture current episode index to prevent race conditions during transitions
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
    // Lưu tiến trình xem cho iframe
    saveMovieProgress(currentMovie.id, activeEpIndex, 0, 0);
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

    // Khôi phục tiến trình xem nếu có cho tập phim hiện tại
    const progress = getMovieProgress(currentMovie.id);
    if (progress && progress.episodes && progress.episodes[activeEpIndex]) {
      const epProgress = progress.episodes[activeEpIndex];
      if (epProgress.time > 0) {
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = epProgress.time;
        }, { once: true });
      }
    }

    // Theo dõi và lưu tiến trình xem phim & tự động chuyển tập
    let lastSavedTime = 0;
    let autoplayPromptShown = false;
    video.addEventListener('timeupdate', () => {
      const currentTime = video.currentTime;
      const duration = video.duration;

      // Lưu tiến trình định kỳ
      if (Math.abs(currentTime - lastSavedTime) > 4 && duration > 0) {
        saveMovieProgress(currentMovie.id, activeEpIndex, currentTime, duration);
        lastSavedTime = currentTime;
      }

      // Tự động chuyển tập khi còn dưới 2 phút (120 giây)
      const nextEpIndex = activeEpIndex + 1;
      const episodes = currentMovie.episodes || [];
      if (duration > 120 && nextEpIndex < episodes.length) {
        const timeLeft = duration - currentTime;
        if (timeLeft <= 120) {
          if (!autoplayPromptShown) {
            autoplayPromptShown = true;
            triggerAutoplayCountdown(nextEpIndex);
          }
        } else {
          // Reset nếu tua ngược lại trước mốc 2 phút
          if (autoplayPromptShown) {
            autoplayPromptShown = false;
            cancelAutoplayCountdown();
          }
        }
      }
    });

    video.addEventListener('pause', () => {
      if (video.duration > 0) {
        saveMovieProgress(currentMovie.id, activeEpIndex, video.currentTime, video.duration);
      }
    });

    const onError = async () => {
      if (video.hasAttribute('data-error-handled')) return;
      video.setAttribute('data-error-handled', 'true');

      // Kiểm tra xem đường truyền thực tế có truy cập được không với timeout 15s mới quyết định báo lỗi
      const accessible = await isVideoUrlAccessible(video.src);
      if (!accessible) {
        // Nếu thực sự không truy cập được, dừng phát hoàn toàn để tránh phát tiếng ngầm và hiện lỗi
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch (e) {
          console.warn("Lỗi tắt âm thanh video ngầm:", e);
        }
        showVideoErrorOnlyRetry(videoUrl);
      } else {
        // Nếu đường truyền vẫn tốt (có thể do lỗi nghẽn tạm thời hoặc bị chặn autoplay), cho phép tự động tải lại
        console.log("Đường truyền vẫn hoạt động tốt, đang tự động tải lại video...");
        video.removeAttribute('data-error-handled');
        try {
          video.load();
          await video.play();
        } catch (e) {
          console.log("Không thể tự động phát lại sau khi khôi phục:", e);
        }
      }
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
    const rangesContainer = document.getElementById("episodeRangesContainer");
    if (rangesContainer) rangesContainer.innerHTML = "";
    return;
  }

  // 1. Calculate Ranges if total episodes > 50
  const groupSize = 50;
  const total = episodes.length;
  const ranges = [];
  if (total > 50) {
    for (let start = 1; start <= total; start += groupSize) {
      const end = Math.min(start + groupSize - 1, total);
      ranges.push({ start, end });
    }
  }

  // 2. Determine initial range tab based on currentEpisodeIndex
  if (total > 50 && !window.hasInitializedRange) {
    const epNum = currentEpisodeIndex + 1;
    const initialRangeIdx = ranges.findIndex(r => epNum >= r.start && epNum <= r.end);
    if (initialRangeIdx !== -1) {
      currentRangeIndex = initialRangeIdx;
    }
    window.hasInitializedRange = true;
  }

  // 3. Render Range Tabs if > 50 episodes
  const rangesContainer = document.getElementById("episodeRangesContainer");
  if (rangesContainer) {
    if (total > 50 && !episodeQuery) {
      rangesContainer.innerHTML = ranges.map((r, idx) => {
        const isActive = idx === currentRangeIndex;
        const label = r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`;
        return `
          <button class="range-tab ${isActive ? 'active' : ''}" data-range-idx="${idx}">
            ${label}
          </button>
        `;
      }).join("");

      rangesContainer.querySelectorAll(".range-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          currentRangeIndex = parseInt(tab.getAttribute("data-range-idx"));
          renderEpisodes();
        });
      });
      rangesContainer.style.display = "flex";
    } else {
      rangesContainer.innerHTML = "";
      rangesContainer.style.display = "none";
    }
  }

  // Helper to filter and render the grid/list
  function renderEpisodesOnly() {
    // Determine list-mode vs grid-mode
    const hasLongTitles = episodes.some(ep => !ep.title.startsWith("Tập ") && ep.title.length > 8);
    const useListMode = hasLongTitles || episodes.length <= 1;

    // Apply classes
    if (useListMode) {
      WatchDOM.episodesList.className = "episodes-list episodes-grid list-mode no-scrollbar";
    } else {
      WatchDOM.episodesList.className = "episodes-list episodes-grid no-scrollbar";
    }

    let filteredEpisodes = episodes.map((ep, idx) => ({ ep, idx }));

    if (episodeQuery) {
      const q = episodeQuery.toLowerCase();
      filteredEpisodes = filteredEpisodes.filter(item => 
        item.ep.title.toLowerCase().includes(q) || 
        item.idx.toString() === q || 
        (item.idx + 1).toString() === q
      );
    } else if (total > 50) {
      const range = ranges[currentRangeIndex];
      filteredEpisodes = filteredEpisodes.filter(item => {
        const epNum = item.idx + 1;
        return epNum >= range.start && epNum <= range.end;
      });
    }

    // Sắp xếp lưới theo thứ tự tăng dần (tập 1, 2, ... 50)

    if (filteredEpisodes.length === 0) {
      WatchDOM.episodesList.innerHTML = `<p style="color: var(--text-secondary); text-align: center; width: 100%; padding: 20px 0;">Không tìm thấy tập phù hợp...</p>`;
      return;
    }

    WatchDOM.episodesList.innerHTML = filteredEpisodes.map(item => {
      const isActive = item.idx === currentEpisodeIndex;
      if (useListMode) {
        return `
          <button class="episode-btn ${isActive ? 'active' : ''}" data-index="${item.idx}">
            <span>${item.ep.title}</span>
            <i class="fa-solid ${isActive ? 'fa-circle-play' : 'fa-play'} episode-play-icon"></i>
          </button>
        `;
      } else {
        let label = item.ep.title;
        if (label.startsWith("Tập ")) {
          label = label.replace("Tập ", "").trim();
        }
        return `
          <button class="ep-grid-btn ${isActive ? 'active' : ''}" data-index="${item.idx}" title="${item.ep.title}">
            ${label}
          </button>
        `;
      }
    }).join("");

    // Bind listeners
    const selector = useListMode ? ".episode-btn" : ".ep-grid-btn";
    WatchDOM.episodesList.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"));
        changeEpisode(idx);
      });
    });
  }

  renderEpisodesOnly();
}

async function changeEpisode(index, isRestore = false) {
  // Hủy đếm ngược tự chuyển tập nếu có
  cancelAutoplayCountdown();

  // Trước khi đổi sang tập mới, lưu lại tiến trình và hủy phát tập cũ ngay lập tức để tránh lỗi bất đồng bộ
  if (!isRestore) {
    const prevVideo = document.getElementById("videoPlayer");
    if (prevVideo) {
      if (prevVideo.duration > 0) {
        saveMovieProgress(currentMovie.id, currentEpisodeIndex, prevVideo.currentTime, prevVideo.duration);
      }
      try {
        prevVideo.pause();
        prevVideo.src = "";
        prevVideo.load();
      } catch (e) {
        console.log("Lỗi dừng video cũ:", e);
      }
    }
  }

  currentEpisodeIndex = index;
  const episodes = currentMovie.episodes || [];
  if (!episodes[index]) return;

  const buttons = WatchDOM.episodesList.querySelectorAll(".episode-btn, .ep-grid-btn");
  buttons.forEach((btn) => {
    const idx = parseInt(btn.getAttribute("data-index"));
    const isGrid = btn.classList.contains("ep-grid-btn");
    if (idx === index) {
      btn.classList.add("active");
      if (!isGrid) {
        const icon = btn.querySelector("i");
        if (icon) icon.className = "fa-solid fa-circle-play episode-play-icon";
      }
    } else {
      btn.classList.remove("active");
      if (!isGrid) {
        const icon = btn.querySelector("i");
        if (icon) icon.className = "fa-solid fa-play episode-play-icon";
      }
    }
  });

  const episode = episodes[index];

  // Lấy tiến trình xem đã lưu của tập mới
  const progress = getMovieProgress(currentMovie.id);
  const epProgress = (progress && progress.episodes) ? progress.episodes[index] : null;

  if (!isRestore && !epProgress) {
    saveMovieProgress(currentMovie.id, currentEpisodeIndex, 0, 0);
  }
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
  WatchDOM.relatedGrid.innerHTML = related.map(movie => {
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
      <a href="detail?id=${movie.id}" class="movie-card">
        <div class="card-poster-wrapper">
          <img class="card-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
          <div class="card-badges">
            <span class="card-badge badge-quality">HD</span>
            <span class="card-badge badge-rating"><i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}</span>
            ${progressBadgeHTML}
          </div>
          ${progressBarHTML}
          <div class="card-hover-overlay"><div class="play-circle"><i class="fa-solid fa-play"></i></div></div>
        </div>
        <div class="card-info">
          <h3 class="card-title">${movie.title}</h3>
          <p class="card-title-sub">${movie.originalTitle}</p>
        </div>
      </a>
    `;
  }).join("");
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

  // Lắng nghe sự kiện tìm kiếm tập phim
  const searchInput = document.getElementById("episodeSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      episodeQuery = e.target.value;
      renderEpisodes();
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
  // Lưu tiến trình xem cuối cùng khi rời trang
  const video = document.getElementById("videoPlayer");
  if (video && video.duration > 0) {
    saveMovieProgress(currentMovie.id, currentEpisodeIndex, video.currentTime, video.duration);
  }
});
window.addEventListener('resize', () => setTimeout(adjustPlaylistPosition, 100));

document.addEventListener("DOMContentLoaded", () => {
  loadMovieDetails();
  setupNavigation();
});