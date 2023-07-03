'use client'
import dynamic from 'next/dynamic'
import './app.css'

const WizardCoderSandbox = dynamic(() => import('./editor'), { ssr: false })

const defaultValue = `
`.trim()

export default function Page() {
  return <WizardCoderSandbox />
}
