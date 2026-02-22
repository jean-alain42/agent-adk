import { Gemini, LlmAgent, FunctionTool, Runner, InMemorySessionService, stringifyContent, setLogLevel, LogLevel, MCPToolset } from "@google/adk";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

// Suppress internal ADK info logs for a clean CLI experience
setLogLevel(LogLevel.WARN);

// Retrieve the API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Ensure the API key exists before proceeding
if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
  console.error("Please provide a valid GEMINI_API_KEY in the .env file");
  process.exit(1);
}

// ---------------------------------------------------------
// 1. Define Native Tools (Functions defined in this file)
// ---------------------------------------------------------
const getCurrentTimeTool = new FunctionTool({
  name: "getCurrentTime",
  description: "Returns the current local time.",
  parameters: z.object({}),
  execute: async () => {
    return { time: new Date().toLocaleString() };
  },
});

// ---------------------------------------------------------
// 2. Configure MCP Toolsets (Model Context Protocol)
// ---------------------------------------------------------
// You can connect to any MCP-compliant server. Uncomment/Modify as needed:

// Example A: Local Standard I/O Server (e.g., a local script or binary)
const localMcpTools = new MCPToolset({
  type: "StdioConnectionParams",
  serverParams: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everything"], // Useful test server
  },
});

/* 
// Example B: Remote SSE Server (e.g., a server running on a URL)
const remoteMcpTools = new MCPToolset({
  type: "StreamableHTTPConnectionParams",
  url: "http://localhost:8788/mcp",
});
*/

// ---------------------------------------------------------
// 3. Initialize Agent & Runner
// ---------------------------------------------------------
const gemini = new Gemini({
  apiKey: apiKey,
  model: "gemini-2.5-flash",
});

const agent = new LlmAgent({
  name: "GeminiAgent",
  model: gemini,
  instruction: "You are a helpful assistant. Use tools when necessary to fulfill user requests.",
  // Register both native tools and MCP toolsets here
  tools: [getCurrentTimeTool, localMcpTools],
});

const sessionService = new InMemorySessionService();
const appName = "GeminiCLI";
const userId = "user-1";
const sessionId = "session-1";

const runner = new Runner({
  appName,
  agent: agent,
  sessionService: sessionService,
});

// ---------------------------------------------------------
// 4. Interactive Chat Loop
// ---------------------------------------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  // Create a session in the session service (required by ADK)
  await sessionService.createSession({
    appName,
    userId,
    sessionId,
  });

  console.log("Chat with Gemini Agent (type 'exit' to quit)");

  const askQuestion = () => {
    rl.question("You: ", async (msg) => {
      if (msg.toLowerCase() === "exit") {
        // Close MCP connections before exiting
        await localMcpTools.close();
        rl.close();
        return;
      }

      try {
        process.stdout.write("Agent: ");

        const iterator = runner.runAsync({
          userId: userId,
          sessionId: sessionId,
          newMessage: { role: 'user', parts: [{ text: msg }] }
        });

        for await (const event of iterator) {
          if (event.author !== "user") {
            const text = stringifyContent(event);
            if (text) {
              process.stdout.write(text);
            }
          }
        }
        console.log();

      } catch (error) {
        console.error("\n[Error during execution]:", error);
      }

      if (!(rl as any).closed) {
        askQuestion();
      }
    });
  };

  askQuestion();
}

main().catch(console.error);
