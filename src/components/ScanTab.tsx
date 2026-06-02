import { useState } from 'react'

interface ScanTabProps {
  address: string | null
}

export default function ScanTab({ address }: ScanTabProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const startScan = () => {
    if (!address) {
      alert("Сначала подключите кошелёк!")
      return
    }

    setIsScanning(true)
    setResults([])

    // Симуляция сканирования
    setTimeout(() => {
      setResults([
        { 
          network: "Base", 
          delegate: "0xA1B2c3D4e5F6789012345678901234567890ABCD", 
          status: "danger" 
        },
        { 
          network: "Ethereum", 
          delegate: "0x0000000000000000000000000000000000000000", 
          status: "clean" 
        },
        { 
          network: "Arbitrum", 
          delegate: "0xFeedDeadBeef1234567890abcdef1234567890AB", 
          status: "danger" 
        },
      ])
      setIsScanning(false)
    }, 1800)
  }

  if (!address) {
    return <p className="text-center text-zinc-400 py-10">Подключите кошелёк для сканирования</p>
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-zinc-400">Адрес для проверки:</p>
        <p className="font-mono text-xs break-all text-green-400 bg-zinc-900 p-2 rounded-lg mt-1">
          {address}
        </p>
      </div>

      <button
        onClick={startScan}
        disabled={isScanning}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 py-4 rounded-2xl font-semibold text-lg mb-6 transition-colors"
      >
        {isScanning ? '🔍 Сканирую 12 сетей...' : '🚀 Запустить сканирование'}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-lg mb-3">Результаты сканирования</h3>
          {results.map((item, index) => (
            <div key={index} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-base">{item.network}</span>
                  <p className="text-xs text-zinc-500 mt-1 break-all font-mono">{item.delegate}</p>
                </div>
                <span className={`px-4 py-1.5 text-xs rounded-full font-medium ${
                  item.status === 'danger' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {item.status === 'danger' ? '⚠️ Опасная делегация' : '✅ Чисто'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}