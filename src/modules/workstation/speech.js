export function speakMessage({ enabled, locale, text }) {
  if (!enabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : 'zh-CN';
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
