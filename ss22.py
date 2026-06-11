import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

# 1. Cấu hình trình duyệt Chrome
options = webdriver.ChromeOptions()
# options.add_argument('--headless') # Bỏ dấu '#' ở đầu dòng này nếu muốn chạy ngầm không hiện cửa sổ bóc tách
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')

# Tự động thiết lập Chrome Driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

try:
    # 2. Điều hướng đến tập phim cần cào
    url = "https://yumei-anime.com/thu-vien/pokemon/tv-series/season-1/002"
    print(f"Đang truy cập: {url}")
    driver.get(url)
    
    # 3. Chờ Next.js render xong toàn bộ giao diện và gọi link video về
    print("Đang chờ JavaScript load trình phát video (5 giây)...")
    time.sleep(5)
    
    print("\n================ KẾT QUẢ CÀO LINK ================")
    
    # Hướng 1: Tìm các thẻ <video> trực tiếp trên trang
    videos = driver.find_elements(By.TAG_NAME, "video")
    found_any = False
    
    for index, video in enumerate(videos):
        src = video.get_attribute("src")
        if src:
            print(f"-> [Thẻ Video {index+1}]: {src}")
            found_any = True
            
    # Hướng 2: Tìm các thẻ <iframe> nhúng từ server ngoài (Ok.ru, GDrive, HydraX...)
    iframes = driver.find_elements(By.TAG_NAME, "iframe")
    for index, iframe in enumerate(iframes):
        src = iframe.get_attribute("src")
        if src:
            print(f"-> [Iframe Nhúng {index+1}]: {src}")
            found_any = True
            
    if not found_any:
        print("[!] Không tìm thấy thẻ video hoặc iframe nào công khai. Khả năng cao link ẩn trong Network.")

except Exception as e:
    print(f"[Xảy ra lỗi]: {e}")

finally:
    # 4. Đóng trình duyệt sau khi quét xong
    driver.quit()
    print("==================================================")
    print("Đã hoàn thành quét và đóng trình duyệt sạch sẽ.")