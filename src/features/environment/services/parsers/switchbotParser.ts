import type { CsvParser, RawEnvironmentRecord } from '../../types'

export const switchbotParser: CsvParser = {
  name: 'SwitchBot',

  canParse(header: string): boolean {
    // 複数のSwitchBotエクスポート形式に対応
    // 新形式: Temperature_Celsius, Relative_Humidity
    const hasNewFormat =
      header.includes('Temperature_Celsius') && header.includes('Relative_Humidity')
    // 旧形式: Temperature, Humidity, Time
    const hasOldFormat =
      header.includes('Temperature') &&
      header.includes('Humidity') &&
      header.includes('Time')

    return hasNewFormat || hasOldFormat
  },

  parse(content: string): RawEnvironmentRecord[] {
    const lines = content.trim().split('\n')
    if (lines.length === 0) return []

    const records: RawEnvironmentRecord[] = []

    // ヘッダーからカラムインデックスを特定
    const header = lines[0].split(',')

    // 新形式を試行
    let dateIdx = header.findIndex((h) => h.trim() === 'Date')
    let tempIdx = header.findIndex((h) => h.includes('Temperature_Celsius'))
    let humidityIdx = header.findIndex((h) => h.includes('Relative_Humidity'))

    // 新形式が見つからない場合は旧形式を試行
    if (dateIdx === -1 || tempIdx === -1) {
      dateIdx = header.findIndex((h) => h.trim() === 'Time')
      tempIdx = header.findIndex((h) =>
        h.trim().match(/^Temperature$/i)
      )
      humidityIdx = header.findIndex((h) =>
        h.trim().match(/^Humidity$/i)
      )
    }

    // 必要なカラムが見つからない場合は空配列を返す
    if (dateIdx === -1 || tempIdx === -1) {
      return []
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = line.split(',')

      // インデックスが範囲外の場合はスキップ
      if (dateIdx >= cols.length || tempIdx >= cols.length) continue

      const timestamp = new Date(cols[dateIdx])
      if (isNaN(timestamp.getTime())) continue

      const temperature = parseFloat(cols[tempIdx])
      if (isNaN(temperature)) continue

      const humidityValue =
        humidityIdx !== -1 && humidityIdx < cols.length
          ? parseFloat(cols[humidityIdx])
          : NaN

      records.push({
        timestamp,
        temperature,
        humidity: isNaN(humidityValue) ? undefined : humidityValue,
      })
    }

    return records
  },
}
