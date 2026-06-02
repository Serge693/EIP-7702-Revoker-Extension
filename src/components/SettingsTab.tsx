import { useState } from 'react'

export default function SettingsTab() {
  const [sponsorKey, setSponsorKey] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm text-zinc-400 block mb-2">Sponsor Private Key</label>
        <input 
          type="password"
          value={sponsorKey}
          onChange={(e) => setSponsorKey(e.target.value)}
          placeholder="0x..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono"
        />
        <p className="text-xs text-zinc-500 mt-2">Используется только для оплаты газа</p>
      </div>
    </div>
  )
}