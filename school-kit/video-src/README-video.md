# مصدر الفيديو التوجيهي

1. `python3 timeline.py` — يبني `timeline.json` (وصوت `voice.wav` لو فيه `segs.json`).
2. `NODE_PATH=<playwright> node render.js all silent.mp4` — يرسم الفيديو بالتوقيت.
3. `python3 mix.py out.mp4` — يركّب الصوت والنقرات.

## عند وصول ملفات «لهجاتي» (a.mp3 b.mp3 c.mp3 d.mp3)
- `parts.json` من `lines.json` (كل جزء = ملفه)، ثم `python3 voice_sync.py parts.json segs.json`.
- راجع الأسطر المعلّمة «راجع»، ثم الخطوات 1 → 3.
