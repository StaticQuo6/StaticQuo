import { useState, useEffect } from 'react'

interface Props {
  onSecretInput: (pin: string) => void
}

export function WeatherSkin({ onSecretInput }: Props) {
  const [tapCount, setTapCount] = useState(0)
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')

  useEffect(() => {
    return () => {
      if (tapTimer) clearTimeout(tapTimer)
    }
  }, [tapTimer])

  const handleLogoTap = () => {
    const next = tapCount + 1
    setTapCount(next)

    if (tapTimer) clearTimeout(tapTimer)

    if (next >= 5) {
      setTapCount(0)
      setPinInput('')
      setShowPinModal(true)
      return
    }

    const timer = setTimeout(() => setTapCount(0), 2000)
    setTapTimer(timer)
  }

  const handlePinDigit = (d: string) => {
    if (pinInput.length < 8) setPinInput((p) => p + d)
  }

  const handlePinBackspace = () => {
    setPinInput((p) => p.slice(0, -1))
  }

  const handlePinSubmit = () => {
    if (pinInput.length >= 4) {
      setShowPinModal(false)
      onSecretInput(pinInput)
    }
  }

  const handlePinCancel = () => {
    setShowPinModal(false)
    setPinInput('')
  }

  const now = new Date()
  const hours = now.getHours()
  const greeting =
    hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-gray-900 text-white flex flex-col p-6 select-none">
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={handleLogoTap}
          className="text-6xl mb-2 active:opacity-70"
        >
          ☀️
        </button>
        <p className="text-lg text-blue-200 mb-1">{greeting}</p>
        <p className="text-6xl font-thin mb-1">72°</p>
        <p className="text-blue-300 text-lg mb-8">Partly Cloudy</p>

        <div className="w-full max-w-sm grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-blue-300 mb-1">Humidity</p>
            <p className="text-lg font-medium">45%</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-blue-300 mb-1">Wind</p>
            <p className="text-lg font-medium">8 mph</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-blue-300 mb-1">UV Index</p>
            <p className="text-lg font-medium">3</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { time: 'Now', icon: '⛅', temp: '72°' },
          { time: '1 PM', icon: '🌤️', temp: '74°' },
          { time: '2 PM', icon: '☀️', temp: '76°' },
          { time: '3 PM', icon: '☀️', temp: '75°' },
          { time: '4 PM', icon: '🌤️', temp: '73°' },
        ].map((hour) => (
          <div
            key={hour.time}
            className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2"
          >
            <span className="text-sm text-blue-200 w-12">{hour.time}</span>
            <span className="text-lg">{hour.icon}</span>
            <span className="text-sm font-medium">{hour.temp}</span>
          </div>
        ))}
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-gray-900 rounded-3xl p-6 border border-gray-700">
            <p className="text-center text-sm text-gray-400 mb-4">Enter access code</p>

            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < pinInput.length ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handlePinDigit(String(n))}
                  className="h-14 rounded-2xl bg-gray-800 text-white text-lg font-medium active:bg-gray-700 transition-colors"
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinDigit('0')}
                className="h-14 rounded-2xl bg-gray-800 text-white text-lg font-medium active:bg-gray-700 transition-colors"
              >
                0
              </button>
              <button
                onClick={handlePinBackspace}
                className="h-14 rounded-2xl bg-gray-800 text-gray-400 active:bg-gray-700 transition-colors"
              >
                ⌫
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePinCancel}
                className="flex-1 h-11 rounded-xl bg-gray-800 text-gray-400 text-sm font-medium active:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pinInput.length < 4}
                className="flex-1 h-11 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-30 active:bg-blue-500 transition-colors"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
