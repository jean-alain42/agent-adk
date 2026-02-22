# Gemini Agent CLI

A powerful, agentic Command-Line Interface built with the **Google Agent Development Kit (ADK)** and **Gemini 2.5 Flash**. This agent can reasoning, use local tools, and connect to Model Context Protocol (MCP) servers.

## Features

- **Agentic reasoning**: Uses `LlmAgent` for sophisticated task handling.
- **Native Tools**: Easily add custom JavaScript/TypeScript functions as tools.
- **MCP Integration**: Connect to any MCP-compliant server (local or remote) for expanded capabilities.
- **Streaming UI**: Real-time response streaming in the terminal.

## Prerequisites

- Node.js (v18 or higher)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/jean-alain42/agent-adk.git
    cd agent-adk
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment**:
    Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the agent**:
    ```bash
    npm start
    ```

## Adding Tools

### 1. Native Tools
You can add local tools in `index.ts` using the `FunctionTool` class:

```typescript
const myTool = new FunctionTool({
  name: "getWeather",
  description: "Get the current weather for a city",
  parameters: z.object({
    city: z.string(),
  }),
  execute: async ({ city }) => {
    // Your logic here
    return { weather: "Sunny in " + city };
  },
});
```

### 2. MCP Servers
Connect to external toolsets using `MCPToolset`:

```typescript
// Local Stdio Server
const mcpTools = new MCPToolset({
  type: "StdioConnectionParams",
  serverParams: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everything"],
  },
});

// Remote SSE Server
const remoteTools = new MCPToolset({
  type: "StreamableHTTPConnectionParams",
  url: "https://example.com/mcp",
});
```

To use these tools, add them to the `tools` array when initializing the `LlmAgent` in `index.ts`.

## Usage Tips

- **Exit**: Type `exit` to end the session.
- **Tools**: The agent will automatically decide when to use a tool based on your prompt.
- **Status**: Native tools like `getCurrentTime` and MCP tools from the `server-everything` test suite are pre-configured.

## License

MIT
