import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'

export function PopupGreeting(): React.JSX.Element {
  const { t, i18n } = useTranslation()

  const isRussian = i18n.language.toLowerCase().startsWith('ru')

  const handleSwitchLanguage = (): void => {
    void i18n.changeLanguage(isRussian ? 'en' : 'ru')
  }

  return (
    <main className="w-80 rounded-lg border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('greeting')}</h1>
        <Button variant="outline" size="sm" onClick={handleSwitchLanguage}>
          <Languages className="h-4 w-4" />
          {isRussian ? 'EN' : 'RU'}
        </Button>
      </div>
      <p className="text-sm text-zinc-600">{t('description')}</p>
    </main>
  )
}
