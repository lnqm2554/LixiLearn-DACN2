import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { Flame, Sparkles, Award, BookHeart, Clock, ArrowRight } from 'lucide-react-native';
import { theme } from '../constants/theme';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, cards } = useUserStore();

  const dueCardsCount = cards.filter(
    (c) => new Date(c.dueDate) <= new Date() || c.repetition === 0
  ).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Greeting & Stats Bar */}
      <View style={styles.userCard}>
        <View>
          <Text style={styles.greetingSub}>Hôm nay của bạn thế nào?</Text>
          <Text style={styles.userName}>{user.name} ☕</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Cấp độ {user.level}</Text>
        </View>
      </View>

      {/* Gamification Stats - Tone Pastel Ấm Áp */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.streakBg }]}>
          <Flame size={24} color={theme.colors.streakText} />
          <Text style={[styles.statValue, { color: theme.colors.streakText }]}>{user.streak} ngày</Text>
          <Text style={styles.statLabel}>Chuỗi kiên trì</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.colors.xpBg }]}>
          <Sparkles size={24} color={theme.colors.xpText} />
          <Text style={[styles.statValue, { color: theme.colors.xpText }]}>{user.xp} XP</Text>
          <Text style={styles.statLabel}>Tích lũy</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.colors.levelBg }]}>
          <Award size={24} color={theme.colors.levelText} />
          <Text style={[styles.statValue, { color: theme.colors.levelText }]}>Top 5</Text>
          <Text style={styles.statLabel}>Bảng vàng</Text>
        </View>
      </View>

      {/* Daily Micro-learning Target */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIconBox}>
            <Clock size={18} color={theme.colors.primary} />
          </View>
          <Text style={styles.goalTitle}>Góc học nhẹ nhàng hôm nay</Text>
        </View>
        <Text style={styles.goalDescription}>
          Chỉ cần 3 - 5 phút thư thả cùng ly cà phê để nạp từ mới vào vùng nhớ dài hạn.
        </Text>

        <View style={styles.dueSummary}>
          <Text style={styles.dueNumber}>{dueCardsCount}</Text>
          <Text style={styles.dueText}>từ vựng đang đợi bạn ghé thăm</Text>
        </View>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('StudyTab')}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Bắt đầu ôn bài</Text>
          <ArrowRight size={18} color="#FFFDF9" />
        </TouchableOpacity>
      </View>

      {/* Study Method Explanation Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <BookHeart size={18} color={theme.colors.primary} />
          <Text style={styles.infoTitle}>Nhịp điệu học thông minh (SRS SM-2)</Text>
        </View>
        <Text style={styles.infoBody}>
          Hệ thống sẽ đồng hành và tự khắc ghi chu kỳ ôn tập riêng biệt dựa trên cảm nhận độ dễ của bạn.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    marginTop: 8,
  },
  greetingSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  levelText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#2E2824',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  goalIconBox: {
    backgroundColor: theme.colors.primaryLight,
    padding: 8,
    borderRadius: 10,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  goalDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  dueSummary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 18,
  },
  dueNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  dueText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  startBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  startBtnText: {
    color: '#FFFDF9',
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#F5EFEB',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  infoBody: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
