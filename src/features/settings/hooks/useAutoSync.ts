import { useEffect, useState, useCallback } from 'react'
import { googleDriveService } from '../services/googleDriveService'
import { importDataFromObject } from '@/utils/export'

export type AutoSyncStatus =
  | 'idle'
  | 'checking'
  | 'authenticating'
  | 'comparing'
  | 'downloading'
  | 'success'
  | 'skipped'
  | 'auth_required'
  | 'error'

interface AutoSyncState {
  status: AutoSyncStatus
  message: string | null
}

export function useAutoSync() {
  const [state, setState] = useState<AutoSyncState>({
    status: 'idle',
    message: null,
  })

  const runAutoSync = useCallback(async () => {
    // 連携フラグがなければスキップ
    if (!googleDriveService.isConnected()) {
      setState({ status: 'skipped', message: null })
      return
    }

    setState({ status: 'checking', message: 'Google Drive連携を確認中...' })

    // Google APIの読み込みを待つ
    let retries = 0
    while (!window.google && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500))
      retries++
    }

    if (!window.google) {
      setState({ status: 'skipped', message: null })
      return
    }

    // 既に認証済みでない場合のみサイレント認証を試みる
    if (!googleDriveService.isAuthenticated()) {
      setState({ status: 'authenticating', message: '認証を確認中...' })

      const authenticated = await googleDriveService.silentAuthenticate()

      if (!authenticated) {
        setState({
          status: 'auth_required',
          message: 'Google Driveとの再認証が必要です'
        })
        return
      }
    }

    setState({ status: 'comparing', message: 'データを確認中...' })

    try {
      // Driveのファイルメタデータを取得
      const metadata = await googleDriveService.getFileMetadata()

      if (!metadata) {
        // Driveにデータがない
        setState({ status: 'skipped', message: null })
        return
      }

      const driveModifiedTime = new Date(metadata.modifiedTime).getTime()
      const lastLocalSync = googleDriveService.getLastSyncTime()
      const localSyncTime = lastLocalSync ? new Date(lastLocalSync).getTime() : 0

      // Driveのデータがローカルより新しい場合のみダウンロード
      if (driveModifiedTime > localSyncTime) {
        setState({ status: 'downloading', message: 'データを同期中...' })

        const syncData = await googleDriveService.download()
        await importDataFromObject(syncData.data)
        googleDriveService.setLastSyncTime(syncData.syncedAt)

        setState({
          status: 'success',
          message: 'Google Driveからデータを同期しました'
        })
      } else {
        setState({ status: 'skipped', message: null })
      }
    } catch (error) {
      console.error('Auto sync error:', error)
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '同期に失敗しました'
      })
    }
  }, [])

  useEffect(() => {
    runAutoSync()
  }, [runAutoSync])

  const clearMessage = useCallback(() => {
    setState(prev => ({ ...prev, message: null }))
  }, [])

  return {
    ...state,
    clearMessage,
  }
}
