import { useRef, useState } from 'react'
import { Download, Languages, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { exportGroups, importGroups } from '../popup/services/export-import'

type PopupStatus = {
  type: 'info' | 'success' | 'error'
  message: string
}

export function PopupGreeting(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [status, setStatus] = useState<PopupStatus | null>(null)

  const isRussian = i18n.language.toLowerCase().startsWith('ru')

  const handleSwitchLanguage = (): void => {
    void i18n.changeLanguage(isRussian ? 'en' : 'ru')
  }

  const handleExport = (): void => {
    setIsBusy(true)
    setStatus(null)

    void exportGroups()
      .then((result) => {
        if (result.exportedCount === 0) {
          setStatus({
            type: 'info',
            message: t('noGroupsToExport'),
          })
          return
        }

        setStatus({
          type: 'success',
          message: t('exportSuccess', { count: result.exportedCount }),
        })
      })
      .catch((error: unknown) => {
        console.error('Failed to export groups', error)
        setStatus({
          type: 'error',
          message: t('exportError'),
        })
      })
      .finally(() => {
        setIsBusy(false)
      })
  }

  const handleOpenImport = (): void => {
    fileInputRef.current?.click()
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setIsBusy(true)
    setStatus(null)

    void importGroups(file)
      .then((result) => {
        setStatus({
          type: 'success',
          message: t('importSuccess', {
            importedCount: result.importedCount,
            skippedCount: result.skippedCount,
            filteredChannelsCount: result.filteredChannelsCount,
          }),
        })
      })
      .catch((error: unknown) => {
        console.error('Failed to import groups', error)
        setStatus({
          type: 'error',
          message: t('importError'),
        })
      })
      .finally(() => {
        setIsBusy(false)
      })
  }

  const statusClassName =
    status?.type === 'error'
      ? 'text-red-600'
      : status?.type === 'success'
        ? 'text-emerald-600'
        : 'text-zinc-600'

  return (
    <main className="w-80 rounded-lg border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('greeting')}</h1>
        <Button variant="outline" size="sm" onClick={handleSwitchLanguage} disabled={isBusy}>
          <Languages className="h-4 w-4" />
          {isRussian ? 'EN' : 'RU'}
        </Button>
      </div>
      <p className="text-sm text-zinc-600">{t('description')}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isBusy}>
          <Download className="h-4 w-4" />
          {t('exportGroups')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleOpenImport} disabled={isBusy}>
          <Upload className="h-4 w-4" />
          {t('importGroups')}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />
      {status ? <p className={`mt-3 text-xs ${statusClassName}`}>{status.message}</p> : null}
    </main>
  )
}
