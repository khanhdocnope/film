import time
import json
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# ================= CẤU HÌNH THÔNG SỐ =================
INPUT_FILE = "note.txt"
OUTPUT_FILE = "m3u8_results.txt"
# ===================================================

# 1. Kiểm tra và đọc file note.txt
if not os.path.exists(INPUT_FILE):
    print(f"[!] Thất bại: File '{INPUT_FILE}' không tồn tại.")
    with open(INPUT_FILE, "w", encoding="utf-8") as f:
        pass
    print(f"[i] Đã tự tạo file '{INPUT_FILE}' rỗng. Hãy điền link vào và chạy lại.")
    import sys; sys.exit()

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    urls = [line.strip() for line in f if line.strip()]

if not urls:
    print(f"[!] File '{INPUT_FILE}' đang trống. Hãy thêm link phim vào (mỗi dòng 1 link).")
    import sys; sys.exit()

print(f"[+] Tìm thấy {len(urls)} link phim cần quét cấu hình mạng.")

# 2. Khởi tạo Trình duyệt ngầm (Chỉ khởi tạo 1 lần để tối ưu tốc độ)
print("\n[➔] Đang khởi động trình duyệt ảo Chrome...")
options = webdriver.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-gpu')
options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

scraped_results = {}

# 3. Vòng lặp quét từng link
try:
    for idx, url in enumerate(urls, 1):
        print(f"\n========================================================")
        print(f"[{idx}/{len(urls)}] Đang tiến hành quét: {url}")
        
        try:
            driver.get(url)
            
            print(" -> Chờ trình phát tải cấu hình phân giải (8 giây)...")
            time.sleep(8)
            
            logs = driver.get_log('performance')
            m3u8_links = set()
            
            for entry in logs:
                log_data = json.loads(entry['message'])['message']
                if log_data['method'] == 'Network.requestWillBeSent':
                    request_url = log_data['params']['request']['url']
                    if '.m3u8' in request_url:
                        m3u8_links.add(request_url)
            
            # --- Thuật toán sàng lọc link Chất lượng cao nhất ---
            if m3u8_links:
                links_list = list(m3u8_links)  # Đã fix lỗi tên biến tại đây
                best_url = None
                
                master_links = [l for l in links_list if 'master' in l.lower() or 'playlist' in l.lower()]
                if master_links:
                    best_url = master_links[0]
                    print(" -> [➔] Trích xuất thành công: Master Playlist (Tự động Max Quality)")
                else:
                    for res in ['1080', '720', '480', '360']:
                        res_links = [l for l in links_list if res in l]
                        if res_links:
                            best_url = res_links[0]
                            print(f" -> [➔] Trích xuất thành công: Luồng độ phân giải {res}p")
                            break
                    
                    if not best_url:
                        best_url = links_list[0]
                        print(" -> [➔] Trích xuất thành công: Luồng mặc định đầu tiên")
                
                print(f" -> Link thu được: {best_url}")
                scraped_results[url] = best_url
            else:
                print(" -> [-] Không tìm thấy luồng phát .m3u8 nào cho trang này.")
                scraped_results[url] = "Không tìm thấy link m3u8"
                
        except Exception as inner_error:
            print(f" -> [!] Lỗi khi truy cập trang: {inner_error}")
            scraped_results[url] = f"Lỗi hệ thống: {inner_error}"

finally:
    # Luôn luôn đóng trình duyệt cho dù có lỗi xảy ra
    driver.quit()
    print("\n=================== QUÁ TRÌNH HOÀN TẤT ===================")

# ================= PHẦN DƯỚI NÀY ĐÃ ĐƯỢC CĂN LỀ CHUẨN XÁC =================

# 4. Xuất kết quả thu hoạch ra file m3u8_results.txt
with open(OUTPUT_FILE, "w", encoding="utf-8") as out_f:
    out_f.write("=== DANH SÁCH LINK M3U8 CHẤT LƯỢNG CAO QUÉT ĐƯỢC ===\n\n")
    for original_url, m3u8_url in scraped_results.items():
        out_f.write(f"Trang xem phim: {original_url}\n")
        out_f.write(f"Link M3U8 Max:  {m3u8_url}\n")
        out_f.write("-" * 60 + "\n")

print(f"\n[✓] Đã xuất toàn bộ dữ liệu cào được vào file '{OUTPUT_FILE}'!")

# 5. Tự động tải file kết quả về máy tính cá nhân
try:
    from google.colab import files
    print("[➔] Đang yêu cầu trình duyệt tải file về máy...")
    files.download(OUTPUT_FILE)
except ImportError:
    print("[!] Chức năng tự tải chỉ hoạt động trên môi trường Google Colab.")
except Exception as e:
    print(f"[!] Không thể tải file tự động do lỗi trình duyệt: {e}. Vui lòng tải thủ công ở cột bên trái.")