export interface BlePeripheralPlugin {
  startAdvertising(options: { localName: string }): Promise<void>
  stopAdvertising(): Promise<void>
  isAvailable(): Promise<{ available: boolean }>
  openGattServer(): Promise<void>
  closeGattServer(): Promise<void>
  sendResponse(options: { deviceId: string; requestId: number; status: number; offset: number; value: string }): Promise<void>
  notifyCharacteristicChanged(options: { deviceId: string; value: string }): Promise<void>
}

export function getBlePeripheral(): BlePeripheralPlugin | null {
  return (window as any).BlePeripherals ?? null
}
