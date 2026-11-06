/* zh-TW strategy decision reason labels. Keys are grouped under the `strategy` prefix. */

export const strategy: Record<string, string> = {
  'strategy.reason.maCrossoverUp': 'MA20 升至 MA60 上方（交叉上）',
  'strategy.reason.maCrossoverDown': 'MA20 降至 MA60 下方（交叉下）',
  'strategy.reason.meanRevBuy': '收價跌破布林下軌且 RSI <= 30',
  'strategy.reason.meanRevSell': '收價突破布林上軌或 RSI >= 70',
  'strategy.reason.monthlyTranche': '每月定期投入',
  'strategy.reason.monthlyTrancheSkipped': '本月投入無法執行',
  'strategy.reason.bullishEngulfingConfirm': '牛市吞沒並獲得趨勢確認',
  'strategy.reason.hammerConfirm': '錘子形態且 RSI 回升',
  'strategy.reason.bearishEngulfingConfirm': '熊市吞沒且收價跌破 MA20',
  'strategy.reason.shootingStarConfirm': '流星形態且 RSI 回落',
  'strategy.reason.breakoutBuy': '收價突破布林上軌',
  'strategy.reason.momentumExit': '收價跌破 MA20 或 RSI 低於 50',
  'strategy.reason.hold': '本交易時段無訊號',
  'strategy.reason.insufficientHistory': '指標歷史不足，尚無法判定',
  'strategy.param.trancheCount': '每月投入期數',
  'strategy.param.defaultTrancheCount': '預設為 12 期，每月金額相同。',
}
