import json
import os

DATA_FILE = "movies.json"
OUTPUT_JS = "js/database.js"   # Đường dẫn tương đối, sẽ tạo thư mục js nếu chưa có

def load_data():
    if not os.path.exists(DATA_FILE):
        print(" Không tìm thấy movies.json. Tạo mới với dữ liệu rỗng.")
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(movies):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)
    print(" Đã lưu vào movies.json")

def export_to_js(movies):
    # Tạo thư mục nếu chưa tồn tại
    os.makedirs(os.path.dirname(OUTPUT_JS), exist_ok=True)
    
    js_content = "const MOVIE_DATABASE = " + json.dumps(movies, indent=2, ensure_ascii=False) + ";\n\nconst GENRES = [\n  \"Tất cả\",\n  \"Hành Động\",\n  \"Viễn Tưởng\",\n  \"Phiêu Lưu\",\n  \"Anime\",\n  \"Kỳ Ảo\",\n  \"Kinh Dị\",\n  \"Kịch Tính\",\n  \"Lãng Mạn\",\n  \"Hình Sự\"\n];"
    
    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f" Đã xuất ra file {OUTPUT_JS} (sẵn sàng thay thế vào dự án)")

def list_movies(movies):
    if not movies:
        print("📭 Chưa có phim nào.")
        return
    print("\n📋 DANH SÁCH PHIM:")
    for idx, m in enumerate(movies, 1):
        print(f"{idx}. {m['title']} ({m['originalTitle']}) - {len(m.get('episodes', []))} tập")

def add_movie(movies):
    print("\n THÊM PHIM MỚI")
    movie_id = input("ID phim (viết liền, không dấu, ví dụ: dune-2): ").strip()
    if not movie_id:
        print(" ID không được để trống")
        return
    if any(m['id'] == movie_id for m in movies):
        print(" ID đã tồn tại")
        return
    title = input("Tên tiếng Việt: ").strip()
    original_title = input("Tên gốc: ").strip()
    poster = input("Link poster (ảnh dọc): ").strip()
    banner = input("Link banner (ảnh ngang): ").strip()
    try:
        rating = float(input("Điểm (VD: 8.5): ").strip())
    except:
        rating = 0.0
    year = input("Năm phát hành: ").strip()
    duration = input("Thời lượng (VD: 120 phút hoặc 12 tập): ").strip()
    genres_input = input("Thể loại (cách nhau bằng dấu phẩy, VD: Hành Động,Viễn Tưởng): ").strip()
    genres = [g.strip() for g in genres_input.split(",") if g.strip()]
    description = input("Mô tả ngắn: ").strip()
    is_featured = input("Có phải phim nổi bật không? (y/n): ").strip().lower() == 'y'
    new_movie = {
        "id": movie_id,
        "title": title,
        "originalTitle": original_title,
        "poster": poster,
        "banner": banner,
        "rating": rating,
        "year": year,
        "duration": duration,
        "genres": genres,
        "description": description,
        "isFeatured": is_featured,
        "episodes": []
    }
    movies.append(new_movie)
    save_data(movies)
    print(f"Đã thêm phim '{title}'")

def add_episode(movies):
    if not movies:
        print(" Chưa có phim nào, hãy thêm phim trước.")
        return
    list_movies(movies)
    try:
        idx = int(input("Chọn số thứ tự phim: ")) - 1
        if idx < 0 or idx >= len(movies):
            print(" Số thứ tự không hợp lệ")
            return
        movie = movies[idx]
    except ValueError:
        print(" Vui lòng nhập số")
        return

    episodes = movie.get('episodes', [])
    next_id = max([ep['episodeId'] for ep in episodes], default=0) + 1
    print(f"\n➕ Thêm tập cho phim: {movie['title']} (ID tự động: {next_id})")
    title = input("Tiêu đề tập (VD: Tập 2, Vietsub...): ").strip()
    if not title:
        title = f"Tập {next_id}"
    video_url = input("Link video (mp4, m3u8, hoặc iframe fcloud.live): ").strip()
    if not video_url:
        print("Link không được để trống")
        return
    new_ep = {
        "episodeId": next_id,
        "title": title,
        "videoUrl": video_url
    }
    episodes.append(new_ep)
    movie['episodes'] = episodes
    save_data(movies)
    print(f" Đã thêm tập '{title}' cho phim '{movie['title']}'")

def main():
    movies = load_data()
    while True:
        print("\n" + "="*50)
        print(" QUẢN LÝ PHIM & TẬP")
        print("1. Xem danh sách phim")
        print("2. Thêm phim mới")
        print("3. Thêm tập cho phim có sẵn")
        print("4. Xuất ra database.js (cập nhật file JS)")
        print("0. Thoát")
        choice = input("Chọn: ").strip()
        if choice == "0":
            print("👋 Tạm biệt!")
            break
        elif choice == "1":
            list_movies(movies)
        elif choice == "2":
            add_movie(movies)
        elif choice == "3":
            add_episode(movies)
        elif choice == "4":
            export_to_js(movies)   # ĐÃ SỬA: gọi đúng hàm
        else:
            print(" Lựa chọn không hợp lệ")

if __name__ == "__main__":
    main()