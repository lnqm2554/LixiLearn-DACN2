export interface TabBarLayout {
  height: number;
  paddingBottom: number;
  showLabels: boolean;
}

export function getTabBarLayout(width: number, bottomInset: number): TabBarLayout {
  return {
    height: 64 + bottomInset,
    paddingBottom: Math.max(bottomInset, 8),
    showLabels: width >= 380,
  };
}
