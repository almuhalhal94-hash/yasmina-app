"""يبني timeline.json (+ voice.wav لو فيه segs.json) من lines.json.
   بدون صوت: مدة الجملة = عدد الحروف ÷ 13 (حسب سكل الدروس).
   segs.json = [[file, start, end], ...] بنفس ترتيب lines.json (من voice_sync.py)."""
import json, re, os, subprocess, numpy as np, wave, sys
L = json.load(open('lines.json', encoding='utf-8'))
W = lambda t: len(re.sub(r'[ً-ْٰـ]', '', t).replace(' ', ''))
SR = 48000
segs = json.load(open('segs.json')) if os.path.exists('segs.json') else None
dur = [(b - a) for _, a, b in segs] if segs else [W(x['t']) / 13 for x in L]
LEAD, GAP, TAIL, STEP_MIN = 0.5, 0.45, 0.8, 2.6
EXTRA = {'s1': 0.4, 's2': 1.2, 's3': 1.6, 's6': 2.2, 's7': 2.6}   # وقت إضافي للمشهد البصري
t = 0.0; sc = {}; steps = {'s4': [], 's5': []}; starts = []
order = []
for x in L:
    if x['sc'] not in order: order.append(x['sc'])
for s in order:
    idx = [i for i, x in enumerate(L) if x['sc'] == s]
    a = t; t += LEAD if s != 's1' else 0.6
    for k, i in enumerate(idx):
        starts.append((i, t))
        if L[i].get('step'): steps[s].append(round(t - 0.15, 3)); t += max(dur[i] + 0.6, STEP_MIN)
        else: t += dur[i] + (GAP if k < len(idx) - 1 else 0)
    t += TAIL + EXTRA.get(s, 0); sc[s] = [round(a, 3), round(t, 3)]
TLJ = {'sc': sc, 'dur': round(t, 3), 'steps': steps, 'lines': [{'id': L[i]['id'], 's': round(st, 3), 'd': round(dur[i], 3)} for i, st in sorted(starts)]}
json.dump(TLJ, open('timeline.json', 'w'), ensure_ascii=False, indent=1)
print('المدة', round(t, 1), 'ث ·', 'بالصوت' if segs else 'تقديري')
if segs:
    out = np.zeros(int(SR * (t + 0.5)), np.float32)
    for (f, a, b), (i, st) in zip(segs, sorted(starts)):
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-to', str(b), '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
        y = np.frombuffer(raw, np.float32); n = min(len(y), int(SR * 0.02)); y = y.copy(); y[:n] *= np.linspace(0, 1, n); y[-n:] *= np.linspace(1, 0, n)
        p = int(st * SR); out[p:p + len(y)] += y[:len(out) - p]
    pk = np.abs(out).max() or 1; out = out / pk * 0.89
    with wave.open('voice.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
    print('voice.wav جاهز')
