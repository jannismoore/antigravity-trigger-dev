---
description: Generate a new Trigger.dev workflow task using natural language
---

To generate a new Trigger.dev workflow task based on a user's request, follow these steps:

1.  **Clarify Request**: Ensure you understand what the user wants the workflow to do (e.g., schedule, trigger event, actions).
2.  **Execute Builder**: Run the following command with the user's description.

// turbo
3.  Run the builder script:
    ```bash
    npm run create-workflow "[INSERT USER DESCRIPTION HERE]"
    ```

4.  **Verify**: Check that the file was created in `src/trigger/` and inform the user.
