'use client'
import dynamic from 'next/dynamic'
import './app.css'

const Editor = dynamic(() => import('./editor'), { ssr: false })

const defaultValue = `
`.trim()

export default function Page() {
  return <Editor defaultValue={defaultValue} />
}
