import { useState, useEffect } from 'react'

interface Props {
  onSecretInput: (pin: string) => void
}

export function WeatherSkin({ onSecretInput }: Props) {
  const [tapCount, setTapCount] = useState(0)
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

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
      const pin = prompt('Enter access code:')
      if (pin) onSecretInput(pin)
      return
    }

    const timer = setTimeout(() => setTapCount(0), 2000)
    setTapTimer(timer)
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
    </div>
  )
}
