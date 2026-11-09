import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/constants/theme';
import { useUserStore } from './src/store/useUserStore';

export default function App() {
  const hydrationStatus = useUserStore((state) => state.hydrationStatus);

  if (hydrationStatus !== 'ready') {
    return (
      <View style={styles.startupContainer}>
        {hydrationStatus === 'loading' ? (
          <>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.startupText}>Đang tải tiến độ học tập...</Text>
          </>
        ) : (
          <>
            <Text style={styles.startupTitle}>Không thể tải dữ liệu học tập</Text>
            <Text style={styles.startupText}>Hãy kiểm tra bộ nhớ thiết bị rồi thử lại.</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                void useUserStore.persist.rehydrate();
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  startupContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  startupTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  startupText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
});
