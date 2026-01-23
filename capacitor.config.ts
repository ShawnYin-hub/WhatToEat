import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whattoeat.today',
  appName: '今天吃什么',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 如果需要调试，可以取消下面的注释启用本地服务器
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
