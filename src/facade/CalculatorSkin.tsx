import { useState } from 'react'

export function CalculatorSkin() {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [fresh, setFresh] = useState(true)

  const inputDigit = (d: string) => {
    if (fresh) {
      setDisplay(d)
      setFresh(false)
    } else {
      setDisplay(display === '0' ? d : display + d)
    }
  }

  const inputDot = () => {
    if (fresh) {
      setDisplay('0.')
      setFresh(false)
      return
    }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  const clear = () => {
    setDisplay('0')
    setPrev(null)
    setOp(null)
    setFresh(true)
  }

  const performOp = (nextOp: string) => {
    const current = parseFloat(display)
    if (prev !== null && op) {
      let result = prev
      switch (op) {
        case '+': result = prev + current; break
        case '-': result = prev - current; break
        case '*': result = prev * current; break
        case '/': result = current !== 0 ? prev / current : 0; break
      }
      setDisplay(String(result))
      setPrev(result)
    } else {
      setPrev(current)
    }
    setOp(nextOp)
    setFresh(true)
  }

  const equals = () => {
    if (prev === null || !op) return
    performOp(op)
    setOp(null)
  }

  const percent = () => {
    setDisplay(String(parseFloat(display) / 100))
  }

  const negate = () => {
    setDisplay(String(-parseFloat(display)))
  }

  const buttons = [
    { label: 'C', action: clear, style: 'bg-gray-600 text-gray-900' },
    { label: '±', action: negate, style: 'bg-gray-600 text-gray-900' },
    { label: '%', action: percent, style: 'bg-gray-600 text-gray-900' },
    { label: '÷', action: () => performOp('/'), style: 'bg-orange-500 text-white' },

    { label: '7', action: () => inputDigit('7'), style: 'bg-gray-800' },
    { label: '8', action: () => inputDigit('8'), style: 'bg-gray-800' },
    { label: '9', action: () => inputDigit('9'), style: 'bg-gray-800' },
    { label: '×', action: () => performOp('*'), style: 'bg-orange-500 text-white' },

    { label: '4', action: () => inputDigit('4'), style: 'bg-gray-800' },
    { label: '5', action: () => inputDigit('5'), style: 'bg-gray-800' },
    { label: '6', action: () => inputDigit('6'), style: 'bg-gray-800' },
    { label: '-', action: () => performOp('-'), style: 'bg-orange-500 text-white' },

    { label: '1', action: () => inputDigit('1'), style: 'bg-gray-800' },
    { label: '2', action: () => inputDigit('2'), style: 'bg-gray-800' },
    { label: '3', action: () => inputDigit('3'), style: 'bg-gray-800' },
    { label: '+', action: () => performOp('+'), style: 'bg-orange-500 text-white' },

    { label: '0', action: () => inputDigit('0'), style: 'bg-gray-800 col-span-2' },
    { label: '.', action: inputDot, style: 'bg-gray-800' },
    { label: '=', action: equals, style: 'bg-orange-500 text-white' },
  ]

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs">
        <div className="text-right text-4xl font-light text-white mb-6 px-4 truncate h-12">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className={`${btn.style} rounded-full h-16 text-xl font-medium active:opacity-70 transition-opacity`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
