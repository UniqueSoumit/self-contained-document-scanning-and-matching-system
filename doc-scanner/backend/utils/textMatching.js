// Basic text matching utility

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  const dp = Array(m + 1)
    .fill()
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

// Calculate Jaccard similarity between two sets
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Convert text to word set
function textToWordSet(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

// Find similar documents based on text similarity
function findSimilarDocuments(targetDoc, allDocs, threshold = 0.3) {
  const targetWords = textToWordSet(targetDoc.content);

  // Skip comparing to self
  const otherDocs = allDocs.filter((doc) => doc.id !== targetDoc.id);

  const matches = otherDocs.map((doc) => {
    const docWords = textToWordSet(doc.content);
    const similarity = jaccardSimilarity(targetWords, docWords);

    return {
      id: doc.id,
      title: doc.title,
      userId: doc.user_id,
      similarity: parseFloat(similarity.toFixed(2)),
    };
  });

  // Filter by threshold and sort by similarity (descending)
  return matches
    .filter((match) => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

module.exports = {
  levenshteinDistance,
  jaccardSimilarity,
  findSimilarDocuments,
};
