import { task } from "@trigger.dev/sdk/v3";

export const helloWorldTask = task({
    id: "hello-world",
    run: async (payload: { message: string }) => {
        console.log("Hello from the Agentic Framework!");
        return {
            message: payload.message,
            timestamp: new Date().toISOString(),
        };
    },
});
