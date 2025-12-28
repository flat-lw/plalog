import { formatDistanceToNow, format } from 'date-fns'
import { ja } from 'date-fns/locale'

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ja })
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy/MM/dd', { locale: ja })
}

export function formatDateTime(date: Date): string {
  return format(date, 'yyyy/MM/dd HH:mm', { locale: ja })
}

export function formatDateForInput(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDateTimeForInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}
