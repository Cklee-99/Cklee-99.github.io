/* zh-TW overview/dashboard labels. Keys are grouped under the `dashboard` prefix. */

export const dashboard: Record<string, string> = {
  'dashboard.title': '總覽',
  'dashboard.empty.title': '尚未有任何回測結果',
  'dashboard.empty.body':
    '尚無任何回測結果。當回測引擎於後續里程碑完成後，可透過演示資料或 CSV 匯入開始探索。',
  'dashboard.empty.demoOption': '演示資料',
  'dashboard.empty.csvOption': 'CSV 匯入',
  'dashboard.engine.unavailable': '回測引擎尚未完成',
  'dashboard.engine.unavailableBody':
    '回測引擎屬於里程碑 3。目前不會產生任何績效數字，避免顯示不實的結果。',
  'dashboard.metric.initialCapital': '初始資金',
  'dashboard.metric.equity': '最終資產',
  'dashboard.metric.totalReturn': '總報酬',
  'dashboard.metric.none': '尚未可用',
  'dashboard.section.headline': '重點指標',
  'dashboard.section.overview': '最新回測摘要',
  'dashboard.section.equity': '投資組合資產',
  'dashboard.section.trades': '近期交易',
  'dashboard.recent.none': '此回測沒有任何已執行交易。',
}
