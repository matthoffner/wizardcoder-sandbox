export const metadata = {
  title: 'wizardcoder-sandbox',
  description: 'monaco-editor and copilot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta property="og:title" content="WizardCoder Sandbox" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wizardcoder-sandbox.netlify.app" />
        <meta property="og:image" content="https://cdn-thumbnails.huggingface.co/social-thumbnails/spaces/matthoffner/wizardcoder-ggml.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
