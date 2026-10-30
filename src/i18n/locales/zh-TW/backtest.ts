/* zh-TW backtest configuration labels. Keys are grouped under the `backtest` prefix. */

export const backtest: Record<string, string> = {
  'backtest.title': '回測設定',
  'backtest.section.required': '必要設定',
  'backtest.field.ticker': '股票或 ETF 代號',
  'backtest.field.strategy': '交易策略',
  'backtest.field.capital': '初始資金（USD）',
  'backtest.field.start': '開始日期',
  'backtest.field.end': '結束日期',
  'backtest.section.execution': '交易執行設定',
  'backtest.field.allocation': '每筆最大配置比例',
  'backtest.field.fee': '交易費用（每筆比例）',
  'backtest.field.slippage': '滑價（比例）',
  'backtest.field.fractional': '允許碎股',
  'backtest.section.benchmark': '基準比較',
  'backtest.field.benchmark': '基準代號',
  'backtest.section.advanced': '進階設定',
  'backtest.strategy.trend_following': '趨勢追蹤（MA20/MA60）',
  'backtest.strategy.mean_reversion': '均值回歸（RSI14 + 布林帶）',
  'backtest.strategy.scheduled_deployment': '定期資金投入',
  'backtest.strategy.candlestick_confirmation': '蠟燭圖確認',
  'backtest.strategy.momentum_breakout': '動量突破',
  'backtest.strategy.purpose.trend_following':
    '使用 MA20/MA60 交叉作為進場與退場規則的教學示例。',
  'backtest.strategy.purpose.mean_reversion':
    '以 RSI14 與布林帶尋找均值回歸機會的教學示例。',
  'backtest.strategy.purpose.scheduled_deployment':
    '依設定按月分批投入本金，不引入未設定之存款。',
  'backtest.strategy.purpose.candlestick_confirmation':
    '明確蠟燭圖形態加上趨勢/指標確認的教學示例。',
  'backtest.strategy.purpose.momentum_breakout':
    '以 RSI14、布林帶與趨勢濾鏡描述動量突破的教學示例。',
  'backtest.strategy.limitNote':
    '策略僅為教學示例，歷史績效不代表未來結果。',
  'backtest.errors.badTicker': '代號需為 1–10 個字母、數字、點號或減號。',
  'backtest.errors.badCapital': '初始資金必須為正值且不超過設定上限。',
  'backtest.errors.invalidDates': '日期必須為有效的 YYYY-MM-DD，且開始日期不得晚於結束日期。',
  'backtest.errors.badAllocation': '配置比例必須介於 0 與 1（100%）。',
  'backtest.errors.badFee': '交易費用比例必須為 0 至 5%。',
  'backtest.errors.badSlippage': '滑價比例必須為 0 至 10%。',
  'backtest.errors.badBenchmark': '基準代號格式無效。',
  'backtest.status.valid': '設定有效',
  'backtest.status.invalid': '設定有錯誤，請修正',
  'backtest.action.saveLabel': '儲存設定',
  'backtest.action.runLabel': '執行回測（後續里程碑）',
  'backtest.engine.unavailable': '回測引擎屬於里程碑 3',
  'backtest.engine.unavailableBody':
    '目前僅儲存與驗證設定。執行回測、產生績效與交易紀錄將在回測引擎完成後啟用。',
  'backtest.pref.note': '設定僅代表當前瀏覽器 origin，不會跨裝置同步。',
  'backtest.field.fractionalYes': '允許碎股',
  'backtest.field.fractionalNo': '不允許碎股',
  'backtest.section.advancedHint': '設定費率、配置與碎股等執行細節。',
}

