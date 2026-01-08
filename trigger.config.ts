import type { TriggerConfig } from "@trigger.dev/sdk/v3";

export const config: TriggerConfig = {
    project: "proj_placeholder", // The user will need to put their real project ID here
    logLevel: "log",
    retries: {
        enabledInDev: true,
        default: {
            maxAttempts: 3,
            minTimeoutInMs: 1000,
            maxTimeoutInMs: 10000,
            factor: 2,
            randomize: true,
        },
    },
};
