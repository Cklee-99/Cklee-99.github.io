/* en overview/dashboard labels. Keys are grouped under the `dashboard` prefix. */

export const dashboard: Record<string, string> = {
  'dashboard.title': 'Overview',
  'dashboard.empty.title': 'No backtest results yet',
  'dashboard.empty.body':
    'No backtest results yet. After the backtest engine is completed in a later milestone, start exploring with demonstration data or CSV import.',
  'dashboard.empty.demoOption': 'Demonstration data',
  'dashboard.empty.csvOption': 'CSV import',
  'dashboard.engine.unavailable': 'Backtest engine is not yet implemented',
  'dashboard.engine.unavailableBody':
    'The backtest engine belongs to Milestone 3. No performance numbers are produced now, so no unrepresentative results appear.',
  'dashboard.metric.initialCapital': 'Initial capital',
  'dashboard.metric.equity': 'Final equity',
  'dashboard.metric.totalReturn': 'Total return',
  'dashboard.metric.none': 'Not available yet',
  'dashboard.section.overview': 'Latest simulation summary',
}
