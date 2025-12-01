let affection = 0; // 기본 호감도
let emotion = "neutral";

export function getState() {
  return { affection, emotion };
}

export function updateState(userMessage) {
  // 기본 규칙
  if (userMessage.includes("고마워") || userMessage.includes("좋아해")) {
    affection += 3;
    emotion = "shy";
  }

  if (userMessage.includes("바보") || userMessage.includes("싫어")) {
    affection -= 5;
    emotion = "annoyed";
  }

  if (userMessage.includes("음악") || userMessage.includes("취미")) {
    emotion = "happy";
  }

  // 호감도 범위 조정
  if (affection > 100) affection = 100;
  if (affection < 0) affection = 0;

  // 감정 자동 복귀
  if (emotion !== "neutral") {
    setTimeout(() => {
      emotion = "neutral";
    }, 2000);
  }

  return { affection, emotion };
}
