import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { tasks, runs } from '@trigger.dev/sdk/v3'
import { config } from 'dotenv'

config()

const app = new Hono()

app.get('/', (c) => {
    return c.text('Antigravity Trigger.dev Webhook Server is running!')
})

app.post('/api/webhooks/:triggerId', async (c) => {
    const triggerId = c.req.param('triggerId')

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
        return c.json({ error: 'Invalid payload' }, 400)
    }

    const mode = c.req.query('mode') ?? 'async'

    try {
        console.log(`Triggering task: ${triggerId} with payload:`, JSON.stringify(payload, null, 2))

        const handle = await tasks.trigger(triggerId, payload)

        if (mode === 'sync') {
            let run = await runs.retrieve(handle.id)
            while (!['COMPLETED', 'CANCELED', 'FAILED', 'CRASHED', 'SYSTEM_FAILURE'].includes(run.status)) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                run = await runs.retrieve(handle.id)
            }

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

        return c.json({
            success: true,
            triggerId,
            runId: handle.id,
            publicAccessToken: handle.publicAccessToken,
        })
    } catch (error) {
        console.error('Failed to trigger task:', error)
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
