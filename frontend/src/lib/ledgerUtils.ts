import { v4 as uuidv4 } from 'uuid';

export const LEDGER_DEVICE_ID_KEY = 'aion2_ledger_device_id';

export const getDeviceId = (): string => {
    if (typeof window === 'undefined') return '';

    let deviceId = localStorage.getItem(LEDGER_DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(LEDGER_DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};

export const getTodayString = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatKina = (value: number): string => {
    return value.toLocaleString();
};

export const parseKina = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, ''));
};
