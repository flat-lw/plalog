import { useState } from 'react'
import type { PlantPassport } from '../types'
import type { PlantFormData } from '@/features/plants/components/PlantForm'
import type { InheritedInfo } from '@/db/models'

interface ImportResult {
  formData: PlantFormData
  inheritedInfo: InheritedInfo
}

interface ImportError {
  message: string
  details?: string
}

export function useImportPassport() {
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<ImportError | null>(null)

  const validatePassport = (data: unknown): data is PlantPassport => {
    if (!data || typeof data !== 'object') {
      return false
    }

    const passport = data as Partial<PlantPassport>

    // バージョンとアプリケーションの確認
    if (passport.version !== 1 || passport.app !== 'plalog') {
      return false
    }

    // 必須フィールドの確認
    if (!passport.exportedAt || !passport.exportedBy || !passport.plant || !passport.summary) {
      return false
    }

    return true
  }

  const importFromFile = async (file: File): Promise<ImportResult | null> => {
    setIsImporting(true)
    setError(null)

    try {
      // ファイルを読み込む
      const text = await file.text()
      const data = JSON.parse(text)

      // PlantPassport形式の検証
      if (!validatePassport(data)) {
        throw new Error('無効なPlant Passportファイルです')
      }

      const passport = data as PlantPassport

      // PlantFormDataに変換
      const formData: PlantFormData = {
        name: '', // ユーザーに入力してもらう（エクスポートには含まれていない）
        species: passport.plant.species,
        acquiredAt: passport.plant.acquiredAt ? new Date(passport.plant.acquiredAt) : undefined,
        notes: passport.plant.notes,
        // locationはユーザーに選択してもらう
      }

      // InheritedInfo情報を作成
      const inheritedInfo: InheritedInfo = {
        displayName: passport.exportedBy.displayName,
        contact: passport.exportedBy.contact,
        managementDays: passport.summary.managementDays,
        importedAt: new Date(),
      }

      setIsImporting(false)
      return { formData, inheritedInfo }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError({
        message: 'インポートに失敗しました',
        details: errorMessage,
      })
      setIsImporting(false)
      return null
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    isImporting,
    error,
    importFromFile,
    clearError,
  }
}
