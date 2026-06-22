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
    export_to_js(movies)

def export_to_js(movies):
    # Tạo thư mục nếu chưa tồn tại
    os.makedirs(os.path.dirname(OUTPUT_JS), exist_ok=True)
    
    js_content = "const MOVIE_DATABASE = " + json.dumps(movies, indent=2, ensure_ascii=False) + ";\n\nconst GENRES = [\n  \"Tất cả\",\n  \"Hành Động\",\n  \"Viễn Tưởng\",\n  \"Phiêu Lưu\",\n  \"Anime\",\n  \"Kỳ Ảo\",\n  \"Kinh Dị\",\n  \"Kịch Tính\",\n  \"Lãng Mạn\",\n  \"Hình Sự\",\n  \"Kỳ ảo (Fantasy)\",\n  \"Ẩm Thực\",\n  \"Shounen\",\n  \"Hài Hước\",\n  \"Đời Thường\",\n  \"Học Đường\"\n];"
    
    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f" Đã xuất ra file {OUTPUT_JS} (sẵn sàng thay thế vào dự án)")

def list_movies(movies):
    if not movies:
        print(" Chưa có phim nào.")
        return
    print("\n DANH SÁCH PHIM:")
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
    movies.insert(0, new_movie) # Chèn phim mới vào đầu danh sách để hiển thị trên cùng
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
    print(f"\n Thêm tập cho phim: {movie['title']} (ID tự động: {next_id})")
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
    # Di chuyển phim lên đầu danh sách để hiển thị phim mới cập nhật lên đầu trang chủ
    movies.pop(idx)
    movies.insert(0, movie)
    save_data(movies)
    print(f" Đã thêm tập '{title}' cho phim '{movie['title']}'")

def add_episodes_bulk(movies):
    if not movies:
        print(" ❌ Chưa có phim nào, hãy thêm phim trước.")
        return
    
    list_movies(movies)
    try:
        idx = int(input("\nChọn số thứ tự phim cần thêm hàng loạt: ")) - 1
        if idx < 0 or idx >= len(movies):
            print(" ❌ Số thứ tự không hợp lệ")
            return
        movie = movies[idx]
    except ValueError:
        print(" ❌ Vui lòng nhập số")
        return

    file_path = "link.txt"
    if not os.path.exists(file_path):
        print(f" ❌ Không tìm thấy file '{file_path}'. Vui lòng tạo file này ở cùng thư mục script.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        links = [line.strip() for line in f if line.strip()]

    if not links:
        print(" ❌ File link.txt trống hoặc không có link hợp lệ.")
        return

    print(f"\n Tìm thấy {len(links)} đường link trong file '{file_path}'.")

    episodes = movie.get('episodes', [])
    auto_next_id = max([ep['episodeId'] for ep in episodes], default=0) + 1
    
    try:
        start_num_input = input(f"Bắt đầu từ số tập mấy? (Để trống để tự động lấy tiếp theo là Tập {auto_next_id}): ").strip()
        if start_num_input == "":
            start_num = auto_next_id
        else:
            start_num = int(start_num_input)
            if start_num < 1:
                print("  Số tập phải lớn hơn hoặc bằng 1. Đã tự động đổi về 1.")
                start_num = 1
    except ValueError:
        print("  Nhập sai định dạng số. Sử dụng số tập tự động mặc định.")
        start_num = auto_next_id

    current_num = start_num
    for video_url in links:
        next_id = max([ep['episodeId'] for ep in episodes], default=0) + 1
        title = f"Tập {current_num}"
        
        new_ep = {
            "episodeId": next_id,
            "title": title,
            "videoUrl": video_url
        }
        episodes.append(new_ep)
        print(f"  Đã chuẩn bị: {title} -> {video_url}")
        current_num += 1

    movie['episodes'] = episodes
    # Di chuyển phim lên đầu danh sách để hiển thị phim mới cập nhật lên đầu trang chủ
    movies.pop(idx)
    movies.insert(0, movie)
    save_data(movies)
    print(f"  Thêm thành công {len(links)} tập phim vào '{movie['title']}'!")

def delete_episode(movies):
    if not movies:
        print(" ❌ Chưa có phim nào.")
        return
    list_movies(movies)
    try:
        idx = int(input("\nChọn số thứ tự phim: ")) - 1
        if idx < 0 or idx >= len(movies):
            print(" ❌ Số thứ tự không hợp lệ")
            return
        movie = movies[idx]
    except ValueError:
        print(" ❌ Vui lòng nhập số")
        return

    episodes = movie.get('episodes', [])
    if not episodes:
        print(f" ❌ Phim '{movie['title']}' chưa có tập nào để xóa.")
        return

    print(f"\n Danh sách tập của phim: {movie['title']}:")
    for i, ep in enumerate(episodes, 1):
        print(f"{i}. {ep['title']} (ID: {ep['episodeId']})")
    
    try:
        ep_idx = int(input("\nChọn số thứ tự tập muốn xóa (nhập 0 để hủy): ")) - 1
        if ep_idx == -1:
            print(" Hủy bỏ.")
            return
        if ep_idx < 0 or ep_idx >= len(episodes):
            print(" ❌ Số thứ tự tập không hợp lệ")
            return
        
        deleted_ep = episodes.pop(ep_idx)
        movie['episodes'] = episodes
        save_data(movies)
        print(f" Đã xóa tập '{deleted_ep['title']}' của phim '{movie['title']}'!")
    except ValueError:
        print(" ❌ Vui lòng nhập số")
        return

def delete_episodes_bulk(movies):
    if not movies:
        print(" ❌ Chưa có phim nào.")
        return
    list_movies(movies)
    try:
        idx = int(input("\nChọn số thứ tự phim: ")) - 1
        if idx < 0 or idx >= len(movies):
            print(" ❌ Số thứ tự không hợp lệ")
            return
        movie = movies[idx]
    except ValueError:
        print(" ❌ Vui lòng nhập số")
        return

    episodes = movie.get('episodes', [])
    if not episodes:
        print(f" ❌ Phim '{movie['title']}' chưa có tập nào để xóa.")
        return

    print(f"\n Danh sách tập của phim: {movie['title']}:")
    for i, ep in enumerate(episodes, 1):
        print(f"{i}. {ep['title']} (ID: {ep['episodeId']})")
    
    input_str = input("\nNhập các số thứ tự tập muốn xóa (VD: 1, 2, 5 hoặc khoảng 10-15, nhập 0 để hủy): ").strip()
    if input_str == "0" or not input_str:
        print(" Hủy bỏ.")
        return
        
    # Parse indices to delete
    indices_to_delete = []
    parts = input_str.split(',')
    for part in parts:
        part = part.strip()
        if '-' in part:
            try:
                start, end = part.split('-')
                start_val = int(start.strip())
                end_val = int(end.strip())
                if start_val > end_val:
                    start_val, end_val = end_val, start_val
                for i in range(start_val, end_val + 1):
                    if 1 <= i <= len(episodes):
                        indices_to_delete.append(i - 1)
            except ValueError:
                pass
        else:
            try:
                val = int(part)
                if 1 <= val <= len(episodes):
                    indices_to_delete.append(val - 1)
            except ValueError:
                pass
                
    # Remove duplicates and sort descending
    indices_to_delete = sorted(list(set(indices_to_delete)), reverse=True)
    
    if not indices_to_delete:
        print(" ❌ Không tìm thấy tập phim nào tương ứng để xóa.")
        return
        
    print(f"\n Bạn đã chọn xóa {len(indices_to_delete)} tập:")
    for idx_del in reversed(indices_to_delete): # Show in normal order to the user
        print(f"  - {episodes[idx_del]['title']}")
        
    confirm = input("Bạn có chắc chắn muốn xóa những tập này? (y/n): ").strip().lower()
    if confirm != 'y':
        print(" Đã hủy xóa.")
        return
        
    # Perform deletion
    deleted_titles = []
    for idx_del in indices_to_delete:
        deleted_ep = episodes.pop(idx_del)
        deleted_titles.append(deleted_ep['title'])
        
    movie['episodes'] = episodes
    save_data(movies)
    print(f" Đã xóa thành công {len(deleted_titles)} tập phim!")

def main():
    movies = load_data()
    while True:
        print("\n" + "="*50)
        print(" QUẢN LÝ PHIM & TẬP")
        print("1. Xem danh sách phim")
        print("2. Thêm phim mới")
        print("3. Thêm một tập thủ công")
        print("4. Thêm tập hàng loạt từ file 'link.txt'")
        print("5. Xóa một tập")
        print("6. Xóa tập hàng loạt")
        print("7. Xuất ra database.js (cập nhật file JS)")
        print("0. Thoát")
        choice = input("Chọn: ").strip()
        if choice == "0":
            print(" Tạm biệt!")
            break
        elif choice == "1":
            list_movies(movies)
        elif choice == "2":
            add_movie(movies)
        elif choice == "3":
            add_episode(movies)
        elif choice == "4":
            add_episodes_bulk(movies)
        elif choice == "5":
            delete_episode(movies)
        elif choice == "6":
            delete_episodes_bulk(movies)
        elif choice == "7":
            export_to_js(movies)  
        else:
            print(" Lựa chọn không hợp lệ")

if __name__ == "__main__":
    main()