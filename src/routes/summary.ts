import type { FastifyInstance } from 'fastify';
import type { Summary, Overview, AssetSummary, Tag } from '../types';

export default async function summaryRoutes(app: FastifyInstance) {
  const db = app.db;

  // GET /api/summary - Investment summary
  app.get<{ Reply: Summary }>('/summary', { onRequest: [app.authenticate] }, async (request, reply) => {
    const userId = request.user!.sub;
    const database = db.getUserDatabase(userId);
    let totalInvestment = 0;
    let totalFees = 0;
    let totalTax = 0;
    let totalDividends = 0;
    let totalRealizedPnl = 0;
    let costBasisOfHoldings = 0;

    const assets: AssetSummary[] = database.assets.map((asset) => {
      const txns = database.transactions.filter((t) => t.asset_id === asset.id);
      const buyTxns = txns.filter((t) => t.txn_type === 'BUY');
      const sellTxns = txns.filter((t) => t.txn_type === 'SELL');
      const buyQty = buyTxns.reduce((sum, t) => sum + t.quantity, 0);
      const sellQty = sellTxns.reduce((sum, t) => sum + t.quantity, 0);
      const holding = buyQty - sellQty;
      const buyCost = buyTxns.reduce((sum, t) => sum + t.price * t.quantity + t.fee + t.tax, 0);
      const sellRevenue = sellTxns.reduce((sum, t) => sum + t.price * t.quantity - t.fee - t.tax, 0);
      const fees = txns.reduce((sum, t) => sum + t.fee, 0);
      const tax = txns.reduce((sum, t) => sum + t.tax, 0);
      const dividends = txns
        .filter((t) => t.txn_type === 'DIVIDEND')
        .reduce((sum, t) => sum + t.quantity * t.price - t.tax, 0);
      const avgBuyCost = buyQty > 0 ? buyCost / buyQty : 0;
      const holdingCostBasis = holding * avgBuyCost;

      totalInvestment += buyCost;
      totalFees += fees;
      totalTax += tax;
      totalDividends += dividends;
      costBasisOfHoldings += holdingCostBasis;

      const realizedPnl = holding <= 0.0001 ? sellRevenue - buyCost : null;
      if (realizedPnl !== null) totalRealizedPnl += realizedPnl;

      const tags: Tag[] = database.asset_tags
        .filter((at) => at.asset_id === asset.id)
        .map((at) => db.findTagById(userId, at.tag_id)?.tag)
        .filter((t): t is Tag => t !== undefined);

      return {
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        asset_type: asset.asset_type,
        currency: asset.currency,
        holding,
        buy_cost: buyCost,
        sell_revenue: sellRevenue,
        avg_buy_cost: avgBuyCost,
        holding_cost_basis: holdingCostBasis,
        realized_pnl: realizedPnl,
        tags,
      };
    });

    // Type distribution (by holding cost basis)
    const typeDistribution: Record<string, number> = {};
    for (const a of assets) {
      typeDistribution[a.asset_type] = (typeDistribution[a.asset_type] || 0) + a.holding_cost_basis;
    }

    // Currency distribution (by buy cost)
    const currencyDistribution: Record<string, number> = {};
    for (const a of database.assets) {
      const buyCost = database.transactions
        .filter((t) => t.asset_id === a.id && t.txn_type === 'BUY')
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
      currencyDistribution[a.currency] = (currencyDistribution[a.currency] || 0) + buyCost;
    }

    const overview: Overview = {
      total_assets: database.assets.length,
      total_investment: totalInvestment,
      total_realized_pnl: totalRealizedPnl,
      total_dividends: totalDividends,
      total_fees: totalFees,
      total_tax: totalTax,
      cost_basis_of_holdings: costBasisOfHoldings,
    };

    const summary: Summary = {
      overview,
      type_distribution: typeDistribution,
      currency_distribution: currencyDistribution,
      assets,
    };

    return reply.send(summary);
  });
}
