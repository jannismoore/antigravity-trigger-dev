import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

export const processElevenLabsCall = task({
    id: "process-elevenlabs-call",
    run: async (payload: any) => {
        // 1. Initialize Supabase
        // We use non-null assertions or default strings to allow build, 
        // but checks are performed inside to throw meaningful errors.
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables.");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Extract Data
        // Check if the payload is wrapped in a 'data' property (standard 11Labs webhook structure)
        const callData = payload.data || payload;

        // Summary extraction
        // It can be in analysis.transcript_summary or analysis.summary
        const analysis = callData.analysis;
        const summary = analysis?.transcript_summary || analysis?.summary || callData.summary || "No summary provided";

        // Transcript extraction
        const transcript = callData.transcript || callData.conversation || [];

        // Date extraction
        let callDate = new Date(); // Default to now
        // In the snapshot, we see metadata.start_time_unix_secs
        const metadata = callData.metadata;
        const rawTimestamp = metadata?.start_time_unix_secs || callData.call?.start_timestamp || callData.start_timestamp;

        if (rawTimestamp) {
            // Check if it's likely seconds (ten digits) vs milliseconds (13 digits)
            if (typeof rawTimestamp === 'number') {
                if (rawTimestamp < 100000000000) {
                    // Likely seconds
                    callDate = new Date(rawTimestamp * 1000);
                } else {
                    // Likely milliseconds
                    callDate = new Date(rawTimestamp);
                }
            } else {
                // Try parsing string
                callDate = new Date(rawTimestamp);
            }
        }

        const phoneNumberId = callData.call?.phone_number_id || callData.agent_id || callData.call?.agent_id || "Unknown";

        console.log("Processing 11Labs Call:", {
            summary: summary.substring(0, 50) + "...",
            transcriptLength: transcript.length,
            callDate,
            phoneNumberId
        });

        // 3. Insert into Supabase
        const { data, error } = await supabase
            .from("agent_calls")
            .insert({
                summary,
                transcript,
                call_date: callDate.toISOString(),
                phone_number_id: phoneNumberId,
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw new Error(`Supabase Insert Error: ${error.message}`);
        }

        return {
            success: true,
            message: "Successfully stored 11Labs call data",
            recordId: data.id,
        };
    },
});
