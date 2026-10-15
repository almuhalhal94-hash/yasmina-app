import subprocess, re, json, sys, math

def sil(f, noise='-32dB', d=0.18):
    o = subprocess.run(['ffmpeg', '-v', 'info', '-i', f, '-af', f'silencedetect=noise={noise}:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    ss = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', o)]
    se = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', o)]
    return list(zip(ss, se))

def dur(f):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)

def W(t):
    t = re.sub('<[^>]+>', '', t)
    return len(re.sub(r'[ً-ْٰـ]', '', t).replace(' ', ''))

def dp(f, lines):
    S = sil(f); D = dur(f)
    st = S[0][1] if S and S[0][0] < 0.05 else 0.0
    en = S[-1][0] if S and S[-1][1] > D - 0.05 else D
    S = [s for s in S if s[0] > st + 0.3 and s[1] < en - 0.3]
    w = [max(1, W(l)) for l in lines]; n = len(lines); pts = [(st, st)] + S + [(en, en)]
    if len(pts) - 1 < n:
        raise SystemExit(f'{f}: الوقفات ({len(pts)-2}) أقل من الجمل ({n}) - اطلب تسجيلا بوقفات أوضح')
    R = sum(w) / ((en - st) - 0.35 * (n - 1)); best = {(0, 0): (0, None)}
    for k in range(1, n + 1):
        for j in range(1, len(pts)):
            if (k == n) != (j == len(pts) - 1): continue
            bb = 1e9; arg = None
            for i in range(j):
                if (k - 1, i) not in best: continue
                d = pts[j][0] - pts[i][1]
                if d <= 0.3: continue
                c = best[(k - 1, i)][0] + math.log(d * R / w[k - 1]) ** 2
                if k < n: c -= 0.6 * (pts[j][1] - pts[j][0])
                if c < bb: bb = c; arg = i
            if arg is not None: best[(k, j)] = (bb, arg)
    j = len(pts) - 1; k = n; seq = []
    while k > 0:
        i = best[(k, j)][1]; seq.append((pts[i][1], pts[j][0])); j = i; k -= 1
    return seq[::-1]

if __name__ == '__main__':
    if sys.argv[1] == '--sil':
        for a, b in sil(sys.argv[2], *(sys.argv[3:4]), *([float(sys.argv[4])] if len(sys.argv) > 4 else [])): print(f'{a:7.2f} - {b:7.2f}  ({b-a:4.2f}s)')
        sys.exit()
    parts = json.load(open(sys.argv[1], encoding='utf-8')); out = []; rows = []
    for p in parts:
        for (a, b), l in zip(dp(p['file'], p['lines']), p['lines']):
            rows.append((p['file'], a, b, W(l) / (b - a), l)); out.append([p['file'], round(a, 2), round(b, 2)])
    med = sorted(r[3] for r in rows)[len(rows) // 2]
    for f, a, b, rate, l in rows:
        flag = '  <-- راجع' if abs(rate - med) / med > 0.45 else ''
        print(f'{f} {a:6.2f}-{b:6.2f} ({b-a:5.2f}s) {rate:4.1f}  {l[:40]}{flag}')
    json.dump(out, open(sys.argv[2], 'w'))
