import { Routes, Route, Navigate } from 'react-router-dom'
import { PlantListPage } from '@/features/plants/pages/PlantListPage'
import { PlantDetailPage } from '@/features/plants/pages/PlantDetailPage'
import { WateringPage } from '@/features/watering/pages/WateringPage'
import { WateringHistoryPage } from '@/features/watering/pages/WateringHistoryPage'
import { LocationListPage } from '@/features/locations/pages/LocationListPage'
import { LocationDetailPage } from '@/features/locations/pages/LocationDetailPage'
import { ExportPage, ImportPage, AboutPage, GoogleDriveSyncPage } from '@/features/settings'
import { CsvImportPage } from '@/features/environment'

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/plants" replace />} />
      <Route path="/plants" element={<PlantListPage />} />
      <Route path="/plants/:id" element={<PlantDetailPage />} />
      <Route path="/watering" element={<WateringPage />} />
      <Route path="/watering/history" element={<WateringHistoryPage />} />
      <Route path="/locations" element={<LocationListPage />} />
      <Route path="/locations/:id" element={<LocationDetailPage />} />
      <Route path="/settings/export" element={<ExportPage />} />
      <Route path="/settings/import" element={<ImportPage />} />
      <Route path="/settings/google-drive" element={<GoogleDriveSyncPage />} />
      <Route path="/settings/environment-import" element={<CsvImportPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}
