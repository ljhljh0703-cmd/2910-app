import numpy as np
from scipy.io import wavfile
from pydub import AudioSegment
import os

# Settings
sample_rate = 44100
duration = 10  # 10 seconds (will loop)
frequency = 60  # Low drone sound

# Generate sine wave
t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
audio_data = 0.5 * np.sin(2 * np.pi * frequency * t)

# Convert to 16-bit PCM
audio_data = (audio_data * 32767).astype(np.int16)

# Save as WAV first
wav_filename = "temp_bgm.wav"
wavfile.write(wav_filename, sample_rate, audio_data)

# Convert to MP3 using pydub
sound = AudioSegment.from_wav(wav_filename)
output_dir = "public/audio"
os.makedirs(output_dir, exist_ok=True)
sound.export(f"{output_dir}/bgm.mp3", format="mp3")

# Clean up
os.remove(wav_filename)
print("Generated bgm.mp3")
