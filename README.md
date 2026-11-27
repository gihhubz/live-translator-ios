# LiveTranslator — App dịch thuật trực tiếp cho iOS (có mic)

App dịch giọng nói & văn bản trực tiếp, 15 ngôn ngữ (Việt, Anh, Nhật, Hàn, Trung, Pháp, Đức, Tây Ban Nha, Nga, Thái...). Dịch qua MyMemory API miễn phí (~5.000 ký tự/ngày/IP).

## Mic chạy được trong app iOS như thế nào?

Bản web gốc của Gemini dùng Web Speech API (`window.SpeechRecognition`), nhưng WKWebView trong app iOS **không hỗ trợ** API này nên nút mic sẽ chết trong file .ipa.

Bản này sửa lại: mic dùng plugin native **@capacitor-community/speech-recognition** — trên iOS nó gọi **SFSpeechRecognizer** của Apple (nhận diện giọng nói hệ thống, hỗ trợ tiếng Việt), trên web nó tự fallback sang Web Speech API của trình duyệt. Code JS (`www/app.js`) được bundle bằng esbuild thành `www/bundle.js` trước khi đóng gói.

Quyền cần cấp khi mở app lần đầu: Micro + Nhận diện giọng nói (đã khai sẵn trong `Info.plist` qua workflow). Nhận diện giọng nói của Apple cần mạng.

## Build file .ipa miễn phí (không cần máy Mac)

1. Tạo repo mới trên GitHub (ví dụ `live-translator-ios`) và đẩy toàn bộ code lên nhánh `main`/`master`.
2. Vào tab **Actions** → chọn **Build Unsigned iOS IPA** → **Run workflow**.
3. Chờ 3–5 phút, tải artifact **LiveTranslator-IPA** (bên trong có `LiveTranslator.ipa`, chưa ký).
4. Cài lên iPhone bằng SideStore / ESign (Apple ID miễn phí, ký lại mỗi 7 ngày, tối đa 3 app) hoặc chạy trong LiveContainer.

## Dùng nhanh không cần .ipa

Đẩy thư mục `www/` lên host miễn phí (Vercel / Netlify / GitHub Pages), mở bằng Safari trên iPhone → Chia sẻ → Thêm vào MH chính. Trên web, mic dùng Web Speech API của Safari.
