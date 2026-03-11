import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voxislabs.merlin',
  appName: 'Merlin',
  webDir: 'out',
  plugins: {
    LocalNotifications: {
      iconColor: '#10b981',
    },
    BackgroundRunner: {
      label: 'com.voxislabs.merlin.liveoracle',
      src: 'runners/live-oracle-runner.js',
      event: 'liveOracleTick',
      repeat: true,
      interval: 15,
      autoStart: true,
    },
  },
};

export default config;
