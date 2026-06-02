import { useState, useEffect } from 'react'
import { encryptKey, decryptKey } from '../utils/crypto'
import { privateKeyToAccount } from 'viem/accounts'

export default function Settings() {
  const [sponsorKey, setSponsorKey] = useState('')
  const [password, setPassword] = useState('')
  const [savedAddress, setSavedAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['sponsorKeyEncrypted', 'sponsorAddress'], (result) => {
      if (result.sponsorAddress) {
        setSavedAddress(result.sponsorAddress)
        setIsLocked(true)
      }
    })
  }, [])

  const handleSave = async () => {
    setErrorMsg('')
    try {
      const pkClean = sponsorKey.trim().startsWith('0x')
        ? sponsorKey.trim() as `0x${string}`
        : `0x${sponsorKey.trim()}` as `0x${string}`
      if (pkClean.length !== 66) throw new Error('Invalid private key length')
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')

      const acc = privateKeyToAccount(pkClean)
      const encrypted = await encryptKey(pkClean, password)

      await chrome.storage.local.set({
        sponsorKeyEncrypted: encrypted,
        sponsorAddress: acc.address,
      })

      setSavedAddress(acc.address)
      setSponsorKey('')
      setPassword('')
      setIsLocked(true)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e: any) {
      setErrorMsg(e.message)
      setStatus('error')
    }
  }

  const handleUnlock = async () => {
    setErrorMsg('')
    try {
      const result = await chrome.storage.local.get(['sponsorKeyEncrypted'])
      if (!result.sponsorKeyEncrypted) throw new Error('No key saved')
      await decryptKey(result.sponsorKeyEncrypted, unlockPassword)
      setIsLocked(false)
      setUnlockPassword('')
    } catch {
      setErrorMsg('Wrong password')
    }
  }

  const handleClear = async () => {
    if (!confirm('Remove sponsor key?')) return
    await chrome.storage.local.remove(['sponsorKeyEncrypted', 'sponsorAddress'])
    setSavedAddress(null)
    setIsLocked(false)
    setSponsorKey('')
    setPassword('')
    setStatus('idle')
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-semibold text-base">Sponsor Wallet Settings</h2>

      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-3 text-blue-300 text-xs space-y-1">
        <p className="font-semibold">ℹ️ About sponsor wallet</p>
        <p>The sponsor wallet pays gas for revocation transactions. The compromised wallet needs zero ETH. The key is stored encrypted locally — never sent anywhere.</p>
      </div>

      {savedAddress && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 space-y-2">
          <p className="text-xs text-zinc-400">Sponsor wallet</p>
          <p className="font-mono text-xs text-green-400 break-all">{savedAddress}</p>
          {isLocked ? (
            <div className="space-y-2 pt-1">
              <input
                type="password"
                value={unlockPassword}
                onChange={e => setUnlockPassword(e.target.value)}
                placeholder="Enter password to unlock"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button onClick={handleUnlock}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg py-2 text-xs font-medium transition-all">
                  Unlock
                </button>
                <button onClick={handleClear}
                  className="px-3 bg-zinc-800 hover:bg-red-900/50 border border-zinc-700 rounded-lg py-2 text-xs transition-all">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-green-400">🔓 Unlocked</span>
              <button onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Remove key
              </button>
            </div>
          )}
        </div>
      )}

      {(!savedAddress || !isLocked) && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Sponsor private key</label>
            <input
              type="password"
              value={sponsorKey}
              onChange={e => setSponsorKey(e.target.value)}
              placeholder="0x..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-500 placeholder-zinc-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Encryption password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 placeholder-zinc-600"
            />
          </div>
          <button onClick={handleSave}
            disabled={!sponsorKey || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl py-3 text-sm font-medium transition-all">
            Save & Encrypt
          </button>
        </div>
      )}

      {status === 'saved' && (
        <p className="text-green-400 text-xs text-center">✅ Sponsor key saved and encrypted</p>
      )}
      {errorMsg && (
        <p className="text-red-400 text-xs text-center">❌ {errorMsg}</p>
      )}
    </div>
  )
}