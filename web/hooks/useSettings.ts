import { useCallback, useEffect, useState } from 'react'

import { fs, joinPath } from '@janhq/core'
import { atom, useAtom } from 'jotai'

export const isShowNotificationAtom = atom<boolean>(false)

export const useSettings = () => {
  const [isGPUModeEnabled, setIsGPUModeEnabled] = useState(false) // New state for GPU mode
  const [showNotification, setShowNotification] = useAtom(
    isShowNotificationAtom
  )

  useEffect(() => {
    setTimeout(() => validateSettings, 3000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateSettings = async () => {
    readSettings().then((settings) => {
      if (
        settings &&
        settings.notify &&
        ((settings.nvidia_driver?.exist && !settings.cuda?.exist) ||
          !settings.nvidia_driver?.exist)
      ) {
        setShowNotification(false)
      }

      // Check if run_mode is 'gpu' or 'cpu' and update state accordingly
      setIsGPUModeEnabled(settings?.run_mode === 'gpu')
    })
  }

  const readSettings = useCallback(async () => {
    if (!window?.core?.api) {
      return
    }
    const settingsFile = await joinPath(['file://settings', 'settings.json'])
    if (await fs.existsSync(settingsFile)) {
      const settings = await fs.readFileSync(settingsFile, 'utf-8')
      return typeof settings === 'object' ? settings : JSON.parse(settings)
    }
    return {}
  }, [])

  const saveSettings = async ({
    runMode,
    notify,
    gpusInUse,
  }: {
    runMode?: string | undefined
    notify?: boolean | undefined
    gpusInUse?: string[] | undefined
  }) => {
    const settingsFile = await joinPath(['file://settings', 'settings.json'])
    const settings = await readSettings()
    if (runMode != null) settings.run_mode = runMode
    if (notify != null) settings.notify = notify
    if (gpusInUse != null) settings.gpus_in_use = gpusInUse
    await fs.writeFileSync(settingsFile, JSON.stringify(settings))
  }

  return {
    showNotification,
    isGPUModeEnabled,
    readSettings,
    saveSettings,
    setShowNotification,
    validateSettings,
  }
}
