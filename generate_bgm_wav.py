import numpy as np
from scipy.io import wavfile
import os

# Settings
sample_rate = 44100
duration = 10  # 10 seconds (will loop)
frequency_left = 60  # Low drone (Binaural beats effect)
frequency_right = 65

# Generate waves
t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
left_channel = 0.5 * np.sin(2 * np.pi * frequency_left * t)
right_channel = 0.5 * np.sin(2 * np.pi * frequency_right * t)

# Combine stereo
audio_data = np.vstack((left_channel, right_channel)).T
audio_data = (audio_data * 32767).astype(np.int16)

# Save as WAV
output_dir = "public/audio"
os.makedirs(output_dir, exist_ok=True)
wavfile.write(f"{output_dir}/bgm.wav", sample_rate, audio_data)

print("Generated bgm.wav")
