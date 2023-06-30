/** @satisfies {import('@webcontainer/api').FileSystemTree} */

export const files = {
    'index.js': {
      file: {
        contents: `
import express from 'express';
const app = express();
const port = 3110;
  
app.get('/', (req, res) => {
    res.write('<html><head><head><body><h1>test</h1><body></html>');
});
  
app.listen(port, () => {
    console.log(\`App is ;live at http://localhost:\${port}\`);
});`,
      },
    },
    'package.json': {
      file: {
        contents: `
          {
            "name": "example-app",
            "type": "module",
            "dependencies": {
              "express": "latest",
              "nodemon": "latest",
              "jest": "latest"
            },
            "scripts": {
              "start": "nodemon index.js",
              "test": "jest"
            }
          }`,
      },
    },
  };
