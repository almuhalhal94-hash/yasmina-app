# مصدر الفيديو التوجيهي

## الطريقة السريعة (بصوت «لهجاتي»)
ضع `a.mp3 b.mp3 c.mp3 d.mp3` في هذا المجلد ثم: `bash build.sh`
يحتاج: python3 + numpy، ffmpeg، node + playwright (`npm i playwright && npx playwright install chromium`).
(لو عندك كروم بمسار خاص: `CHROME=/path/to/chrome bash build.sh`)

## الخطوات بالتفصيل
1. `python3 voice_sync.py parts.json segs.json` — يقطّع كل ملف إلى جمله. راجع الأسطر المعلّمة «راجع»؛ لعرض الوقفات بدقة: `python3 voice_sync.py --sil a.mp3 -30dB 0.08`.
2. `python3 timeline.py` — توقيت المشاهد من مدد الجمل + `voice.wav`.
3. `node render.js all silent.mp4` — رسم الفيديو (`node render.js preview 5 30 60` لقطات للفحص).
4. `python3 mix.py out.mp4` — الصوت + نقرات خفيفة، بلا موسيقى.

## ملفات
- `lines.json` الجمل ومشاهدها · `parts.json` أي جمل في أي ملف · `video/index.html` المشاهد.
- `tts.py` + `tts_lines.json` صوت محلي تجريبي (نموذج Piper عربي، رجالي) — غير معتمد.
