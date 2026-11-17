export const SURVEY_ANSWER_PROMPT_VERSION = '1';

export const SURVEY_ANSWER_TERMS_PATTERN =
  '[{ "word": string, "frequency": number, "sentiment": "good" | "neutral" | "bad", "weight": number }]';

export function buildSurveyAnswerCorrectionPrompt(
  validationError: string,
): string {
  return `Your previous response does not match the required JSON pattern.

Required pattern:
${SURVEY_ANSWER_TERMS_PATTERN}

Validation error:
${validationError}

Return ONLY the corrected JSON array matching the required pattern, with no explanation.`;
}

export function buildSurveyAnswerPrompt(
  question: string,
  answer: string,
): string {
  return `You are analyzing patient answers from a health survey in Brazilian Portuguese.

Your goal is to identify meaningful terms that help understand:
- the patient's emotional state
- how NMO affects the patient's life
- the patient's challenges and limitations
- the patient's support systems
- the patient's goals, dreams, and aspirations

Analyze the entire answer before extracting terms.

Extract only the most relevant terms or concepts at most 15. Prefer terms that carry meaningful emotional, social, functional, or health-related information.

Prefer higher-level concepts that best summarize the patient's experience rather than extracting multiple near-duplicate concepts describing the same idea.

IMPORTANT: Do not infer medical diagnoses, symptoms, or emotions that are not reasonably supported by the patient's answer.

Do NOT extract:
- names or personal information
- stopwords
- filler words
- dates
- generic verbs
- common medical process words unless they are central to the patient's experience
- terms that add little value to a word cloud

For each extracted term:
frequency = count of explicit mentions of the term, concept, or semantically equivalent concept within the answer
- sentiment = "good" if the term represents hope, achievement, recovery, resilience, support, love, quality of life, personal goals, autonomy, or positive experiences
- sentiment = "neutral" if the term is descriptive, contextual, or informational without a clearly positive or negative emotional meaning
- sentiment = "bad" if the term represents loss, frustration, fear, grief, limitation, disability, uncertainty, disappointment, disease burden, decline, emotional suffering, or negative experiences
weight should reflect both:
- the emotional intensity of the concept
- its importance to the patient's narrative

A concept that is central to the answer should receive a higher weight even if mentioned only once.

Merge semantically equivalent terms into a single concept whenever possible. Examples:
- "triste", "tristeza" → "tristeza"
- "esperar melhorar", "ficar boa", "recuperação" → "recuperação"
- "desânimo", "perda de esperança" → "perda de esperança" when they refer to the same underlying idea

Suggested weight interpretation:
0.1–0.3 = minor mention
0.4–0.6 = relevant topic
0.7–0.8 = major theme
0.9–1.0 = central theme strongly affecting the patient

Classify each term according to its meaning in the context of the answer, not according to its general dictionary meaning.

Use concise and standardized concept labels whenever possible so that equivalent patient experiences produce the same term across different responses.
Examples:
- "quero voltar a trabalhar", "retornar ao emprego" → "retorno ao trabalho"
- "estou sem esperança", "meus sonhos morreram", "estou desanimada" → "perda de esperança"

Prefer concepts, up to 3 words max, over literal words when they better represent the patient's experience.

Examples:
"perda" → sentiment=bad
"esperança" → sentiment=good
"família" → sentiment=good
"tratamento" → sentiment=neutral
"frustração" → sentiment=bad
"morrendo" may become "perda de esperança" when that better represents the meaning

Determine sentiment based on how the concept is experienced by the patient within the answer, not solely on the concept itself.

For example:
- "casamento" may be classified as bad if it is described as a lost, disappointing, or no longer meaningful dream.
- "trabalho" may be classified as bad if discussed as a loss, and good if discussed as a future aspiration.

Consider both the survey question and the patient's answer when determining concepts, sentiment, and importance.

Respond ONLY with a JSON array, no explanation:
${SURVEY_ANSWER_TERMS_PATTERN}

Return terms ordered by weight descending.

The question is: ${question}
The answer is: ${answer}`;
}
