"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detachInterrupt = exports.attachInterrupt = exports.digitalWrite = exports.pinMode = exports.Pin = exports.LogicLevel = exports.InterruptMode = exports.PinMode = void 0;
var PinMode;
(function (PinMode) {
    PinMode[PinMode["INPUT"] = 0] = "INPUT";
    PinMode[PinMode["INPUT_PULLUP"] = 2] = "INPUT_PULLUP";
    PinMode[PinMode["OUTPUT"] = 1] = "OUTPUT";
})(PinMode || (exports.PinMode = PinMode = {}));
var InterruptMode;
(function (InterruptMode) {
    InterruptMode[InterruptMode["RISING"] = 1] = "RISING";
    InterruptMode[InterruptMode["FALLING"] = 2] = "FALLING";
    InterruptMode[InterruptMode["CHANGE"] = 3] = "CHANGE";
    InterruptMode[InterruptMode["ONLOW"] = 4] = "ONLOW";
    InterruptMode[InterruptMode["ONHIGH"] = 5] = "ONHIGH";
})(InterruptMode || (exports.InterruptMode = InterruptMode = {}));
var LogicLevel;
(function (LogicLevel) {
    LogicLevel[LogicLevel["HIGH"] = 1] = "HIGH";
    LogicLevel[LogicLevel["LOW"] = 0] = "LOW";
})(LogicLevel || (exports.LogicLevel = LogicLevel = {}));
var Pin;
(function (Pin) {
    Pin[Pin["D0"] = 16] = "D0";
    Pin[Pin["D1"] = 5] = "D1";
    Pin[Pin["D2"] = 4] = "D2";
    Pin[Pin["D3"] = 0] = "D3";
    Pin[Pin["D4"] = 2] = "D4";
    Pin[Pin["D5"] = 14] = "D5";
    Pin[Pin["D6"] = 12] = "D6";
    Pin[Pin["D7"] = 13] = "D7";
    Pin[Pin["D8"] = 15] = "D8";
    Pin[Pin["D9"] = 3] = "D9";
    Pin[Pin["D10"] = 1] = "D10";
    Pin[Pin["_A0"] = 17] = "_A0";
})(Pin || (exports.Pin = Pin = {}));
function pinMode(pin, mode) {
    return {
        command: 'pinMode',
        pin, mode,
    };
}
exports.pinMode = pinMode;
function digitalWrite(pin, value) {
    return {
        command: 'digitalWrite',
        pin, value,
    };
}
exports.digitalWrite = digitalWrite;
function attachInterrupt(pin, mode) {
    return {
        command: 'attachInterrupt',
        pin, mode,
    };
}
exports.attachInterrupt = attachInterrupt;
function detachInterrupt(pin) {
    return {
        command: 'detachInterrupt',
        pin
    };
}
exports.detachInterrupt = detachInterrupt;
//# sourceMappingURL=esp8266.js.map