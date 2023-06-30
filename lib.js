export function isErrorMessage(m) {
    return m.type === 'error';
}
export function isMetadataMessage(m) {
    return m.type === 'metadata';
}
export function isConnectMessage(m) {
    return m.type === 'connect';
}
export function isChannelMessage(m) {
    return isDataMessage(m) || isRequestPing(m) || isPingMessage(m);
}
export function isDataMessage(m) {
    return m.type === 'data';
}
export function isRequestPing(m) {
    return m.type === 'rping';
}
export function isPingMessage(m) {
    return m.type === 'ping';
}
//# sourceMappingURL=lib.js.map