# wizardcoder-sandbox

![](./demo2.png)

Rapid prototyping AI code generation tool.

## auto mode (?autoMode=false)

Loop with a request to make improvements based on initial prompt. If false will behave like a chat window.

## clear mode (?clearMode=false)

Clear response with each iteration. If false each response will append to editor.

### copilot (⌘b)

Command B will kick off copilot completion using completions API

## Development

```bash
pnpm i
pnpm dev
```

For best performance run locally. The API used can be found here: https://github.com/matthoffner/ggml-fastapi
