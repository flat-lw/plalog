import { jsPDF } from 'jspdf'
import type { PlantPassport } from '../types'
import { GROWTH_EVENT_LABELS } from '@/db/models'

export async function generatePlantPassportPdf(
  passport: PlantPassport
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let y = 20

  // タイトル
  doc.setFontSize(20)
  doc.text('Plant Passport', 105, y, { align: 'center' })
  y += 15

  // 区切り線
  doc.setLineWidth(0.5)
  doc.line(20, y, 190, y)
  y += 10

  // 基本情報
  doc.setFontSize(11)

  if (passport.plant.species) {
    doc.text(`Species: ${passport.plant.species}`, 20, y)
    y += 7
  }

  if (passport.exportedBy.displayName) {
    let managerText = `Managed by: ${passport.exportedBy.displayName}`
    if (passport.exportedBy.contact) {
      managerText += ` (${passport.exportedBy.contact})`
    }
    doc.text(managerText, 20, y)
    y += 7
  }

  if (passport.plant.acquiredAt) {
    const exportDate = passport.exportedAt.split('T')[0]
    const periodText = formatPeriod(passport.summary.managementDays)
    doc.text(
      `Period: ${passport.plant.acquiredAt} - ${exportDate} (${periodText})`,
      20,
      y
    )
    y += 10
  }

  // 区切り線
  doc.line(20, y, 190, y)
  y += 10

  // 管理サマリー
  doc.setFontSize(12)
  doc.text('Management Summary', 20, y)
  y += 8

  doc.setFontSize(10)
  doc.text(
    `Watering: ${passport.summary.wateringCount} times (avg. every ${passport.summary.avgWateringInterval} days)`,
    25,
    y
  )
  y += 6
  doc.text(`Repotting: ${passport.summary.repottingCount} times`, 25, y)
  y += 6
  doc.text(
    `Flowering: ${passport.summary.floweringCount > 0 ? passport.summary.floweringCount + ' times' : 'None'}`,
    25,
    y
  )
  y += 10

  // 環境データ
  if (passport.environment) {
    doc.line(20, y, 190, y)
    y += 10

    doc.setFontSize(12)
    doc.text('Environment', 20, y)
    y += 8

    doc.setFontSize(10)
    doc.text(
      `Temperature: ${passport.environment.tempMin} - ${passport.environment.tempMax}°C (avg. ${passport.environment.tempAvg}°C)`,
      25,
      y
    )
    y += 6

    if (passport.environment.humidityAvg) {
      doc.text(`Humidity: avg. ${passport.environment.humidityAvg}%`, 25, y)
      y += 6
    }

    if (passport.environment.placement) {
      doc.text(`Placement: ${passport.environment.placement}`, 25, y)
      y += 6
    }
    y += 4
  }

  // 成長イベント
  if (passport.growthEvents.length > 0) {
    doc.line(20, y, 190, y)
    y += 10

    doc.setFontSize(12)
    doc.text('Growth Events', 20, y)
    y += 8

    doc.setFontSize(9)
    for (const event of passport.growthEvents.slice(0, 10)) {
      const label = GROWTH_EVENT_LABELS[event.type] || event.type
      let eventText = `${event.date}  ${label}`
      if (event.notes) {
        eventText += ` - ${event.notes}`
      }
      // テキストが長すぎる場合は切り詰め
      if (eventText.length > 80) {
        eventText = eventText.substring(0, 77) + '...'
      }
      doc.text(eventText, 25, y)
      y += 5

      if (y > 260) {
        doc.addPage()
        y = 20
      }
    }

    if (passport.growthEvents.length > 10) {
      doc.text(`... and ${passport.growthEvents.length - 10} more events`, 25, y)
      y += 5
    }
    y += 5
  }

  // メモ
  if (passport.plant.notes) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }

    doc.line(20, y, 190, y)
    y += 10

    doc.setFontSize(12)
    doc.text('Notes', 20, y)
    y += 8

    doc.setFontSize(10)
    const lines = doc.splitTextToSize(passport.plant.notes, 160)
    doc.text(lines, 25, y)
    y += lines.length * 5 + 5
  }

  // フッター
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Exported from plalog', 20, pageHeight - 15)
  doc.text(passport.exportedAt.split('T')[0], 20, pageHeight - 10)

  return doc.output('blob')
}

function formatPeriod(days: number): string {
  if (days < 30) {
    return `${days} days`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months} month${months > 1 ? 's' : ''}`
  }
  const years = Math.floor(days / 365)
  const remainingMonths = Math.floor((days % 365) / 30)
  if (remainingMonths === 0) {
    return `${years} year${years > 1 ? 's' : ''}`
  }
  return `${years}y ${remainingMonths}m`
}
