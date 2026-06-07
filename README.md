# Hướng dẫn Quản lý Phim & Tập Phim (FilmXem - Cấu trúc Mới)

Dự án FilmXem hiện tại đã được nâng cấp lên cấu trúc thư mục dạng **Mô-đun mở rộng** (Modular Architecture) và phân tách trang xem phim riêng biệt (`watch.html`).

## 1. Cấu trúc thư mục mới
```
├── index.html            # Trang chủ (Hiển thị danh sách, tìm kiếm, lưu trữ)
├── watch.html            # Trang xem phim riêng biệt (Đầu phát, danh sách tập, gợi ý)
├── detail.html           # Trang xem Movie Card (Thông tin chi tiết bộ phim)
├── css/
│   ├── main.css          # Định nghĩa giao diện chung, sáng/tối, header, footer, bottom nav
│   ├── home.css          # Giao diện riêng của trang chủ (banner, bộ lọc trượt, grid)
│   ├── watch.css         # Giao diện riêng của trang xem phim (bố cục 2 cột, player, sidebar)
│   └── detail.css        # Giao diện riêng của trang Movie Card 
├── js/
│   ├── database.js       # Cơ sở dữ liệu tĩnh tập trung (Nơi thêm/sửa phim & tập phim)
│   ├── core.js           # Xử lý các tác vụ chung (Giao diện sáng/tối, tìm kiếm, Toast)
│   ├── home.js           # Điều khiển hiển thị trang chủ
│   ├── watch.js          # Điều khiển hiển thị trang xem phim (Đọc ?id=... từ link)
│   └── detail.js         # Điều khiển hiển thị trang Movie Card 
├── movies.json           # Khởi tạo nội dung ban đầu,quản lí  
└── README.md             # Hướng dẫn sử dụng này
```

---

## 2. Cách thêm Phim mới
Bạn chỉ cần mở tệp `js/database.js` và thêm một đối tượng phim mới vào mảng `MOVIE_DATABASE` theo mẫu bên dưới:

```javascript
  {
    id: "ten-phim-viet-lien-khong-dau", // Dùng làm ID trong đường dẫn (Ví dụ: watch.html?id=dune-2)
    title: "Tên Tiếng Việt",
    originalTitle: "Tên gốc (Tiếng việt/Anh/Hàn/Nhật...)",
    poster: "Đường dẫn ảnh poster dọc (tỉ lệ 2:3)",
    banner: "Đường dẫn ảnh banner ngang đầu trang (tỉ lệ 16:9)",
    rating: 8.5, // Điểm số đánh giá từ 1 đến 10
    year: 2026,
    duration: "120 phút" hoặc "12 tập",
    genres: ["Hành Động", "Viễn Tưởng", "Phiêu Lưu"], // Thể loại
    description: "Tóm tắt nội dung phim của bạn...",
    isFeatured: false, // Chọn true nếu muốn đưa phim lên banner quảng cáo lớn ở trang chủ
    episodes: [
      {
        episodeId: 1,
        title: "Tập 1",
        videoUrl: "Đường dẫn luồng video (.mp4, .m3u8, v.v.)"
      }
    ]
  },
```

---

## 3. Cơ chế hoạt động của trang xem phim riêng biệt
Khi nhấp vào một thẻ phim trên trang chủ:
1. Trình duyệt chuyển hướng đến địa chỉ: `watch.html?id=[id-cua-phim]` (ví dụ: `watch.html?id=dune-2`).
2. Script `js/watch.js` sẽ tự động tách tham số `id` từ thanh địa chỉ.
3. Tìm kiếm thông tin chi tiết trong `js/database.js` và vẽ ra giao diện chơi phim tương ứng.

Cơ chế này giúp bạn **chỉ cần quản lý một trang giao diện chơi phim duy nhất (`watch.html`)**, nhưng mỗi bộ phim khi mở ra đều có một liên kết độc lập, dễ dàng chia sẻ, tối ưu hóa dung lượng dự án và cực kỳ dễ mở rộng!

## 4. Dễ dàng debug
# Khi dùng Live Server (VS Code Extension)
.\toggle-urls.ps1 local
# Khi deploy lên Apache hosting
.\toggle-urls.ps1 production