import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";
import { SYSTEM_PROMPT } from "./prompts";

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("Error: GOOGLE_API_KEY is not set in .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateWorkflow(prompt: string) {
    console.log(`\n🤖 Agentic Builder: Generating workflow for: "${prompt}"...\n`);

    try {
        const result = await model.generateContent([
            SYSTEM_PROMPT,
            `User Request: ${prompt}`
        ]);
        const response = result.response;
        const text = response.text();

        const codeBlock = extractCode(text);

        if (!codeBlock) {
            throw new Error("Could not parse TypeScript code from AI response.");
        }

        // Generate a filename based on the prompt (simplified)
        const timestamp = Date.now();
        const filename = `generated-workflow-${timestamp}.ts`;
        const outputPath = path.join(__dirname, "../trigger", filename);

        await fs.writeFile(outputPath, codeBlock);

        console.log(`✅ Success! Created new workflow: src/trigger/${filename}`);
        console.log(`\nTo run this, make sure your dev server is running (npm run dev).`);

    } catch (error) {
        console.error("❌ Generation Failed:", error);
    }
}

function extractCode(text: string): string | null {
    const match = text.match(/```typescript([\s\S]*?)```/);
    if (match && match[1]) {
        return match[1].trim();
    }
    // Fallback if no block, maybe it returned just code?
    // But strictly we asked for block.
    return null;
}

// CLI Entry point
const userPrompt = process.argv[2];
if (!userPrompt) {
    console.log("Usage: npm run create-workflow \"<Description of workflow>\"");
    process.exit(0);
}

generateWorkflow(userPrompt);
