"""يمزج صوت الجمل (voice.wav إن وُجد) مع نقرات خفيفة (sfx.json) ويركّبها على silent.mp4 → out.mp4. بلا موسيقى."""
import json, numpy as np, wave, os, subprocess, sys
SR = 48000; out_name = sys.argv[1] if len(sys.argv) > 1 else 'out.mp4'
D = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'silent.mp4'], capture_output=True, text=True).stdout)
a = np.zeros(int(SR * (D + .5)))
def tone(f, d, v, t, sweep=0):
    n = int(SR * d); x = np.arange(n) / SR; fr = f * (1 + sweep * x / d); env = np.minimum(1, x / .005) * np.exp(-x / (d / 4))
    s = v * np.sin(2 * np.pi * np.cumsum(fr) / SR) * env; i = int(t * SR); a[i:i + n] += s[:max(0, len(a) - i)]
V = os.path.exists('voice.wav'); k = .5 if V else 1   # النقرات أخفض تحت الكلام
for kind, t in json.load(open('sfx.json')):
    if kind == 'pop': tone(660, .18, .16 * k, t, .4)
    elif kind == 'tap': tone(1200, .07, .10 * k, t)
    elif kind == 'chime': tone(784, .5, .12 * k, t); tone(1175, .6, .10 * k, t + .12); tone(1568, .7, .08 * k, t + .24)
if V:
    w = wave.open('voice.wav'); v = np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32767.0; a[:len(v)] += v[:len(a)]
a = np.clip(a, -1, 1)
with wave.open('mix.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a * 32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'silent.mp4', '-i', 'mix.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-af', 'loudnorm=I=-16:TP=-1.5', '-shortest', '-movflags', '+faststart', out_name], check=True)
print('→', out_name)
