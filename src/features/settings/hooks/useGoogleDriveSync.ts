import { useState, useCallback } from 'react'
import { googleDriveService } from '../services/googleDriveService'
import { getAllData, importDataFromObject } from '@/utils/export'

interface SyncState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  lastSyncedAt: string | null
}

export function useGoogleDriveSync() {
  const [state, setState] = useState<SyncState>({
    isAuthenticated: googleDriveService.isAuthenticated(),
    isLoading: false,
    error: null,
    lastSyncedAt: null,
  })

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      await googleDriveService.authenticate()

      // 既存のファイルがあれば最終同期日時を取得
      const metadata = await googleDriveService.getFileMetadata()

      setState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastSyncedAt: metadata?.modifiedTime || null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : '認証に失敗しました',
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    googleDriveService.disconnect()
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastSyncedAt: null,
    })
  }, [])

  const upload = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await getAllData()
      await googleDriveService.upload(data)

      setState((prev) => ({
        ...prev,
        isLoading: false,
        lastSyncedAt: new Date().toISOString(),
      }))

      return true
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '保存に失敗しました',
      }))
      return false
    }
  }, [])

  const download = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const syncData = await googleDriveService.download()
      await importDataFromObject(syncData.data)

      setState((prev) => ({
        ...prev,
        isLoading: false,
        lastSyncedAt: syncData.syncedAt,
      }))

      return true
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '復元に失敗しました',
      }))
      return false
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    upload,
    download,
    clearError,
  }
}
