import OpenAI from "openai";
import { supabase } from "../db/supabaseClient.js";
import { config } from "../config/env.js";

const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });

async function search(query) {
  console.log("RAG 검색 시작");

  const embedding = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  console.log("embedding length:", embedding.data[0].embedding.length);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding.data[0].embedding,
    match_count: 3,
  });

  console.log("검색 결과:", data);
}

search("유민아는 어떤 시간을 좋아해?");
