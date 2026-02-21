import os
from gtts import gTTS

# Create directory
output_dir = "public/audio/timer"
os.makedirs(output_dir, exist_ok=True)

# Generate audio for 0 to 60 (English for numbers)
for i in range(61):
    text = str(i)
    if i == 0:
        text = "Time is up"  # English for 'End'
    
    # Generate speech in English
    tts = gTTS(text=text, lang='en')
    filename = f"{output_dir}/{i}.mp3"
    tts.save(filename)
    print(f"Generated {filename}")

# Generate interrupt message (Korean)
interrupt_text = "모든 참가자는 5초 뒤 눈을 떠주세요"
tts = gTTS(text=interrupt_text, lang='ko')
tts.save(f"{output_dir}/interrupt.mp3")
print("Generated interrupt.mp3")
