import { useState } from 'react'
import { supportedChains, getChainById, getChainWarning } from '../utils/networks'
import { checkDelegation, getNonce, sendSponsoredRevoke } from '../utils/rpc'
import { signAuthorizationWithPrivateKey } from '../utils/sign'
import { decryptKey } from '../utils/crypto'
import { zeroAddress } from 'viem'

type ChainStatus = {
  chainId: number;
  chainName: string;
  status: 'idle' | 'checking' | 'delegated' | 'clean' | 'error' | 'revoking' | 'revoked';
  delegateTo?: string | null;
}

type Tab = 'scan' | 'delegate'

type Props = {
  privateKey: string;
  setPrivateKey: (v: string) => void;
  pkAddress: string | null;
  setPkAddress: (v: string | null) => void;
  sponsorUnlocked: boolean;
  setSponsorUnlocked: (v: boolean) => void;
  sponsorAddress: string | null;
  setSponsorAddress: (v: string | null) => void;
  sponsorKey: string | null;
  setSponsorKey: (v: string | null) => void;
  unlockPassword: string;
  setUnlockPassword: (v: string) => void;
}

function StatusDot({ status }: { status: ChainStatus['status'] }) {
  if (status === 'checking') return <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse shrink-0" />;
  if (status === 'delegated') return <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />;
  if (status === 'clean') return <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />;
  if (status === 'revoked') return <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />;
  if (status === 'revoking') return <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />;
  return <div className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />;
}

function ExplorerLink({ chainId, txHash }: { chainId: number; txHash: string }) {
  const chain = getChainById(chainId);
  const url = chain?.blockExplorers?.default?.url;
  if (!url) return null;
  return (
    <a href={url + '/tx/' + txHash} target="_blank" rel="noopener noreferrer"
      className="text-xs text-blue-400 hover:text-blue-300 underline block truncate">
      View tx →
    </a>
  );
}

export default function ScanRevoke({
  privateKey, setPrivateKey,
  pkAddress, setPkAddress,
  sponsorUnlocked, setSponsorUnlocked,
  sponsorAddress, setSponsorAddress,
  sponsorKey, setSponsorKey,
  unlockPassword, setUnlockPassword,
}: Props) {
  const [tab, setTab] = useState<Tab>('scan')
  const [address, setAddress] = useState('')
  const [pkError, setPkError] = useState<string | null>(null)
  const [chainStatuses, setChainStatuses] = useState<ChainStatus[]>([])
  const [scanning, setScanning] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [txResults, setTxResults] = useState<Record<number, string>>({})
  const [selectedChains, setSelectedChains] = useState<Set<number>>(new Set())
  const [batchRunning, setBatchRunning] = useState(false)

  // Delegate tab
  const [delegateTarget, setDelegateTarget] = useState('')
  const [delegateChainId] = useState(1)
  const [delegateSelectedChains, setDelegateSelectedChains] = useState<Set<number>>(new Set())
  const [delegating, setDelegating] = useState(false)
  const [delegateTxResults, setDelegateTxResults] = useState<Record<number, string>>({})

  const handleAddressChange = (val: string) => {
    setAddress(val)
    setChainStatuses([])
    setSelectedChains(new Set())
  }

  const handlePrivateKeyChange = async (pk: string) => {
    setPrivateKey(pk)
    setPkError(null)
    setPkAddress(null)
    if (!pk.trim()) return
    try {
      const { privateKeyToAccount } = await import('viem/accounts')
      const pkClean = pk.trim().startsWith('0x')
        ? pk.trim() as `0x${string}`
        : `0x${pk.trim()}` as `0x${string}`
      if (pkClean.length !== 66) { setPkError('Invalid key length'); return }
      const acc = privateKeyToAccount(pkClean)
      setPkAddress(acc.address)
      setAddress(acc.address)
    } catch { setPkError('Invalid private key') }
  }

  const handleUnlockSponsor = async () => {
    setErrorMsg(null)
    try {
      const result = await chrome.storage.local.get(['sponsorKeyEncrypted', 'sponsorAddress'])
      if (!result.sponsorKeyEncrypted) throw new Error('No sponsor key saved. Go to Settings.')
      const decrypted = await decryptKey(result.sponsorKeyEncrypted, unlockPassword)
      setSponsorUnlocked(true)
      setSponsorAddress(result.sponsorAddress)
      setSponsorKey(decrypted)
      setNeedsUnlock(false)
      setUnlockPassword('')
    } catch (e: any) {
      setErrorMsg(e.message || 'Wrong password')
    }
  }

  const runScan = async () => {
    if (!address.trim()) { setErrorMsg('Enter address or private key'); return }
    setErrorMsg(null)
    setScanning(true)
    setTxResults({})
    setSelectedChains(new Set())
    setChainStatuses(
      supportedChains.map(c => ({ chainId: c.id, chainName: c.name, status: 'checking' as const }))
    )
    await Promise.all(
      supportedChains.map(async (chain) => {
        try {
          const { delegated, delegateTo } = await checkDelegation(address.trim() as `0x${string}`, chain.id)
          setChainStatuses(prev =>
            prev.map(s => s.chainId === chain.id
              ? { ...s, status: delegated ? 'delegated' : 'clean', delegateTo }
              : s
            )
          )
        } catch {
          setChainStatuses(prev =>
            prev.map(s => s.chainId === chain.id ? { ...s, status: 'error' } : s)
          )
        }
      })
    )
    setScanning(false)
  }

  const getPkSnapshot = (): `0x${string}` => {
    return privateKey.trim().startsWith('0x')
      ? privateKey.trim() as `0x${string}`
      : `0x${privateKey.trim()}` as `0x${string}`
  }

  const revokeOne = async (chainId: number) => {
    if (!pkAddress || !sponsorKey) return
    setChainStatuses(prev =>
      prev.map(s => s.chainId === chainId ? { ...s, status: 'revoking' } : s)
    )
    try {
      const nonce = await getNonce(address.trim() as `0x${string}`, chainId)
      const { r, s, yParity } = await signAuthorizationWithPrivateKey(getPkSnapshot(), chainId, zeroAddress, nonce)
      const txHash = await sendSponsoredRevoke(
        sponsorKey as `0x${string}`,
        address.trim() as `0x${string}`,
        { chainId, address: zeroAddress, nonce, r, s, yParity },
        chainId,
      )
      setTxResults(prev => ({ ...prev, [chainId]: txHash }))
      setChainStatuses(prev =>
        prev.map(s => s.chainId === chainId ? { ...s, status: 'revoked', delegateTo: null } : s)
      )
    } catch (e: any) {
      setErrorMsg(e?.shortMessage || e?.message || 'Unknown error')
      setChainStatuses(prev =>
        prev.map(s => s.chainId === chainId ? { ...s, status: 'delegated' } : s)
      )
    }
  }

  const handleRevokeOne = async (chainId: number) => {
    setErrorMsg(null)
    if (!pkAddress) { setErrorMsg('Enter private key first'); return }
    if (!sponsorUnlocked || !sponsorKey) { setNeedsUnlock(true); return }
    const warning = getChainWarning(chainId)
    if (warning && !confirm(warning + '\n\nContinue?')) return
    await revokeOne(chainId)
  }

  const handleBatchRevoke = async () => {
    setErrorMsg(null)
    if (!pkAddress) { setErrorMsg('Enter private key first'); return }
    if (!sponsorUnlocked || !sponsorKey) { setNeedsUnlock(true); return }
    if (selectedChains.size === 0) { setErrorMsg('Select at least one network'); return }

    setBatchRunning(true)
    for (const chainId of selectedChains) {
      const warning = getChainWarning(chainId)
      if (warning && !confirm(warning + '\n\nContinue?')) continue
      await revokeOne(chainId)
    }
    setSelectedChains(new Set())
    setBatchRunning(false)
  }

  const handleDelegate = async (chainIds: number[]) => {
    setErrorMsg(null)
    setDelegateTxResults({})
    const target = delegateTarget.trim() as `0x${string}`
    if (!target.startsWith('0x') || target.length !== 42) { setErrorMsg('Invalid contract address'); return }
    if (!pkAddress) { setErrorMsg('Enter private key first'); return }
    if (!sponsorUnlocked || !sponsorKey) { setNeedsUnlock(true); return }

    setDelegating(true)
    for (const chainId of chainIds) {
      const warning = getChainWarning(chainId)
      if (warning && !confirm(warning + '\n\nContinue?')) continue
      try {
        const nonce = await getNonce(address.trim() as `0x${string}`, chainId)
        const { r, s, yParity } = await signAuthorizationWithPrivateKey(getPkSnapshot(), chainId, target, nonce)
        const txHash = await sendSponsoredRevoke(
          sponsorKey as `0x${string}`,
          address.trim() as `0x${string}`,
          { chainId, address: target, nonce, r, s, yParity },
          chainId,
        )
        setDelegateTxResults(prev => ({ ...prev, [chainId]: txHash }))
      } catch (e: any) {
        setErrorMsg(e?.shortMessage || e?.message || 'Unknown error')
      }
    }
    setDelegateSelectedChains(new Set())
    setDelegating(false)
  }

  const toggleChain = (chainId: number) => {
    setSelectedChains(prev => {
      const next = new Set(prev)
      next.has(chainId) ? next.delete(chainId) : next.add(chainId)
      return next
    })
  }

  const toggleDelegateChain = (chainId: number) => {
    setDelegateSelectedChains(prev => {
      const next = new Set(prev)
      next.has(chainId) ? next.delete(chainId) : next.add(chainId)
      return next
    })
  }

  const delegatedChains = chainStatuses.filter(s => s.status === 'delegated')
  const allDelegatedSelected = delegatedChains.length > 0 &&
    delegatedChains.every(s => selectedChains.has(s.chainId))

  const toggleSelectAll = () => {
    if (allDelegatedSelected) {
      setSelectedChains(new Set())
    } else {
      setSelectedChains(new Set(delegatedChains.map(s => s.chainId)))
    }
  }

  return (
    <div className="p-4 space-y-4">

      {/* Private key */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-400">Private key of compromised wallet</label>
        <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-2.5 text-orange-300 text-xs">
          ⚠️ Used only locally to sign authorization. Never sent anywhere.
        </div>
        <input
          type="password"
          value={privateKey}
          onChange={e => handlePrivateKeyChange(e.target.value)}
          placeholder="0x... (auto-fills address)"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-orange-500 placeholder-zinc-600"
        />
        {pkAddress && <p className="text-green-400 text-xs">✅ {pkAddress.slice(0, 10)}...{pkAddress.slice(-6)}</p>}
        {pkError && <p className="text-red-400 text-xs">❌ {pkError}</p>}
      </div>

      {/* Address */}
      <div className="space-y-1">
        <label className="text-xs text-zinc-400">Address to scan</label>
        <input
          type="text"
          value={address}
          onChange={e => handleAddressChange(e.target.value)}
          placeholder="0x..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-500 placeholder-zinc-600"
        />
      </div>

      {/* Sponsor */}
      <div className={['rounded-xl p-2.5 text-xs flex items-center justify-between',
        sponsorUnlocked ? 'bg-green-900/20 border border-green-800' : 'bg-zinc-900 border border-zinc-700',
      ].join(' ')}>
        <span className={sponsorUnlocked ? 'text-green-400' : 'text-zinc-400'}>
          {sponsorUnlocked
            ? `✅ Sponsor: ${sponsorAddress?.slice(0, 10)}...${sponsorAddress?.slice(-6)}`
            : '⚡ Sponsor wallet — pays gas'}
        </span>
        {!sponsorUnlocked && (
          <button onClick={() => setNeedsUnlock(true)}
            className="text-xs text-blue-400 hover:text-blue-300 underline">
            Unlock
          </button>
        )}
      </div>

      {/* Unlock modal */}
      {needsUnlock && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 space-y-2">
          <p className="text-xs text-zinc-400">Enter sponsor wallet password</p>
          <input
            type="password"
            value={unlockPassword}
            onChange={e => setUnlockPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlockSponsor()}
            placeholder="Password"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button onClick={handleUnlockSponsor}
              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg py-2 text-xs font-medium">
              Unlock
            </button>
            <button onClick={() => setNeedsUnlock(false)}
              className="px-3 bg-zinc-800 rounded-lg py-2 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Inner tabs */}
      <div className="flex border border-zinc-800 rounded-xl overflow-hidden">
        <button
          onClick={() => { setTab('scan'); setErrorMsg(null); }}
          className={['flex-1 py-2 text-xs font-medium transition-colors',
            tab === 'scan' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300',
          ].join(' ')}
        >
          🔍 Scan & Revoke
        </button>
        <button
          onClick={() => { setTab('delegate'); setErrorMsg(null); }}
          className={['flex-1 py-2 text-xs font-medium transition-colors',
            tab === 'delegate' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300',
          ].join(' ')}
        >
          🔗 Delegate
        </button>
      </div>

      {/* SCAN TAB */}
      {tab === 'scan' && (
        <div className="space-y-3">
          <button onClick={runScan} disabled={scanning || !address.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl py-3 text-sm font-medium transition-all">
            {scanning ? '🔍 Scanning...' : '🔍 Scan All Networks'}
          </button>

          {chainStatuses.length > 0 && (
            <div className="space-y-2">
              {delegatedChains.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="bg-red-900/20 border border-red-800 rounded-xl px-3 py-2 text-red-300 text-xs flex-1 mr-2">
                      ⚠️ {delegatedChains.length} delegation{delegatedChains.length !== 1 ? 's' : ''} found
                    </div>
                    <button
                      onClick={toggleSelectAll}
                      className="text-xs text-zinc-400 hover:text-zinc-200 whitespace-nowrap"
                    >
                      {allDelegatedSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  {selectedChains.size > 0 && (
                    <button
                      onClick={handleBatchRevoke}
                      disabled={batchRunning || !pkAddress || !sponsorUnlocked}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl py-2.5 text-sm font-bold transition-all"
                    >
                      {batchRunning
                        ? 'Revoking...'
                        : `🚫 Revoke Selected (${selectedChains.size})`}
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                {chainStatuses.map(s => (
                  <div key={s.chainId}
                    className={['bg-zinc-900 border rounded-xl p-2.5 space-y-1.5 transition-all',
                      selectedChains.has(s.chainId) ? 'border-red-500' : 'border-zinc-800',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-1.5">
                      {s.status === 'delegated' && (
                        <input
                          type="checkbox"
                          checked={selectedChains.has(s.chainId)}
                          onChange={() => toggleChain(s.chainId)}
                          className="w-3 h-3 accent-red-500 shrink-0"
                        />
                      )}
                      <StatusDot status={s.status} />
                      <span className="text-xs font-medium truncate">{s.chainName}</span>
                    </div>
                    {s.status === 'checking' && <span className="text-xs text-zinc-500">checking...</span>}
                    {s.status === 'clean' && <span className="text-xs text-green-500">Clean</span>}
                    {s.status === 'error' && <span className="text-xs text-zinc-500">RPC error</span>}
                    {s.status === 'revoked' && <span className="text-xs text-green-400">✅ Revoked</span>}
                    {s.status === 'revoking' && <span className="text-xs text-blue-400">Sending...</span>}
                    {s.status === 'delegated' && (
                      <button onClick={() => handleRevokeOne(s.chainId)}
                        disabled={!pkAddress || !sponsorUnlocked || batchRunning}
                        className="w-full text-xs bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg py-1.5 font-medium transition-all">
                        Revoke
                      </button>
                    )}
                    {txResults[s.chainId] && (
                      <ExplorerLink chainId={s.chainId} txHash={txResults[s.chainId]} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DELEGATE TAB */}
      {tab === 'delegate' && (
        <div className="space-y-3">
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-2.5 text-yellow-400 text-xs">
            ⚠️ Delegating gives the contract full control over your EOA. Only use contracts you trust.
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Contract address to delegate to</label>
            <input
              type="text"
              value={delegateTarget}
              onChange={e => setDelegateTarget(e.target.value)}
              placeholder="0x..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-500 placeholder-zinc-600"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Select networks</label>
              <button
                onClick={() => {
                  const allIds = new Set(supportedChains.map(c => c.id))
                  const allSelected = supportedChains.every(c => delegateSelectedChains.has(c.id))
                  setDelegateSelectedChains(allSelected ? new Set() : allIds)
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                {supportedChains.every(c => delegateSelectedChains.has(c.id)) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {supportedChains.map(c => (
                <label key={c.id}
                  className={['flex items-center gap-2 bg-zinc-900 border rounded-xl px-3 py-2 cursor-pointer transition-all',
                    delegateSelectedChains.has(c.id) ? 'border-blue-500' : 'border-zinc-800 hover:border-zinc-600',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={delegateSelectedChains.has(c.id)}
                    onChange={() => toggleDelegateChain(c.id)}
                    className="w-3 h-3 accent-blue-500 shrink-0"
                  />
                  <span className="text-xs truncate">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDelegate(delegateSelectedChains.size > 0
                ? Array.from(delegateSelectedChains)
                : [delegateChainId]
              )}
              disabled={!delegateTarget || delegating || !pkAddress || !sponsorUnlocked}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl py-3 text-sm font-medium transition-all"
            >
              {delegating
                ? 'Sending...'
                : delegateSelectedChains.size > 0
                  ? `Delegate on ${delegateSelectedChains.size} networks`
                  : 'Delegate'}
            </button>
          </div>

          {Object.entries(delegateTxResults).length > 0 && (
            <div className="space-y-1">
              {Object.entries(delegateTxResults).map(([chainId, txHash]) => (
                <div key={chainId} className="bg-green-900/20 border border-green-800 rounded-xl px-3 py-2 space-y-0.5">
                  <p className="text-xs text-green-400">{getChainById(Number(chainId))?.name}</p>
                  <ExplorerLink chainId={Number(chainId)} txHash={txHash} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-900/30 border border-red-700 p-3 rounded-xl text-red-300 text-xs">
          ❌ {errorMsg}
        </div>
      )}

    </div>
  )
}