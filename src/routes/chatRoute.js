import express from "express";
import OpenAI from "openai";
import { supabase } from "../db/supabaseClient.js";
import { config } from "../config/env.js";
import { buildCharacterPrompt } from "../character/promptEngine.js";
import { getState, updateState } from "../character/state.js";

const router = express.Router();
const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { message } = req.body;

  // 1) RAG 검색
  const embedding = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const { data: ragResults } = await supabase.rpc("match_documents", {
    query_embedding: embedding.data[0].embedding,
    match_count: 3,
  });

  const ragTexts = ragResults.map((r) => r.content);

  // 2) 상태 업데이트
  const { affection, emotion } = updateState(message);

  // 3) 캐릭터 프롬프트 생성
  const systemPrompt = buildCharacterPrompt({
    ragTexts,
    affection,
    emotion,
  });

  // 4) GPT 호출
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  });

  const reply = completion.choices[0].message.content;

  res.json({
    reply,
    affection,
    emotion,
    ragUsed: ragTexts,
  });
});

export default router;
