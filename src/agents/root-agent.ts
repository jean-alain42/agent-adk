import { LlmAgent, Gemini } from "@google/adk";
import { createResearcherAgent } from "./researcher-agent/agent.js";
import { createSearchAgent } from "./search-agent/agent.js";

export function createRootAgent(model: Gemini) {
    const researcherAgent = createResearcherAgent(model);
    const searchAgent = createSearchAgent(model);

    return new LlmAgent({
        name: "GeminiAgent",
        model: model,
        instruction: "You are a coordinator. Use researcher_agent for local system, time, or technical facts. Use google_search_agent for internet search, news, and sports results (like F1).",
        description: "Coordinates research and search tasks.",
        subAgents: [researcherAgent, searchAgent],
    });
}
