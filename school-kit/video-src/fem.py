"""يحوّل صوت الجمل (vo/) إلى صوت نسائي بمحلّل WORLD: يرفع طبقة الصوت ×1.8 ويزحزح الرنين (الفورمنت) ×1.17 → vo_f/ + segs.json"""
import pyworld as pw, numpy as np, wave, json, os
os.makedirs('vo_f', exist_ok=True); segs = json.load(open('segs.json')); out = []
PITCH, FORM = 1.8, 1.17
for f, a, b in segs:
    f = f.replace('vo_f/', 'vo/')
    w = wave.open(f); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
    f0, t = pw.harvest(x, sr, f0_floor=60, f0_ceil=400, frame_period=5)
    sp = pw.cheaptrick(x, f0, t, sr); ap = pw.d4c(x, f0, t, sr)
    n = sp.shape[1]; idx = np.arange(n) / FORM; i0 = np.floor(idx).astype(int); fr = idx - i0; i1 = np.minimum(i0 + 1, n - 1)
    sp2 = sp[:, i0] * (1 - fr) + sp[:, i1] * fr          # تزحيح غلاف الطيف لفوق = حلق أقصر
    y = pw.synthesize(np.ascontiguousarray(f0 * PITCH), np.ascontiguousarray(sp2), np.ascontiguousarray(ap), sr, frame_period=5)
    y = y / (np.abs(y).max() + 1e-9) * 0.9
    g = f.replace('vo/', 'vo_f/')
    with wave.open(g, 'wb') as o: o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes((y * 32767).astype('<i2').tobytes())
    out.append([g, 0, round(len(y) / sr, 3)])
json.dump(out, open('segs.json', 'w')); print('تم', len(out), 'جملة')
