import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { tasks, runs } from '@trigger.dev/sdk/v3'
import { config } from 'dotenv'

config()

const app = new Hono()

app.get('/', (c) => {
    return c.text('Antigravity Trigger.dev Webhook Server is running!')
})

app.post('/api/webhooks/:env/:triggerId', async (c) => {
    const env = c.req.param('env')
    const triggerId = c.req.param('triggerId')

    // Validate environment parameter
    if (!['production', 'staging'].includes(env)) {
        return c.json({ error: 'Invalid environment. Must be either "production" or "staging"' }, 400)
    }

    // Set the appropriate Trigger.dev API key based on environment
    const apiKey = env === 'production'
        ? process.env.TRIGGER_SECRET_KEY
        : process.env.TRIGGER_SECRET_KEY_STAGING

    if (!apiKey) {
        return c.json({
            error: `Missing API key for ${env} environment. Please set ${env === 'production' ? 'TRIGGER_SECRET_KEY' : 'TRIGGER_SECRET_KEY_STAGING'} in .env`
        }, 500)
    }

    // Temporarily set the API key for this request
    const originalKey = process.env.TRIGGER_SECRET_KEY
    process.env.TRIGGER_SECRET_KEY = apiKey

    // Validate webhook secret if WEBHOOK_SECRET is set
    const expectedSecret = process.env.WEBHOOK_SECRET
    if (expectedSecret) {
        // Check for secret in query parameter or header
        const querySecret = c.req.query('agtr_secret')
        const headerSecret = c.req.header('X-Webhook-Secret')
        const providedSecret = querySecret || headerSecret

        if (!providedSecret || providedSecret !== expectedSecret) {
            // Restore original key before returning
            if (originalKey) process.env.TRIGGER_SECRET_KEY = originalKey
            return c.json({ error: 'Unauthorized: Invalid or missing webhook secret' }, 401)
        }
    }

    let payload = {}
    try {
        const contentType = c.req.header('content-type')
        if (contentType === 'application/json') {
            payload = await c.req.json()
        } else {
            // Handle text or other types if necessary, or default to empty
            // For now, let's try to parse text as json if possible or just wrap it
            const text = await c.req.text()
            try {
                payload = JSON.parse(text)
            } catch {
                payload = { rawBody: text }
            }
        }
    } catch (e) {
        console.error('Failed to parse payload', e)
        // Restore original key before returning
        if (originalKey) process.env.TRIGGER_SECRET_KEY = originalKey
        return c.json({ error: 'Invalid payload' }, 400)
    }

    const mode = c.req.query('mode') ?? 'async'

    try {
        console.log(`Triggering task: ${triggerId} in ${env} environment with payload:`, JSON.stringify(payload, null, 2))

        const handle = await tasks.trigger(triggerId, payload)

        if (mode === 'sync') {
            let run = await runs.retrieve(handle.id)
            while (!['COMPLETED', 'CANCELED', 'FAILED', 'CRASHED', 'SYSTEM_FAILURE'].includes(run.status)) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                run = await runs.retrieve(handle.id)
            }

            // Restore original key
            if (originalKey) process.env.TRIGGER_SECRET_KEY = originalKey

            if (run.status === 'COMPLETED') {
                return c.json({
                    success: true,
                    triggerId,
                    runId: run.id,
                    output: run.output,
                })
            } else {
                return c.json({
                    success: false,
                    triggerId,
                    runId: run.id,
                    status: run.status,
                    error: run.error,
                }, 500)
            }
        }

        // Restore original key for async mode
        if (originalKey) process.env.TRIGGER_SECRET_KEY = originalKey

        return c.json({
            success: true,
            triggerId,
            runId: handle.id,
            publicAccessToken: handle.publicAccessToken,
        })
    } catch (error) {
        console.error('Failed to trigger task:', error)
        // Restore original key on error
        if (originalKey) process.env.TRIGGER_SECRET_KEY = originalKey
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, 500)
    }
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
    fetch: app.fetch,
    port
})
