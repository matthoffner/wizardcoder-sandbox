# wizardcoder-sandbox

![](./demo.png)

Rapid prototyping AI code generation tool.

## wizardcoder chat

Submitting a prompt calls itself recursively by default and increments a version number with each respponse.

## monaco-editor-copilot

There is a built in copilot too. To use press Command B which will invoke the LLM running. Currently https://huggingface.co/spaces/matthoffner/ggml-ctransformers-fastapi

## Development

```bash
pnpm i
pnpm dev
```

For faster response times run WizardCoder locally: https://huggingface.co/spaces/matthoffner/wizardcoder-ggml
