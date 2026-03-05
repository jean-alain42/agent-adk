import { FunctionTool, MCPToolset } from '@google/adk';
import { z } from 'zod';

export const getCurrentTimeTool = new FunctionTool({
    name: "getCurrentTime",
    description: "Returns the current local time.",
    parameters: z.object({}),
    execute: async () => {
        return { time: new Date().toLocaleString() };
    },
});

export const localMcpTools = new MCPToolset({
    type: "StdioConnectionParams",
    serverParams: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-everything"],
    },
});

export const developerKnowledgeMcpTools = new MCPToolset({
    type: "StreamableHTTPConnectionParams",
    url: "https://developerknowledge.googleapis.com/mcp",
});
