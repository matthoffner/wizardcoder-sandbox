# wizardcoder-sandbox

![](./demo.png)

The goal of wizardcoder-sandbox is to create a versatile live editor with LLM prompting. This tool aims to bring the chat and copilot completion into a portable dev tool to rapidly prototype.

## Prompts

## HTML/CSS:


>Given the following html create an improved version, respond only in html AND DO NOT COMMENT ON CODE, use inline styles only, current html:


## Roadmap

* [ ] HTML/CSS
* [ ] Prompt improvements
* [ ] JS/Import Maps
* [ ] Node.js/Python

To use press Command B which will invoke the LLM running. Currently https://huggingface.co/spaces/matthoffner/ggml-ctransformers-fastapi

## Development

```bash
pnpm i
pnpm dev
```

For faster response times run WizardCoder locally: https://huggingface.co/spaces/matthoffner/wizardcoder-ggml
