export interface Asset {
  id: number
  name: string
  symbol?: string
  assetType: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: number
  assetId: number
  txnType: string
  date: string
  price: number
  quantity: number
  fee: number
  tax: number
  currency: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: number
  name: string
  category: string
  color: string
}

export interface AssetWithTags extends Asset {
  tags: Tag[]
}

export interface TransactionWithAsset extends Transaction {
  asset?: Asset
}

export interface AssetSummary {
  id: number
  name: string
  symbol?: string
  assetType: string
  currency: string
  holding: number
  buyCost: number
  sellRevenue: number
  avgBuyCost: number
  holdingCostBasis: number
  realizedPnl?: number
  tags: Tag[]
}

export interface Overview {
  totalAssets: number
  totalInvestment: number
  totalRealizedPnl: number
  totalDividends: number
  totalFees: number
  totalTax: number
  costBasisOfHoldings: number
}

export interface Summary {
  overview: Overview
  typeDistribution: Record<string, number>
  currencyDistribution: Record<string, number>
  assets: AssetSummary[]
}

export interface CreateAsset {
  name: string
  symbol?: string
  assetType?: string
  currency?: string
  tagIds?: number[]
}

export interface CreateTransaction {
  assetId: number
  txnType: string
  date: string
  price: number
  quantity: number
  fee?: number
  tax?: number
  currency?: string
  notes?: string
}

export interface CreateTag {
  name: string
  category?: string
  color?: string
}
