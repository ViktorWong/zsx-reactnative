import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';

interface WebViewWithNativeProps {
  source: { uri: string };
  onNavigationStateChange?: (navState: any) => void;
  onNavigationUpdate?: (navigationData: any) => void;
}

// 添加 ref 类型定义
export interface WebViewWithNativeRef {
  goBack: () => void;
}

const WebViewWithNative = forwardRef<WebViewWithNativeRef, WebViewWithNativeProps>(({ 
  source, 
  onNavigationStateChange, 
  onNavigationUpdate
}, ref) => {
  const webViewRef = useRef<WebView>(null);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    goBack: () => {
      // 向 H5 发送返回消息，让 Vue Router 处理路由返回
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'goBack',
        data: {}
      }));
    }
  }));

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
        source:'native'
      };

      webViewRef.current?.postMessage(JSON.stringify({
        type: 'location',
        data: locationData
      }));
    } catch (error: any) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'locationError',
        data: { error: '获取位置信息失败', details: error?.message }
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
    } catch (error: any) {
      console.error('选择联系人时出错:', error);
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'contactError',
        data: { error: '无法访问通讯录', details: error?.message }
      }));
    }
  };

  // 使用原生联系人选择器（iOS 和 Android 都支持）
  const selectContactFallback = async () => {
    try {
      // expo-contacts 15+ 版本 presentContactPickerAsync 支持 iOS 和 Android
      const contact = await Contacts.presentContactPickerAsync();
      
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
    } catch (error: any) {
      console.log('原生选择器失败，尝试备用方案:', error);
      
      // 如果原生选择器失败（某些 Android 设备可能不支持），使用 fallback
      if (Platform.OS === 'android') {
        await selectContactListFallback();
      } else {
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'contactError',
          data: { error: '获取联系人失败', details: error?.message }
        }));
      }
    }
  };

  // Android 备用方案：获取联系人列表发送给 H5
  const selectContactListFallback = async () => {
    try {
      const { data: contacts } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      if (!contacts || contacts.length === 0) {
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'contactError',
          data: { error: '通讯录为空', code: 'NO_CONTACTS' }
        }));
        return;
      }

      // 格式化联系人列表，只保留有电话号码的联系人
      const contactList = contacts
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map(contact => ({
          id: contact.id || `contact_${Date.now()}_${Math.random()}`,
          name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '未知联系人',
          phoneNumber: contact.phoneNumbers?.[0]?.number || '',
          email: contact.emails?.[0]?.email || '',
          firstName: contact.firstName || '',
          lastName: contact.lastName || ''
        }));

      // 发送联系人列表给 H5，让 H5 显示选择界面
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'contactList',
        data: contactList
      }));
    } catch (error: any) {
      console.log('获取联系人列表失败:', error);
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'contactError',
        data: { error: '获取联系人失败', details: error?.message }
      }));
    }
  };

  // 处理来自WebView的消息
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('收到H5消息:', data);
  
      switch (data.type) {
        case 'updateNavigation':
          // 通知父组件更新导航
          onNavigationUpdate?.(data.data);
          break;
        case 'getLocation':
          getCurrentLocation();
          break;
        case 'selectContact':
          selectContact();
          break;
        case 'selectContactFromList':
          // 处理 H5 页面选择的联系人（Android 联系人列表选择后回传）
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'contact',
            data: data.data
          }));
          break;
        default:
          console.log('未知消息类型:', data.type);
      }
    } catch (error) {
      console.error('解析H5消息失败:', error);
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewWithNative;