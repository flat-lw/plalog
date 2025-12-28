import { Header, PageLayout } from '@/components/layout'
import { Sprout } from 'lucide-react'

export function AboutPage() {
  return (
    <>
      <Header title="このアプリについて" showBack />
      <PageLayout>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <Sprout size={40} className="text-primary-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary-600 mb-2">plalog</h1>
          <p className="text-gray-500 mb-6">園芸管理アプリ</p>

          <div className="text-left space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800">バージョン</h3>
              <p>0.1.0</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">機能</h3>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>植物の管理</li>
                <li>水やり記録</li>
                <li>開花・成長イベント記録</li>
                <li>場所・環境データ管理</li>
                <li>データのエクスポート/インポート</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">データ保存</h3>
              <p>すべてのデータはお使いのブラウザに保存されます。</p>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  )
}
