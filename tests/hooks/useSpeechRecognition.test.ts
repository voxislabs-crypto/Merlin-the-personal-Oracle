import { isSpeechRecognitionSupported } from '@/hooks/useSpeechRecognition';

describe('isSpeechRecognitionSupported', () => {
  const w = window as Window & {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  const originalSpeech = w.SpeechRecognition;
  const originalWebkit = w.webkitSpeechRecognition;

  afterEach(() => {
    if (originalSpeech === undefined) delete w.SpeechRecognition;
    else w.SpeechRecognition = originalSpeech;
    if (originalWebkit === undefined) delete w.webkitSpeechRecognition;
    else w.webkitSpeechRecognition = originalWebkit;
  });

  it('returns false when SpeechRecognition is missing', () => {
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it('returns true when webkitSpeechRecognition exists', () => {
    w.webkitSpeechRecognition = function WebkitSpeechRecognition() {};
    expect(isSpeechRecognitionSupported()).toBe(true);
  });
});
