import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? "");

export const answerQuestion = task({
    id: "answer-question",
    run: async (payload: { question: string }) => {
        const { question } = payload;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Answer the following question concisely: ${question}`;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        return {
            question,
            answer,
        };
    },
});
