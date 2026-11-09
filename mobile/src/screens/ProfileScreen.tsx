import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { Award, Flame, Sparkles, CheckCircle2, ShieldCheck, Heart } from 'lucide-react-native';
import { theme } from '../constants/theme';

export default function ProfileScreen() {
  const { user } = useUserStore();

  const achievements = [
    { id: '1', title: 'Khởi đầu Dịu dàng', desc: 'Duy trì thói quen học 3 ngày liên tiếp', unlocked: user.streak >= 3 },
    { id: '2', title: 'Tâm trí Sâu lắng', desc: 'Tích lũy đạt 200 điểm trải nghiệm kiến thức', unlocked: user.xp >= 200 },
    { id: '3', title: 'Ý chí Bền bỉ', desc: 'Duy trì chuỗi học 7 ngày liên tiếp', unlocked: user.streak >= 7 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.avatarCard}>
        <View style={styles.avatarCircle}>
          <Heart size={36} color={theme.colors.primary} fill={theme.colors.primaryLight} />
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <View style={styles.levelTag}>
          <Text style={styles.levelTagText}>Học viên Cấp độ {user.level}</Text>
        </View>
      </View>

      {/* Overview Stat Badges */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Flame size={20} color={theme.colors.streakText} />
          <Text style={[styles.statNumber, { color: theme.colors.streakText }]}>{user.streak}</Text>
          <Text style={styles.statName}>Streak ngày</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Sparkles size={20} color={theme.colors.xpText} />
          <Text style={[styles.statNumber, { color: theme.colors.xpText }]}>{user.xp}</Text>
          <Text style={styles.statName}>Tổng XP</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ShieldCheck size={20} color={theme.colors.levelText} />
          <Text style={[styles.statNumber, { color: theme.colors.levelText }]}>A2 - B1</Text>
          <Text style={styles.statName}>Khung CEFR</Text>
        </View>
      </View>

      {/* Gamification Achievements Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Award size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Huy hiệu & Bước tiến nhỏ</Text>
        </View>

        {achievements.map((item) => (
          <View key={item.id} style={[styles.achievementRow, !item.unlocked && styles.lockedRow]}>
            <View style={styles.checkCircle}>
              <CheckCircle2
                size={20}
                color={item.unlocked ? theme.colors.primary : theme.colors.border}
              />
            </View>
            <View style={styles.achievementTextWrapper}>
              <Text style={[styles.achievementTitle, !item.unlocked && styles.lockedText]}>
                {item.title}
              </Text>
              <Text style={styles.achievementDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Student/University Info */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerUni}>Trường ĐH Công nghệ Thông tin & Truyền thông Việt - Hàn</Text>
        <Text style={styles.footerSubject}>Lớp 23SE5 • Đồ án Chuyên ngành 2 (DACN2)</Text>
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
  avatarCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  levelTag: {
    backgroundColor: theme.colors.background,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  levelTagText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  statName: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '55%',
    backgroundColor: theme.colors.border,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  lockedRow: {
    opacity: 0.55,
  },
  checkCircle: {
    marginRight: 12,
  },
  achievementTextWrapper: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  achievementDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  lockedText: {
    color: theme.colors.textMuted,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerUni: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  footerSubject: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
