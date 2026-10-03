// services/Guardrails.js
// Guardrails der kører, FØR en besked sendes til selve tutor-modellen.
// Formålet er at fange upassende indhold, spørgsmål uden for emnet, og
// for lange/for hyppige beskeder, inden de koster et dyrt API-kald.
// Hver tjek-funktion returnerer { allowed: true } eller
// { allowed: false, reason: "besked til brugeren" }.

import OpenAI from "openai/index.mjs";
import { OPENAI_API_KEY } from "@env";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const MAX_MESSAGE_LENGTH = 500;
const MIN_MS_BETWEEN_MESSAGES = 3000;

let lastSentAt = 0;

// Guardrail 1: beskedlængde. Forhindrer alt for lange beskeder, som er
// dyre at sende og ofte et tegn på at nogen forsøger at "oversvømme"
// modellen med tekst.
export function checkLength(text) {
  if (text.length > MAX_MESSAGE_LENGTH) {
    return {
      allowed: false,
      reason: `Den besked er for lang (maks. ${MAX_MESSAGE_LENGTH} tegn). Prøv at forkorte den.`,
    };
  }
  return { allowed: true };
}

// Guardrail 2: rate limiting. En simpel klient-side begrænsning, så man
// ikke kan sende beskeder (og dermed udløse API-kald) i hurtig
// rækkefølge. Bemærk: det er KUN en klient-side beskyttelse mod at spamme
// appen ved et uheld - en bruger, der selv skriver koden om, kan omgå
// den. En rigtig produktionsapp skal rate-limite på en server.
export function checkRateLimit() {
  const now = Date.now();
  if (now - lastSentAt < MIN_MS_BETWEEN_MESSAGES) {
    return {
      allowed: false,
      reason: "Vent lidt – du sender beskeder meget hurtigt efter hinanden.",
    };
  }
  lastSentAt = now;
  return { allowed: true };
}

// Guardrail 3: indholdsmoderation via OpenAIs moderation-endpoint. Fanger
// stødende/skadeligt indhold, før det når selve chat-modellen. Moderation
// er gratis at kalde.
export async function checkModeration(text) {
  try {
    const result = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });
    const flagged = result.results?.[0]?.flagged ?? false;
    if (flagged) {
      return {
        allowed: false,
        reason: "Den besked kan jeg ikke hjælpe med. Prøv at formulere dig anderledes.",
      };
    }
    return { allowed: true };
  } catch (error) {
    console.error("Fejl ved moderation:", error);
    // Fail open: hvis moderations-kaldet selv fejler (fx netværksfejl),
    // lader vi beskeden gå videre, i stedet for at låse brugeren helt ude.
    return { allowed: true };
  }
}

// Guardrail 4: emnebegrænsning. System-prompten ber allerede modellen om
// at blive på emnet, men det er ikke en garanti - en bruger kan forsøge
// at omgå den med en smart formulering. Her laver vi derfor et
// selvstændigt, billigt klassificerings-kald på en mindre model, der kun
// afgør om beskeden hører til forretningsmodel-teori, FØR vi bruger det
// dyrere kald på selve tutor-samtalen.
//
// Kendt begrænsning: klassifikationen ser kun på den enkelte besked, ikke
// resten af samtalen, så en kort opfølgning uden fagord (fx "hvorfor?")
// kan i nogle tilfælde blive vurderet forkert.
export async function checkOnTopic(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            'Classify whether the following student message is about business model theory (including topics like value propositions, revenue models, Chesbrough, open innovation, business model canvas). Respond with only one word: "yes" or "no".',
        },
        { role: "user", content: text },
      ],
      max_tokens: 1,
    });
    const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
    if (answer !== "yes") {
      return {
        allowed: false,
        reason:
          "Jeg er sat op som din tutor i forretningsmodel-teori, så det spørgsmål kan jeg ikke hjælpe med – prøv at spørge om noget relateret til forretningsmodeller i stedet.",
      };
    }
    return { allowed: true };
  } catch (error) {
    console.error("Fejl ved emne-tjek:", error);
    // Fail open her også - en teknisk fejl i selve tjekket skal ikke
    // blokere eleven for at bruge appen.
    return { allowed: true };
  }
}

// Kører guardrails i rækkefølge, billigst/hurtigst først, og stopper ved
// den første der blokerer - så vi aldrig betaler for flere API-kald end
// nødvendigt for en besked, der bliver afvist alligevel.
export async function runGuardrails(text) {
  const checks = [checkLength, checkRateLimit, checkModeration, checkOnTopic];
  for (const check of checks) {
    const result = await check(text);
    if (!result.allowed) {
      return result;
    }
  }
  return { allowed: true };
}
