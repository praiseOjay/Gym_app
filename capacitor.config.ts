import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.overloadai.app',
  appName: 'Overload AI',
  webDir: 'dist',
  backgroundColor: '#0A0D14',
  server: {
    androidScheme: 'https',
  },
};

export default config;
