#!/usr/bin/env bash
# يبني الفيديو التوجيهي بصوت «لهجاتي»: ضع a.mp3 b.mp3 c.mp3 d.mp3 في هذا المجلد ثم:  bash build.sh
# يحتاج: python3 + numpy، ffmpeg، node + playwright (npm i playwright && npx playwright install chromium)
set -e
cd "$(dirname "$0")"
for f in a b c d; do [ -f "$f.mp3" ] || { echo "❌ الملف $f.mp3 ناقص"; exit 1; }; done
python3 voice_sync.py parts.json segs.json        # يقطّع كل ملف إلى جمله (راجع الأسطر المعلّمة «راجع»)
python3 timeline.py                                # توقيت المشاهد من مدد الجمل + voice.wav
node render.js all silent.mp4                      # رسم الفيديو
python3 mix.py "فيديو-تثبيت-ياسمينة-بالصوت.mp4"     # الصوت + نقرات خفيفة، بلا موسيقى
echo "✅ جاهز: فيديو-تثبيت-ياسمينة-بالصوت.mp4"
