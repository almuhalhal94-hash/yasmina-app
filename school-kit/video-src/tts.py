"""صوت فصحى محلي (بدون نت) بمحرّك sherpa-onnx ونموذج Piper العربي ar_JO-kareem → vo/L*.wav + segs.json"""
import sherpa_onnx, json, numpy as np, wave, os, sys
M = sys.argv[1]; os.makedirs('vo', exist_ok=True)
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(
    model=M + '/ar_JO-kareem-medium.onnx', tokens=M + '/tokens.txt', data_dir=M + '/espeak-ng-data'), num_threads=4))
tts = sherpa_onnx.OfflineTts(cfg)
T = json.load(open('tts_lines.json', encoding='utf-8')); L = json.load(open('lines.json', encoding='utf-8')); segs = []
for x, t in zip(L, T):
    a = tts.generate(t, sid=0, speed=1.08); y = np.array(a.samples, np.float32); sr = a.sample_rate
    e = np.abs(y) > 0.01; i0 = max(0, np.argmax(e) - int(.03 * sr)); i1 = min(len(y), len(y) - np.argmax(e[::-1]) + int(.08 * sr)); y = y[i0:i1]
    f = f"vo/{x['id']}.wav"
    with wave.open(f, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
    segs.append([f, 0, round(len(y) / sr, 3)]); print(x['id'], round(len(y) / sr, 2), 'ث')
json.dump(segs, open('segs.json', 'w'))
