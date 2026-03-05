import { Gemini, Runner, InMemorySessionService, stringifyContent, setLogLevel, LogLevel } from "@google/adk";
import * as dotenv from "dotenv";
import * as readline from "readline";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import gradient from "gradient-string";
import { createRootAgent } from "./agents/root-agent.js";

// Load environment variables
dotenv.config();

// Suppress Node.js deprecation warnings
process.env.NODE_NO_WARNINGS = '1';
process.removeAllListeners('warning');

// Suppress internal ADK logs
setLogLevel(LogLevel.WARN);

const apiKey = process.env.GEMINI_API_KEY;
const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

if (!project && (!apiKey || apiKey === "YOUR_API_KEY_HERE")) {
    console.error(chalk.red.bold("✖ Error: Please provide either GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT in the .env file"));
    process.exit(1);
}

// ---------------------------------------------------------
// UI Utility Functions
// ---------------------------------------------------------

function renderBanner() {
    const bannerText = figlet.textSync("Universal Agent", { font: "Slant" });
    console.log(gradient.pastel.multiline(bannerText));
    console.log(chalk.cyan.bold("---------------------------------------------------------"));
    console.log(chalk.magenta("  The Future of Autonomous CLI Intelligence is Here"));
    const authMode = project ? `Vertex AI (${project})` : "Gemini API Key";
    console.log(chalk.dim(`  Auth Mode: ${authMode}`));
    console.log(chalk.cyan.bold("---------------------------------------------------------") + "\n");
}

async function typeMessage(text: string) {
    for (const char of text) {
        process.stdout.write(char);
        await new Promise((resolve) => setTimeout(resolve, 1));
    }
}

// ---------------------------------------------------------
// Main Chat Interface
// ---------------------------------------------------------

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function main() {
    const gemini = new Gemini(
        project
            ? { model: "gemini-2.0-flash", vertexai: true, project, location }
            : { model: "gemini-2.0-flash", vertexai: false, apiKey: apiKey as string }
    );

    const agent = createRootAgent(gemini);
    const sessionService = new InMemorySessionService();
    const appName = "UniversalCLI";
    const userId = "user-1";
    const sessionId = "session-1";

    const runner = new Runner({
        appName,
        agent: agent,
        sessionService: sessionService,
    });

    await sessionService.createSession({ appName, userId, sessionId });

    renderBanner();
    console.log(chalk.dim("Type 'exit' to quit the mission.\n"));

    const askQuestion = () => {
        rl.question(chalk.cyan.bold("❯ User: "), async (msg) => {
            if (msg.toLowerCase() === "exit") {
                console.log(chalk.yellow("\n[SYSTEM]: Connection terminated. Goodbye."));
                rl.close();
                process.exit(0);
            }

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
                                spinner.stop();
                                process.stdout.write(chalk.green.bold("❯ Agent: "));
                                firstChunk = false;
                            }
                            fullResponse += text;
                            await typeMessage(text);
                        }
                    }
                }

                console.log("\n");

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
