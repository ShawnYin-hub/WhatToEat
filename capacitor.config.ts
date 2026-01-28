import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whattoeat.today',
  appName: '今天吃什么',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // 开发模式：取消注释以连接到本地开发服务器
    // 注意：需要将 localhost 替换为你的电脑局域网 IP 地址
    // 例如：url: 'http://192.168.1.100:5173',
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
