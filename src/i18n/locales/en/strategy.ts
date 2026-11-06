/* en strategy decision reason labels. Keys are grouped under the `strategy` prefix. */

export const strategy: Record<string, string> = {
  'strategy.reason.maCrossoverUp': 'MA20 crossed above MA60',
  'strategy.reason.maCrossoverDown': 'MA20 crossed below MA60',
  'strategy.reason.meanRevBuy': 'Close below lower band and RSI <= 30',
  'strategy.reason.meanRevSell': 'Close above upper band or RSI >= 70',
  'strategy.reason.monthlyTranche': 'Monthly scheduled deployment',
  'strategy.reason.monthlyTrancheSkipped': 'Monthly tranche cannot execute',
  'strategy.reason.bullishEngulfingConfirm': 'Bullish engulfing with trend confirmation',
  'strategy.reason.hammerConfirm': 'Hammer with rising RSI',
  'strategy.reason.bearishEngulfingConfirm': 'Bearish engulfing with close below MA20',
  'strategy.reason.shootingStarConfirm': 'Shooting star with falling RSI',
  'strategy.reason.breakoutBuy': 'Breakout close above the upper band',
  'strategy.reason.momentumExit': 'Close below MA20 or RSI below 50',
  'strategy.reason.hold': 'No signal this session',
  'strategy.reason.insufficientHistory': 'Not enough history for the selected indicators',
  'strategy.param.trancheCount': 'Number of monthly tranches',
  'strategy.param.defaultTrancheCount': 'Default is 12 even monthly tranches.',
}
