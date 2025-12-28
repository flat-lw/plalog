import { useState } from 'react'
import { Download } from 'lucide-react'
import { Header, PageLayout } from '@/components/layout'
import { Button } from '@/components/ui'
import { exportData, downloadJson } from '@/utils/export'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'

export function ExportPage() {
  const [isExporting, setIsExporting] = useState(false)
  const { showToast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await exportData()
      const filename = `plalog-backup-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`
      downloadJson(data, filename)
      showToast('エクスポートが完了しました')
    } catch (error) {
      showToast('エクスポートに失敗しました', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Header title="データエクスポート" showBack />
      <PageLayout>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">データをエクスポート</h2>
          <p className="text-gray-600 mb-6">
            すべてのデータをJSONファイルとしてダウンロードします。
            バックアップや別の端末への移行に使用できます。
          </p>
          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            <Download size={20} className="mr-2" />
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          </Button>
        </div>
      </PageLayout>
    </>
  )
}
