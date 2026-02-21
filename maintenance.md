# 🛠️ 2910 App Maintenance Guide

## 1. 개요 (Overview)
이 문서는 '2910 보드게임 컴패니언 앱'의 유지보수, 업데이트, 배포 절차를 설명합니다. 이 프로젝트는 **Vite + React**로 구축되었으며 **Vercel**을 통해 배포됩니다.

- **GitHub Repository**: https://github.com/ljhljh0703-cmd/2910-app
- **Live Site**: https://2910-app.vercel.app

---

## 2. 개발 환경 설정 (Local Setup)
새로운 작업 환경에서 프로젝트를 시작할 때 사용합니다.

```bash
# 1. 저장소 복제 (Clone)
git clone https://github.com/ljhljh0703-cmd/2910-app.git
cd 2910-app

# 2. 의존성 설치 (Dependencies)
npm install

# 3. 로컬 개발 서버 실행 (Local Server)
npm run dev
# -> http://localhost:5173 접속
```

---

## 3. 코드 수정 및 업데이트 절차 (Update Workflow)

### 3.1 기능 수정 (Code Changes)
1.  로컬 환경에서 코드를 수정합니다 (예: `src/App.tsx`, `public/bg.png` 교체 등).
2.  브라우저에서 `npm run dev` 상태로 테스트합니다.
3.  터미널에서 빌드 테스트를 수행하여 오류가 없는지 확인합니다.
    ```bash
    npm run build
    ```

### 3.2 배포 (Deployment)
Vercel은 GitHub와 연동되어 있어, **코드를 푸시하기만 하면 자동으로 배포**됩니다.

```bash
# 1. 변경된 파일 스테이징
git add .

# 2. 커밋 메시지 작성 (변경 내용 요약)
git commit -m "배경 이미지 변경 및 TTS 로직 수정"

# 3. GitHub에 푸시 (자동 배포 트리거)
git push
```
*   `git push` 후 약 1~2분 뒤 Live Site에 반영됩니다.

---

## 4. 주요 유지보수 포인트 (Key Areas)

### 🔊 오디오 (Audio/TTS)
*   **파일 위치**: `src/App.tsx` 내 `playTTS` 함수.
*   **MP3 교체 시**: 추후 TTS를 실제 성우 녹음 파일로 교체할 경우, `playTTS` 함수 내부를 `new Audio('/audio/filename.mp3').play()` 형태로 변경해야 합니다.
*   **주의사항**: 모바일 브라우저 정책상 오디오는 **반드시 사용자의 터치/클릭 이벤트 내부**에서 실행되어야 합니다.

### 🖼️ 이미지 (Images)
*   **배경 이미지**: `public/bg.png` 파일을 덮어쓰면 됩니다. (파일명 유지 권장)
*   **크기/비율**: 모바일 세로 화면을 고려하여 중요한 콘텐츠가 중앙이나 하단에 위치한 이미지를 사용하는 것이 좋습니다.

### 📱 모바일 최적화 (Mobile Optimization)
*   **Wake Lock**: 화면 꺼짐 방지 로직이 `src/hooks/useWakeLock.ts`에 구현되어 있습니다.
*   **Safe Area**: 아이폰 노치/홈 바 대응을 위해 `pb-safe-bottom` 클래스가 최상위 `div`에 적용되어 있습니다.
