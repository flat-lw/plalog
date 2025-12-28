import type { CsvParser, RawEnvironmentRecord } from '../../types'

export const switchbotParser: CsvParser = {
  name: 'SwitchBot',

  canParse(header: string): boolean {
    return (
      header.includes('Temperature') &&
      header.includes('Humidity') &&
      header.includes('Time')
    )
  },

  parse(content: string): RawEnvironmentRecord[] {
    const lines = content.trim().split('\n')
    const records: RawEnvironmentRecord[] = []

    // ヘッダー行をスキップ
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const parts = line.split(',')
      if (parts.length < 3) continue

      const [time, temp, humidity] = parts

      const timestamp = new Date(time)
      if (isNaN(timestamp.getTime())) continue

      const temperature = parseFloat(temp)
      if (isNaN(temperature)) continue

      const humidityValue = parseFloat(humidity)

      records.push({
        timestamp,
        temperature,
        humidity: isNaN(humidityValue) ? undefined : humidityValue,
      })
    }

    return records
  },
}
