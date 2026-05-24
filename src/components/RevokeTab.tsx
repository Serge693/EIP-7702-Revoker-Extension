interface RevokeTabProps {
  address: string | null
}

export default function RevokeTab({ address }: RevokeTabProps) {
  if (!address) {
    return (
      <div className="text-center py-12 text-zinc-400">
        Подключите кошелёк для отзыва делегаций
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Отзыв делегации</h3>
        <div className="bg-zinc-900 p-4 rounded-2xl">
          <p className="text-sm text-zinc-400 mb-2">Source Address</p>
          <p className="font-mono text-xs break-all text-green-400">{address}</p>
        </div>
      </div>

      <button 
        className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-semibold text-lg transition-colors"
        onClick={() => alert("Функция отзыва будет реализована в следующей версии")}
      >
        Отозвать все опасные делегации
      </button>

      <p className="text-xs text-zinc-500 text-center">
        Sponsor Private Key настраивается во вкладке "Настройки"
      </p>
    </div>
  )
}