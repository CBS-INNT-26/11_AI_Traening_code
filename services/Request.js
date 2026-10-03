//services/Request.js
import OpenAI from "openai/index.mjs";

import { OPENAI_API_KEY } from "@env";
// Opret en ny instans af OpenAI-klassen
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// console.log("OPENAI_API_KEY:", JSON.stringify(OPENAI_API_KEY));

// Funktion der sender en besked til OpenAI API'et
export default async function SendMessage(messageArray) {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: messageArray,
  });

  // Udtræk AI'ens svar fra svaret
  const result = response.choices[0]?.message?.content || "";
  // Returnér AI'ens svar
  return { role: "assistant", content: result };
}