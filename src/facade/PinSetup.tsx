import { useState } from 'react'
import { useFacadeStore } from './useFacadeStore'

type Step = 'secret' | 'secret-confirm' | 'decoy' | 'decoy-confirm' | 'skin'

export function PinSetup() {
  const { setSecretPin, setDecoyPin, setSkin } = useFacadeStore()
  const [step, setStep] = useState<Step>('secret')
  const [input, setInput] = useState('')
  const [confirmInput, setConfirmInput] = useState('')
  const [error, setError] = useState('')

  const handleDigit = (d: string) => {
    if (input.length < 8) setInput((p) => p + d)
  }

  const handleBackspace = () => {
    setInput((p) => p.slice(0, -1))
  }

  const handleNext = async () => {
    setError('')

    if (step === 'secret') {
      if (input.length < 6) {
        setError('PIN must be at least 6 digits')
        return
      }
      setConfirmInput(input)
      setInput('')
      setStep('secret-confirm')
      return
    }

    if (step === 'secret-confirm') {
      if (input !== confirmInput) {
        setError('PINs do not match')
        setInput('')
        return
      }
      await setSecretPin(input)
      setInput('')
      setStep('decoy')
      return
    }

    if (step === 'decoy') {
      if (input.length < 4) {
        setError('Decoy PIN must be at least 4 digits')
        return
      }
      setConfirmInput(input)
      setInput('')
      setStep('decoy-confirm')
      return
    }

    if (step === 'decoy-confirm') {
      if (input !== confirmInput) {
        setError('PINs do not match')
        setInput('')
        return
      }
      await setDecoyPin(input)
      setInput('')
      setStep('skin')
      return
    }
  }

  const labels: Record<Step, { title: string; sub: string }> = {
    secret: { title: 'Create Secret PIN', sub: '6+ digits. This opens the real app.' },
    'secret-confirm': { title: 'Confirm Secret PIN', sub: 'Re-enter your secret PIN.' },
    decoy: { title: 'Create Decoy PIN', sub: '4+ digits. Opens the fake app.' },
    'decoy-confirm': { title: 'Confirm Decoy PIN', sub: 'Re-enter your decoy PIN.' },
    skin: { title: 'Choose Facade', sub: 'Pick what the decoy app looks like.' },
  }

  const { title, sub } = labels[step]

  if (step === 'skin') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
          <p className="text-sm text-gray-400 mb-8">{sub}</p>

          <div className="space-y-3">
            <button
              onClick={() => { setSkin('calculator'); window.location.reload() }}
              className="w-full h-16 rounded-2xl bg-gray-800 text-white text-lg font-medium active:bg-gray-700 transition-colors"
            >
              🧮 Calculator
            </button>
            <button
              onClick={() => { setSkin('weather'); window.location.reload() }}
              className="w-full h-16 rounded-2xl bg-gray-800 text-white text-lg font-medium active:bg-gray-700 transition-colors"
            >
              🌤️ Weather
            </button>
          </div>
        </div>
      </div>
    )
  }

  const maxLen = step.startsWith('secret') ? 8 : 6

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-sm text-gray-400 mb-8">{sub}</p>

        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: maxLen }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < input.length ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-4">{error}</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(String(n))}
              className="h-16 rounded-2xl bg-gray-800 text-white text-xl font-medium active:bg-gray-700 transition-colors"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-gray-800 text-white text-xl font-medium active:bg-gray-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-gray-800 text-gray-400 text-lg active:bg-gray-700 transition-colors"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={input.length < (step.startsWith('secret') ? 6 : 4)}
          className="w-full mt-4 h-12 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-30 active:bg-blue-500 transition-colors"
        >
          {step === 'decoy-confirm' ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  )
}
