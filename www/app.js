// Live Translator — mic dùng plugin native @capacitor-community/speech-recognition
// (iOS: SFSpeechRecognizer của Apple, chạy được trong WKWebView của app Capacitor).
// Trên web, plugin tự fallback sang Web Speech API của trình duyệt.
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const languages = {
    "vi-VN": "Tiếng Việt", "en-US": "Tiếng Anh", "ja-JP": "Tiếng Nhật",
    "ko-KR": "Tiếng Hàn", "zh-CN": "Tiếng Trung", "fr-FR": "Tiếng Pháp",
    "de-DE": "Tiếng Đức", "es-ES": "Tiếng Tây Ban Nha", "ru-RU": "Tiếng Nga",
    "th-TH": "Tiếng Thái", "id-ID": "Tiếng Indonesia", "it-IT": "Tiếng Ý",
    "pt-PT": "Tiếng Bồ Đào Nha", "ar-SA": "Tiếng Ả Rập", "hi-IN": "Tiếng Hindi"
};

const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');
const sourceText = document.getElementById('sourceText');
const targetText = document.getElementById('targetText');
const micBtn = document.getElementById('micBtn');
const micStatus = document.getElementById('micStatus');
const translateStatus = document.getElementById('translateStatus');

for (const code in languages) {
    sourceLangSelect.add(new Option(languages[code], code));
    targetLangSelect.add(new Option(languages[code], code));
}
sourceLangSelect.value = "vi-VN";
targetLangSelect.value = "en-US";

// --- 1. Dịch trực tiếp (debounce) qua MyMemory API miễn phí ---
let typingTimer;
async function translateText() {
    const text = sourceText.value.trim();
    if (!text) { targetText.value = ""; translateStatus.textContent = ""; return; }
    const from = sourceLangSelect.value.split('-')[0];
    const to = targetLangSelect.value.split('-')[0];
    if (from === to) { targetText.value = text; return; }
    translateStatus.textContent = "Đang dịch...";
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData) { targetText.value = data.responseData.translatedText; translateStatus.textContent = "Xong"; }
    } catch (error) { translateStatus.textContent = "Lỗi mạng"; }
}
sourceText.addEventListener('input', () => { clearTimeout(typingTimer); typingTimer = setTimeout(translateText, 450); });
sourceLangSelect.addEventListener('change', translateText);
targetLangSelect.addEventListener('change', translateText);
document.getElementById('swapBtn').addEventListener('click', () => {
    [sourceLangSelect.value, targetLangSelect.value] = [targetLangSelect.value, sourceLangSelect.value];
    [sourceText.value, targetText.value] = [targetText.value, sourceText.value];
    translateText();
});

// --- 2. Mic: nhận diện giọng nói native (iOS) / Web Speech API (web) ---
let isRecording = false;
let baseText = '';

function setRecordingUI(recording) {
    isRecording = recording;
    micBtn.classList.toggle('recording', recording);
    micBtn.innerHTML = recording ? "⏹ Dừng" : "🎤 Nói";
    micStatus.textContent = recording ? "Đang nghe..." : "Sẵn sàng";
}

async function stopRecording() {
    if (!isRecording) return;
    try { await SpeechRecognition.stop(); } catch (e) { /* đã dừng rồi */ }
    setRecordingUI(false);
    translateText();
}

// Nghe kết quả từng phần: nối vào cuối đoạn text đã có trước khi bấm mic.
SpeechRecognition.addListener('partialResults', (data) => {
    if (!isRecording) return;
    const match = (data.matches && data.matches[0]) || '';
    if (!match) return;
    sourceText.value = baseText ? baseText + ' ' + match : match;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(translateText, 450);
});

micBtn.addEventListener('click', async () => {
    if (isRecording) { await stopRecording(); return; }
    try {
        const { available } = await SpeechRecognition.available();
        if (!available) {
            micStatus.textContent = "Thiết bị không hỗ trợ Mic";
            return;
        }
        const perm = await SpeechRecognition.requestPermissions();
        if (perm && perm.speechRecognition && perm.speechRecognition !== 'granted') {
            micStatus.textContent = "Cần cấp quyền Mic + Nhận diện giọng nói";
            return;
        }
        baseText = sourceText.value.trim();
        await SpeechRecognition.start({
            language: sourceLangSelect.value,
            partialResults: true,
            popup: false,
            maxResults: 1
        });
        setRecordingUI(true);
    } catch (e) {
        micStatus.textContent = "Lỗi Mic: " + (e && e.message ? e.message : e);
        setRecordingUI(false);
    }
});

// --- 3. Đọc văn bản (Text to Speech) ---
function speak(text, lang) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
}
document.getElementById('speakSourceBtn').addEventListener('click', () => speak(sourceText.value, sourceLangSelect.value));
document.getElementById('speakTargetBtn').addEventListener('click', () => speak(targetText.value, targetLangSelect.value));

// --- 4. Tiện ích khác ---
document.getElementById('clearBtn').addEventListener('click', () => {
    sourceText.value = ""; targetText.value = ""; translateStatus.textContent = "";
});
document.getElementById('copyBtn').addEventListener('click', () => {
    if (!targetText.value) return;
    navigator.clipboard.writeText(targetText.value);
    translateStatus.textContent = "Đã chép!";
});

// Ghi chú nền tảng (debug): native hay web
console.log('LiveTranslator chạy trên:', Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web');
