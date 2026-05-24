import { useState } from 'react'
import ScanRevoke from './components/ScanRevoke'
import Settings from './components/Settings'

type Tab = 'scan' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('scan')
  const [privateKey, setPrivateKey] = useState('')
  const [pkAddress, setPkAddress] = useState<string | null>(null)
  const [sponsorUnlocked, setSponsorUnlocked] = useState(false)
  const [sponsorAddress, setSponsorAddress] = useState<string | null>(null)
  const [sponsorKey, setSponsorKey] = useState<string | null>(null)
  const [unlockPassword, setUnlockPassword] = useState('')

  return (
    <div className="w-[400px] min-h-[560px] bg-zinc-950 text-white flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
        <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-xl">🛡️</div>
        <div>
          <h1 className="text-lg font-bold leading-tight">EIP-7702 Revoker</h1>
          <p className="text-xs text-zinc-500">Delegation Manager</p>
        </div>
      </div>

      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setTab('scan')}
          className={['flex-1 py-2.5 text-sm font-medium transition-colors',
            tab === 'scan' ? 'text-white border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300',
          ].join(' ')}
        >
          🔍 Scan & Revoke
        </button>
        <button
          onClick={() => setTab('settings')}
          className={['flex-1 py-2.5 text-sm font-medium transition-colors',
            tab === 'settings' ? 'text-white border-b-2 border-zinc-400' : 'text-zinc-500 hover:text-zinc-300',
          ].join(' ')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'scan' && (
          <ScanRevoke
            privateKey={privateKey}
            setPrivateKey={setPrivateKey}
            pkAddress={pkAddress}
            setPkAddress={setPkAddress}
            sponsorUnlocked={sponsorUnlocked}
            setSponsorUnlocked={setSponsorUnlocked}
            sponsorAddress={sponsorAddress}
            setSponsorAddress={setSponsorAddress}
            sponsorKey={sponsorKey}
            setSponsorKey={setSponsorKey}
            unlockPassword={unlockPassword}
            setUnlockPassword={setUnlockPassword}
          />
        )}
        {tab === 'settings' && <Settings />}
      </div>
    </div>
  )
}