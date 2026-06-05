/**
 * CƠ SỞ DỮ LIỆU PHIM (MOVIE DATABASE)
 * 
 * Hướng dẫn thêm phim mới:
 * Copy phần tử mẫu bên dưới dán vào mảng MOVIE_DATABASE:
 * 
 * {
 *   id: "ten-phim-viet-lien-khong-dau",
 *   title: "Tên Tiếng Việt",
 *   originalTitle: "Tên gốc (Tiếng Anh/Hàn/Nhật...)",
 *   poster: "Đường dẫn ảnh dọc (tỉ lệ 2:3)",
 *   banner: "Đường dẫn ảnh ngang (tỉ lệ 16:9)",
 *   rating: 8.5,
 *   year: 2026,
 *   duration: "120 phút" hoặc "12 tập",
 *   genres: ["Hành Động", "Viễn Tưởng"],
 *   description: "Tóm tắt nội dung...",
 *   isFeatured: false,
 *   episodes: [
 *     {
 *       episodeId: 1,
 *       title: "Tập 1",
 *       videoUrl: "Link video trực tiếp hoặc link nhúng iframe"
 *     }
 *   ]
 * }
 */

const MOVIE_DATABASE = [
  {
    id: "dune-2",
    title: "Hành Tinh Cát: Phần Hai",
    originalTitle: "Dune: Part Two",
    poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
    rating: 9.0,
    year: 2024,
    duration: "166 phút",
    genres: ["Hành Động", "Viễn Tưởng", "Phiêu Lưu"],
    description: "Paul Atreides hội ngộ với Chani và người Fremen khi đang tìm cách trả thù những kẻ âm mưu tiêu diệt gia đình mình. Đối mặt với sự lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ, anh nỗ lực ngăn chặn một tương lai khủng khiếp mà chỉ mình anh có thể thấy trước.",
    isFeatured: true,
    episodes: [
      {
        episodeId: 1,
        title: "Viet sub",
        videoUrl: "https://fcloud.live/cinema/eyJzbHVnIjoiaGFuaC10aW5oLWNhdC1waGFuLWhhaS0xNzAzODc2MjMxIiwiZXBpc29kZVNsdWciOiJ0YXAtZnVsbCIsInNlcnZlciI6IlZpZXRzdWIgIzEiLCJ0eXBlIjoibTN1OCJ9._Ns5r2iluvCB7n53gOdO1ILIjJT2oN5fciRUUcTINkg"
      }
    ]
  },
  {
    id: "suzume",
    title: "Khóa Chặt Cửa Nào Suzume",
    originalTitle: "Suzume no Tojimari",
    poster: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80",
    rating: 8.8,
    year: 2023,
    duration: "122 phút",
    genres: ["Anime", "Kỳ Ảo", "Phiêu Lưu"],
    description: "Hành trình của cô gái 17 tuổi Suzume Iwato tại một thị trấn yên bình ở vùng Kyushu. Cô gặp một chàng trai trẻ đang tìm kiếm một 'cánh cửa'. Suzume đi theo anh ta và tìm thấy một cánh cửa cũ kỹ đứng trơ trọi trong đống đổ nát trên núi. Khi cô đưa tay mở nó ra, những hiểm họa liên tục ập đến khắp nước Nhật.",
    isFeatured: false,
    episodes: [
      {
        episodeId: 1,
        title: "Tập Full HD",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      }
    ]
  },
  {
    id: "demon-slayer-infinity-castle",
    title: "Thanh Gươm Diệt Quỷ: Pháo Đài Vô Tận",
    originalTitle: "Demon Slayer: Infinity Castle",
    poster: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1600&auto=format&fit=crop&q=80",
    rating: 9.3,
    year: 2025,
    duration: "3 Tập",
    genres: ["Anime", "Hành Động", "Kỳ Ảo"],
    description: "Bộ ba phim điện ảnh chuyển thể từ phần cuối cùng của mạch truyện chính trong Thanh Gươm Diệt Quỷ. Cuộc chiến sinh tử hoành tráng nhất giữa Sát Quỷ Đoàn và Chúa Quỷ Kibutsuji Muzan tại mê cung Pháo Đài Vô Tận khổng lồ.",
    isFeatured: false,
    episodes: [
      {
        episodeId: 1,
        title: "Tập 1",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 2,
        title: "Tập 2",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 3,
        title: "Tập 3 (Tập Cuối)",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      }
    ]
  },
  {
    id: "spiderman-no-way-home",
    title: "Người Nhện: Không Còn Đường Về",
    originalTitle: "Spider-Man: No Way Home",
    poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=1600&auto=format&fit=crop&q=80",
    rating: 8.7,
    year: 2021,
    duration: "148 phút",
    genres: ["Hành Động", "Viễn Tưởng", "Phiêu Lưu"],
    description: "Lần đầu tiên trong lịch sử điện ảnh của Người Nhện, danh tính người hàng xóm thân thiện của chúng ta bị bại lộ, khiến trách nhiệm làm một Siêu anh hùng xung đột với cuộc sống bình thường của anh ta và đặt những người anh ta quan tâm nhất vào tình thế nguy hiểm.",
    isFeatured: false,
    episodes: [
      {
        episodeId: 1,
        title: "Tập Full HD - Thuyết Minh",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      }
    ]
  },
  {
    id: "breaking-bad",
    title: "Biến Chất (Phần 1)",
    originalTitle: "Breaking Bad (Season 1)",
    poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=1600&auto=format&fit=crop&q=80",
    rating: 9.5,
    year: 2008,
    duration: "7 Tập",
    genres: ["Hành Động", "Kịch Tính", "Hình Sự"],
    description: "Một giáo viên hóa học cấp ba mắc bệnh ung thư giai đoạn cuối đã bắt tay với một cựu học sinh của mình để sản xuất và bán chất cấm nhằm bảo đảm tương lai tài chính cho gia đình mình.",
    isFeatured: false,
    episodes: [
      {
        episodeId: 1,
        title: "Tập 1",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 2,
        title: "Tập 2",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 3,
        title: "Tập 3",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 4,
        title: "Tập 4",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 5,
        title: "Tập 5",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 6,
        title: "Tập 6",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 7,
        title: "Tập 7",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      }
    ]
  },
  {
    id: "stranger-things-4",
    title: "Cậu Bé Mất Tích (Mùa 4)",
    originalTitle: "Stranger Things (Season 4)",
    poster: "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1600&auto=format&fit=crop&q=80",
    rating: 8.9,
    year: 2022,
    duration: "9 Tập",
    genres: ["Kinh Dị", "Viễn Tưởng", "Kỳ Ảo"],
    description: "Đã sáu tháng trôi qua kể từ Trận chiến Starcourt, mang lại nỗi kinh hoàng và sự tàn phá cho Hawkins. Vật lộn với hậu quả, nhóm bạn của chúng ta lần đầu tiên phải chia cắt – và việc điều hướng sự phức tạp của trường trung học không làm mọi việc dễ dàng hơn. Trong thời điểm dễ bị tổn thương nhất này, một mối đe dọa siêu nhiên mới đáng sợ xuất hiện, mang theo một bí ẩn khủng khiếp, mà nếu được giải quyết, có thể chấm dứt nỗi kinh hoàng của Thế giới Ngược.",
    isFeatured: false,
    episodes: [
      {
        episodeId: 1,
        title: "Tập 1",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      },
      {
        episodeId: 2,
        title: "Tập 2",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      }
    ]
  },
  {
    id: "your-name",
    title: "Tên Cậu Là Gì?",
    originalTitle: "Kimi no Na wa.",
    poster: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1600&auto=format&fit=crop&q=80",
    rating: 9.1,
    year: 2016,
    duration: "106 phút",
    genres: ["Anime", "Lãng Mạn", "Kỳ Ảo"],
    description: "Mitsuha, một nữ sinh trung học sống ở vùng nông thôn Nhật Bản, và Taki, một nam sinh trung học sống ở Tokyo, bất ngờ bị tráo đổi cơ thể cho nhau một cách bí ẩn mỗi khi ngủ. Họ bắt đầu giao tiếp bằng cách để lại tin nhắn trên điện thoại và nhật ký, tạo nên một sợi dây liên kết đặc biệt vượt qua cả thời gian và không gian.",
    isFeatured: false,
    episodes: [
      {
        episodeId: 1,
        title: "Tập Full HD",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      }
    ]
  }
];

const GENRES = [
  "Tất cả",
  "Hành Động",
  "Viễn Tưởng",
  "Phiêu Lưu",
  "Anime",
  "Kỳ Ảo",
  "Kinh Dị",
  "Kịch Tính",
  "Lãng Mạn",
  "Hình Sự"
];
