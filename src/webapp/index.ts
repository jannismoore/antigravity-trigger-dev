import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { tasks } from '@trigger.dev/sdk/v3'
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

    try {
        console.log(`Triggering task: ${triggerId} with payload:`, JSON.stringify(payload, null, 2))

        const handle = await tasks.trigger(triggerId, payload)

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
