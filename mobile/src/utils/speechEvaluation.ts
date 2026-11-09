/**
 * Thuật toán tính khoảng cách Levenshtein để đo độ tương đồng giữa hai chuỗi từ
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Thay thế
          matrix[i][j - 1] + 1,     // Chèn
          matrix[i - 1][j] + 1      // Xóa
        );
      }
    }
  }

  return matrix[s1.length][s2.length];
}

export interface TranscriptMatchResult {
  similarityScore: number; // 0 -> 100
  accuracyGrade: 'excellent' | 'good' | 'needs_practice';
  feedbackText: string;
}

/**
 * Đánh giá độ chính xác phát âm của người học so với từ vựng gốc
 */
export function evaluateTranscriptMatch(
  spokenText: string,
  targetWord: string
): TranscriptMatchResult {
  const cleanSpoken = spokenText.trim().toLowerCase();
  const cleanTarget = targetWord.trim().toLowerCase();

  if (!cleanSpoken) {
    return {
      similarityScore: 0,
      accuracyGrade: 'needs_practice',
      feedbackText: 'Chưa nhận diện được giọng nói, bạn hãy thử lại nhé!',
    };
  }

  // Khớp chính xác hoàn toàn
  if (cleanSpoken === cleanTarget) {
    return {
      similarityScore: 100,
      accuracyGrade: 'excellent',
      feedbackText: 'Từ được nhận dạng trùng khớp hoàn toàn với từ mục tiêu.',
    };
  }

  const distance = calculateLevenshteinDistance(cleanSpoken, cleanTarget);
  const maxLength = Math.max(cleanSpoken.length, cleanTarget.length);
  const similarity = Math.max(0, Math.round(((maxLength - distance) / maxLength) * 100));

  let grade: 'excellent' | 'good' | 'needs_practice' = 'needs_practice';
  let feedback = 'Văn bản nhận dạng còn khác từ mục tiêu, hãy thử nói lại rõ hơn nhé.';

  if (similarity >= 85) {
    grade = 'excellent';
    feedback = 'Văn bản nhận dạng gần trùng khớp với từ mục tiêu.';
  } else if (similarity >= 65) {
    grade = 'good';
    feedback = 'Văn bản nhận dạng khá gần với từ mục tiêu.';
  }

  return {
    similarityScore: similarity,
    accuracyGrade: grade,
    feedbackText: feedback,
  };
}
