import { useState, useMemo, useEffect } from 'react'
import './App.css'

interface W2Data {
  wages: number
  federalTax: number
  stateTax: number
  socialSecurity: number
  medicare: number
  overtimePay: number
  tips: number
}

interface Form1099Data {
  income: number
  expenses: number
}

interface CryptoTransaction {
  id: number
  type: 'buy' | 'sell' | 'transfer'
  amount: number
  price: number
  token: string
  date: string
  network: string
}

interface WalletData {
  address: string
  network: string
  totalReceived: number
  totalSent: number
  txCount: number
  tokens: string[]
  transactions: CryptoTransaction[]
}

type Blockchain = 'ethereum' | 'solana' | 'bitcoin' | 'polygon' | 'arbitrum' | 'avalanche' | 'base' | 'tron'

const BLOCKCHAINS: { value: Blockchain; label: string; icon: string }[] = [
  { value: 'ethereum', label: 'Ethereum', icon: '🔷' },
  { value: 'solana', label: 'Solana', icon: '☀️' },
  { value: 'bitcoin', label: 'Bitcoin', icon: '₿' },
  { value: 'polygon', label: 'Polygon', icon: '⬡' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '🔵' },
  { value: 'avalanche', label: 'Avalanche', icon: '🔺' },
  { value: 'base', label: 'Base', icon: '🔴' },
  { value: 'tron', label: 'Tron', icon: '🔶' },
]

interface StateTaxInfo {
  name: string
  rates: { min: number; max: number; rate: number }[]
  isNoTax: boolean
}

const STATE_TAX_DATA: Record<string, StateTaxInfo> = {
  AL: { name: 'Alabama', rates: [{ min: 0, max: 500, rate: 0.02 }, { min: 500, max: 3000, rate: 0.04 }, { min: 3000, max: Infinity, rate: 0.05 }], isNoTax: false },
  AK: { name: 'Alaska', rates: [], isNoTax: true },
  AZ: { name: 'Arizona', rates: [{ min: 0, max: 28653, rate: 0.0259 }, { min: 28653, max: Infinity, rate: 0.0259 }], isNoTax: false },
  AR: { name: 'Arkansas', rates: [{ min: 0, max: 4400, rate: 0.02 }, { min: 4400, max: 8800, rate: 0.04 }, { min: 8800, max: Infinity, rate: 0.044 }], isNoTax: false },
  CA: { name: 'California', rates: [{ min: 0, max: 10412, rate: 0.01 }, { min: 10412, max: 24684, rate: 0.02 }, { min: 24684, max: 38959, rate: 0.04 }, { min: 38959, max: 54081, rate: 0.06 }, { min: 54081, max: 68350, rate: 0.08 }, { min: 68350, max: 349137, rate: 0.093 }, { min: 349137, max: 418961, rate: 0.103 }, { min: 418961, max: 698271, rate: 0.113 }, { min: 698271, max: Infinity, rate: 0.123 }], isNoTax: false },
  CO: { name: 'Colorado', rates: [{ min: 0, max: Infinity, rate: 0.044 }], isNoTax: false },
  CT: { name: 'Connecticut', rates: [{ min: 0, max: 10000, rate: 0.03 }, { min: 10000, max: 50000, rate: 0.05 }, { min: 50000, max: 100000, rate: 0.055 }, { min: 100000, max: 200000, rate: 0.06 }, { min: 200000, max: 250000, rate: 0.065 }, { min: 250000, max: Infinity, rate: 0.0699 }], isNoTax: false },
  DE: { name: 'Delaware', rates: [{ min: 0, max: 2000, rate: 0.022 }, { min: 2000, max: 5000, rate: 0.039 }, { min: 5000, max: 10000, rate: 0.048 }, { min: 10000, max: 25000, rate: 0.052 }, { min: 25000, max: 60000, rate: 0.0555 }, { min: 60000, max: Infinity, rate: 0.066 }], isNoTax: false },
  FL: { name: 'Florida', rates: [], isNoTax: true },
  GA: { name: 'Georgia', rates: [{ min: 0, max: 750, rate: 0.01 }, { min: 750, max: 2250, rate: 0.02 }, { min: 2250, max: 3750, rate: 0.03 }, { min: 3750, max: 5250, rate: 0.04 }, { min: 5250, max: 7000, rate: 0.05 }, { min: 7000, max: Infinity, rate: 0.0549 }], isNoTax: false },
  HI: { name: 'Hawaii', rates: [{ min: 0, max: 2400, rate: 0.014 }, { min: 2400, max: 4800, rate: 0.032 }, { min: 4800, max: 9600, rate: 0.055 }, { min: 9600, max: 14400, rate: 0.064 }, { min: 14400, max: 19200, rate: 0.068 }, { min: 19200, max: 24000, rate: 0.072 }, { min: 24000, max: 36000, rate: 0.076 }, { min: 36000, max: 48000, rate: 0.079 }, { min: 48000, max: 150000, rate: 0.0825 }, { min: 150000, max: 175000, rate: 0.09 }, { min: 175000, max: 200000, rate: 0.10 }, { min: 200000, max: Infinity, rate: 0.11 }], isNoTax: false },
  ID: { name: 'Idaho', rates: [{ min: 0, max: 1662, rate: 0.01 }, { min: 1662, max: 4987, rate: 0.03 }, { min: 4987, max: 8311, rate: 0.045 }, { min: 8311, max: Infinity, rate: 0.058 }], isNoTax: false },
  IL: { name: 'Illinois', rates: [{ min: 0, max: Infinity, rate: 0.0495 }], isNoTax: false },
  IN: { name: 'Indiana', rates: [{ min: 0, max: Infinity, rate: 0.0305 }], isNoTax: false },
  IA: { name: 'Iowa', rates: [{ min: 0, max: 6210, rate: 0.044 }, { min: 6210, max: 31050, rate: 0.0482 }, { min: 31050, max: Infinity, rate: 0.057 }], isNoTax: false },
  KS: { name: 'Kansas', rates: [{ min: 0, max: 15000, rate: 0.031 }, { min: 15000, max: 30000, rate: 0.0525 }, { min: 30000, max: Infinity, rate: 0.057 }], isNoTax: false },
  KY: { name: 'Kentucky', rates: [{ min: 0, max: Infinity, rate: 0.04 }], isNoTax: false },
  LA: { name: 'Louisiana', rates: [{ min: 0, max: 12500, rate: 0.0185 }, { min: 12500, max: 50000, rate: 0.035 }, { min: 50000, max: Infinity, rate: 0.0425 }], isNoTax: false },
  ME: { name: 'Maine', rates: [{ min: 0, max: 24500, rate: 0.058 }, { min: 24500, max: 58150, rate: 0.0675 }, { min: 58150, max: Infinity, rate: 0.0715 }], isNoTax: false },
  MD: { name: 'Maryland', rates: [{ min: 0, max: 1000, rate: 0.02 }, { min: 1000, max: 2000, rate: 0.03 }, { min: 2000, max: 3000, rate: 0.04 }, { min: 3000, max: 100000, rate: 0.0475 }, { min: 100000, max: 125000, rate: 0.05 }, { min: 125000, max: 150000, rate: 0.0525 }, { min: 150000, max: 250000, rate: 0.055 }, { min: 250000, max: Infinity, rate: 0.0575 }], isNoTax: false },
  MA: { name: 'Massachusetts', rates: [{ min: 0, max: Infinity, rate: 0.05 }], isNoTax: false },
  MI: { name: 'Michigan', rates: [{ min: 0, max: Infinity, rate: 0.0425 }], isNoTax: false },
  MN: { name: 'Minnesota', rates: [{ min: 0, max: 30070, rate: 0.0535 }, { min: 30070, max: 98760, rate: 0.068 }, { min: 98760, max: 183340, rate: 0.0785 }, { min: 183340, max: Infinity, rate: 0.0985 }], isNoTax: false },
  MS: { name: 'Mississippi', rates: [{ min: 0, max: 10000, rate: 0.0 }, { min: 10000, max: Infinity, rate: 0.047 }], isNoTax: false },
  MO: { name: 'Missouri', rates: [{ min: 0, max: 1207, rate: 0.02 }, { min: 1207, max: 2414, rate: 0.025 }, { min: 2414, max: 3619, rate: 0.03 }, { min: 3619, max: 4826, rate: 0.035 }, { min: 4826, max: 6033, rate: 0.04 }, { min: 6033, max: 7240, rate: 0.045 }, { min: 7240, max: 8447, rate: 0.05 }, { min: 8447, max: Infinity, rate: 0.048 }], isNoTax: false },
  MT: { name: 'Montana', rates: [{ min: 0, max: 20500, rate: 0.047 }, { min: 20500, max: Infinity, rate: 0.059 }], isNoTax: false },
  NE: { name: 'Nebraska', rates: [{ min: 0, max: 3700, rate: 0.0246 }, { min: 3700, max: 22170, rate: 0.0351 }, { min: 22170, max: 35730, rate: 0.0501 }, { min: 35730, max: Infinity, rate: 0.0584 }], isNoTax: false },
  NV: { name: 'Nevada', rates: [], isNoTax: true },
  NH: { name: 'New Hampshire', rates: [], isNoTax: true },
  NJ: { name: 'New Jersey', rates: [{ min: 0, max: 20000, rate: 0.014 }, { min: 20000, max: 35000, rate: 0.0175 }, { min: 35000, max: 40000, rate: 0.035 }, { min: 40000, max: 75000, rate: 0.05525 }, { min: 75000, max: 500000, rate: 0.0637 }, { min: 500000, max: 1000000, rate: 0.0897 }, { min: 1000000, max: Infinity, rate: 0.1075 }], isNoTax: false },
  NM: { name: 'New Mexico', rates: [{ min: 0, max: 5500, rate: 0.017 }, { min: 5500, max: 11000, rate: 0.032 }, { min: 11000, max: 16000, rate: 0.047 }, { min: 16000, max: 210000, rate: 0.049 }, { min: 210000, max: Infinity, rate: 0.059 }], isNoTax: false },
  NY: { name: 'New York', rates: [{ min: 0, max: 8500, rate: 0.04 }, { min: 8500, max: 11700, rate: 0.045 }, { min: 11700, max: 13900, rate: 0.0525 }, { min: 13900, max: 80650, rate: 0.055 }, { min: 80650, max: 215400, rate: 0.06 }, { min: 215400, max: 1077550, rate: 0.0685 }, { min: 1077550, max: 5000000, rate: 0.0965 }, { min: 5000000, max: 25000000, rate: 0.103 }, { min: 25000000, max: Infinity, rate: 0.109 }], isNoTax: false },
  NC: { name: 'North Carolina', rates: [{ min: 0, max: Infinity, rate: 0.0475 }], isNoTax: false },
  ND: { name: 'North Dakota', rates: [{ min: 0, max: 44725, rate: 0.0195 }, { min: 44725, max: Infinity, rate: 0.0195 }], isNoTax: false },
  OH: { name: 'Ohio', rates: [{ min: 0, max: 26050, rate: 0.0 }, { min: 26050, max: 100000, rate: 0.0277 }, { min: 100000, max: Infinity, rate: 0.035 }], isNoTax: false },
  OK: { name: 'Oklahoma', rates: [{ min: 0, max: 1000, rate: 0.0025 }, { min: 1000, max: 2500, rate: 0.0075 }, { min: 2500, max: 3750, rate: 0.0175 }, { min: 3750, max: 4900, rate: 0.0275 }, { min: 4900, max: 7200, rate: 0.0375 }, { min: 7200, max: Infinity, rate: 0.0475 }], isNoTax: false },
  OR: { name: 'Oregon', rates: [{ min: 0, max: 4050, rate: 0.0475 }, { min: 4050, max: 10200, rate: 0.0675 }, { min: 10200, max: 125000, rate: 0.0875 }, { min: 125000, max: Infinity, rate: 0.099 }], isNoTax: false },
  PA: { name: 'Pennsylvania', rates: [{ min: 0, max: Infinity, rate: 0.0307 }], isNoTax: false },
  RI: { name: 'Rhode Island', rates: [{ min: 0, max: 73450, rate: 0.0375 }, { min: 73450, max: 166950, rate: 0.0475 }, { min: 166950, max: Infinity, rate: 0.0599 }], isNoTax: false },
  SC: { name: 'South Carolina', rates: [{ min: 0, max: 3460, rate: 0.0 }, { min: 3460, max: 17330, rate: 0.03 }, { min: 17330, max: Infinity, rate: 0.064 }], isNoTax: false },
  SD: { name: 'South Dakota', rates: [], isNoTax: true },
  TN: { name: 'Tennessee', rates: [], isNoTax: true },
  TX: { name: 'Texas', rates: [], isNoTax: true },
  UT: { name: 'Utah', rates: [{ min: 0, max: Infinity, rate: 0.0465 }], isNoTax: false },
  VT: { name: 'Vermont', rates: [{ min: 0, max: 45400, rate: 0.0335 }, { min: 45400, max: 110050, rate: 0.066 }, { min: 110050, max: 229550, rate: 0.076 }, { min: 229550, max: Infinity, rate: 0.0875 }], isNoTax: false },
  VA: { name: 'Virginia', rates: [{ min: 0, max: 3000, rate: 0.02 }, { min: 3000, max: 5000, rate: 0.03 }, { min: 5000, max: 17000, rate: 0.05 }, { min: 17000, max: Infinity, rate: 0.0575 }], isNoTax: false },
  WA: { name: 'Washington', rates: [], isNoTax: true },
  WV: { name: 'West Virginia', rates: [{ min: 0, max: 10000, rate: 0.0236 }, { min: 10000, max: 25000, rate: 0.0315 }, { min: 25000, max: 40000, rate: 0.0354 }, { min: 40000, max: 60000, rate: 0.0472 }, { min: 60000, max: Infinity, rate: 0.0512 }], isNoTax: false },
  WI: { name: 'Wisconsin', rates: [{ min: 0, max: 14320, rate: 0.035 }, { min: 14320, max: 28640, rate: 0.044 }, { min: 28640, max: 315310, rate: 0.053 }, { min: 315310, max: Infinity, rate: 0.0765 }], isNoTax: false },
  WY: { name: 'Wyoming', rates: [], isNoTax: true },
  DC: { name: 'Washington D.C.', rates: [{ min: 0, max: 10000, rate: 0.04 }, { min: 10000, max: 40000, rate: 0.06 }, { min: 40000, max: 60000, rate: 0.065 }, { min: 60000, max: 250000, rate: 0.085 }, { min: 250000, max: 500000, rate: 0.0925 }, { min: 500000, max: 1000000, rate: 0.0975 }, { min: 1000000, max: Infinity, rate: 0.1075 }], isNoTax: false },
}

const FEDERAL_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
]

const LONG_TERM_BRACKETS = [
  { min: 0, max: 47025, rate: 0.00 },
  { min: 47025, max: 518900, rate: 0.15 },
  { min: 518900, max: Infinity, rate: 0.20 },
]

interface Lot {
  amount: number
  price: number
  date: string
}

interface GainLoss {
  token: string
  sellAmount: number
  sellPrice: number
  costBasis: number
  proceeds: number
  gainLoss: number
  holdingPeriod: 'short' | 'long'
  sellDate: string
}

function calculateTax(income: number, brackets: { min: number; max: number; rate: number }[]): number {
  if (brackets.length === 0) return 0
  let tax = 0
  let remaining = income
  
  for (const bracket of brackets) {
    if (remaining <= 0) break
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min)
    tax += taxableInBracket * bracket.rate
    remaining -= taxableInBracket
  }
  
  return tax
}

function calculateFIFOCapitalGains(transactions: CryptoTransaction[]): { shortTermGains: number; longTermGains: number; gains: GainLoss[] } {
  const lotsByToken: Record<string, Lot[]> = {}
  const gains: GainLoss[] = []

  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  for (const tx of sortedTxs) {
    if (!lotsByToken[tx.token]) {
      lotsByToken[tx.token] = []
    }

    if (tx.type === 'buy') {
      lotsByToken[tx.token].push({
        amount: tx.amount,
        price: tx.price,
        date: tx.date
      })
    } else if (tx.type === 'sell') {
      let remainingToSell = tx.amount
      let totalCostBasis = 0
      const lots = lotsByToken[tx.token]
      let earliestDate = tx.date

      while (remainingToSell > 0 && lots.length > 0) {
        const lot = lots[0]
        const amountFromLot = Math.min(remainingToSell, lot.amount)
        
        totalCostBasis += amountFromLot * lot.price
        remainingToSell -= amountFromLot
        earliestDate = lot.date
        
        if (amountFromLot >= lot.amount) {
          lots.shift()
        } else {
          lot.amount -= amountFromLot
        }
      }

      const proceeds = tx.amount * tx.price
      const gainLoss = proceeds - totalCostBasis
      
      const sellDate = new Date(tx.date)
      const buyDate = new Date(earliestDate)
      const daysHeld = Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24))
      const holdingPeriod = daysHeld <= 365 ? 'short' : 'long'

      gains.push({
        token: tx.token,
        sellAmount: tx.amount,
        sellPrice: tx.price,
        costBasis: totalCostBasis,
        proceeds,
        gainLoss,
        holdingPeriod,
        sellDate: tx.date
      })
    }
  }

  const shortTermGains = gains.filter(g => g.holdingPeriod === 'short').reduce((sum, g) => sum + g.gainLoss, 0)
  const longTermGains = gains.filter(g => g.holdingPeriod === 'long').reduce((sum, g) => sum + g.gainLoss, 0)

  return { shortTermGains, longTermGains, gains }
}

const mockWalletData: Record<string, WalletData> = {
  '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4': {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4',
    network: 'ethereum',
    totalReceived: 45.832,
    totalSent: 12.154,
    txCount: 47,
    tokens: ['ETH', 'USDC', 'LINK', 'UNI'],
    transactions: [
      { id: 1, type: 'buy', amount: 2.5, price: 1850, token: 'ETH', date: '2024-01-15', network: 'ethereum' },
      { id: 2, type: 'buy', amount: 500, price: 1, token: 'USDC', date: '2024-02-01', network: 'ethereum' },
      { id: 3, type: 'buy', amount: 25, price: 18.5, token: 'LINK', date: '2024-02-15', network: 'ethereum' },
      { id: 4, type: 'sell', amount: 1.2, price: 2100, token: 'ETH', date: '2024-03-10', network: 'ethereum' },
      { id: 5, type: 'buy', amount: 100, price: 9.8, token: 'UNI', date: '2024-04-01', network: 'ethereum' },
      { id: 6, type: 'sell', amount: 10, price: 22, token: 'LINK', date: '2024-05-20', network: 'ethereum' },
    ]
  },
  '0x8ba1f109551bD432803012645Ac136ddd64DBA72': {
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    network: 'ethereum',
    totalReceived: 12.45,
    totalSent: 3.21,
    txCount: 23,
    tokens: ['BTC', 'ETH', 'USDT'],
    transactions: [
      { id: 1, type: 'buy', amount: 0.5, price: 42000, token: 'BTC', date: '2024-01-08', network: 'bitcoin' },
      { id: 2, type: 'buy', amount: 3.2, price: 2200, token: 'ETH', date: '2024-01-20', network: 'ethereum' },
      { id: 3, type: 'sell', amount: 0.15, price: 45000, token: 'BTC', date: '2024-03-15', network: 'bitcoin' },
      { id: 4, type: 'buy', amount: 1500, price: 1, token: 'USDT', date: '2024-04-10', network: 'ethereum' },
    ]
  },
  'DxVWLqDgFnU4QKe2X1hKvK5778893gJ4TzqyVAKH7uY': {
    address: 'DxVWLqDgFnU4QKe2X1hKvK5778893gJ4TzqyVAKH7uY',
    network: 'solana',
    totalReceived: 850,
    totalSent: 320,
    txCount: 34,
    tokens: ['SOL', 'USDC', 'RAY', 'SRM', 'mSOL'],
    transactions: [
      { id: 1, type: 'buy', amount: 50, price: 95, token: 'SOL', date: '2024-01-05', network: 'solana' },
      { id: 2, type: 'buy', amount: 1000, price: 1, token: 'USDC', date: '2024-01-12', network: 'solana' },
      { id: 3, type: 'buy', amount: 250, price: 3.2, token: 'RAY', date: '2024-02-01', network: 'solana' },
      { id: 4, type: 'sell', amount: 15, price: 110, token: 'SOL', date: '2024-02-20', network: 'solana' },
      { id: 5, type: 'buy', amount: 80, price: 1.05, token: 'SRM', date: '2024-03-05', network: 'solana' },
      { id: 6, type: 'sell', amount: 100, price: 4.5, token: 'RAY', date: '2024-04-10', network: 'solana' },
      { id: 7, type: 'buy', amount: 12.5, price: 115, token: 'SOL', date: '2024-05-01', network: 'solana' },
    ]
  },
  '0x1a2b3c4d5e6f789012345678901234567890abcd': {
    address: '0x1a2b3c4d5e6f789012345678901234567890abcd',
    network: 'polygon',
    totalReceived: 25000,
    totalSent: 8500,
    txCount: 18,
    tokens: ['MATIC', 'USDC', 'QUICK'],
    transactions: [
      { id: 1, type: 'buy', amount: 5000, price: 1, token: 'USDC', date: '2024-01-10', network: 'polygon' },
      { id: 2, type: 'buy', amount: 15000, price: 0.85, token: 'MATIC', date: '2024-02-15', network: 'polygon' },
      { id: 3, type: 'sell', amount: 5000, price: 0.95, token: 'MATIC', date: '2024-04-01', network: 'polygon' },
      { id: 4, type: 'buy', amount: 50, price: 45, token: 'QUICK', date: '2024-04-20', network: 'polygon' },
    ]
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<'tradfi' | 'crypto'>('tradfi')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('tax-estimator-theme')
    return (stored as 'light' | 'dark') || 'light'
  })
  
  useEffect(() => {
    document.body.className = theme
  }, [])
  
  useEffect(() => {
    localStorage.setItem('tax-estimator-theme', theme)
    document.body.className = theme
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const resetAllData = () => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return
    
    localStorage.removeItem('tax-estimator-w2')
    localStorage.removeItem('tax-estimator-1099')
    localStorage.removeItem('tax-estimator-crypto')
    localStorage.removeItem('tax-estimator-state')
    
    setW2Data({
      wages: 0,
      federalTax: 0,
      stateTax: 0,
      socialSecurity: 0,
      medicare: 0,
      overtimePay: 0,
      tips: 0
    })
    setForm1099({ income: 0, expenses: 0 })
    setCryptoTxs([])
    setSelectedState('CA')
    setW2Upload({ file: null, progress: 0, status: 'idle' })
    setForm1099Upload({ file: null, progress: 0, status: 'idle' })
    setCsvUpload({ file: null, progress: 0, status: 'idle' })
    setWalletData(null)
    setWalletError('')
  }
  
  const [selectedState, setSelectedState] = useState<string>(() => {
    const stored = localStorage.getItem('tax-estimator-state')
    return stored || 'CA'
  })
  
  const [w2Data, setW2Data] = useState<W2Data>(() => {
    const stored = localStorage.getItem('tax-estimator-w2')
    return stored ? JSON.parse(stored) : {
      wages: 0,
      federalTax: 0,
      stateTax: 0,
      socialSecurity: 0,
      medicare: 0,
      overtimePay: 0,
      tips: 0
    }
  })

  const [form1099, setForm1099] = useState<Form1099Data>(() => {
    const stored = localStorage.getItem('tax-estimator-1099')
    return stored ? JSON.parse(stored) : {
      income: 0,
      expenses: 0
    }
  })

  const [cryptoTxs, setCryptoTxs] = useState<CryptoTransaction[]>(() => {
    const stored = localStorage.getItem('tax-estimator-crypto')
    return stored ? JSON.parse(stored) : []
  })

  const [saveIndicator, setSaveIndicator] = useState(false)

  useEffect(() => {
    localStorage.setItem('tax-estimator-state', selectedState)
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1500)
  }, [selectedState])

  useEffect(() => {
    localStorage.setItem('tax-estimator-w2', JSON.stringify(w2Data))
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1500)
  }, [w2Data])

  useEffect(() => {
    localStorage.setItem('tax-estimator-1099', JSON.stringify(form1099))
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1500)
  }, [form1099])

  useEffect(() => {
    localStorage.setItem('tax-estimator-crypto', JSON.stringify(cryptoTxs))
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1500)
  }, [cryptoTxs])
  const [newTx, setNewTx] = useState<{ type: 'buy' | 'sell' | 'transfer'; amount: string; token: string; price: string; network: Blockchain }>({
    type: 'sell',
    amount: '',
    token: '',
    price: '',
    network: 'ethereum'
  })

  const [walletAddress, setWalletAddress] = useState('')
  const [walletNetwork, setWalletNetwork] = useState<Blockchain>('ethereum')
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [walletError, setWalletError] = useState('')

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hi! I\'m your Tax AI Assistant. Ask me about US taxes for W-2 income, 1099 freelance work, or crypto transactions.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const [w2Upload, setW2Upload] = useState<{ file: File | null; progress: number; status: 'idle' | 'uploading' | 'done' | 'error' }>({
    file: null,
    progress: 0,
    status: 'idle'
  })

  const [form1099Upload, setForm1099Upload] = useState<{ file: File | null; progress: number; status: 'idle' | 'uploading' | 'done' | 'error' }>({
    file: null,
    progress: 0,
    status: 'idle'
  })

  const [csvUpload, setCsvUpload] = useState<{ file: File | null; progress: number; status: 'idle' | 'uploading' | 'done' | 'error' }>({
    file: null,
    progress: 0,
    status: 'idle'
  })

  const [exportModal, setExportModal] = useState<'closed' | 'checkout' | 'processing' | 'success'>('closed')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cryptoWallet, setCryptoWallet] = useState<'connected' | 'disconnected'>('disconnected')
  const [selectedCryptoToken, setSelectedCryptoToken] = useState<'ETH' | 'USDC' | 'SOL' | 'BTC' | 'BASE_ETH' | 'BASE_USDC'>('ETH')

  const CRYPTO_PAYMENT_OPTIONS = {
    ETH: { icon: '🔷', name: 'Ethereum', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4', amount: '~0.003 ETH', network: 'Ethereum' },
    USDC: { icon: '◈', name: 'USD Coin', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4', amount: '$9.99 USDC', network: 'Ethereum' },
    SOL: { icon: '☀️', name: 'Solana', address: 'DxVWLqDgFnU4QKe2X1hKvK5778893gJ4TzqyVAKH7uY', amount: '~0.07 SOL', network: 'Solana' },
    BTC: { icon: '₿', name: 'Bitcoin', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', amount: '~0.0001 BTC', network: 'Bitcoin' },
    BASE_ETH: { icon: '🔴', name: 'Base (ETH)', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4', amount: '~0.003 ETH', network: 'Base' },
    BASE_USDC: { icon: '🔴', name: 'Base (USDC)', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4', amount: '$9.99 USDC', network: 'Base' },
  } as const

  const handleExportClick = () => {
    setExportModal('checkout')
    setPaymentMethod('card')
    setCryptoWallet('disconnected')
    setSelectedCryptoToken('ETH')
  }

  const handlePayment = async () => {
    setExportModal('processing')
    await new Promise(resolve => setTimeout(resolve, 2000))
    setExportModal('success')
    
    const content = `TAX ESTIMATE REPORT 2024
========================
Generated: ${new Date().toISOString()}

STATE: ${selectedState}
State Name: ${STATE_TAX_DATA[selectedState]?.name}

INCOME SUMMARY
--------------
W-2 Income: $${w2Data.wages.toLocaleString()}
1099 Net Income: $${Math.max(0, form1099.income - form1099.expenses).toLocaleString()}
Crypto Gains: $${calculations.netCrypto.toLocaleString()}
  Short-Term: $${calculations.shortTermGains.toLocaleString()}
  Long-Term: $${calculations.longTermGains.toLocaleString()}

Total Taxable Income: $${calculations.totalTaxableIncome.toLocaleString()}

TAX BREAKDOWN
-------------
Federal Tax: $${calculations.federalTax.toLocaleString()}
Self-Employment Tax: $${calculations.selfEmploymentTax.toLocaleString()}
Long-Term Cap Gains Tax: $${calculations.longTermCapitalGainsTax.toLocaleString()}
${STATE_TAX_DATA[selectedState]?.name} Tax: $${calculations.stateTax.toLocaleString()}

TOTAL ESTIMATED TAX: $${calculations.totalTax.toLocaleString()}
Tax Withheld: $${calculations.totalWithheld.toLocaleString()}
${calculations.balanceDue > 0 ? `Balance Due: $${calculations.balanceDue.toLocaleString()}` : `Est. Refund: $${Math.abs(calculations.balanceDue).toLocaleString()}`}

---
This is an estimate only. Consult a tax professional.
`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'estimated_tax_report_2024.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const closeExportModal = () => {
    setExportModal('closed')
    setCardNumber('')
    setCardExpiry('')
    setCardCvc('')
  }

  const handleW2Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setW2Upload({ file, progress: 0, status: 'uploading' })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docType', 'w2')

      const response = await fetch('http://localhost:3001/api/extract-tax-doc', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      setW2Data({
        wages: data.wages || 0,
        federalTax: data.federalTax || 0,
        stateTax: data.stateTax || 0,
        socialSecurity: data.socialSecurity || 0,
        medicare: data.medicare || 0,
        overtimePay: data.overtimePay || 0,
        tips: data.tips || 0
      })

      setW2Upload({ file, progress: 100, status: 'done' })
    } catch (error) {
      console.error('W2 upload failed:', error)
      setW2Upload({ file, progress: 0, status: 'error' })
    }
  }

  const handle1099Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setForm1099Upload({ file, progress: 0, status: 'uploading' })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docType', '1099')

      const response = await fetch('http://localhost:3001/api/extract-tax-doc', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      setForm1099({
        income: data.income || 0,
        expenses: data.expenses || 0
      })

      setForm1099Upload({ file, progress: 100, status: 'done' })
    } catch (error) {
      console.error('1099 upload failed:', error)
      setForm1099Upload({ file, progress: 0, status: 'error' })
    }
  }

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a helpful US Tax Assistant specializing in TradFi (W-2, 1099) and Crypto taxation. Keep responses brief, accurate, and focused on US federal tax rules. Do not provide specific tax advice, but general guidance is fine.' },
            ...chatMessages,
            { role: 'user', content: userMessage }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

      setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
    } catch (error) {
      console.error('Chat failed:', error)
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvUpload({ file, progress: 0, status: 'uploading' })

    const interval = setInterval(() => {
      setCsvUpload(prev => {
        if (prev.progress >= 100) {
          clearInterval(interval)
          return { ...prev, progress: 100, status: 'done' }
        }
        return { ...prev, progress: prev.progress + Math.random() * 20 }
      })
    }, 200)

    await new Promise(resolve => setTimeout(resolve, 2000))

    setCryptoTxs([
      { id: Date.now() + 1, type: 'buy', amount: 1.5, price: 42000, token: 'BTC', date: '2024-01-10', network: 'bitcoin' },
      { id: Date.now() + 2, type: 'buy', amount: 5, price: 2400, token: 'ETH', date: '2024-02-15', network: 'ethereum' },
      { id: Date.now() + 3, type: 'sell', amount: 0.5, price: 52000, token: 'BTC', date: '2024-03-20', network: 'bitcoin' },
      { id: Date.now() + 4, type: 'buy', amount: 2000, price: 1, token: 'USDC', date: '2024-04-05', network: 'ethereum' },
      { id: Date.now() + 5, type: 'sell', amount: 2, price: 3000, token: 'ETH', date: '2024-05-12', network: 'ethereum' },
    ])
  }

  const clearW2Upload = () => setW2Upload({ file: null, progress: 0, status: 'idle' })
  const clearForm1099Upload = () => setForm1099Upload({ file: null, progress: 0, status: 'idle' })
  const clearCsvUpload = () => setCsvUpload({ file: null, progress: 0, status: 'idle' })

  const fetchWalletData = async (address: string) => {
    if (!address || address.length < 20) return
    
    setWalletLoading(true)
    setWalletError('')
    setWalletData(null)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const normalizedAddress = address.toLowerCase()
    let data = mockWalletData[normalizedAddress]
    
    if (!data && walletNetwork === 'solana') {
      data = mockWalletData['DxVWLqDgFnU4QKe2X1hKvK5778893gJ4TzqyVAKH7uY']
    } else if (!data && walletNetwork === 'polygon') {
      data = mockWalletData['0x1a2b3c4d5e6f789012345678901234567890abcd']
    }
    
    if (data && data.network === walletNetwork) {
      setWalletData(data)
      const newTxs: CryptoTransaction[] = data.transactions.map(tx => ({
        ...tx,
        id: tx.id + Date.now()
      }))
      setCryptoTxs([...cryptoTxs, ...newTxs])
    } else {
      setWalletError(`No transaction history found for this address on ${BLOCKCHAINS.find(b => b.value === walletNetwork)?.label || walletNetwork}. Try: ${walletNetwork === 'solana' ? 'DxVWLqDgFnU4QKe2X1hKvK5778893gJ4TzqyVAKH7uY' : walletNetwork === 'polygon' ? '0x1a2b3c4d5e6f789012345678901234567890abcd' : '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4'}`)
    }
    
    setWalletLoading(false)
  }

  const handleAddTx = () => {
    if (!newTx.amount || !newTx.token || !newTx.price) return
    setCryptoTxs([...cryptoTxs, {
      id: Date.now(),
      type: newTx.type,
      amount: Number(newTx.amount),
      token: newTx.token.toUpperCase(),
      price: Number(newTx.price),
      date: new Date().toISOString().split('T')[0],
      network: newTx.network
    }])
    setNewTx({ type: 'sell', amount: '', token: '', price: '', network: 'ethereum' })
  }

  const stateTaxInfo = STATE_TAX_DATA[selectedState]
  
  const cryptoTaxData = useMemo(() => {
    return calculateFIFOCapitalGains(cryptoTxs)
  }, [cryptoTxs])
  
  const calculations = useMemo(() => {
    const standardDeduction = 13850; // TCJA single filer standard deduction for 2023
    const deductibleOvertime = Math.min(w2Data.overtimePay, 12500); // New law cap for single filers
    const deductibleTips = Math.min(w2Data.tips, 25000); // New law cap for tips
    const taxableW2Federal = Math.max(0, w2Data.wages - deductibleOvertime - deductibleTips - standardDeduction)
    const taxableW2 = w2Data.wages
    const net1099 = Math.max(0, form1099.income - form1099.expenses)
    const net1099Taxable = net1099 * 0.9235
    
    const { shortTermGains, longTermGains } = cryptoTaxData
    
    const totalShortTermGain = Math.max(0, shortTermGains)
    const totalLongTermGain = Math.max(0, longTermGains)
    const netCrypto = totalShortTermGain + totalLongTermGain
    
    const federalTaxableIncome = taxableW2Federal + net1099Taxable + netCrypto
    const totalTaxableIncome = taxableW2 + net1099Taxable + netCrypto
    
    const federalTax = calculateTax(federalTaxableIncome, FEDERAL_BRACKETS)
    const selfEmploymentTax = net1099 * 0.9235 * 0.153
    
    const longTermCapitalGainsTax = calculateTax(totalLongTermGain, LONG_TERM_BRACKETS)
    
    let stateTax = 0
    if (!stateTaxInfo.isNoTax) {
      stateTax = calculateTax(totalTaxableIncome, stateTaxInfo.rates)
    }
    
    const totalTax = federalTax + selfEmploymentTax + stateTax + longTermCapitalGainsTax
    const totalWithheld = w2Data.federalTax + w2Data.stateTax
    const balanceDue = totalTax - totalWithheld
    
    return {
      totalTaxableIncome,
      federalTaxableIncome,
      federalTax,
      selfEmploymentTax,
      stateTax,
      longTermCapitalGainsTax,
      totalTax,
      totalWithheld,
      balanceDue,
      shortTermGains: totalShortTermGain,
      longTermGains: totalLongTermGain,
      netCrypto,
      overtimePay: deductibleOvertime,
      tips: deductibleTips
    }
  }, [w2Data, form1099, cryptoTaxData, selectedState, stateTaxInfo])

  const stateOptions = Object.entries(STATE_TAX_DATA)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <button className="reset-btn" onClick={resetAllData} title="Clear All Data">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Start Over
          </button>
          <h1>Unified Tax Estimator</h1>
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>
        </div>
        <p>TradFi + Crypto Tax Calculator</p>
        {saveIndicator && <span className="save-indicator">✓ Saved</span>}
      </header>

      <div className="state-selector">
        <label htmlFor="state-select">State of Residence</label>
        <select 
          id="state-select" 
          value={selectedState} 
          onChange={(e) => setSelectedState(e.target.value)}
        >
          {stateOptions.map(([code, info]) => (
            <option key={code} value={code}>
              {info.name} {info.isNoTax ? '(No State Tax)' : ''}
            </option>
          ))}
        </select>
      </div>

      <nav className="tabs">
        <button 
          className={activeTab === 'tradfi' ? 'active' : ''}
          onClick={() => setActiveTab('tradfi')}
        >
          TradFi (W-2, 1099)
        </button>
        <button 
          className={activeTab === 'crypto' ? 'active' : ''}
          onClick={() => setActiveTab('crypto')}
        >
          Crypto
        </button>
      </nav>

      <main>
        {activeTab === 'tradfi' && (
          <section className="form-section">
            <div className="form-card">
              <h2>W-2 Income</h2>
              
              {w2Upload.status === 'idle' && (
                <div className="upload-zone compact">
                  <input
                    type="file"
                    id="w2-upload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleW2Upload}
                    className="file-input"
                  />
                  <label htmlFor="w2-upload" className="upload-label compact">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Upload W-2 PDF</span>
                  </label>
                </div>
              )}

              {w2Upload.status === 'uploading' && (
                <div className="upload-progress compact">
                  <div className="progress-info">
                    <span>Processing {w2Upload.file?.name}</span>
                    <span>{Math.round(w2Upload.progress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${w2Upload.progress}%` }}></div>
                  </div>
                </div>
              )}

              {w2Upload.status === 'done' && (
                <div className="upload-success compact">
                  <div className="success-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>W-2 extracted</span>
                    <button className="clear-btn" onClick={clearW2Upload}>×</button>
                  </div>
                  <p className="file-name">{w2Upload.file?.name}</p>
                </div>
              )}

              <div className="form-group">
                <label>Wages (Box 1)</label>
                <input
                  type="number"
                  value={w2Data.wages || ''}
                  onChange={(e) => setW2Data({...w2Data, wages: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Overtime Pay (Federal Tax-Free)</label>
                <input
                  type="number"
                  value={w2Data.overtimePay || ''}
                  onChange={(e) => setW2Data({...w2Data, overtimePay: Number(e.target.value)})}
                  placeholder="0.00"
                />
                <p className="helper">Deductible up to $12,500 under federal law</p>
              </div>
              <div className="form-group">
                <label>Tips (Federal Tax-Free)</label>
                <input
                  type="number"
                  value={w2Data.tips || ''}
                  onChange={(e) => setW2Data({...w2Data, tips: Number(e.target.value)})}
                  placeholder="0.00"
                />
                <p className="helper">Deductible up to $25,000 under federal law</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Federal Tax Withheld</label>
                  <input
                    type="number"
                    value={w2Data.federalTax || ''}
                    onChange={(e) => setW2Data({...w2Data, federalTax: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>State Tax Withheld</label>
                  <input
                    type="number"
                    value={w2Data.stateTax || ''}
                    onChange={(e) => setW2Data({...w2Data, stateTax: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Social Security</label>
                  <input
                    type="number"
                    value={w2Data.socialSecurity || ''}
                    onChange={(e) => setW2Data({...w2Data, socialSecurity: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Medicare</label>
                  <input
                    type="number"
                    value={w2Data.medicare || ''}
                    onChange={(e) => setW2Data({...w2Data, medicare: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="form-card">
              <h2>1099-NEC / 1099-MISC</h2>

              {form1099Upload.status === 'idle' && (
                <div className="upload-zone compact">
                  <input
                    type="file"
                    id="form1099-upload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handle1099Upload}
                    className="file-input"
                  />
                  <label htmlFor="form1099-upload" className="upload-label compact">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Upload 1099 PDF</span>
                  </label>
                </div>
              )}

              {form1099Upload.status === 'uploading' && (
                <div className="upload-progress compact">
                  <div className="progress-info">
                    <span>Processing {form1099Upload.file?.name}</span>
                    <span>{Math.round(form1099Upload.progress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${form1099Upload.progress}%` }}></div>
                  </div>
                </div>
              )}

              {form1099Upload.status === 'done' && (
                <div className="upload-success compact">
                  <div className="success-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>1099 extracted</span>
                    <button className="clear-btn" onClick={clearForm1099Upload}>×</button>
                  </div>
                  <p className="file-name">{form1099Upload.file?.name}</p>
                </div>
              )}

              <div className="form-group">
                <label>Self-Employment Income</label>
                <input
                  type="number"
                  value={form1099.income || ''}
                  onChange={(e) => setForm1099({...form1099, income: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Business Expenses</label>
                <input
                  type="number"
                  value={form1099.expenses || ''}
                  onChange={(e) => setForm1099({...form1099, expenses: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <p className="helper">Net 1099 Income: ${Math.max(0, form1099.income - form1099.expenses).toLocaleString()}</p>
            </div>
          </section>
        )}

        {activeTab === 'crypto' && (
          <section className="form-section">
            <div className="form-card wallet-card">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                </svg>
                Connect Wallet
              </h2>
              <p className="helper">Enter a public wallet address to import transaction history</p>
              
              <div className="network-select-row">
                <label>Network:</label>
                <select 
                  value={walletNetwork}
                  onChange={(e) => setWalletNetwork(e.target.value as Blockchain)}
                  className="network-select"
                >
                  {BLOCKCHAINS.map(bc => (
                    <option key={bc.value} value={bc.value}>{bc.icon} {bc.label}</option>
                  ))}
                </select>
              </div>

              <div className="wallet-input-group">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="wallet-address-input"
                />
                <button 
                  onClick={() => fetchWalletData(walletAddress)}
                  disabled={walletLoading || !walletAddress}
                  className="fetch-btn"
                >
                  {walletLoading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    'Fetch'
                  )}
                </button>
              </div>

              {walletLoading && (
                <div className="wallet-loading">
                  <div className="loading-bars">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <p>Scanning blockchain for transactions...</p>
                </div>
              )}

              {walletError && (
                <div className="wallet-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {walletError}
                </div>
              )}

              {walletData && (
                <div className="wallet-summary">
                  <div className="wallet-header">
                    <span className="wallet-address">
                      {walletData.address.slice(0, 6)}...{walletData.address.slice(-4)}
                    </span>
                    <span className="network-badge">{BLOCKCHAINS.find(b => b.value === walletData.network)?.icon} {walletData.network}</span>
                  </div>
                  <div className="wallet-stats">
                    <div className="stat">
                      <span className="stat-label">Total Received</span>
                      <span className="stat-value positive">+{walletData.totalReceived.toFixed(4)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Sent</span>
                      <span className="stat-value negative">-{walletData.totalSent.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="wallet-tokens">
                    {walletData.tokens.map(token => (
                      <span key={token} className="token-tag">{token}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="helper demo-hint">
                <strong>Demo addresses:</strong><br/>
                Ethereum: <code>0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4</code><br/>
                Solana: <code>DxVWLqDgFnU4QKe2X1hKvK5778893gJ4TzqyVAKH7uY</code><br/>
                Polygon: <code>0x1a2b3c4d5e6f789012345678901234567890abcd</code>
              </p>
            </div>

            <div className="form-card upload-card">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Upload Exchange CSV
              </h2>
              
              {csvUpload.status === 'idle' && (
                <div className="upload-zone">
                  <input
                    type="file"
                    id="csv-upload"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="file-input"
                  />
                  <label htmlFor="csv-upload" className="upload-label">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Drag & drop or click to upload</span>
                    <span className="upload-hint">CSV files (Coinbase, Kraken, Binance, etc.)</span>
                  </label>
                </div>
              )}

              {csvUpload.status === 'uploading' && (
                <div className="upload-progress">
                  <div className="progress-info">
                    <span>Processing {csvUpload.file?.name}</span>
                    <span>{Math.round(csvUpload.progress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${csvUpload.progress}%` }}></div>
                  </div>
                  <p className="progress-status">Parsing transaction history...</p>
                </div>
              )}

              {csvUpload.status === 'done' && (
                <div className="upload-success">
                  <div className="success-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>Successfully processed</span>
                    <button className="clear-btn" onClick={clearCsvUpload}>×</button>
                  </div>
                  <p className="file-name">{csvUpload.file?.name}</p>
                  <p className="success-detail">5 transactions imported from exchange</p>
                </div>
              )}
            </div>

            <div className="form-card">
              
              <div className="tx-list">
                {cryptoTxs.length === 0 ? (
                  <p className="empty-state">No transactions added yet</p>
                ) : (
                  cryptoTxs.map((tx) => (
                    <div key={tx.id} className="tx-item">
                      <span className={`tx-type ${tx.type}`}>{tx.type.toUpperCase()}</span>
                      <span className="tx-network">{BLOCKCHAINS.find(b => b.value === tx.network)?.icon}</span>
                      <span>{tx.amount} {tx.token}</span>
                      <span>@ ${tx.price.toLocaleString()}</span>
                      <span>${(tx.amount * tx.price).toLocaleString()}</span>
                      <button onClick={() => setCryptoTxs(cryptoTxs.filter(t => t.id !== tx.id))}>×</button>
                    </div>
                  ))
                )}
              </div>

              <div className="add-tx">
                <select 
                  value={newTx.type}
                  onChange={(e) => setNewTx({...newTx, type: e.target.value as 'buy' | 'sell' | 'transfer'})}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="transfer">Transfer</option>
                </select>
                <select 
                  value={newTx.network}
                  onChange={(e) => setNewTx({...newTx, network: e.target.value as Blockchain})}
                >
                  {BLOCKCHAINS.map(bc => (
                    <option key={bc.value} value={bc.value}>{bc.icon} {bc.label}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  placeholder="Amt"
                  value={newTx.amount}
                  onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Token (e.g. SOL, BTC)"
                  value={newTx.token}
                  onChange={(e) => setNewTx({...newTx, token: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Price"
                  value={newTx.price}
                  onChange={(e) => setNewTx({...newTx, price: e.target.value})}
                />
                <button onClick={handleAddTx}>+</button>
              </div>
            </div>
          </section>
        )}

        <aside className="summary">
          <h2>Tax Summary</h2>
          <div className="summary-row">
            <span>W-2 Income</span>
            <span>${w2Data.wages.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>1099 Net Income</span>
            <span>${Math.max(0, form1099.income - form1099.expenses).toLocaleString()}</span>
          </div>
          <div className="summary-row crypto-gains">
            <span>Crypto Gains</span>
            <span>${calculations.netCrypto.toLocaleString()}</span>
          </div>
          <div className="summary-row sub-row">
            <span>  Short-Term (&lt;=1yr)</span>
            <span className={calculations.shortTermGains >= 0 ? 'gain' : 'loss'}>${calculations.shortTermGains.toLocaleString()}</span>
          </div>
          <div className="summary-row sub-row">
            <span>  Long-Term (&gt;1yr)</span>
            <span className={calculations.longTermGains >= 0 ? 'gain' : 'loss'}>${calculations.longTermGains.toLocaleString()}</span>
          </div>
          <hr />
          <div className="summary-row total">
            <span>Taxable Income</span>
            <span>${calculations.totalTaxableIncome.toLocaleString()}</span>
          </div>
          {calculations.overtimePay > 0 && (
            <div className="summary-row overtime">
              <span>Tax-Free Overtime</span>
              <span>-${calculations.overtimePay.toLocaleString()}</span>
            </div>
          )}
          {calculations.tips > 0 && (
            <div className="summary-row overtime">
              <span>Tax-Free Tips</span>
              <span>-${calculations.tips.toLocaleString()}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Federal Tax</span>
            <span>${calculations.federalTax.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Self-Employment Tax</span>
            <span>${calculations.selfEmploymentTax.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Long-Term Cap Gains Tax</span>
            <span>${calculations.longTermCapitalGainsTax.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>{stateTaxInfo.name} Tax</span>
            <span>${calculations.stateTax.toLocaleString()}</span>
          </div>
          <hr />
          <div className="summary-row total">
            <span>Total Est. Tax</span>
            <span>${calculations.totalTax.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Tax Withheld</span>
            <span>${calculations.totalWithheld.toLocaleString()}</span>
          </div>
          <div className={`summary-row balance ${calculations.balanceDue > 0 ? 'owed' : 'refund'}`}>
            <span>{calculations.balanceDue > 0 ? 'Balance Due' : 'Est. Refund'}</span>
            <span>${Math.abs(calculations.balanceDue).toLocaleString()}</span>
          </div>
          <button className="export-btn" onClick={handleExportClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Generate IRS Forms (Export)
          </button>
          <p className="disclaimer">* Estimates include FIFO cost basis. Short-term gains taxed as ordinary income. Long-term at 0%/15%/20%. Consult a tax professional.</p>
        </aside>
      </main>

      {exportModal !== 'closed' && (
        <div className="modal-overlay" onClick={closeExportModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {exportModal === 'checkout' && (
              <>
                <div className="modal-header">
                  <div className="lock-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <h2>Unlock Pro Export</h2>
                  <p>Get your official IRS Form 8949 & Schedule D</p>
                </div>
                <div className="price-tag">
                  <span className="price">$9.99</span>
                  <span className="price-note">One-time payment</span>
                </div>

                <div className="payment-tabs">
                  <button 
                    className={`payment-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Credit Card
                  </button>
                  <button 
                    className={`payment-tab ${paymentMethod === 'crypto' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('crypto')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Pay with Crypto
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <>
                    <div className="checkout-form">
                      <div className="form-group">
                        <label>Card Number</label>
                        <input 
                          type="text" 
                          placeholder="4242 4242 4242 4242"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>
                      <div className="form-row-split">
                        <div className="form-group">
                          <label>Expiry</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>CVC</label>
                          <input 
                            type="text" 
                            placeholder="123"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <button className="pay-btn" onClick={handlePayment}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Pay &amp; Download
                    </button>
                    <p className="secure-note">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Secured by Stripe
                    </p>
                  </>
                )}

                {paymentMethod === 'crypto' && (
                  <div className="crypto-payment">
                    <div className="crypto-options">
                      {(Object.keys(CRYPTO_PAYMENT_OPTIONS) as Array<keyof typeof CRYPTO_PAYMENT_OPTIONS>).map((token) => (
                        <div 
                          key={token}
                          className={`crypto-token ${selectedCryptoToken === token ? 'selected' : ''}`}
                          onClick={() => setSelectedCryptoToken(token)}
                        >
                          <span className="token-icon">{CRYPTO_PAYMENT_OPTIONS[token].icon}</span>
                          <span className="token-name">{CRYPTO_PAYMENT_OPTIONS[token].name}</span>
                          <span className="token-amount">{CRYPTO_PAYMENT_OPTIONS[token].amount}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="network-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      {CRYPTO_PAYMENT_OPTIONS[selectedCryptoToken].network} Network
                    </div>

                    <div className="qr-placeholder">
                      <div className="qr-code">
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                          <rect x="10" y="10" width="30" height="30" stroke="#1a1a2e" strokeWidth="2"/>
                          <rect x="80" y="10" width="30" height="30" stroke="#1a1a2e" strokeWidth="2"/>
                          <rect x="10" y="80" width="30" height="30" stroke="#1a1a2e" strokeWidth="2"/>
                          <rect x="15" y="15" width="20" height="20" fill="#1a1a2e"/>
                          <rect x="85" y="15" width="20" height="20" fill="#1a1a2e"/>
                          <rect x="15" y="85" width="20" height="20" fill="#1a1a2e"/>
                          <rect x="50" y="10" width="20" height="20" stroke="#1a1a2e" strokeWidth="2"/>
                          <rect x="50" y="50" width="20" height="20" stroke="#1a1a2e" strokeWidth="2"/>
                          <rect x="50" y="90" width="20" height="20" stroke="#1a1a2e" strokeWidth="2"/>
                          <rect x="10" y="50" width="20" height="20" stroke="#1a1a2e" strokeWidth="2"/>
                          <rect x="90" y="50" width="20" height="20" stroke="#1a1a2e" strokeWidth="2"/>
                        </svg>
                      </div>
                      <p className="qr-label">Scan to pay</p>
                    </div>

                    <div className="wallet-address">
                      <label>Send {CRYPTO_PAYMENT_OPTIONS[selectedCryptoToken].amount.split(' ')[1] || CRYPTO_PAYMENT_OPTIONS[selectedCryptoToken].name} to:</label>
                      <div className="address-box">
                        <code>{CRYPTO_PAYMENT_OPTIONS[selectedCryptoToken].address}</code>
                        <button className="copy-btn" onClick={() => navigator.clipboard.writeText(CRYPTO_PAYMENT_OPTIONS[selectedCryptoToken].address)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {cryptoWallet === 'disconnected' ? (
                      <button className="connect-wallet-btn" onClick={() => setCryptoWallet('connected')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                        </svg>
                        Connect Wallet to Verify
                      </button>
                    ) : (
                      <button className="pay-btn crypto-pay" onClick={handlePayment}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Verify Transaction &amp; Download
                      </button>
                    )}
                    
                    <p className="crypto-note">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      Payment will be verified on-chain
                    </p>
                  </div>
                )}

                <button className="close-modal" onClick={closeExportModal}>×</button>
              </>
            )}

            {exportModal === 'processing' && (
              <div className="processing-state">
                <div className="spinner"></div>
                <h2>Processing Payment...</h2>
                <p>Please wait while we confirm your payment</p>
              </div>
            )}

            {exportModal === 'success' && (
              <div className="success-state">
                <div className="success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h2>Payment Successful!</h2>
                <p>Your tax report is downloading...</p>
                <button className="done-btn" onClick={closeExportModal}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`chat-widget ${chatOpen ? 'open' : ''}`}>
        {chatOpen && (
          <div className="chat-window">
            <div className="chat-header">
              <span>Ask Tax AI</span>
              <button className="chat-close" onClick={() => setChatOpen(false)}>×</button>
            </div>
            <div className="chat-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && <div className="chat-message assistant">Thinking...</div>}
            </div>
            <div className="chat-input-wrap">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask about taxes..."
                disabled={chatLoading}
              />
              <button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}>Send</button>
            </div>
          </div>
        )}
        <button className="chat-toggle" onClick={() => setChatOpen(!chatOpen)}>
          {chatOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default App
