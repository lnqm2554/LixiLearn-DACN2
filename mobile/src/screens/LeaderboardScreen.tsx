import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { Award, Flame, Zap, Trophy, Crown, Sparkles, UserCheck } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { getCurrentWeekXP } from '../utils/leaderboard';

interface StudentRank {
  id: string;
  name: string;
  studentId: string;
  streak: number;
  xp: number;
  weeklyXp: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardScreen() {
  const user = useUserStore((state) => state.user);
  const xpHistory = useUserStore((state) => state.xpHistory);
  const [filterType, setFilterType] = useState<'weekly' | 'allTime'>('weekly');
  const currentUserWeeklyXP = getCurrentWeekXP(xpHistory);

  const leaderboardData: StudentRank[] = [
    { id: '1', name: 'Người học An', studentId: 'DEMO.001', streak: 12, xp: 620, weeklyXp: 170 },
    { id: '2', name: 'Người học Bình', studentId: 'DEMO.002', streak: 9, xp: 510, weeklyXp: 140 },
    { id: '3', name: 'Người học Chi', studentId: 'DEMO.003', streak: 8, xp: 480, weeklyXp: 125 },
    {
      id: 'user_current',
      name: user.name,
      studentId: 'DEMO.USER',
      streak: user.streak,
      xp: user.xp,
      weeklyXp: currentUserWeeklyXP,
      isCurrentUser: true,
    },
    { id: '4', name: 'Người học Dung', studentId: 'DEMO.004', streak: 6, xp: 390, weeklyXp: 110 },
    { id: '5', name: 'Người học Hà', studentId: 'DEMO.005', streak: 5, xp: 340, weeklyXp: 95 },
    { id: '6', name: 'Người học Khoa', studentId: 'DEMO.006', streak: 4, xp: 290, weeklyXp: 80 },
  ];
  leaderboardData.forEach((student) => {
    student.xp = filterType === 'weekly' ? student.weeklyXp : student.xp;
  });
  leaderboardData.sort((a, b) => b.xp - a.xp);

  const currentUserRank = leaderboardData.findIndex((s) => s.isCurrentUser) + 1;

  const top1 = leaderboardData[0];
  const top2 = leaderboardData[1];
  const top3 = leaderboardData[2];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Tabs (Tuần này / Toàn thời gian) */}
      <View style={styles.tabSwitchContainer}>
        <TouchableOpacity
          style={[styles.tabButton, filterType === 'weekly' && styles.tabButtonActive]}
          onPress={() => setFilterType('weekly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, filterType === 'weekly' && styles.tabButtonTextActive]}>
            Tuần thi đua này
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, filterType === 'allTime' && styles.tabButtonActive]}
          onPress={() => setFilterType('allTime')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, filterType === 'allTime' && styles.tabButtonTextActive]}>
            Bảng vàng toàn khóa
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.demoNotice}>
        Bảng xếp hạng hiện dùng dữ liệu minh họa; XP của bạn được tính từ hoạt động trên thiết bị này.
      </Text>

      {/* Podium Top 3 Học viên Xuất sắc */}
      <View style={styles.podiumContainer}>
        {/* Top 2 */}
        {top2 && (
          <View style={[styles.podiumItem, styles.podiumSilver]}>
            <View style={styles.podiumBadge}>
              <Text style={styles.silverBadgeText}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top2.name.split(' ').slice(-2).join(' ')}</Text>
            <Text style={styles.podiumXp}>{top2.xp} XP</Text>
            <View style={[styles.podiumPillar, { height: 75, backgroundColor: '#E2E8F0' }]}>
              <Text style={styles.pillarLabel}>🥈 Bạc</Text>
            </View>
          </View>
        )}

        {/* Top 1 */}
        {top1 && (
          <View style={[styles.podiumItem, styles.podiumGold]}>
            <Crown size={24} color="#D97706" style={styles.crownIcon} />
            <View style={[styles.podiumBadge, { backgroundColor: '#FDE68A' }]}>
              <Text style={[styles.goldBadgeText, { color: '#B45309' }]}>1</Text>
            </View>
            <Text style={[styles.podiumName, { fontWeight: '800' }]} numberOfLines={1}>
              {top1.name.split(' ').slice(-2).join(' ')}
            </Text>
            <Text style={[styles.podiumXp, { color: theme.colors.primary }]}>{top1.xp} XP</Text>
            <View style={[styles.podiumPillar, { height: 100, backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.pillarLabel}>🥇 Quán quân</Text>
            </View>
          </View>
        )}

        {/* Top 3 */}
        {top3 && (
          <View style={[styles.podiumItem, styles.podiumBronze]}>
            <View style={[styles.podiumBadge, { backgroundColor: '#FFEDD5' }]}>
              <Text style={[styles.bronzeBadgeText, { color: '#C2410C' }]}>3</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3.name.split(' ').slice(-2).join(' ')}</Text>
            <Text style={styles.podiumXp}>{top3.xp} XP</Text>
            <View style={[styles.podiumPillar, { height: 55, backgroundColor: '#FED7AA' }]}>
              <Text style={styles.pillarLabel}>🥉 Đồng</Text>
            </View>
          </View>
        )}
      </View>

      {/* Current User Status Banner */}
      <View style={styles.currentUserCard}>
        <View style={styles.currentUserLeft}>
          <View style={styles.currentRankBadge}>
            <Text style={styles.currentRankText}>#{currentUserRank}</Text>
          </View>
          <View>
            <Text style={styles.currentUserName}>{user.name} (Bạn)</Text>
            <Text style={styles.currentUserSub}>Cố thêm một chút để vào Top 3 nhé!</Text>
          </View>
        </View>
        <View style={styles.currentUserRight}>
          <Text style={styles.currentUserXp}>
            {filterType === 'weekly' ? currentUserWeeklyXP : user.xp} XP
          </Text>
          <View style={styles.streakSmall}>
            <Flame size={14} color={theme.colors.streakText} />
            <Text style={styles.streakSmallText}>{user.streak}d</Text>
          </View>
        </View>
      </View>

      {/* Full Leaderboard List */}
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>Danh sách người học minh họa</Text>
        {leaderboardData.map((item, index) => {
          const rank = index + 1;
          return (
            <View
              key={item.id}
              style={[
                styles.rankRow,
                item.isCurrentUser && styles.rankRowActive,
                index === leaderboardData.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.rankNumberContainer}>
                <Text
                  style={[
                    styles.rankNumberText,
                    rank <= 3 && { fontWeight: '800', color: theme.colors.primary },
                  ]}
                >
                  {rank}
                </Text>
              </View>

              <View style={styles.studentInfoContainer}>
                <Text style={[styles.studentName, item.isCurrentUser && { color: theme.colors.primary, fontWeight: '700' }]}>
                  {item.name} {item.isCurrentUser && '✨'}
                </Text>
                <Text style={styles.studentId}>{item.studentId}</Text>
              </View>

              <View style={styles.studentStats}>
                <View style={styles.streakPill}>
                  <Flame size={13} color={theme.colors.streakText} />
                  <Text style={styles.streakPillText}>{item.streak} ngày</Text>
                </View>
                <Text style={styles.xpText}>{item.xp} XP</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  demoNotice: {
    marginTop: -10,
    marginBottom: 16,
    color: theme.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  tabButtonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumGold: {
    zIndex: 2,
  },
  podiumSilver: {},
  podiumBronze: {},
  crownIcon: {
    marginBottom: 4,
  },
  podiumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  silverBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  goldBadgeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  bronzeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  podiumXp: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    marginBottom: 8,
  },
  podiumPillar: {
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  pillarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  currentUserCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF4E8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FBD38D',
    marginBottom: 20,
  },
  currentUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currentRankBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  currentRankText: {
    color: '#FFFDF9',
    fontWeight: '800',
    fontSize: 14,
  },
  currentUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  currentUserSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  currentUserRight: {
    alignItems: 'flex-end',
  },
  currentUserXp: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  streakSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  streakSmallText: {
    fontSize: 11,
    color: theme.colors.streakText,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  rankRowActive: {
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  rankNumberContainer: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  rankNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  studentInfoContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  studentId: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  studentStats: {
    alignItems: 'flex-end',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.streakBg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  streakPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.streakText,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
