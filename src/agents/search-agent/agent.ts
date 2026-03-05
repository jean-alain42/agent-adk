import { LlmAgent, GOOGLE_SEARCH, Gemini } from '@google/adk';

export function createSearchAgent(model: Gemini) {
    return new LlmAgent({
        name: "google_search_agent",
        model: model,
        instruction: "Answer questions using Google Search when needed. Always cite sources. You are professional and accurate.",
        description: "Expert at searching the internet for latest news, sports results (F1, etc.), and general information using Google Search.",
        tools: [GOOGLE_SEARCH],
        disallowTransferToParent: true,
        disallowTransferToPeers: true
    });
}
