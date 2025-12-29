import { useState, useCallback } from 'react'
import type { ImportResult, ImportPreview } from '../types'
import { previewCsv, importCsv } from '../services/importService'

interface CsvImportState {
  file: File | null
  content: string | null
  preview: ImportPreview | null
  result: ImportResult | null
  isLoading: boolean
  error: string | null
}

export function useCsvImport() {
  const [state, setState] = useState<CsvImportState>({
    file: null,
    content: null,
    preview: null,
    result: null,
    isLoading: false,
    error: null,
  })

  const selectFile = useCallback(async (file: File): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const content = await file.text()
      const preview = await previewCsv(content)

      if (!preview) {
        setState((prev) => ({
          ...prev,
          file: null,
          content: null,
          preview: null,
          isLoading: false,
          error: '対応していないCSV形式です',
        }))
        return false
      }

      setState((prev) => ({
        ...prev,
        file,
        content,
        preview,
        result: null,
        isLoading: false,
        error: null,
      }))
      return true
    } catch {
      setState((prev) => ({
        ...prev,
        file: null,
        content: null,
        preview: null,
        isLoading: false,
        error: 'ファイルの読み込みに失敗しました',
      }))
      return false
    }
  }, [])

  const executeImport = useCallback(
    async (locationId: string) => {
      if (!state.content) {
        return null
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const result = await importCsv(state.content, locationId)

        setState((prev) => ({
          ...prev,
          result,
          isLoading: false,
          error: result.success ? null : result.errors.join(', '),
        }))

        return result
      } catch {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'インポートに失敗しました',
        }))
        return null
      }
    },
    [state.content]
  )

  const reset = useCallback(() => {
    setState({
      file: null,
      content: null,
      preview: null,
      result: null,
      isLoading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    selectFile,
    executeImport,
    reset,
  }
}
