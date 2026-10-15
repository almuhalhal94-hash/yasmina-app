# مصدر الفيديو التوجيهي

1. `python3 timeline.py` — يبني `timeline.json` (وصوت `voice.wav` لو فيه `segs.json`).
2. `NODE_PATH=<playwright> node render.js all silent.mp4` — يرسم الفيديو بالتوقيت.
3. `python3 mix.py out.mp4` — يركّب الصوت والنقرات.

## عند وصول ملفات «لهجاتي» (a.mp3 b.mp3 c.mp3 d.mp3)
- `parts.json` من `lines.json` (كل جزء = ملفه)، ثم `python3 voice_sync.py parts.json segs.json`.
- راجع الأسطر المعلّمة «راجع»، ثم الخطوات 1 → 3.

## الصوت المولّد محليًا (بدون نت)
`python3 tts.py <مجلد نموذج vits-piper-ar_JO-kareem-medium>` — يولّد `vo/L*.wav` و`segs.json` من `tts_lines.json` (نصوص مشكولة كاملة). النموذج من إصدارات sherpa-onnx على GitHub.

## الصوت النسائي
بعد `tts.py` شغّل `python3 fem.py` — يرفع طبقة الصوت ×1.8 ويزحزح الرنين ×1.17 (محلّل WORLD عبر pyworld) ويكتب `vo_f/` و`segs.json`، ثم `timeline.py` ← `render.js` ← `mix.py`.
