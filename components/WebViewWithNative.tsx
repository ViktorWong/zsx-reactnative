import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';

interface WebViewWithNativeProps {
  source: { uri: string };
  onNavigationStateChange?: (navState: any) => void;
}

const WebViewWithNative: React.FC<WebViewWithNativeProps> = ({ source, onNavigationStateChange }) => {
  const webViewRef = useRef<WebView>(null);

  // 定位功能
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'locationError',
          data: { error: '位置权限被拒绝', code: 'PERMISSION_DENIED' }
        }));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      webViewRef.current?.postMessage(JSON.stringify({
        type: 'location',
        data: locationData
      }));
    } catch (error) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'locationError',
        data: { error: '获取位置信息失败', details: error.message }
      }));
    }
  };

  // 通讯录选择功能 - 使用原生选择器
  const selectContact = async () => {
    try {
      // 请求通讯录权限
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        // 权限被拒绝，提示用户手动开启权限
        Alert.alert(
          '需要通讯录权限',
          '为了选择联系人，请在设置中允许访问通讯录。\n\n设置路径：设置 > 隐私与安全性 > 通讯录 > [应用名称]',
          [
            {
              text: '取消',
              style: 'cancel',
              onPress: () => {
                webViewRef.current?.postMessage(JSON.stringify({
                  type: 'contactError',
                  data: { error: '用户取消了权限授权', code: 'PERMISSION_CANCELLED' }
                }));
              }
            },
            {
              text: '去设置',
              onPress: async () => {
                try {
                  // 打开应用设置页面
                  await Linking.openSettings();
                  
                  // 发送消息提示用户返回后重试
                  webViewRef.current?.postMessage(JSON.stringify({
                    type: 'contactError',
                    data: { 
                      error: '请在设置中开启通讯录权限后重试', 
                      code: 'PERMISSION_SETTINGS_OPENED',
                      action: 'retry'
                    }
                  }));
                } catch (error) {
                  webViewRef.current?.postMessage(JSON.stringify({
                    type: 'contactError',
                    data: { error: '无法打开设置页面，请手动前往设置开启通讯录权限', code: 'SETTINGS_ERROR' }
                  }));
                }
              }
            },
          ]
        );
        return;
      }
      await selectContactFallback();
    } catch (error) {
      console.error('选择联系人时出错:', error);
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'contactError',
        data: { error: '无法访问通讯录', details: error.message }
      }));
    }
  };

  // 获取联系人列表
  const selectContactFallback = async () => {
    // 检查是否支持原生联系人选择器
      try {
          // 使用iOS原生联系人选择器
          const contact = await Contacts.presentContactPickerAsync();
          // 修复：检查result是否存在且有效
          if (!contact) {
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'contactError',
              data: { error: '用户取消选择', code: 'USER_CANCELLED' }
            }));
            return;
          }

          const contactData = {
            id: contact.id || `contact_${Date.now()}`,
            name: contact.name || contact.firstName || contact.lastName || '未知联系人',
            phoneNumber: contact.phoneNumbers?.[0]?.number || '',
            email: contact.emails?.[0]?.email || '',
            firstName: contact.firstName || '',
            lastName: contact.lastName || ''
          };

          webViewRef.current?.postMessage(JSON.stringify({
            type: 'contact',
            data: contactData
          }));

        } catch (error) {
          console.log('原生选择器不可用，使用备用方案:', error);
        }
  };

  // 处理来自WebView的消息
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'getLocation':
          getCurrentLocation();
          break;
        case 'selectContact':
          selectContact();
          break;
        case 'selectContactFromList':
          // 处理从H5页面选择的联系人
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'contact',
            data: message.data
          }));
          break;
        default:
          console.log('未知消息类型:', message.type);
      }
    } catch (error) {
      console.error('处理WebView消息失败:', error);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    onNavigationStateChange?.(navState);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={source}
        style={styles.webview}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewWithNative;