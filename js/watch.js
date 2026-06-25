// ==========================================
// WATCHPAGE CONTROLLER - HỖ TRỢ IFRAME NHÚNG (KHÔNG CHO NHẬP LINK NGOÀI)
// ==========================================
let currentMovie = null;
let currentEpisodeIndex = 0;
let currentServerIndex = 0;
let currentVideoBlobUrl = null;
let autoplayTimer = null;
let autoplayOverlay = null;

// ==========================================
// SUPABASE COMMENTS & VIEWS INTEGRATION
// ==========================================
let supabaseClient = null;
let selectedCommentRating = 5;
let hasTrackedViewForCurrentEpisode = false;

// Tải lượt xem và hiển thị lên giao diện
async function fetchAndDisplayViews() {
  const viewsText = document.getElementById("viewCountText");
  if (!viewsText) return;

  if (!supabaseClient) {
    const success = await initSupabase();
    if (!success) return;
  }

  if (!currentMovie) return;

  try {
    const { data, error } = await supabaseClient
      .from('episode_views')
      .select('views')
      .eq('movie_id', currentMovie.id)
      .eq('episode_index', currentEpisodeIndex)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 là mã khi không tìm thấy dòng dữ liệu
      throw error;
    }

    const views = data ? data.views : 0;
    viewsText.textContent = views.toLocaleString();
  } catch (err) {
    console.error("Lỗi khi tải lượt xem:", err);
  }
}

// Ghi nhận lượt xem mới khi bắt đầu xem video
async function trackEpisodeView() {
  if (hasTrackedViewForCurrentEpisode) return;
  hasTrackedViewForCurrentEpisode = true;

  if (!supabaseClient) {
    const success = await initSupabase();
    if (!success) return;
  }

  if (!currentMovie) return;

  try {
    // Gọi Postgres RPC function để tự động tăng lượt xem một cách bảo mật
    const { error } = await supabaseClient.rpc('increment_episode_view', {
      p_movie_id: currentMovie.id,
      p_episode_index: currentEpisodeIndex
    });

    if (error) throw error;

    // Cập nhật lại số lượt xem hiển thị trên màn hình
    fetchAndDisplayViews();
  } catch (err) {
    console.warn("RPC increment failed, falling back to client-side upsert:", err);
    fallbackTrackView();
  }
}

// Cơ chế dự phòng khi không cài đặt RPC trên database
async function fallbackTrackView() {
  try {
    let currentViews = 0;
    const { data } = await supabaseClient
      .from('episode_views')
      .select('views')
      .eq('movie_id', currentMovie.id)
      .eq('episode_index', currentEpisodeIndex)
      .single();

    if (data) {
      currentViews = data.views;
    }

    const { error } = await supabaseClient
      .from('episode_views')
      .upsert({
        movie_id: currentMovie.id,
        episode_index: currentEpisodeIndex,
        views: currentViews + 1
      }, { onConflict: 'movie_id,episode_index' });

    if (!error) {
      fetchAndDisplayViews();
    }
  } catch (e) {
    console.error("Fallback track view failed:", e);
  }
}
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
  const config = await getSupabaseConfig();
  if (config.url && config.key && typeof window.supabase !== 'undefined') {
    try {
      supabaseClient = window.supabase.createClient(config.url, config.key);
      console.log("Supabase Client initialized successfully.");
      return true;
    } catch (err) {
      console.error("Lỗi khởi tạo Supabase Client:", err);
    }
  } else {
    console.warn("Supabase library chưa được nạp hoặc cấu hình trống.");
  }
  return false;
}

// Định dạng thời gian hiển thị bình luận
function formatCommentDate(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 60000) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Định dạng ngày tháng năm thông thường
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const hr = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${d}/${m}/${y} lúc ${hr}:${min}`;
  } catch (e) {
    return dateString;
  }
}

// Xử lý nạp và hiển thị danh sách bình luận
async function loadAndRenderComments() {
  const container = document.getElementById("commentsContainer");
  const loading = document.getElementById("commentsLoading");
  if (!container || !loading) return;

  loading.style.display = "block";
  container.style.display = "none";
  container.innerHTML = "";

  if (!supabaseClient) {
    const success = await initSupabase();
    if (!success) {
      loading.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> Không thể kết nối với hệ thống bình luận.`;
      return;
    }
  }

  if (!currentMovie) return;

  try {
    const { data, error } = await supabaseClient
      .from('comments')
      .select('*')
      .eq('movie_id', currentMovie.id)
      .eq('episode_index', currentEpisodeIndex)
      .order('created_at', { ascending: false });

    if (error) throw error;

    loading.style.display = "none";
    container.style.display = "flex";

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="comment-empty">
          <i class="fa-regular fa-comment-dots" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 8px; display: block;"></i>
          Chưa có bình luận nào cho tập này. Hãy là người đầu tiên chia sẻ cảm nghĩ nhé!
        </div>
      `;
      return;
    }

    container.innerHTML = data.map((comment, index) => {
      // Lấy ký tự đầu tiên của tên làm avatar
      const firstLetter = (comment.user_name || "U").substring(0, 1).toUpperCase();
      
      // Vẽ các sao đánh giá
      let starsHTML = "";
      const rating = comment.rating || 5;
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          starsHTML += `<i class="fa-solid fa-star"></i>`;
        } else {
          starsHTML += `<i class="fa-regular fa-star"></i>`;
        }
      }

      const delay = index * 0.03;
      return `
        <div class="comment-item" style="animation-delay: ${delay}s;">
          <div class="comment-avatar">${firstLetter}</div>
          <div class="comment-content-wrapper">
            <div class="comment-item-header">
              <span class="comment-user-name">${escapeHtml(comment.user_name)}</span>
              <div class="comment-meta-info">
                <div class="comment-stars">${starsHTML}</div>
                <span class="comment-date">${formatCommentDate(comment.created_at)}</span>
              </div>
            </div>
            <p class="comment-text">${escapeHtml(comment.content)}</p>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Lỗi khi tải bình luận:", err);
    loading.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color: #f97316;"></i> Lỗi khi tải bình luận. Vui lòng tải lại trang.`;
  }
}

// Cài đặt chọn sao đánh giá
function setupCommentStars() {
  const starsContainer = document.getElementById("commentStarsSelect");
  if (!starsContainer) return;

  const stars = starsContainer.querySelectorAll(".star-btn");

  function highlightStars(val) {
    stars.forEach(star => {
      const starVal = parseInt(star.getAttribute("data-value"));
      if (starVal <= val) {
        star.className = "fa-solid fa-star star-btn selected";
      } else {
        star.className = "fa-regular fa-star star-btn";
      }
    });
  }

  // Mặc định chọn 5 sao
  highlightStars(selectedCommentRating);

  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedCommentRating = parseInt(star.getAttribute("data-value"));
      highlightStars(selectedCommentRating);
    });

    star.addEventListener("mouseenter", () => {
      const hoverVal = parseInt(star.getAttribute("data-value"));
      stars.forEach(s => {
        const sVal = parseInt(s.getAttribute("data-value"));
        if (sVal <= hoverVal) {
          s.classList.add("hovered");
        } else {
          s.classList.remove("hovered");
        }
      });
    });

    star.addEventListener("mouseleave", () => {
      stars.forEach(s => s.classList.remove("hovered"));
    });
  });
}

// Cài đặt nút gửi bình luận
function setupCommentSubmit() {
  const btnSubmit = document.getElementById("btnSubmitComment");
  const inputName = document.getElementById("commentUserName");
  const textareaContent = document.getElementById("commentContent");

  if (!btnSubmit || !inputName || !textareaContent) return;

  // Tải tên đã lưu từ lần bình luận trước
  const savedName = localStorage.getItem("filmXem_commenter_name");
  if (savedName) {
    inputName.value = savedName;
  }

  btnSubmit.addEventListener("click", async () => {
    const userName = inputName.value.trim();
    const content = textareaContent.value.trim();

    if (!userName) {
      if (typeof showToast === 'function') showToast("Vui lòng nhập tên của bạn!");
      inputName.focus();
      return;
    }

    if (!content) {
      if (typeof showToast === 'function') showToast("Vui lòng nhập nội dung bình luận!");
      textareaContent.focus();
      return;
    }

    if (!supabaseClient) {
      if (typeof showToast === 'function') showToast("Đang kết nối lại cơ sở dữ liệu...");
      const success = await initSupabase();
      if (!success) {
        if (typeof showToast === 'function') showToast("Không thể kết nối cơ sở dữ liệu!");
        return;
      }
    }

    // Đổi trạng thái nút gửi
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang gửi...`;

    try {
      const { error } = await supabaseClient
        .from('comments')
        .insert([
          {
            movie_id: currentMovie.id,
            episode_index: currentEpisodeIndex,
            user_name: userName,
            rating: selectedCommentRating,
            content: content
          }
        ]);

      if (error) throw error;

      // Lưu tên người bình luận vào localStorage cho lần sau
      localStorage.setItem("filmXem_commenter_name", userName);

      // Reset nội dung bình luận
      textareaContent.value = "";
      
      // Reset về 5 sao mặc định
      selectedCommentRating = 5;
      const starsContainer = document.getElementById("commentStarsSelect");
      if (starsContainer) {
        starsContainer.querySelectorAll(".star-btn").forEach(star => {
          star.className = "fa-solid fa-star star-btn selected";
        });
      }

      if (typeof showToast === 'function') showToast("Đăng bình luận thành công!");
      
      // Load lại danh sách bình luận
      await loadAndRenderComments();

    } catch (err) {
      console.error("Lỗi khi gửi bình luận:", err);
      if (typeof showToast === 'function') showToast("Gửi bình luận thất bại. Vui lòng thử lại!");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Gửi bình luận`;
    }
  });
}


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
  const backdropWrapper = document.getElementById("watchBackdropWrapper");
  if (backdropWrapper) {
    backdropWrapper.style.setProperty("--movie-banner", `url('${currentMovie.banner}')`);
    backdropWrapper.style.setProperty("--movie-poster", `url('${currentMovie.poster}')`);
    backdropWrapper.style.backgroundImage = `var(--movie-banner)`;
  }
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
// ========== XỬ LÝ ĐA SERVER & VIDEO / IFRAME ==========

// Lấy danh sách server của một tập phim (hỗ trợ cả backup và tự động tạo mirror cho HuggingFace)
function getEpisodeServers(episode) {
  const servers = [];
  if (!episode) return servers;

  // 1. Kiểm tra mảng servers rõ ràng nếu có
  if (episode.servers && Array.isArray(episode.servers)) {
    return episode.servers;
  }

  // 2. Thêm server gốc
  if (episode.videoUrl) {
    servers.push({
      name: "Server 1",
      url: episode.videoUrl
    });
  }

  // 3. Thêm backup 1
  if (episode.videoUrlBackup) {
    servers.push({
      name: "Server 2",
      url: episode.videoUrlBackup
    });
  }

  // 4. Thêm backup 2
  if (episode.videoUrlBackup2) {
    servers.push({
      name: "Server 3",
      url: episode.videoUrlBackup2
    });
  }

  // 5. Tự động tạo Server 2 (Mirror) nếu chỉ có 1 server gốc là Hugging Face
  if (servers.length === 1 && episode.videoUrl && episode.videoUrl.includes("huggingface.co")) {
    const mirrorUrl = episode.videoUrl.replace("huggingface.co", "hf-mirror.com");
    servers.push({
      name: "Server 2 (HF Mirror)",
      url: mirrorUrl
    });
  }

  return servers;
}

// Render bộ chọn Server
function renderServerSelector(episode) {
  const wrapper = document.getElementById("serverSelectorWrapper");
  const btnGroup = document.getElementById("serverBtnGroup");
  if (!wrapper || !btnGroup) return;

  const servers = getEpisodeServers(episode);
  if (servers.length <= 1) {
    wrapper.style.display = "none";
    return;
  }

  wrapper.style.display = "flex";
  btnGroup.innerHTML = servers.map((server, idx) => {
    const isActive = idx === currentServerIndex;
    return `
      <button class="server-btn ${isActive ? 'active' : ''}" data-server-idx="${idx}">
        ${server.name}
      </button>
    `;
  }).join("");

  btnGroup.querySelectorAll(".server-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-server-idx"));
      if (idx === currentServerIndex) return;

      currentServerIndex = idx;
      
      btnGroup.querySelectorAll(".server-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const currentEp = currentMovie.episodes[currentEpisodeIndex];
      const selectedServer = servers[currentServerIndex];
      if (currentEp && selectedServer) {
        const prevVideo = document.getElementById("videoPlayer");
        let restoreTime = 0;
        if (prevVideo && prevVideo.duration > 0) {
          restoreTime = prevVideo.currentTime;
        }
        
        renderPlayerForUrl(selectedServer.url, currentEp.title).then(() => {
          const newVideo = document.getElementById("videoPlayer");
          if (newVideo && restoreTime > 0) {
            newVideo.addEventListener('loadedmetadata', () => {
              newVideo.currentTime = restoreTime;
              newVideo.play().catch(e => console.log('Autoplay play error:', e));
            }, { once: true });
          }
        });
      }
    });
  });
}

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
  if (!originalUrl) return originalUrl;

  // Hỗ trợ tự động proxy các link lưu trữ trên GitHub Releases
  // để tránh lỗi CORS và lỗi Range Request khi tua/streaming trực tiếp trên trình duyệt.
  if (originalUrl.includes('github.com') && originalUrl.includes('/releases/download/')) {
    return `https://gh-proxy.com/${originalUrl}`;
  }

  if (!originalUrl.includes('fcloud.live') || originalUrl.includes('/cinema/')) {
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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok || response.status === 206) {
      return true;
    }
  } catch (err) {
    // Lỗi kết nối mạng sẽ chạy xuống khối thử nghiệm GET ở dưới
  }

  // Fallback: Thử dùng fetch GET với mode 'no-cors' (phù hợp cho các link chặn HEAD hoặc có tham số truy vấn như S3/CDN)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
    clearTimeout(timeoutId);
    return true; // Nếu kết nối mạng thành công thì coi như khả dụng
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

// Định dạng thời gian (giây -> mm:ss hoặc hh:mm:ss)
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Hiển thị thông báo Tiếp tục xem
function showResumeNotification(video, time) {
  const wrapper = document.querySelector('.watch-player-wrapper');
  if (!wrapper) return;

  // Xóa thông báo cũ nếu có
  const oldNotif = wrapper.querySelector('.resume-notification');
  if (oldNotif) oldNotif.remove();

  const notif = document.createElement('div');
  notif.className = 'resume-notification';
  notif.style.opacity = '0';
  notif.style.transform = 'translateY(20px)';

  notif.innerHTML = `
    <span class="resume-text">
      <i class="fa-solid fa-clock-rotate-left"></i> 
      Tiếp tục xem từ <strong>${formatTime(time)}</strong>
    </span>
    <button class="btn-restart-video">Xem lại từ đầu</button>
    <i class="fa-solid fa-xmark btn-close-resume"></i>
  `;

  wrapper.appendChild(notif);

  // Kích hoạt animation hiện lên
  setTimeout(() => {
    notif.style.opacity = '1';
    notif.style.transform = 'translateY(0)';
  }, 50);

  // Sự kiện nút đóng
  const closeBtn = notif.querySelector('.btn-close-resume');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notif.style.opacity = '0';
      notif.style.transform = 'translateY(20px)';
      setTimeout(() => notif.remove(), 400);
    });
  }

  // Sự kiện nút xem lại từ đầu
  const restartBtn = notif.querySelector('.btn-restart-video');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      video.currentTime = 0;
      video.play();
      notif.style.opacity = '0';
      notif.style.transform = 'translateY(20px)';
      setTimeout(() => notif.remove(), 400);
    });
  }

  // Tự động đóng sau 8 giây
  setTimeout(() => {
    if (notif.parentNode) {
      notif.style.opacity = '0';
      notif.style.transform = 'translateY(20px)';
      setTimeout(() => notif.remove(), 400);
    }
  }, 8000);
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
    // Tăng lượt xem cho iframe ngay khi tải
    trackEpisodeView();
  } else {
    const video = document.createElement('video');
    video.id = 'videoPlayer';
    video.className = 'watch-video';
    video.controls = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.height = '100%';
    let playableUrl = await getPlayableUrl(videoUrl);
    video.src = playableUrl;
    container.appendChild(video);

    // Tăng lượt xem khi người dùng bắt đầu nhấn phát video (chỉ chạy 1 lần)
    video.addEventListener('play', () => {
      trackEpisodeView();
    }, { once: true });

    // Khôi phục tiến trình xem nếu có cho tập phim hiện tại
    const progress = getMovieProgress(currentMovie.id);
    if (progress && progress.episodes && progress.episodes[activeEpIndex]) {
      const epProgress = progress.episodes[activeEpIndex];
      if (epProgress.time > 5) {
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = epProgress.time;
          showResumeNotification(video, epProgress.time);
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

    let retryCount = 0;
    const onError = async () => {
      // Ngăn chặn các sự kiện lỗi từ thẻ video cũ đã bị hủy/gỡ khỏi DOM khi chuyển server
      if (!video.isConnected || video !== document.getElementById('videoPlayer')) {
        return;
      }

      if (video.hasAttribute('data-error-handled')) return;
      video.setAttribute('data-error-handled', 'true');

      const timeToRestore = video.currentTime;

      retryCount++;
      if (retryCount > 2) {
        console.log("Đã thử tự động tải lại 2 lần nhưng vẫn lỗi. Dừng lại và hiển thị thông báo lỗi.");
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch (e) {
          console.warn("Lỗi tắt âm thanh video ngầm:", e);
        }
        showVideoErrorOnlyRetry(videoUrl);
        return;
      }

      // Kiểm tra xem đường truyền thực tế có truy cập được không
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
        // Nếu đường truyền vẫn tốt (có thể do lỗi nghẽn tạm thời, lỗi tua buffering hoặc bị chặn autoplay), cho phép tự động tải lại
        console.log(`Đường truyền vẫn hoạt động tốt, đang tự động phục hồi video từ mốc ${timeToRestore.toFixed(1)}s (Lần thử thứ ${retryCount})...`);
        video.removeAttribute('data-error-handled');
        try {
          video.load();
          if (timeToRestore > 0.5) {
            video.addEventListener('loadedmetadata', () => {
              video.currentTime = timeToRestore;
              video.play().catch(e => console.log("Không thể tự động phát lại sau khi khôi phục:", e));
            }, { once: true });
          } else {
            await video.play();
          }
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

    WatchDOM.episodesList.innerHTML = filteredEpisodes.map((item, index) => {
      const isActive = item.idx === currentEpisodeIndex;
      const delay = index * 0.02;
      const animStyle = `style="animation-delay: ${delay}s;"`;
      if (useListMode) {
        return `
          <button class="episode-btn ${isActive ? 'active' : ''}" data-index="${item.idx}" ${animStyle}>
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
          <button class="ep-grid-btn ${isActive ? 'active' : ''}" data-index="${item.idx}" title="${item.ep.title}" ${animStyle}>
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
  currentServerIndex = 0; // Reset về server mặc định cho tập mới
  hasTrackedViewForCurrentEpisode = false; // Reset view tracking flag for new episode
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

  const servers = getEpisodeServers(episode);
  const activeServerUrl = servers[currentServerIndex] ? servers[currentServerIndex].url : episode.videoUrl;
  await renderPlayerForUrl(activeServerUrl, episode.title);

  // Render bộ chọn Server
  renderServerSelector(episode);
  
  // Load comments and views for current movie and episode index
  loadAndRenderComments();
  fetchAndDisplayViews();
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
  WatchDOM.relatedGrid.innerHTML = related.map((movie, index) => {
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
      <a href="detail?id=${movie.id}" class="movie-card" style="animation-delay: ${index * 0.05}s;">
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

// Cài đặt phím tắt điều khiển và Modal trợ giúp
function setupKeyboardShortcuts() {
  const modal = document.getElementById("shortcutsModal");
  const btnHelp = document.getElementById("btnShortcutsHelp");
  const btnClose = document.getElementById("btnCloseShortcutsModal");

  // Xử lý đóng/mở Modal trợ giúp
  if (btnHelp && modal) {
    btnHelp.addEventListener("click", () => {
      modal.classList.add("active");
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener("click", () => {
      modal.classList.remove("active");
    });
    
    // Click ngoài modal để đóng
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }

  // Đóng modal bằng phím Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      modal.classList.remove("active");
    }
  });

  // Xử lý các phím tắt chính
  document.addEventListener("keydown", (e) => {
    // Không nhận phím tắt khi đang nhập liệu trong ô input/textarea
    const activeEl = document.activeElement;
    if (
      activeEl &&
      (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)
    ) {
      return;
    }

    const video = document.getElementById("videoPlayer");
    const hasVideo = !!video;

    // Phím M: Tắt / Bật tiếng
    if (e.key.toLowerCase() === "m") {
      e.preventDefault();
      if (hasVideo) {
        video.muted = !video.muted;
        if (typeof showToast === 'function') {
          showToast(video.muted ? "🔇 Đã tắt tiếng" : "🔊 Đã bật tiếng");
        }
      } else {
        if (typeof showToast === 'function') showToast("Phím tắt này chỉ dùng cho trình phát HTML5");
      }
    }

    // Phím F: Toàn màn hình
    if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      if (hasVideo) {
        if (!document.fullscreenElement) {
          video.requestFullscreen().catch(err => {
            console.error("Lỗi bật toàn màn hình:", err);
          });
        } else {
          document.exitFullscreen();
        }
      } else {
        if (typeof showToast === 'function') showToast("Phím tắt này chỉ dùng cho trình phát HTML5");
      }
    }

    // Phím N: Tập tiếp theo
    if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      if (currentMovie && currentMovie.episodes) {
        const nextIndex = currentEpisodeIndex + 1;
        if (nextIndex < currentMovie.episodes.length) {
          changeEpisode(nextIndex);
          if (typeof showToast === 'function') {
            showToast(`⏭️ Đang chuyển sang ${currentMovie.episodes[nextIndex].title}`);
          }
        } else {
          if (typeof showToast === 'function') showToast("Đã là tập cuối cùng rồi!");
        }
      }
    }

    // Phím cách (Space): Phát / Tạm dừng
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      if (hasVideo) {
        if (video.paused) {
          video.play();
          if (typeof showToast === 'function') showToast("▶️ Tiếp tục phát");
        } else {
          video.pause();
          if (typeof showToast === 'function') showToast("⏸️ Đã tạm dừng");
        }
      }
    }

    // Mũi tên Trái: Tua lùi 10s
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (hasVideo) {
        video.currentTime = Math.max(0, video.currentTime - 10);
        if (typeof showToast === 'function') showToast("⏪ Tua lùi 10 giây");
      }
    }

    // Mũi tên Phải: Tua tiến 10s
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (hasVideo) {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
        if (typeof showToast === 'function') showToast("⏩ Tua tiến 10 giây");
      }
    }

    // Mũi tên Lên: Tăng âm lượng 10%
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hasVideo) {
        video.volume = Math.min(1, video.volume + 0.1);
        video.muted = false; // Tự động unmute khi tăng âm lượng
        const volPercent = Math.round(video.volume * 100);
        if (typeof showToast === 'function') showToast(`🔊 Âm lượng: ${volPercent}%`);
      }
    }

    // Mũi tên Xuống: Giảm âm lượng 10%
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hasVideo) {
        video.volume = Math.max(0, video.volume - 0.1);
        const volPercent = Math.round(video.volume * 100);
        if (typeof showToast === 'function') showToast(`🔉 Âm lượng: ${volPercent}%`);
      }
    }
  });
}

// Cài đặt chức năng Báo Lỗi qua Gmail
function setupErrorReporting() {
  const modal = document.getElementById("reportModal");
  const btnOpen = document.getElementById("btnReportError");
  const btnClose = document.getElementById("btnCloseReportModal");
  const form = document.getElementById("reportErrorForm");
  const optionCards = document.querySelectorAll(".report-option-card");
  const hiddenInput = document.getElementById("reportErrorType");

  function resetFormAndCards() {
    if (form) form.reset();
    if (hiddenInput) hiddenInput.value = "";
    if (optionCards) {
      optionCards.forEach(c => c.classList.remove("active"));
    }
  }

  if (optionCards && hiddenInput) {
    optionCards.forEach(card => {
      card.addEventListener("click", () => {
        optionCards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        hiddenInput.value = card.getAttribute("data-value");
      });
    });
  }

  if (btnOpen && modal) {
    btnOpen.addEventListener("click", () => {
      modal.classList.add("active");
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener("click", () => {
      modal.classList.remove("active");
      resetFormAndCards();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        resetFormAndCards();
      }
    });
  }

  // Đóng modal bằng phím Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      modal.classList.remove("active");
      resetFormAndCards();
    }
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const descTextarea = document.getElementById("reportDescription");
      
      if (!hiddenInput || !currentMovie) return;

      const errorText = hiddenInput.value;
      if (!errorText) {
        // Rung nhẹ khi chưa chọn
        const grid = document.getElementById("reportOptionsGrid");
        if (grid) {
          grid.classList.add("shake-animation");
          setTimeout(() => grid.classList.remove("shake-animation"), 300);
        }
        if (typeof showToast === 'function') {
          showToast("Vui lòng chọn loại lỗi!");
        }
        return;
      }

      const description = descTextarea ? descTextarea.value.trim() : "";
      
      const epTitle = currentMovie.episodes[currentEpisodeIndex] 
        ? currentMovie.episodes[currentEpisodeIndex].title 
        : `Tập ${currentEpisodeIndex + 1}`;

      // Xây dựng nội dung Email gửi đến khanh4346k9@gmail.com
      const adminEmail = "khanh4346k9@gmail.com";
      const subject = `[Bao loi FilmXem] ${currentMovie.title} - ${epTitle}`;
      
      let body = `Chao Admin,\n\nToi muon bao loi ve tap phim tren he thong FilmXem:\n`;
      body += `--------------------------------------\n`;
      body += `Ten phim: ${currentMovie.title}\n`;
      body += `Tap phim: ${epTitle}\n`;
      body += `Loai loi: ${errorText}\n`;
      if (description) {
        body += `Mo ta chi tiet: ${description}\n`;
      }
      body += `Link xem phim: ${window.location.href}\n`;
      body += `Thoi gian bao cao: ${new Date().toLocaleString()}\n`;
      body += `--------------------------------------\n\n`;
      body += `Rat mong Admin kiem tra va khac phuc loi nay! Cam on Admin.`;

      // Mã hóa URL
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);

      // Phát hiện thiết bị di động
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let mailUrl = "";
      if (isMobile) {
        // Mở app mail mặc định trên Mobile
        mailUrl = `mailto:${adminEmail}?subject=${encodedSubject}&body=${encodedBody}`;
      } else {
        // Mở trang soạn thư của Gmail Web trên Desktop
        mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${adminEmail}&su=${encodedSubject}&body=${encodedBody}`;
      }

      window.open(mailUrl, "_blank");

      // Reset & Đóng
      modal.classList.remove("active");
      resetFormAndCards();

      if (typeof showToast === 'function') {
        showToast("Đã mở trình soạn thư Gmail!");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initSupabase();
  loadMovieDetails();
  setupNavigation();
  setupCommentStars();
  setupCommentSubmit();
  setupKeyboardShortcuts();
  setupErrorReporting();
});