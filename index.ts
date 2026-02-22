import { Gemini, LlmAgent, FunctionTool, Runner, InMemorySessionService, stringifyContent, setLogLevel, LogLevel, MCPToolset } from "@google/adk";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { z } from "zod";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import figlet from "figlet";
import gradient from "gradient-string";

// Load environment variables
dotenv.config();

// Suppress internal ADK logs
setLogLevel(LogLevel.WARN);

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
  console.error(chalk.red.bold("✖ Error: Please provide a valid GEMINI_API_KEY in the .env file"));
  process.exit(1);
}

// ---------------------------------------------------------
// 1. UI Utility Functions
// ---------------------------------------------------------

/**
 * Renders a futuristic ASCII banner
 */
function renderBanner() {
  const bannerText = figlet.textSync("Universal Agent", { font: "Slant" });
  console.log(gradient.pastel.multiline(bannerText));
  console.log(chalk.cyan.bold("---------------------------------------------------------"));
  console.log(chalk.magenta("  The Future of Autonomous CLI Intelligence is Here"));
  console.log(chalk.cyan.bold("---------------------------------------------------------") + "\n");
}

/**
 * Simulates a typing effect for agent responses
 */
async function typeMessage(text: string) {
  for (const char of text) {
    process.stdout.write(char);
    // Control typing speed (much faster for better terminal output)
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}

// ---------------------------------------------------------
// 2. Tools & Toolsets
// ---------------------------------------------------------

const getCurrentTimeTool = new FunctionTool({
  name: "getCurrentTime",
  description: "Returns the current local time.",
  parameters: z.object({}),
  execute: async () => {
    return { time: new Date().toLocaleString() };
  },
});

const localMcpTools = new MCPToolset({
  type: "StdioConnectionParams",
  serverParams: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everything"],
  },
});

// ---------------------------------------------------------
// 3. Agent & Runner Setup
// ---------------------------------------------------------

const gemini = new Gemini({
  apiKey: apiKey,
  model: "gemini-2.5-flash",
});

const agent = new LlmAgent({
  name: "GeminiAgent",
  model: gemini,
  instruction: "You are a helpful assistant. Use tools when necessary to fulfill user requests.",
  tools: [getCurrentTimeTool, localMcpTools],
});

const sessionService = new InMemorySessionService();
const appName = "UniversalCLI";
const userId = "user-1";
const sessionId = "session-1";

const runner = new Runner({
  appName,
  agent: agent,
  sessionService: sessionService,
});

// ---------------------------------------------------------
// 4. Main Chat Interface
// ---------------------------------------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  await sessionService.createSession({ appName, userId, sessionId });

  renderBanner();
  console.log(chalk.dim("Type 'exit' to quit the mission.\n"));

  const askQuestion = () => {
    rl.question(chalk.cyan.bold("❯ User: "), async (msg) => {
      if (msg.toLowerCase() === "exit") {
        console.log(chalk.yellow("\n[SYSTEM]: Connection terminated. Goodbye."));
        await localMcpTools.close();
        rl.close();
        return;
      }

      // Start the "thinking" spinner
      const spinner = ora({
        text: chalk.magenta("Agent is processing signal..."),
        color: "magenta"
      }).start();

      try {
        const iterator = runner.runAsync({
          userId: userId,
          sessionId: sessionId,
          newMessage: { role: 'user', parts: [{ text: msg }] }
        });

        let fullResponse = "";
        let firstChunk = true;

        for await (const event of iterator) {
          if (event.author !== "user") {
            const text = stringifyContent(event);
            if (text) {
              if (firstChunk) {
                spinner.stop(); // Stop spinner when first content arrives
                process.stdout.write(chalk.green.bold("❯ Agent: "));
                firstChunk = false;
              }
              fullResponse += text;
              await typeMessage(text);
            }
          }
        }

        console.log("\n"); // Newline after response

      } catch (error) {
        spinner.fail(chalk.red("Signal lost. Error occurred."));
        console.error(chalk.red(`\n[ERROR]: ${error}`));
      }

      if (!(rl as any).closed) {
        askQuestion();
      }
    });
  };

  askQuestion();
}

main().catch(console.error);
