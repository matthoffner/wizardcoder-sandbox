import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { fetchSSE } from './fetch-sse';

interface llmParams {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: Array<string>;
}

type CursorStyle =
  | 'line'
  | 'block'
  | 'underline'
  | 'line-thin'
  | 'block-outline'
  | 'underline-thin';

export interface Config {
  llmKey?: string;
  llmUrl?: string;
  llmParams?: llmParams;
  customCompletionFunction?: (code: string) => Promise<string>;
  maxCodeLinesTollm?: number;
  cursorStyleLoading?: CursorStyle;
  cursorStyleNormal?: CursorStyle;
  assistantMessage?: string;
}

export const defaultllmParams: llmParams = {
  model: '',
  temperature: 0,
  max_tokens: 64,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
};

export const defaultConfig: Config = {
  llmKey: '',
  llmUrl: 'https://matthoffner-wizardcoder-ggml.hf.space/v0/chat/completions',
  llmParams: defaultllmParams,
  cursorStyleLoading: 'underline',
  cursorStyleNormal: 'line',
  assistantMessage: '',
};

export async function fetchCompletionFromllm(
  code: string,
  config: Config,
  controller: AbortController,
  handleInsertion: (text: string) => void
): Promise<void> {
  const handleMessage = (message: string) => {
    handleInsertion(message);
  };

  let text = ''

  return new Promise(async (resolve, reject) => {
    await fetchSSE(config.llmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${config.llmKey}`,
      },
      body: JSON.stringify({
        prompt: code,
        ...config.llmParams,
      }),
      signal: controller.signal,
      onMessage: (data) => {
        let lastResponse;
        if (data === "[DONE]") {
          text = text.trim();
          return resolve();
        }
        try {
          const response = JSON.parse(data);
          if ((lastResponse = response == null ? void 0 : response) == null ? void 0 : lastResponse.length) {
            text += response || '';
            handleMessage == null ? void 0 : handleMessage(text);
          }
        } catch (err) {
          console.warn("llm stream SEE event unexpected error", err);
          return reject(err);
        }
      },
      onError: (error: any) => {
        console.error(error);
      }
    });
  })
}

const handleCompletion = async (
  editor: monaco.editor.IStandaloneCodeEditor,
  config: Config,
  controller: AbortController,
  cursorStyleLoading: () => void,
  cursorStyleNormal: () => void
) => {
  const currentPosition = editor.getPosition();
  if (!currentPosition) {
    return;
  }
  const currentLineNumber = currentPosition.lineNumber;
  const startLineNumber = !config.maxCodeLinesTollm
    ? 1
    : Math.max(1, currentLineNumber - config.maxCodeLinesTollm);
  const endLineNumber = currentLineNumber;
  const code = editor
    .getModel()!
    .getLinesContent()
    .slice(startLineNumber - 1, endLineNumber)
    .join('\n');

  cursorStyleLoading();


  let lastText = ''
  const handleInsertion = (text: string) => {
    const position = editor.getPosition();
    if (!position) {
      return;
    }
    const offset = editor.getModel()?.getOffsetAt(position);
    if (!offset) {
      return;
    }

    const edits = [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text: text.slice(lastText.length),
      },
    ];

    lastText = text
    editor.executeEdits('', edits);
  };


  try {
    let newCode = '';
    if (config.customCompletionFunction) {
      newCode = await config.customCompletionFunction(code);
      handleInsertion(newCode);
    } else {
      await fetchCompletionFromllm(code, config, controller, handleInsertion);
    }
    cursorStyleNormal();
  } catch (error) {
    cursorStyleNormal();
    console.error('MonacoEditorCopilot error:', error);
  }
};

const MonacoEditorCopilot = (
  editor: monaco.editor.IStandaloneCodeEditor,
  config: Config
) => {
  const mergedConfig: Config = {
    ...defaultConfig,
    ...config,
    llmParams: { ...defaultllmParams, ...config.llmParams },
  };

  const cursorStyleLoading = () => {
    editor.updateOptions({ cursorStyle: mergedConfig.cursorStyleLoading });
  };

  const cursorStyleNormal = () => {
    editor.updateOptions({ cursorStyle: mergedConfig.cursorStyleNormal });
  };

  cursorStyleNormal();

  let controller: AbortController | null = null;

  const cancel  = () => {
    if (controller) {
      controller.abort();
    }
    cursorStyleNormal();
  }

  const keyDownHandler =  editor.onKeyDown(cancel);
  const mouseDownHandler = editor.onMouseDown(cancel);

  let copilotAction: monaco.editor.IActionDescriptor | null = {
    id: 'copilot-completion',
    label: 'Trigger Copilot Completion',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run: async () => {
      controller = new AbortController();
      await handleCompletion(
        editor,
        mergedConfig,
        controller,
        cursorStyleLoading,
        cursorStyleNormal
      );
    },
  };

  editor.addAction(copilotAction);

  const dispose = () => {
    keyDownHandler.dispose();
    mouseDownHandler.dispose();
  };

  return dispose;
};

export default MonacoEditorCopilot;