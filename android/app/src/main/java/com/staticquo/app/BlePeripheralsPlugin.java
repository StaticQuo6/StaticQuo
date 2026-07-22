package com.staticquo.app;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.ParcelUuid;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.UUID;

@CapacitorPlugin(
    name = "BlePeripherals",
    permissions = {
        @PermissionCallback(strings = {
            "android.permission.BLUETOOTH_ADVERTISE",
            "android.permission.BLUETOOTH_CONNECT"
        })
    }
)
public class BlePeripheralsPlugin extends Plugin {

    private static final UUID MESH_SERVICE_UUID =
        UUID.fromString("0000ff01-0000-1000-8000-00805f9b34fb");
    private static final UUID MESH_CHARACTERISTIC_UUID =
        UUID.fromString("0000ff02-0000-1000-8000-00805f9b34fb");

    private BluetoothManager bluetoothManager;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothGattServer gattServer;
    private BluetoothLeAdvertiser advertiser;
    private AdvertiseCallback advertiseCallback;
    private boolean isAdvertising = false;
    private boolean isGattServerOpen = false;

    @Override
    public void load() {
        Context ctx = getContext();
        bluetoothManager = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
        bluetoothAdapter = bluetoothManager != null ? bluetoothManager.getAdapter() : null;
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        boolean available = bluetoothAdapter != null && bluetoothAdapter.isEnabled();
        result.put("available", available);
        call.resolve(result);
    }

    @PluginMethod
    public void startAdvertising(PluginCall call) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth is not enabled");
            return;
        }

        advertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
        if (advertiser == null) {
            call.reject("BLE advertising not supported on this device");
            return;
        }

        String localName = call.getString("localName", "StaticQuo");

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setConnectable(true)
            .setTimeout(0)
            .build();

        AdvertiseData data = new AdvertiseData.Builder()
            .addServiceUuid(new ParcelUuid(MESH_SERVICE_UUID))
            .setIncludeDeviceName(true)
            .setIncludeTxPowerLevel(false)
            .build();

        advertiseCallback = new AdvertiseCallback() {
            @Override
            public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                isAdvertising = true;
                JSObject result = new JSObject();
                result.put("status", "started");
                result.put("localName", localName);
                notifyListeners("advertisingStarted", result);
            }

            @Override
            public void onStartFailure(int errorCode) {
                isAdvertising = false;
                JSObject result = new JSObject();
                result.put("errorCode", errorCode);
                notifyListeners("advertisingFailed", result);
                call.reject("Advertising failed with error code: " + errorCode);
            }
        };

        advertiser.startAdvertising(settings, data, advertiseCallback);
        call.resolve();
    }

    @PluginMethod
    public void stopAdvertising(PluginCall call) {
        if (advertiser != null && advertiseCallback != null && isAdvertising) {
            advertiser.stopAdvertising(advertiseCallback);
            isAdvertising = false;
        }
        JSObject result = new JSObject();
        result.put("status", "stopped");
        call.resolve(result);
    }

    @PluginMethod
    public void openGattServer(PluginCall call) {
        if (bluetoothManager == null) {
            call.reject("Bluetooth manager not available");
            return;
        }

        if (gattServer != null && isGattServerOpen) {
            call.resolve();
            return;
        }

        gattServer = bluetoothManager.openGattServer(getContext(), gattServerCallback);
        if (gattServer == null) {
            call.reject("Failed to open GATT server");
            return;
        }

        BluetoothGattService service = new BluetoothGattService(
            MESH_SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY);

        BluetoothGattCharacteristic characteristic = new BluetoothGattCharacteristic(
            MESH_CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ |
            BluetoothGattCharacteristic.PROPERTY_WRITE |
            BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE |
            BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ |
            BluetoothGattCharacteristic.PERMISSION_WRITE);

        service.addCharacteristic(characteristic);
        gattServer.addService(service);

        isGattServerOpen = true;

        JSObject result = new JSObject();
        result.put("status", "opened");
        call.resolve(result);
    }

    @PluginMethod
    public void closeGattServer(PluginCall call) {
        if (gattServer != null) {
            gattServer.close();
            gattServer = null;
            isGattServerOpen = false;
        }
        call.resolve();
    }

    @PluginMethod
    public void sendResponse(PluginCall call) {
        if (gattServer == null) {
            call.reject("GATT server not open");
            return;
        }

        String deviceId = call.getString("deviceId");
        int requestId = call.getInt("requestId", 0);
        int status = call.getInt("status", BluetoothGatt.GATT_SUCCESS);
        int offset = call.getInt("offset", 0);
        byte[] value = call.getArray("value", byte[].class);

        if (deviceId == null || value == null) {
            call.reject("deviceId and value are required");
            return;
        }

        BluetoothDevice device = bluetoothAdapter.getRemoteDevice(deviceId);
        gattServer.sendResponse(device, requestId, status, offset, value);
        call.resolve();
    }

    @PluginMethod
    public void notifyCharacteristicChanged(PluginCall call) {
        if (gattServer == null) {
            call.reject("GATT server not open");
            return;
        }

        String deviceId = call.getString("deviceId");
        byte[] value = call.getArray("value", byte[].class);

        if (deviceId == null || value == null) {
            call.reject("deviceId and value are required");
            return;
        }

        BluetoothDevice device = bluetoothAdapter.getRemoteDevice(deviceId);

        BluetoothGattService service = gattServer.getService(MESH_SERVICE_UUID);
        if (service == null) {
            call.reject("Mesh service not found");
            return;
        }

        BluetoothGattCharacteristic characteristic = service.getCharacteristic(MESH_CHARACTERISTIC_UUID);
        if (characteristic == null) {
            call.reject("Mesh characteristic not found");
            return;
        }

        characteristic.setValue(value);
        characteristic.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
        gattServer.notifyCharacteristicChanged(device, characteristic, false);
        call.resolve();
    }

    private final BluetoothGattServerCallback gattServerCallback = new BluetoothGattServerCallback() {
        @Override
        public void onConnectionStateChange(BluetoothDevice device, int status, int newState) {
            JSObject data = new JSObject();
            data.put("deviceId", device.getAddress());
            data.put("state", newState == BluetoothProfile.STATE_CONNECTED ? "connected" : "disconnected");

            if (newState == BluetoothProfile.STATE_CONNECTED) {
                notifyListeners("deviceConnected", data);
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                notifyListeners("deviceDisconnected", data);
            }
        }

        @Override
        public void onCharacteristicWriteRequest(
                BluetoothDevice device,
                int requestId,
                BluetoothGattCharacteristic characteristic,
                boolean preparedWrite,
                boolean responseNeeded,
                int offset,
                byte[] value) {

            if (!MESH_CHARACTERISTIC_UUID.equals(characteristic.getUuid())) return;

            JSObject data = new JSObject();
            data.put("deviceId", device.getAddress());
            data.put("requestId", requestId);
            data.put("offset", offset);
            data.put("preparedWrite", preparedWrite);
            data.put("responseNeeded", responseNeeded);

            if (value != null) {
                data.put("value", android.util.Base64.encodeToString(value, android.util.Base64.NO_WRAP));
            }

            notifyListeners("characteristicWrite", data);

            if (responseNeeded) {
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
            }
        }

        @Override
        public void onCharacteristicReadRequest(
                BluetoothDevice device,
                int requestId,
                int offset,
                BluetoothGattCharacteristic characteristic) {

            if (!MESH_CHARACTERISTIC_UUID.equals(characteristic.getUuid())) return;

            byte[] value = characteristic.getValue();
            if (value == null) value = new byte[0];

            gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
        }

        @Override
        public void onNotificationSent(BluetoothDevice device, int status) {
            JSObject data = new JSObject();
            data.put("deviceId", device.getAddress());
            data.put("status", status);
            notifyListeners("notificationSent", data);
        }
    };
}
