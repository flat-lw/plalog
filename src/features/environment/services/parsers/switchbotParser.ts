import type { CsvParser, RawEnvironmentRecord } from '../../types'

export const switchbotParser: CsvParser = {
  name: 'SwitchBot',

  canParse(header: string): boolean {
    // 実際のSwitchBotエクスポート形式に対応
    return (
      header.includes('Temperature_Celsius') && header.includes('Relative_Humidity')
    )
  },

  parse(content: string): RawEnvironmentRecord[] {
    const lines = content.trim().split('\n')
    const records: RawEnvironmentRecord[] = []

    // ヘッダーからカラムインデックスを特定
    const header = lines[0].split(',')
    const dateIdx = header.findIndex((h) => h.trim() === 'Date')
    const tempIdx = header.findIndex((h) => h.includes('Temperature_Celsius'))
    const humidityIdx = header.findIndex((h) => h.includes('Relative_Humidity'))

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = line.split(',')

      const timestamp = new Date(cols[dateIdx])
      if (isNaN(timestamp.getTime())) continue

      const temperature = parseFloat(cols[tempIdx])
      if (isNaN(temperature)) continue

      const humidityValue = parseFloat(cols[humidityIdx])

      records.push({
        timestamp,
        temperature,
        humidity: isNaN(humidityValue) ? undefined : humidityValue,
      })
    }

    return records
  },
}
