import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { Header, PageLayout } from '@/components/layout'
import { Button } from '@/components/ui'
import { importData } from '@/utils/export'
import { useToast } from '@/hooks/useToast'

export function ImportPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    if (!confirm('現在のデータはすべて上書きされます。続行しますか？')) {
      return
    }

    setIsImporting(true)
    try {
      const text = await selectedFile.text()
      await importData(text)
      showToast('インポートが完了しました')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      showToast('インポートに失敗しました。ファイルを確認してください。', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <Header title="データインポート" showBack />
      <PageLayout>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">データをインポート</h2>
          <p className="text-gray-600 mb-6">
            エクスポートしたJSONファイルからデータを復元します。
            <br />
            <span className="text-red-500 font-medium">
              注意: 現在のデータはすべて上書きされます。
            </span>
          </p>

          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-primary-500 transition-colors"
              >
                {selectedFile ? (
                  <span className="text-primary-600 font-medium">{selectedFile.name}</span>
                ) : (
                  <span className="text-gray-500">ファイルを選択してください</span>
                )}
              </label>
            </div>

            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="w-full"
            >
              <Upload size={20} className="mr-2" />
              {isImporting ? 'インポート中...' : 'インポート'}
            </Button>
          </div>
        </div>
      </PageLayout>
    </>
  )
}
