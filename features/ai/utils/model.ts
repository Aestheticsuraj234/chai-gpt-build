import { openai } from "@ai-sdk/openai";

export const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

export function getChatModel(modelId?: string | null) {
    return openai(modelId || DEFAULT_CHAT_MODEL)
}