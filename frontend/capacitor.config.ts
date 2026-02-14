import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.in.tagsphere',
  appName: 'TagSphere',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
