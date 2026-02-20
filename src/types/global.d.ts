export {};

declare global {
  interface Window {
    __ttsUtterance: SpeechSynthesisUtterance | null;
  }
}
