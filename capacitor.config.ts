import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.staticquo.app',
  appName: 'StaticQuo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: true,
    },
  },
};

export default config;
