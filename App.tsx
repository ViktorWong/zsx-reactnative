import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WebViewWithNative, { WebViewWithNativeRef } from './components/WebViewWithNative';
import CustomNavigation from './components/CustomNavigation';
import { config } from './config'; // 导入配置

export default function App() {
  const [webViewUrl] = useState(config.webViewUrl); // 使用配置中的地址
  const [pageTitle, setPageTitle] = useState('加载中...');
  const [canGoBack, setCanGoBack] = useState(false);
   const [showNavigation, setShowNavigation] = useState(true); // 新增状态
  const [navigationStyle, setNavigationStyle] = useState({
    backgroundColor: '#FFFFFF',
    textColor: '#000000'
  });
  const webViewRef = useRef<WebViewWithNativeRef>(null);

  useEffect(() => {
    console.log('应用启动成功，当前环境:', __DEV__ ? '开发' : '生产');
    console.log('WebView URL:', webViewUrl);
  }, []);

  // 添加 useEffect 监听 pageTitle 的所有变化
  useEffect(() => {
    console.log('🔍 pageTitle 状态变化:', pageTitle);
    console.trace('调用栈:'); // 这会显示是谁调用了这个更新
  }, [pageTitle]);

  const handleNavigationStateChange = (navState: any) => {
    console.log('⚠️ handleNavigationStateChange 被调用:', navState.title);
    console.log('⚠️ 当前 pageTitle:', pageTitle);
    
    // 不要自动更新标题，因为我们通过 handleNavigationUpdate 来管理标题
    // setPageTitle(navState.title || ''); // 注释掉这行
    
    console.log(navState.canGoBack);
    setCanGoBack(navState.canGoBack);
  };

  // 处理来自H5的导航更新 - 合并并优化后的版本
  const handleNavigationUpdate = (navigationData: any) => {
    console.log('🚀 handleNavigationUpdate 被调用');
    console.log('🚀 收到导航更新:', navigationData);
    console.log('🚀 当前状态:', { pageTitle, canGoBack, navigationStyle });
    
    const newTitle = navigationData.title || '默认标题';
    const newCanGoBack = navigationData.canGoBack || false;
    const newShowNavigation = navigationData.showNavigation !== false; // 新增
    const newStyle = {
      backgroundColor: navigationData.backgroundColor,
      textColor: navigationData.textColor
    };
    
    console.log('🚀 准备更新 pageTitle 从', pageTitle, '到', newTitle);
    
    // 立即更新状态
    setPageTitle(newTitle);
    setCanGoBack(newCanGoBack);
    setShowNavigation(newShowNavigation); // 新增
    setNavigationStyle(newStyle);
    
    console.log('🚀 setPageTitle 调用完成');
    
    // 验证更新
    setTimeout(() => {
      console.log('🔍 延迟验证 pageTitle:', pageTitle);
    }, 100);
  };

  const handleBackPress = () => {
    console.log('原生返回按钮被点击, canGoBack:', canGoBack);
    if (webViewRef.current && canGoBack) {
      console.log('发送goBack消息到H5');
      webViewRef.current.goBack();
    }
  };

  const handleClose = () => {
    console.log('关闭应用');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {showNavigation && <CustomNavigation
          title={pageTitle}
          canGoBack={canGoBack}
          onBackPress={handleBackPress}
          onClose={handleClose}
          backgroundColor={navigationStyle.backgroundColor}
          textColor={navigationStyle.textColor}
        />}
        <WebViewWithNative
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onNavigationUpdate={handleNavigationUpdate}
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
