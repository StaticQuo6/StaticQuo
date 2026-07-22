import { getBlePeripheral } from '../../shared/ble/BlePeripheralPlugin'

export function broadcastBeacon(localName: string): Promise<void> {
  const ble = getBlePeripheral()
  if (!ble) return Promise.resolve()
  return ble.startAdvertising({ localName })
}

export function stopBeacon(): Promise<void> {
  const ble = getBlePeripheral()
  if (!ble) return Promise.resolve()
  return ble.stopAdvertising()
}
