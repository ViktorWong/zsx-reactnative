// 环境配置
const isDevelopment = false // __DEV__;

export const config = {
  webViewUrl: isDevelopment 
    ? 'http://192.168.201.144:5173/'  // 开发环境
    : 'https://tanjitest.xmbus.com/xmzsx-car-app-h5/index.html', // 生产环境
  apiBaseUrl: isDevelopment
    ? 'http://192.168.201.144:3000/api'
    : 'https://tanjitest.xmbus.com/xmzsx-car-app-h5/api',
};