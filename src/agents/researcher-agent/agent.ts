import { LlmAgent, Gemini } from '@google/adk';
import { getCurrentTimeTool, localMcpTools, developerKnowledgeMcpTools } from './tools.js';

export function createResearcherAgent(model: Gemini) {
    return new LlmAgent({
        name: "researcher_agent",
        model: model,
        instruction: "You are the Research Specialist. Use your tools (MCP, Time, Developer Knowledge) to gather specific technical data or local facts. Be precise and technical.",
        description: "Technical specialist for local and MCP systems research",
        tools: [getCurrentTimeTool, localMcpTools, developerKnowledgeMcpTools],
    });
}
