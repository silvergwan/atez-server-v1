import { supabase } from "../db/supabaseClient.js";
import OpenAI from "openai";
import { config } from "../config/env.js";

const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// 기억할 가치가 있는 발화인지 판단해요.
// 키워드를 반말로도 추가했어요.
function shouldSaveMemory(message) {
  const importantKeywords = [
    // 감정
    "좋아해",
    "싫어해",
    "힘들어",
    "무서워",
    "설레",
    // 취향
    "좋아하는",
    "싫어하는",
    "즐겨",
    "자주",
    "항상",
    // 음식
    "먹고 싶어",
    "맛있어",
    "좋아해",
    "파스타",
    "커피",
    "라떼",
    // 일상
    "꿈",
    "취미",
    "과제",
    "시험",
    "부모님",
    "친구",
    "학교",
    // 존댓말 버전도 유지
    "좋아해요",
    "싫어해요",
    "힘들어요",
  ];

  return importantKeywords.some((k) => message.includes(k));
}

// 유저 발화를 임베딩해서 rag_docs에 저장해요.
// 나중에 비슷한 맥락이 나오면 RAG가 이걸 꺼내올 수 있어요.
export async function saveMemory(userId, message) {
  if (!shouldSaveMemory(message)) return;

  // 텍스트 → 벡터 변환
  const embeddingRes = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const embedding = embeddingRes.data[0].embedding;

  // rag_docs에 저장 (source: 'user'로 구분)
  await supabase.from("rag_docs").insert({
    content: message,
    embedding,
    source: "user",
    user_id: userId,
  });

  // memory 텍스트 테이블에도 여전히 저장 (프롬프트용)
  await supabase.from("memory").insert({
    user_id: userId,
    content: message,
    importance: 2,
  });
}

// 텍스트 기반 기억 불러오기 (프롬프트에 직접 삽입용)
export async function loadMemories(userId, limit = 5) {
  const { data } = await supabase
    .from("memory")
    .select("content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  return data.map((m) => m.content);
}
