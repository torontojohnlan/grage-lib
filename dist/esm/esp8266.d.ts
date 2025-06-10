declare enum PinMode {
    INPUT = 0,
    INPUT_PULLUP = 2,
    OUTPUT = 1
}
declare enum InterruptMode {
    RISING = 1,
    FALLING = 2,
    CHANGE = 3,
    ONLOW = 4,
    ONHIGH = 5
}
declare enum LogicLevel {
    HIGH = 1,
    LOW = 0
}
declare enum Pin {
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
    _A0 = 17
}
export type StateData = {
    pinReadings: number[];
};
declare const _default: {
    LogicLevel: typeof LogicLevel;
    PinMode: typeof PinMode;
    InterruptMode: typeof InterruptMode;
    Pin: typeof Pin;
    pinMode(pin: Pin, mode: PinMode): {
        command: string;
        pin: Pin;
        mode: PinMode;
    };
    digitalWrite(pin: Pin, value: LogicLevel): {
        command: string;
        pin: Pin;
        value: LogicLevel;
    };
    attachInterrupt(pin: Pin, mode: InterruptMode): {
        command: string;
        pin: Pin;
        mode: InterruptMode;
    };
    detachInterrupt(pin: Pin): {
        command: string;
        pin: Pin;
    };
};
export default _default;
