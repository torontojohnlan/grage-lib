export enum PinMode {
    INPUT = 0x00,
    INPUT_PULLUP = 0x02,
    OUTPUT = 0x01,
}

export enum InterruptMode {
    RISING = 0x01,
    FALLING = 0x02,
    CHANGE = 0x03,
    ONLOW = 0x04,
    ONHIGH = 0x05,
}

export enum LogicLevel {
    HIGH = 0x01,
    LOW = 0x00,
}

export enum Pin {
    D0 = 16,
    D1 = 5,
    D2 = 4,
    D3 = 0,
    D4 = 2,
    D5 = 14,
    D6 = 12,
    D7 = 13,
    D8 = 15,
    D9 = 3,
    D10 = 1,
    _A0 = 17,
}

export type StateData={
    pinReadings:number[],
}

export function  pinMode(pin: Pin, mode: PinMode) {
        return {
            command: 'pinMode',
            pin, mode,
        }
}
export function digitalWrite(pin: Pin, value: LogicLevel) {
        return {
            command: 'digitalWrite',
            pin, value,
        };
}
export function attachInterrupt(pin: Pin, mode: InterruptMode) {
        return {
            command: 'attachInterrupt',
            pin, mode,
        };
}
export function detachInterrupt(pin: Pin) {
        return {
            command: 'detachInterrupt',
            pin
        };
}

