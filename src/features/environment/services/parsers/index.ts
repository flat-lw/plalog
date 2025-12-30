import type { CsvParser } from '../../types'
import { switchbotParser } from './switchbotParser'

const parsers: CsvParser[] = [switchbotParser]

export function selectParser(header: string): CsvParser | null {
  if (!header || header.trim() === '') {
    return null
  }
  return parsers.find((p) => p.canParse(header)) ?? null
}

export { switchbotParser }
