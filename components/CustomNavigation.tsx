import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomNavigationProps {
  title: string;
  canGoBack: boolean;
  onBackPress: () => void;
  onClose: () => void;
  backgroundColor?: string;
  textColor?: string;
}

const CustomNavigation: React.FC<CustomNavigationProps> = ({
  title,
  canGoBack,
  onBackPress,
  onClose,
  backgroundColor = '#007AFF',
  textColor = '#FFFFFF'
}) => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <View style={styles.navigationBar}>
          <TouchableOpacity 
            style={styles.leftButton} 
            onPress={canGoBack ? onBackPress : onClose}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>
              {canGoBack ? '← 返回' : '✕ 关闭'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          
          <TouchableOpacity style={styles.rightButton} onPress={onClose}>
            <Text style={[styles.buttonText, { color: textColor }]}>完成</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  navigationBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftButton: {
    minWidth: 60,
    alignItems: 'flex-start',
  },
  rightButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '400',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
});

export default CustomNavigation;