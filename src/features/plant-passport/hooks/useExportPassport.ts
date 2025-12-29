import { useState, useCallback } from 'react'
import type { Plant } from '@/db/models'
import type { ExportOptions, ExportResult } from '../types'
import { buildPlantPassport, passportToJson } from '../services/passportBuilder'
import { generatePlantPassportPdf } from '../services/pdfGenerator'

interface ExportState {
  isLoading: boolean
  error: string | null
  result: ExportResult | null
}

export function useExportPassport() {
  const [state, setState] = useState<ExportState>({
    isLoading: false,
    error: null,
    result: null,
  })

  const exportPassport = useCallback(
    async (plant: Plant, options: ExportOptions): Promise<ExportResult | null> => {
      setState({ isLoading: true, error: null, result: null })

      try {
        const passport = await buildPlantPassport(plant, options)
        const result: ExportResult = {
          fileName: sanitizeFileName(plant.species || plant.name),
        }

        if (options.exportJson) {
          const jsonString = passportToJson(passport)
          result.jsonBlob = new Blob([jsonString], { type: 'application/json' })
        }

        if (options.exportPdf) {
          result.pdfBlob = await generatePlantPassportPdf(passport)
        }

        setState({ isLoading: false, error: null, result })
        return result
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'エクスポートに失敗しました'
        setState({ isLoading: false, error: message, result: null })
        return null
      }
    },
    []
  )

  const downloadFile = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, result: null })
  }, [])

  return {
    ...state,
    exportPassport,
    downloadFile,
    reset,
  }
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50) || 'plant'
}
