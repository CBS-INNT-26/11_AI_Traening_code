# 11_AI_Traening_code

Bygger videre på `10_AI_code`: samme chatbot-app (Expo, `react-native-gifted-chat`, OpenAI's API), men AI-tutoren er nu "trænet" gennem en mere detaljeret system-prompt, og der er sat guardrails op omkring selve samtalen.

## Hvad er nyt ift. 10_AI_code

- **Træning af AI'en** (`services/SystemPrompt.js`): i stedet for fine-tuning af selve modellen (kræver træningsdata og et betalt fine-tuning-job), er "træningen" her en udbygget system-prompt med konkrete regler for, hvordan tutoren skal reagere i forskellige situationer (elev vil have et direkte svar, elev er fast kørt, elev svarer godt, elev spørger om noget andet), plus et eksempel på et godt svar.
- **Guardrails** (`services/Guardrails.js`), som kører på hver besked, *før* den sendes til tutor-modellen:
  - **Emnebegrænsning** – et selvstændigt, billigt klassificeringskald (`gpt-5-mini`) afgør om beskeden hører til forretningsmodel-teori, uafhængigt af hvad system-prompten selv siger.
  - **Indholdsmoderation** – bruger OpenAIs `omni-moderation-latest`-endpoint til at fange stødende/skadeligt indhold.
  - **Beskedlængde** – afviser beskeder over 500 tegn.
  - **Rate limiting** – simpel klient-side begrænsning mod at sende beskeder for hurtigt efter hinanden (bemærk: kun en klient-side beskyttelse, ikke en erstatning for server-side rate limiting i en rigtig produktionsapp).

  Guardrails køres billigst/hurtigst først og stopper ved den første, der blokerer, så vi ikke betaler for unødvendige API-kald.

## Kør appen lokalt

1. Installer dependencies:
   ```
   npm install
   ```
2. Opret en `.env`-fil i projektets rod med din egen OpenAI API-nøgle:
   ```
   OPENAI_API_KEY=din-egen-nøgle-her
   ```
   `.env` er allerede i `.gitignore`, så nøglen bliver ikke committet.
3. Start Expo:
   ```
   npx expo start
   ```
