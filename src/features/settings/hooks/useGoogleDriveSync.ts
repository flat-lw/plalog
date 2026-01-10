import { useState, useCallback } from 'react'
import { googleDriveService } from '../services/googleDriveService'
import { getAllData, importDataFromObject } from '@/utils/export'

interface SyncState {
  isAuthenticated: boolean
  isConnected: boolean
  isLoading: boolean
  error: string | null
  lastSyncedAt: string | null
}

export function useGoogleDriveSync() {
  const [state, setState] = useState<SyncState>({
    isAuthenticated: googleDriveService.isAuthenticated(),
    isConnected: googleDriveService.isConnected(),
    isLoading: false,
    error: null,
    lastSyncedAt: googleDriveService.getLastSyncTime(),
  })

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      await googleDriveService.authenticate()

      // 連携フラグを保存
      googleDriveService.setConnected(true)

      // 既存のファイルがあれば表示用に最終同期日時を取得（lastSyncTimeは設定しない）
      const metadata = await googleDriveService.getFileMetadata()

      setState({
        isAuthenticated: true,
        isConnected: true,
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
    googleDriveService.setConnected(false)
    setState({
      isAuthenticated: false,
      isConnected: false,
      isLoading: false,
      error: null,
      lastSyncedAt: null,
    })
  }, [])

  const upload = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Drive側のファイルメタデータを取得して日時比較
      const metadata = await googleDriveService.getFileMetadata()
      const lastLocalSync = googleDriveService.getLastSyncTime()

      if (metadata && lastLocalSync) {
        const driveModifiedTime = new Date(metadata.modifiedTime).getTime()
        const localSyncTime = new Date(lastLocalSync).getTime()

        // Drive側の方が新しい場合は警告
        if (driveModifiedTime > localSyncTime) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              'Google Drive上のデータの方が新しい可能性があります。先にGoogle Driveから復元することをお勧めします。',
          }))
          return false
        }
      }

      const data = await getAllData()
      await googleDriveService.upload(data)

      const now = new Date().toISOString()
      googleDriveService.setLastSyncTime(now)

      setState((prev) => ({
        ...prev,
        isLoading: false,
        lastSyncedAt: now,
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
      // Drive側のファイルメタデータを取得して日時比較
      const metadata = await googleDriveService.getFileMetadata()
      const lastLocalSync = googleDriveService.getLastSyncTime()

      if (!metadata) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Google Drive上にデータが見つかりません。',
        }))
        return false
      }

      if (lastLocalSync) {
        const driveModifiedTime = new Date(metadata.modifiedTime).getTime()
        const localSyncTime = new Date(lastLocalSync).getTime()

        // ローカルの方が新しい、または同じ場合はスキップ
        if (driveModifiedTime <= localSyncTime) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'すでに最新のデータです。復元は不要です。',
          }))
          return false
        }
      }

      const syncData = await googleDriveService.download()
      await importDataFromObject(syncData.data)

      googleDriveService.setLastSyncTime(syncData.syncedAt)

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
