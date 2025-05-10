export interface Message {
    type: 'error' | 'metadata' | 'connect' | 'data' | 'receive' | 'rping' | 'ping';
}
export interface ErrorMessage extends Message {
    type: 'error';
    error: string;
}
export declare function isErrorMessage(m: Message): m is ErrorMessage;
export interface MetadataMessage extends Message {
    type: 'metadata';
    connectionTimeout: number;
    connectedChannels: string[];
    [key: string]: any;
}
export declare function isMetadataMessage(m: Message): m is MetadataMessage;
export interface ConnectMessage extends Message {
    type: 'connect';
    id: string;
}
export declare function isConnectMessage(m: Message): m is ConnectMessage;
export interface ChannelMessage extends Message {
    type: 'data' | 'rping' | 'ping';
    id: string;
    fromDevice: boolean;
}
export declare function isChannelMessage(m: Message): m is ChannelMessage;
export interface DataMessage extends ChannelMessage {
    type: 'data';
    data: any;
}
export declare function isDataMessage(m: Message): m is DataMessage;
export interface RequestPing extends ChannelMessage {
    type: 'rping';
    fromDevice: false;
}
export interface Ping extends ChannelMessage {
    type: 'ping';
    fromDevice: true;
}
export declare function isRequestPing(m: Message): m is RequestPing;
export declare function isPingMessage(m: Message): m is Ping;
