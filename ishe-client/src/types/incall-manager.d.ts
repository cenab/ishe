declare module 'react-native-incall-manager' {
  type ForceSpeakerParam = boolean | 'on' | 'off' | 'auto';

  interface StartOptions {
    media?: 'audio' | 'video';
    ringback?: string;
  }

  const InCallManager: {
    start: (options?: StartOptions) => void;
    stop: () => void;
    setForceSpeakerphoneOn: (flag: ForceSpeakerParam) => void;
    setSpeakerphoneOn?: (flag: boolean) => void; // Android legacy
    setKeepScreenOn?: (flag: boolean) => void;
  };

  export default InCallManager;
}


