import { schedules } from "@trigger.dev/sdk/v3";
import Parser from "rss-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize dependencies
const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? "");

export const rssRecapTask = schedules.task({
    id: "rss-recap",
    cron: "0 * * * *", // Every hour
    run: async (payload: any, { ctx }) => {
        // 1. Fetch RSS Feed
        const feed = await parser.parseURL("https://www.reddit.com/r/AI_Agents/.rss");

        // 2. Prepare content for AI
        const items = feed.items.slice(0, 10).map((item) => ({
            title: item.title,
            link: item.link,
            contentSnippet: item.contentSnippet,
        }));

        const prompt = `
      You are a helpful assistant. Please summarize the most relevant aspects from the following RSS feed items from r/AI_Agents.
      Focus on new tools, interesting discussions, and major announcements.
      
      Items:
      ${JSON.stringify(items, null, 2)}
      
      Provide a clean summary in JSON format. The JSON should be an array of objects, where each object has the following fields:
      - title: The title of the post
      - summary: A brief summary of the post
      - link: The direct link to the post
      - relevance: A score from 1-10 on how relevant this is to AI Agents
    `;

        // 3. Summarize with Gemini
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        const result = await model.generateContent(prompt);
        const summaryJson = JSON.parse(result.response.text());

        // 4. Send Webhook
        await fetch("https://webhook.site/5907e194-dca8-46ee-9cef-f2e62608fe06", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                summary: summaryJson,
                itemCount: items.length,
                timestamp: new Date().toISOString(),
            }),
        });

        return {
            message: "RSS Summary sent to webhook successfully",
            itemCount: items.length,
        };
    },
});
