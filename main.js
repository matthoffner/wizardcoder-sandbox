import './style.css';
import { WebContainer } from '@webcontainer/api';
import { files } from './files';

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;

window.addEventListener('load', async () => {
  textareaEl.value = files['index.js'].file.contents;
  textareaEl.addEventListener('input', (e) => {
    writeIndexJS(e.currentTarget.value);
  });

  // Call only once
  webcontainerInstance = await WebContainer.boot();
  await webcontainerInstance.mount(files);

  const exitCode = await installDependencies();
  if (exitCode !== 0) {
    throw new Error('Installation failed');
  }

  startDevServer();
});

async function installDependencies() {
  // Install dependencies
  const installProcess = await webcontainerInstance.spawn('npm', ['install']);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );
  // Wait for install command to exit
  return installProcess.exit;
}

async function startDevServer() {
  // Run `npm run start` to start the Express app
  const foo = await webcontainerInstance.spawn('npm', ['run', 'start']);

  // Wait for `server-ready` event
  webcontainerInstance.on('server-ready', (port, url) => {
    iframeEl.src = url;
  });

  webcontainerInstance.on('error', (err) => {
    console.log(err);
    terminalEl.innerHTML = err;
  })
}

/**
 * @param {string} content
 */

async function writeIndexJS(content) {
  await webcontainerInstance.fs.writeFile('/index.js', content);
}


document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="editor">
      <textarea style="background:black;color:white;height:40vh">I am a textarea</textarea>
    </div>
    <div class="preview">
      <iframe src="loading.html" style="height:40vh"></iframe>
    </div>
    <div class="prompt">
      <textarea style="background:#999;color:black;height:40vh;font-family:system-ui;font-size:20px;">Simple express server</textarea>
      <button id="submit-button">Submit</button>
    </div>
    <div class="terminal">
      <div style="background:black;color:white;height:40vh;font-family:courier">Server running</div>
    </div>
  </div>
`;

document.querySelector('#submit-button').addEventListener('click', async () => {
  const promptText = document.querySelector('.prompt textarea').value;
  
  const response = await fetch('https://your-wizardcoder-url/v1/completions', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: promptText }) 
  });

  const data = await response.json();
  document.querySelector('.editor textarea').value = data;
});


/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector('iframe');

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector('textarea');

const terminalEl = document.querySelector('terminal');
