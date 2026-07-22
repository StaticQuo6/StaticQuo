import { useState, useCallback, useEffect } from 'react'
import { useFacadeStore } from './useFacadeStore'
import { CalculatorSkin } from './CalculatorSkin'
import { WeatherSkin } from './WeatherSkin'
import { PinSetup } from './PinSetup'
import { TrueApp } from './TrueApp'

export function FacadeGate() {
  const { state, skin, authenticate, lock } = useFacadeStore()
  const isConfigured = useFacadeStore((s) => s.isConfigured())
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [lockTimer, setLockTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const resetInactivityTimer = useCallback(() => {
    if (lockTimer) clearTimeout(lockTimer)
    if (state === 'authenticated') {
      const timer = setTimeout(() => {
        lock()
        setInput('')
      }, 5 * 60 * 1000)
      setLockTimer(timer)
    }
  }, [state, lock, lockTimer])

  useEffect(() => {
    resetInactivityTimer()
    return () => {
      if (lockTimer) clearTimeout(lockTimer)
    }
  }, [state, resetInactivityTimer])

  const handlePinSubmit = async (pin: string) => {
    const result = await authenticate(pin)
    if (result === 'denied') {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 600)
    }
    setInput('')
  }

  const handleFacadePin = (pin: string) => {
    setInput((prev) => prev + pin)
  }

  const handleFacadeBackspace = () => {
    setInput((prev) => prev.slice(0, -1))
  }

  const handleFacadeEnter = () => {
    if (input.length >= 4) {
      handlePinSubmit(input)
    }
  }

  if (!isConfigured) {
    return <PinSetup />
  }

  if (state === 'authenticated') {
    return <TrueApp onLock={lock} />
  }

  if (state === 'decoy') {
    return (
      <div className="relative">
        {skin === 'calculator' ? (
          <CalculatorSkin />
        ) : (
          <WeatherSkin onSecretInput={handlePinSubmit} />
        )}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 max-w-xs mx-auto">
            <div className="flex-1 flex gap-1 justify-center">
              {Array.from({ length: Math.min(input.length, 8) }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white" />
              ))}
              {Array.from({ length: Math.max(0, 8 - input.length) }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-gray-600" />
              ))}
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-xs text-center mt-2">Invalid code</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">StaticQuo</h1>
          <p className="text-sm text-gray-400">Enter your PIN to continue</p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < input.length ? 'bg-blue-500' : 'bg-gray-700'
              } ${error ? 'animate-pulse bg-red-500' : ''}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleFacadePin(String(n))}
              className="h-16 rounded-2xl bg-gray-800 text-white text-xl font-medium active:bg-gray-700 transition-colors"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleFacadePin('0')}
            className="h-16 rounded-2xl bg-gray-800 text-white text-xl font-medium active:bg-gray-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleFacadeBackspace}
            className="h-16 rounded-2xl bg-gray-800 text-gray-400 text-lg active:bg-gray-700 transition-colors"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handleFacadeEnter}
          disabled={input.length < 4}
          className="w-full mt-4 h-12 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-30 active:bg-blue-500 transition-colors"
        >
          Enter
        </button>
      </div>
    </div>
  )
}
