/* en backtest configuration labels. Keys are grouped under the `backtest` prefix. */

export const backtest: Record<string, string> = {
  'backtest.title': 'Backtest configuration',
  'backtest.section.required': 'Required settings',
  'backtest.field.ticker': 'Stock or ETF ticker',
  'backtest.field.strategy': 'Strategy',
  'backtest.field.capital': 'Initial capital (USD)',
  'backtest.field.start': 'Start date',
  'backtest.field.end': 'End date',
  'backtest.section.execution': 'Execution assumptions',
  'backtest.field.allocation': 'Max allocation per position',
  'backtest.field.fee': 'Transaction fee (per trade)',
  'backtest.field.slippage': 'Slippage (fraction)',
  'backtest.field.fractional': 'Allow fractional shares',
  'backtest.section.benchmark': 'Benchmark',
  'backtest.field.benchmark': 'Benchmark ticker',
  'backtest.section.advanced': 'Advanced settings',
  'backtest.strategy.trend_following': 'Trend Following (MA20/MA60)',
  'backtest.strategy.mean_reversion': 'Mean Reversion (RSI14 + Bollinger)',
  'backtest.strategy.scheduled_deployment': 'Scheduled Capital Deployment',
  'backtest.strategy.candlestick_confirmation': 'Candlestick Confirmation',
  'backtest.strategy.momentum_breakout': 'Momentum Breakout',
  'backtest.strategy.purpose.trend_following':
    'Educational example using MA20/MA60 crossovers as entry and exit rules.',
  'backtest.strategy.purpose.mean_reversion':
    'Educational example using RSI14 and Bollinger Bands for mean-reversion opportunities.',
  'backtest.strategy.purpose.scheduled_deployment':
    'Deploy capital in configured monthly tranches without assuming deposits that are not configured.',
  'backtest.strategy.purpose.candlestick_confirmation':
    'Educational example with explicit candle patterns plus trend/indicator confirmation.',
  'backtest.strategy.purpose.momentum_breakout':
    'Educational description of momentum breakout using RSI14, Bollinger Bands, and a trend filter.',
  'backtest.strategy.limitNote':
    'Strategies are educational examples; historical performance does not guarantee future results.',
  'backtest.errors.badTicker': 'Ticker must be 1–10 letters, digits, dots, or dashes.',
  'backtest.errors.badCapital': 'Initial capital must be positive and within the configured cap.',
  'backtest.errors.invalidDates': 'Dates must be valid YYYY-MM-DD and the start must not be after the end.',
  'backtest.errors.badAllocation': 'Allocation must be between 0 and 1 (100%).',
  'backtest.errors.badFee': 'Transaction fee must be between 0 and 5%.',
  'backtest.errors.badSlippage': 'Slippage must be between 0 and 10%.',
  'backtest.errors.badBenchmark': 'Benchmark ticker has an invalid format.',
  'backtest.status.valid': 'Configuration valid',
  'backtest.status.invalid': 'Configuration has errors — please fix them',
  'backtest.action.saveLabel': 'Save configuration',
  'backtest.action.runLabel': 'Run backtest (later milestone)',
  'backtest.engine.unavailable': 'Backtest engine belongs to Milestone 3',
  'backtest.engine.unavailableBody':
    'Only saving and validating configuration is available now. Running a backtest, producing performance and order records will be enabled once the engine is completed.',
  'backtest.pref.note': 'Settings belong to the current browser origin and are not synced across devices.',
  'backtest.field.fractionalYes': 'Yes',
  'backtest.field.fractionalNo': 'No',
  'backtest.section.advancedHint': 'Execution details such as fees, allocation, and fractional shares.',
}

