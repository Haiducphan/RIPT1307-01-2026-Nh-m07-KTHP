import { createDevice, deleteDevice, getDevices, updateDevice } from '@/services/devices';
import { getErrorMessage } from '@/services/http';
import type { Device, DeviceStatus } from '@/types';

const STATUS_OPTIONS: { label: string; value: DeviceStatus }[] = (
  Object.entries(DEVICE_STATUS_LABEL) as [DeviceStatus, string][]
).map(([value, label]) => ({ value, label }));

interface DeviceFormValues {
  name: string;
  category: string;
  totalQuantity: number;
  status: DeviceStatus;
  description?: string;
}