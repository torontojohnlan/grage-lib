type LiveListener = () => void;
type TerminateListener = (reason: any) => void;
type ChannelListener = (data: any) => void;
export default function makeClient(host?: string, onTerminate?: TerminateListener): {
    options: {
        /**
         * shows debug messages if set to true
         */
        debug: boolean;
        /**
         * how long to wait before reloading the page
         * this prevents exploding if errors occur at page load time
         */
        reloadTime: number;
        /**
         * how long to wait before actively checking if a device is alive
         */
        aliveTimeout: number;
        /**
         * how long to wait for a device to respond to a ping request
         */
        pingTimeout: number;
        /**
         * if a device is not responding,
         * how long to wait before retrying another ping request
         */
        pingRetry: number;
    };
    /**
     * Registers a listener which is called upon connection to server
     * @param cb the listener
     */
    onOpen(cb: LiveListener): void;
    /**
     * Gets the ID of the currently running app
     */
    getAppID(): string;
    /**
     * Gets the locally stored data/settings for this app
     */
    getData(defaultValue?: any): any;
    /**
     * Saves some data to the local storage for this app.
     * Overwrites old data
     * @param data the data to save
     */
    saveData(data: any): void;
    /**
     * Terminates the connection and reloads the app.
     */
    terminate(reason?: any): void;
    /**
     * Request a device to ping
     * @param id the device to request ping from
     */
    requestPing(id: string): void;
    /**
     * Connects to a channel and listens to any messages on channel
     * @param id the id of the channel
     * @param cb the listener for messages
     */
    connect(id: string, cb: ChannelListener): void;
    /**
     * Listens to a single message from a channel
     * @param id the channel to listen to
     * @param cb the listener
     */
    once(id: string, cb: ChannelListener): void;
    /**
     * Sends data to channel
     * @param id the id of the channel
     * @param data the data to send
     */
    send(id: string, data: any): void;
    onAlive(id: string, cb: LiveListener): void;
    onDead(id: string, cb: LiveListener): void;
};
export {};
