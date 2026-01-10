import '@/types/google.d'
import type { ExportData } from '@/db/models'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
const FILE_NAME = 'plalog-data.json'
const STORAGE_KEY_CONNECTED = 'plalog_gdrive_connected'
const STORAGE_KEY_LAST_SYNC = 'plalog_gdrive_last_sync'

export interface GoogleDriveSyncData {
  version: number
  app: 'plalog'
  syncedAt: string
  data: ExportData['data']
}

interface DriveFile {
  id: string
  name: string
  modifiedTime?: string
}

interface DriveFileListResponse {
  files: DriveFile[]
}

class GoogleDriveService {
  private accessToken: string | null = null
  private tokenExpiresAt: number | null = null

  isAuthenticated(): boolean {
    if (!this.accessToken || !this.tokenExpiresAt) return false
    return Date.now() < this.tokenExpiresAt
  }

  getAccessToken(): string | null {
    return this.isAuthenticated() ? this.accessToken : null
  }

  // 連携フラグの管理
  isConnected(): boolean {
    return localStorage.getItem(STORAGE_KEY_CONNECTED) === 'true'
  }

  setConnected(connected: boolean): void {
    if (connected) {
      localStorage.setItem(STORAGE_KEY_CONNECTED, 'true')
    } else {
      localStorage.removeItem(STORAGE_KEY_CONNECTED)
      localStorage.removeItem(STORAGE_KEY_LAST_SYNC)
    }
  }

  getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC)
  }

  setLastSyncTime(time: string): void {
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, time)
  }

  async authenticate(): Promise<void> {
    if (!window.google) {
      throw new Error('Google Identity Servicesが読み込まれていません')
    }

    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client IDが設定されていません')
    }

    return new Promise((resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || '認証に失敗しました'))
            return
          }
          this.accessToken = response.access_token
          this.tokenExpiresAt = Date.now() + response.expires_in * 1000
          resolve()
        },
        error_callback: (error) => {
          reject(new Error(error.message || '認証がキャンセルされました'))
        },
      })

      client.requestAccessToken({ prompt: 'consent' })
    })
  }

  // サイレント認証（ポップアップなしで試行、失敗したらエラー）
  async silentAuthenticate(): Promise<boolean> {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      return false
    }

    // 既に認証済みなら成功
    if (this.isAuthenticated()) {
      return true
    }

    return new Promise((resolve) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            resolve(false)
            return
          }
          this.accessToken = response.access_token
          this.tokenExpiresAt = Date.now() + response.expires_in * 1000
          resolve(true)
        },
        error_callback: () => {
          resolve(false)
        },
      })

      // prompt: 'none' でサイレント認証を試みる
      client.requestAccessToken({ prompt: 'none' })
    })
  }

  disconnect(): void {
    if (this.accessToken && window.google) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        // Revoke callback
      })
    }
    this.accessToken = null
    this.tokenExpiresAt = null
  }

  private async findFile(): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('認証が必要です')
    }

    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      q: `name='${FILE_NAME}'`,
      fields: 'files(id, name, modifiedTime)',
    })

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'ファイル検索に失敗しました')
    }

    const data: DriveFileListResponse = await response.json()
    return data.files.length > 0 ? data.files[0].id : null
  }

  async getFileMetadata(): Promise<{ modifiedTime: string } | null> {
    if (!this.accessToken) {
      throw new Error('認証が必要です')
    }

    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      q: `name='${FILE_NAME}'`,
      fields: 'files(id, name, modifiedTime)',
    })

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data: DriveFileListResponse = await response.json()
    if (data.files.length === 0 || !data.files[0].modifiedTime) {
      return null
    }

    return { modifiedTime: data.files[0].modifiedTime }
  }

  private async createFile(syncData: GoogleDriveSyncData): Promise<void> {
    if (!this.accessToken) {
      throw new Error('認証が必要です')
    }

    const metadata = {
      name: FILE_NAME,
      parents: ['appDataFolder'],
    }

    const form = new FormData()
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    )
    form.append(
      'file',
      new Blob([JSON.stringify(syncData)], { type: 'application/json' })
    )

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'ファイル作成に失敗しました')
    }
  }

  private async updateFile(
    fileId: string,
    syncData: GoogleDriveSyncData
  ): Promise<void> {
    if (!this.accessToken) {
      throw new Error('認証が必要です')
    }

    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncData),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'ファイル更新に失敗しました')
    }
  }

  async upload(data: ExportData['data']): Promise<void> {
    const syncData: GoogleDriveSyncData = {
      version: 1,
      app: 'plalog',
      syncedAt: new Date().toISOString(),
      data,
    }

    const fileId = await this.findFile()

    if (fileId) {
      await this.updateFile(fileId, syncData)
    } else {
      await this.createFile(syncData)
    }
  }

  async download(): Promise<GoogleDriveSyncData> {
    if (!this.accessToken) {
      throw new Error('認証が必要です')
    }

    const fileId = await this.findFile()

    if (!fileId) {
      throw new Error('同期データが見つかりません')
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'ファイル取得に失敗しました')
    }

    const syncData: GoogleDriveSyncData = await response.json()

    if (syncData.app !== 'plalog') {
      throw new Error('無効なデータ形式です')
    }

    return syncData
  }
}

export const googleDriveService = new GoogleDriveService()
