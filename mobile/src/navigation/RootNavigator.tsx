import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import StudyScreen from '../screens/StudyScreen';
import SpeakingScreen from '../screens/SpeakingScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Sparkles, BookHeart, Mic, Trophy, Heart } from 'lucide-react-native';
import { theme } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.colors.textPrimary,
          letterSpacing: 0.3,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Khởi đầu',
          headerTitle: 'LixiLearn ☕',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="StudyTab"
        component={StudyScreen}
        options={{
          title: 'Góc học',
          headerTitle: 'Thong thả ghi nhớ (SRS)',
          tabBarIcon: ({ color, size }) => <BookHeart color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="SpeakingTab"
        component={SpeakingScreen}
        options={{
          title: 'Luyện nói',
          headerTitle: 'Luyện nói & nhận dạng từ 🎙️',
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardScreen}
        options={{
          title: 'Bảng vàng',
          headerTitle: 'Thi đua Lớp 23SE5 🏆',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Góc riêng',
          headerTitle: 'Bước tiến của bạn',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size - 2} />,
        }}
      />
    </Tab.Navigator>
  );
}
