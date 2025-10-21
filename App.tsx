import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// 移除微信SDK导入
import WebViewWithNative from './components/WebViewWithNative';
import CustomNavigation from './components/CustomNavigation';

export default function App() {
  // const [webViewUrl] = useState('https://tanjitest.xmbus.com/xmzsx-car-app-h5/index.html');
  const [webViewUrl] = useState('http://192.168.201.134:5500/h5-demo.html');
  const [pageTitle, setPageTitle] = useState('加载中...');
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = React.useRef<any>(null);

  useEffect(() => {
    // 移除微信SDK初始化
    console.log('应用启动成功');
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    setPageTitle(navState.title || '网页');
    setCanGoBack(navState.canGoBack);
  };

  const handleBackPress = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  const handleClose = () => {
    console.log('关闭应用');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <CustomNavigation
          title={pageTitle}
          canGoBack={canGoBack}
          onBackPress={handleBackPress}
          onClose={handleClose}
        />
        <WebViewWithNative
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          onNavigationStateChange={handleNavigationStateChange}
        />
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
