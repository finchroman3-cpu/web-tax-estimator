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

interface StateTaxInfo {
  name: string
  rates: { min: number; max: number; rate: number }[]
  isNoTax: boolean
}

type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh'

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  mfj: 'Married Filing Jointly',
  mfs: 'Married Filing Separately',
  hoh: 'Head of Household',
}

const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 14600,
  mfj: 29200,
  mfs: 14600,
  hoh: 21900,
}

const OVERTIME_CAPS: Record<FilingStatus, number> = {
  single: 12500,
  mfj: 25000,
  mfs: 12500,
  hoh: 12500,
}

const TIPS_CAPS: Record<FilingStatus, number> = {
  single: 25000,
  mfj: 50000,
  mfs: 25000,
  hoh: 25000,
}

// 2024 federal income tax brackets
const FEDERAL_BRACKETS: Record<FilingStatus, { min: number; max: number; rate: number }[]> = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  mfs: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  hoh: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
}

const STATE_TAX_DATA: Record<string, StateTaxInfo> = {
  AL: { name: 'Alabama', rates: [{ min: 0, max: 500, rate: 0.02 }, { min: 500, max: 3000, rate: 0.04 }, { min: 3000, max: Infinity, rate: 0.05 }], isNoTax: false },
  AK: { name: 'Alaska', rates: [], isNoTax: true },
  AZ: { name: 'Arizona', rates: [{ min: 0, max: Infinity, rate: 0.0259 }], isNoTax: false },
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
  ND: { name: 'North Dakota', rates: [{ min: 0, max: Infinity, rate: 0.0195 }], isNoTax: false },
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

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('tax-estimator-theme')
    return (stored as 'light' | 'dark') || 'light'
  })

  const [selectedState, setSelectedState] = useState<string>(() => {
    return localStorage.getItem('tax-estimator-state') || 'CA'
  })

  const [filingStatus, setFilingStatus] = useState<FilingStatus>(() => {
    return (localStorage.getItem('tax-estimator-filing') as FilingStatus) || 'single'
  })

  const [w2Data, setW2Data] = useState<W2Data>(() => {
    const stored = localStorage.getItem('tax-estimator-w2')
    return stored ? JSON.parse(stored) : {
      wages: 0, federalTax: 0, stateTax: 0, socialSecurity: 0, medicare: 0, overtimePay: 0, tips: 0
    }
  })

  const [form1099, setForm1099] = useState<Form1099Data>(() => {
    const stored = localStorage.getItem('tax-estimator-1099')
    return stored ? JSON.parse(stored) : { income: 0, expenses: 0 }
  })

  const [saveIndicator, setSaveIndicator] = useState(false)

  const [w2Upload, setW2Upload] = useState<{
    file: File | null; progress: number; status: 'idle' | 'uploading' | 'done' | 'error'
  }>({ file: null, progress: 0, status: 'idle' })

  const [form1099Upload, setForm1099Upload] = useState<{
    file: File | null; progress: number; status: 'idle' | 'uploading' | 'done' | 'error'
  }>({ file: null, progress: 0, status: 'idle' })

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  useEffect(() => {
    localStorage.setItem('tax-estimator-state', selectedState)
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1500)
  }, [selectedState])

  useEffect(() => {
    localStorage.setItem('tax-estimator-filing', filingStatus)
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1500)
  }, [filingStatus])

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

  const resetAllData = () => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return
    localStorage.removeItem('tax-estimator-w2')
    localStorage.removeItem('tax-estimator-1099')
    localStorage.removeItem('tax-estimator-state')
    localStorage.removeItem('tax-estimator-filing')
    setW2Data({ wages: 0, federalTax: 0, stateTax: 0, socialSecurity: 0, medicare: 0, overtimePay: 0, tips: 0 })
    setForm1099({ income: 0, expenses: 0 })
    setSelectedState('CA')
    setFilingStatus('single')
    setW2Upload({ file: null, progress: 0, status: 'idle' })
    setForm1099Upload({ file: null, progress: 0, status: 'idle' })
  }

  const toggleTheme = () => setTheme((prev: 'light' | 'dark') => prev === 'light' ? 'dark' : 'light')

  const stateTaxInfo = STATE_TAX_DATA[selectedState]

  const calculations = useMemo(() => {
    const stdDeduction = STANDARD_DEDUCTIONS[filingStatus]
    const overtimeCap = OVERTIME_CAPS[filingStatus]
    const tipsCap = TIPS_CAPS[filingStatus]

    const deductibleOvertime = Math.min(w2Data.overtimePay, overtimeCap)
    const deductibleTips = Math.min(w2Data.tips, tipsCap)

    // 1099: self-employment tax and above-the-line deduction for half of SE tax
    const net1099 = Math.max(0, form1099.income - form1099.expenses)
    const seTaxBase = net1099 * 0.9235
    const selfEmploymentTax = seTaxBase * 0.153
    const deductibleSETax = selfEmploymentTax * 0.5

    // Federal taxable income (standard deduction + overtime/tips + half SE tax deducted)
    const w2Federal = Math.max(0, w2Data.wages - deductibleOvertime - deductibleTips - stdDeduction)
    const net1099Federal = Math.max(0, net1099 - deductibleSETax)
    const federalTaxableIncome = w2Federal + net1099Federal

    const federalTax = calculateTax(federalTaxableIncome, FEDERAL_BRACKETS[filingStatus])

    // State taxable income: apply overtime/tips deductions but not standard deduction (states vary)
    const w2State = Math.max(0, w2Data.wages - deductibleOvertime - deductibleTips)
    const stateTaxableIncome = w2State + net1099

    let stateTax = 0
    if (!stateTaxInfo.isNoTax) {
      stateTax = calculateTax(stateTaxableIncome, stateTaxInfo.rates)
    }

    const totalTax = federalTax + selfEmploymentTax + stateTax
    const totalWithheld = w2Data.federalTax + w2Data.stateTax
    const balanceDue = totalTax - totalWithheld

    const totalGrossIncome = w2Data.wages + net1099
    const effectiveFederalRate = totalGrossIncome > 0 ? (federalTax / totalGrossIncome) * 100 : 0
    const effectiveOverallRate = totalGrossIncome > 0 ? (totalTax / totalGrossIncome) * 100 : 0

    // Quarterly estimate = (marginal federal tax on 1099 + SE tax) / 4
    const federalOnW2Only = calculateTax(w2Federal, FEDERAL_BRACKETS[filingStatus])
    const federalOn1099 = Math.max(0, federalTax - federalOnW2Only)
    const quarterlyEstimate = (selfEmploymentTax + federalOn1099) / 4

    return {
      federalTaxableIncome,
      federalTax,
      selfEmploymentTax,
      stateTax,
      totalTax,
      totalWithheld,
      balanceDue,
      deductibleOvertime,
      deductibleTips,
      net1099,
      effectiveFederalRate,
      effectiveOverallRate,
      quarterlyEstimate,
    }
  }, [w2Data, form1099, filingStatus, stateTaxInfo])

  const handleW2Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setW2Upload({ file, progress: 0, status: 'uploading' })
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docType', 'w2')
      const response = await fetch('http://localhost:3001/api/extract-tax-doc', { method: 'POST', body: formData })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setW2Data({
        wages: data.wages || 0,
        federalTax: data.federalTax || 0,
        stateTax: data.stateTax || 0,
        socialSecurity: data.socialSecurity || 0,
        medicare: data.medicare || 0,
        overtimePay: data.overtimePay || 0,
        tips: data.tips || 0,
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
      const response = await fetch('http://localhost:3001/api/extract-tax-doc', { method: 'POST', body: formData })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setForm1099({ income: data.income || 0, expenses: data.expenses || 0 })
      setForm1099Upload({ file, progress: 100, status: 'done' })
    } catch (error) {
      console.error('1099 upload failed:', error)
      setForm1099Upload({ file, progress: 0, status: 'error' })
    }
  }

  const clearW2Upload = () => setW2Upload({ file: null, progress: 0, status: 'idle' })
  const clearForm1099Upload = () => setForm1099Upload({ file: null, progress: 0, status: 'idle' })

  const handleExport = () => {
    const content = `TAX ESTIMATE REPORT 2024
========================
Generated: ${new Date().toLocaleDateString()}

FILING INFO
-----------
Filing Status: ${FILING_STATUS_LABELS[filingStatus]}
State: ${stateTaxInfo.name}

INCOME SUMMARY
--------------
W-2 Wages:              $${w2Data.wages.toLocaleString()}
1099 Net Income:        $${calculations.net1099.toLocaleString()}
${calculations.deductibleOvertime > 0 ? `Tax-Free Overtime:     -$${calculations.deductibleOvertime.toLocaleString()}\n` : ''}${calculations.deductibleTips > 0 ? `Tax-Free Tips:         -$${calculations.deductibleTips.toLocaleString()}\n` : ''}Standard Deduction:    -$${STANDARD_DEDUCTIONS[filingStatus].toLocaleString()}

Federal Taxable Income: $${calculations.federalTaxableIncome.toLocaleString()}

TAX BREAKDOWN
-------------
Federal Income Tax:     $${Math.round(calculations.federalTax).toLocaleString()}
Self-Employment Tax:    $${Math.round(calculations.selfEmploymentTax).toLocaleString()}
${stateTaxInfo.name} Tax:${' '.repeat(Math.max(1, 20 - stateTaxInfo.name.length))}$${Math.round(calculations.stateTax).toLocaleString()}

TOTAL ESTIMATED TAX:    $${Math.round(calculations.totalTax).toLocaleString()}
Tax Already Withheld:   $${calculations.totalWithheld.toLocaleString()}
${calculations.balanceDue > 0
  ? `BALANCE DUE:            $${Math.round(calculations.balanceDue).toLocaleString()}`
  : `ESTIMATED REFUND:       $${Math.round(Math.abs(calculations.balanceDue)).toLocaleString()}`}

EFFECTIVE RATES
---------------
Federal Effective Rate: ${calculations.effectiveFederalRate.toFixed(1)}%
Overall Effective Rate: ${calculations.effectiveOverallRate.toFixed(1)}%
${calculations.net1099 > 0 ? `
QUARTERLY ESTIMATES (1099)
--------------------------
Est. Quarterly Payment: $${Math.round(calculations.quarterlyEstimate).toLocaleString()}
Due Dates: Apr 15 · Jun 15 · Sep 15 · Jan 15
` : ''}
---
This is an estimate only. Consult a tax professional before filing.
`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tax_estimate_2024.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stateOptions = Object.entries(STATE_TAX_DATA).sort((a, b) => a[1].name.localeCompare(b[1].name))

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
          <h1>Tax Estimator</h1>
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
        <p>Free W-2 &amp; 1099 Tax Calculator — 2024 Brackets</p>
        {saveIndicator && <span className="save-indicator">✓ Saved</span>}
      </header>

      <div className="controls-bar">
        <div className="control-group">
          <label htmlFor="filing-select">Filing Status</label>
          <select
            id="filing-select"
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
          >
            {(Object.entries(FILING_STATUS_LABELS) as [FilingStatus, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
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
      </div>

      <main>
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
                  <span>Upload W-2 PDF to auto-fill</span>
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

            {w2Upload.status === 'error' && (
              <div className="upload-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Upload failed — enter values manually below</span>
                <button className="clear-btn" onClick={clearW2Upload}>×</button>
              </div>
            )}

            <div className="form-group">
              <label>Wages (Box 1)</label>
              <input
                type="number"
                value={w2Data.wages || ''}
                onChange={(e) => setW2Data({ ...w2Data, wages: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Overtime Pay (Tax-Free)</label>
              <input
                type="number"
                value={w2Data.overtimePay || ''}
                onChange={(e) => setW2Data({ ...w2Data, overtimePay: Number(e.target.value) })}
                placeholder="0.00"
              />
              <p className="helper">
                Deductible up to ${OVERTIME_CAPS[filingStatus].toLocaleString()} ({FILING_STATUS_LABELS[filingStatus]})
              </p>
            </div>
            <div className="form-group">
              <label>Tips (Tax-Free)</label>
              <input
                type="number"
                value={w2Data.tips || ''}
                onChange={(e) => setW2Data({ ...w2Data, tips: Number(e.target.value) })}
                placeholder="0.00"
              />
              <p className="helper">
                Deductible up to ${TIPS_CAPS[filingStatus].toLocaleString()} ({FILING_STATUS_LABELS[filingStatus]})
              </p>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Federal Tax Withheld (Box 2)</label>
                <input
                  type="number"
                  value={w2Data.federalTax || ''}
                  onChange={(e) => setW2Data({ ...w2Data, federalTax: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>State Tax Withheld (Box 17)</label>
                <input
                  type="number"
                  value={w2Data.stateTax || ''}
                  onChange={(e) => setW2Data({ ...w2Data, stateTax: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Social Security (Box 4)</label>
                <input
                  type="number"
                  value={w2Data.socialSecurity || ''}
                  onChange={(e) => setW2Data({ ...w2Data, socialSecurity: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Medicare (Box 6)</label>
                <input
                  type="number"
                  value={w2Data.medicare || ''}
                  onChange={(e) => setW2Data({ ...w2Data, medicare: Number(e.target.value) })}
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
                  <span>Upload 1099 PDF to auto-fill</span>
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

            {form1099Upload.status === 'error' && (
              <div className="upload-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Upload failed — enter values manually below</span>
                <button className="clear-btn" onClick={clearForm1099Upload}>×</button>
              </div>
            )}

            <div className="form-group">
              <label>Self-Employment Income</label>
              <input
                type="number"
                value={form1099.income || ''}
                onChange={(e) => setForm1099({ ...form1099, income: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Business Expenses</label>
              <input
                type="number"
                value={form1099.expenses || ''}
                onChange={(e) => setForm1099({ ...form1099, expenses: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <p className="helper">Net 1099 Income: ${calculations.net1099.toLocaleString()}</p>
          </div>

        </section>

        <aside className="summary">
          <h2>Tax Summary</h2>

          <div className="summary-row">
            <span>W-2 Wages</span>
            <span>${w2Data.wages.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>1099 Net Income</span>
            <span>${calculations.net1099.toLocaleString()}</span>
          </div>
          {calculations.deductibleOvertime > 0 && (
            <div className="summary-row overtime">
              <span>Tax-Free Overtime</span>
              <span>-${calculations.deductibleOvertime.toLocaleString()}</span>
            </div>
          )}
          {calculations.deductibleTips > 0 && (
            <div className="summary-row overtime">
              <span>Tax-Free Tips</span>
              <span>-${calculations.deductibleTips.toLocaleString()}</span>
            </div>
          )}
          <div className="summary-row sub-row">
            <span>Standard Deduction</span>
            <span>-${STANDARD_DEDUCTIONS[filingStatus].toLocaleString()}</span>
          </div>

          <hr />

          <div className="summary-row total">
            <span>Federal Taxable Income</span>
            <span>${calculations.federalTaxableIncome.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Federal Income Tax</span>
            <span>${Math.round(calculations.federalTax).toLocaleString()}</span>
          </div>
          {calculations.selfEmploymentTax > 0 && (
            <div className="summary-row">
              <span>Self-Employment Tax</span>
              <span>${Math.round(calculations.selfEmploymentTax).toLocaleString()}</span>
            </div>
          )}
          <div className="summary-row">
            <span>{stateTaxInfo.name} Tax</span>
            <span>${Math.round(calculations.stateTax).toLocaleString()}</span>
          </div>

          <hr />

          <div className="summary-row total">
            <span>Total Est. Tax</span>
            <span>${Math.round(calculations.totalTax).toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Tax Withheld</span>
            <span>${calculations.totalWithheld.toLocaleString()}</span>
          </div>
          <div className={`summary-row balance ${calculations.balanceDue > 0 ? 'owed' : 'refund'}`}>
            <span>{calculations.balanceDue > 0 ? 'Balance Due' : 'Est. Refund'}</span>
            <span>${Math.round(Math.abs(calculations.balanceDue)).toLocaleString()}</span>
          </div>

          <div className="effective-rate-section">
            <div className="effective-rate-row">
              <span>Federal Effective Rate</span>
              <span>{calculations.effectiveFederalRate.toFixed(1)}%</span>
            </div>
            <div className="effective-rate-row">
              <span>Overall Effective Rate</span>
              <span>{calculations.effectiveOverallRate.toFixed(1)}%</span>
            </div>
          </div>

          {calculations.net1099 > 0 && (
            <div className="quarterly-section">
              <h3>Quarterly Estimates</h3>
              <div className="quarterly-amount">
                ${Math.round(calculations.quarterlyEstimate).toLocaleString()}
                <span className="quarterly-period"> / quarter</span>
              </div>
              <p className="quarterly-dates">Apr 15 · Jun 15 · Sep 15 · Jan 15</p>
            </div>
          )}

          <button className="export-btn" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Tax Summary
          </button>

          <p className="disclaimer">
            * Estimates use 2024 federal brackets. State deductions vary. Consult a tax professional before filing.
          </p>
        </aside>
      </main>
    </div>
  )
}

export default App
