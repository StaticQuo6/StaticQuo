import { useEffect, useState } from 'react'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'

type PermissionStatus = 'unknown' | 'granted' | 'denied'

export function usePermissions() {
  const [ble, setBle] = useState<PermissionStatus>('unknown')
  const [location, setLocation] = useState<PermissionStatus>('unknown')

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      BleClient.initialize({ androidNeverForLocation: true })
        .then(() => {
          setBle('granted')
          setLocation('granted')
        })
        .catch(() => {
          setBle('denied')
          setLocation('denied')
        })
    } else {
      setBle('granted')
      setLocation('granted')
    }
  }, [])

  return { ble, location }
}
