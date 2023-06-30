import {
    ChannelMessage,
    ConnectMessage,
    isMetadataMessage,
    DataMessage,
    Message, Ping,
    RequestPing
} from "./lib.js";

// import { w3cwebsocket } from 'websocket'
import pkg from 'websocket/index.js';
const { w3cwebsocket } = pkg;

function isRequestPing(m: Message): m is RequestPing {
    return m.type === 'rping';
}

function isPingMessage(m: Message): m is Ping {
    return m.type === 'ping';
}

function isChannelMessage(m: Message): m is ChannelMessage {
    return isDataMessage(m) || isRequestPing(m) || isPingMessage(m);
}

function isDataMessage(m: Message): m is DataMessage {
    return m.type === 'data';
}

enum LiveState {
    ALIVE, DEAD, UNKNOWN
}

type LiveListener = () => void;
type TerminateListener = (reason:any) => void;

type ChannelListener = (data: any) => void;
type Channel = {
    dataListeners: ChannelListener[];
    dataListenersOnce: ChannelListener[];
    state: LiveState;
    prevState: LiveState;
    aliveListeners: LiveListener[];
    deadListeners: LiveListener[];
    currentTimer?: NodeJS.Timeout;//TODO stop using nodejs classes
};

// @ts-ignore
export default function makeClient(host:string = undefined, onTerminate:TerminateListener = undefined) { //returns a grage object
    let protocol = 'wss';

    if(globalThis.location) {
        if (location.protocol !== 'https:')
            protocol = 'ws';

        host ??= `${location.hostname}:${location.port}`;
    }
    debug(`${protocol}://${host}/ws`);
    const ws = new w3cwebsocket(`${protocol}://${host}/ws`);

    //list of listeners for when the websocket connects
    let openListeners: LiveListener[] | undefined = [];

    const channels: {
        [id: string]: Channel;
    } = {};

    /**
     * Sends a message on the websocket, returns any error which occurs
     * @param m the message to send
     */
    function wsSend(m: Message) {
        try {
            debug('[Send]', m);
            ws.send(JSON.stringify(m));
            return false;
        } catch (error) {
            handleError(error);
            return error;
        }
    }

    /**
     * console.logs the parameters if debug mode is on
     * @param args the parameters to console.log
     */
    function debug(...args: any) {
        // if (grage.options.debug)
            console.log(...args);
    }

    const grage = {
        options: {
            /**
             * shows debug messages if set to true
             */
            debug: globalThis.location && (location.hostname === "localhost" || location.hostname === "127.0.0.1"),

            /**
             * how long to wait before reloading the page
             * this prevents exploding if errors occur at page load time
             */
            reloadTime: 5 * 1000,

            /**
             * how long to wait before actively checking if a device is alive //JohnLan. To be exact, this is to check if a channel, rather than a device, is alive
             */
            aliveTimeout: 10 * 1000,

            /**
             * how long to wait for a device to respond to a ping request
             */
            pingTimeout: 5 * 1000,

            /**
             * if a device is not responding,
             * how long to wait before retrying another ping request
             */
            pingRetry: 30 * 1000,

            /**
             * how long the door has been consecutively open before an alert is sent (for debug purpose, set to 5 min)
             */
            maxOpenTimeAllowed: 5 * 60 * 1000,  // 5 min,
            alertEmailInterval: 60 * 60 * 1000, // 1 hour
        },
        /**
         * Registers a listener which is called upon connection to server
         * @param cb the listener
         */
        onOpen(cb: LiveListener) {
            if (openListeners === undefined)
                cb();
            else
                openListeners.push(cb);
        },
        /**
         * Gets the ID of the currently running app
         */
        getAppID() {
            const url = window.location.pathname.slice(1);
            const tokens = url.split('/');
            if (tokens[0] !== 'apps')
                throw new Error('Cannot get data: invalid app');
            return tokens[1];
        },
        /**
         * Gets the locally stored data/settings for this app
         */
        getData(defaultValue?: any) {
            const app = grage.getAppID();
            const data = window.localStorage.getItem(app);
            if (data)
                return JSON.parse(data);
            else
                return defaultValue;
        },
        /**
         * Saves some data to the local storage for this app.
         * Overwrites old data
         * @param data the data to save
         */
        saveData(data: any) {
            window.localStorage.setItem(grage.getAppID(), JSON.stringify(data));
        },

        /**
         * Terminates the connection and reloads the app.
         */
        terminate(reason:any = undefined) {
            //close ws if not already
            console.log("grage channel closing handler")
            if (ws.readyState === w3cwebsocket.OPEN || ws.readyState === w3cwebsocket.CONNECTING) {
                ws.close();
            }

            // User error handler
            if(onTerminate){
                return onTerminate(reason);
            }

            if(globalThis.location)
            {
                //reload page in 5 seconds
                setTimeout(
                    () => window.location.reload(),
                    grage.options.reloadTime
                );
            }
            else
            {
                console.log('terminated websocket')
                globalThis.process.exit(-1)
            }
        },
        /**
         * Request a device to ping
         * @param id the device to request ping from
         */
        requestPing(id: string) {
            //send ping
            const m: RequestPing = {
                type: "rping",
                id,
                fromDevice: false
            };
            if (wsSend(m)) return;
        },
        /**
         * Connects to a channel and listens to any messages on channel
         * @param id the id of the channel
         * @param cb the listener for messages
         */
        connect(id: string, cb: ChannelListener) {
            //if not connected to channel yet
            if (!channels.hasOwnProperty(id)) {
                //initialize channelListeners
                channels[id] = {
                    dataListeners: [],
                    dataListenersOnce: [],
                    aliveListeners: [],
                    deadListeners: [],
                    state: LiveState.UNKNOWN,
                    prevState: LiveState.UNKNOWN,
                };

                //send channel connect message
                const m: ConnectMessage = {
                    type: "connect",
                    id,
                };
                if (wsSend(m)) return;
            }

            //request new data
            grage.requestPing(id);
            channels[id].dataListeners.push(cb);
        },
        /**
         * Listens to a single message from a channel
         * @param id the channel to listen to
         * @param cb the listener
         */
        once(id: string, cb: ChannelListener) {
            channels[id].dataListenersOnce.push(cb);
        },
        /**
         * Sends data to channel
         * @param id the id of the channel
         * @param data the data to send
         */
        send(id: string, data: any) {
            const m: DataMessage = {
                type: "data",
                data,
                id,
                fromDevice: false,
            };
            if (wsSend(m)) return;
        },

        onAlive(id: string, cb: LiveListener) {
            const channel = channels[id];
            if (channel.state === LiveState.ALIVE) {
                cb();
            }
            channel.aliveListeners.push(cb);
        },

        onDead(id: string, cb: LiveListener) {
            const channel = channels[id];
            if (channel.state === LiveState.DEAD)
                cb();
            channel.deadListeners.push(cb);
        }
    };

    /**
     * Call this when a device is known to be alive
     * @param id the device which is alive
     */
    function assertAlive(id: string) {
        debug('[Alive]', id);
        const channel = channels[id];

        //remove any pending timeout
        clearTimeout(channel.currentTimer);

        //channel just became alive
        if (channel.prevState !== LiveState.ALIVE) {
            channel.prevState = LiveState.ALIVE;
            //protect from stack explosion by running in next tick
            setTimeout(() => {
                debug('[Notifying alive]', id);
                for (const listener of channel.aliveListeners)
                    listener();
            });
        }

        channel.state = LiveState.ALIVE;

        //make sure to periodically check if channel is actually alive
        channel.currentTimer = setTimeout(function checkAlive() {
            channel.state = LiveState.UNKNOWN;

            //channel has not said anything for a long time,
            //send it a ping to see if its still alive
            pingTest(id);
        }, grage.options.aliveTimeout);
    }

    /**
     * Tests if a device is still alive by pinging it and waiting for response
     * @param id the device
     */
    function pingTest(id: string) {
        const channel = channels[id];

        debug('Pinging', id, '...');
        grage.requestPing(id);

        //if device does respond, assertAlive will get called,
        //canceling the death timer
        channel.currentTimer = setTimeout(function dead() {
            //otherwise no response, its dead.
            assertDead(id);
        }, grage.options.pingTimeout);
    }

    /**
     * Called when it is known a device is dead
     * @param id the device known to be dead
     */
    function assertDead(id: string) {
        debug('[Dead]', id);
        const channel = channels[id];

        //remove any pending timeout
        clearTimeout(channel.currentTimer);

        //channel just became dead
        if (channel.prevState !== LiveState.DEAD) {
            channel.prevState = LiveState.DEAD;
            //protect from stack explosion by running in next tick
            setTimeout(() => {
                debug('[Notifying dead]', id);
                for (const listener of channel.deadListeners)
                    listener();
            });
        }

        channel.state = LiveState.DEAD;

        //try pinging it again later
        setTimeout(() => pingTest(id), grage.options.pingRetry);
    }

    ws.onmessage = evt => {
        try {
            const m = JSON.parse(evt.data as string) as Message;
            debug('[recv]', m);
            //ignore messages from other browsers, ignore non subscribed messages
            if (isChannelMessage(m) && m.fromDevice && channels.hasOwnProperty(m.id)) { ////data || ping || rping
                //since this device just sent a message,
                //it must be alive
                assertAlive(m.id);

                const channel = channels[m.id];

                if (isDataMessage(m)) { //data 
                    //send to every listener in the proper channel
                    for (const listener of channel.dataListeners) {
                        listener(m.data);
                    }

                    //send to every once listener
                    for (const listener of channel.dataListenersOnce) {
                        listener(m.data);
                    }

                    //then clear list of once listeners
                    channel.dataListenersOnce = [];
                }
            } else if (isMetadataMessage(m)) { //metadata msg //added by John
                //connect(m.id);
                debug('no handler for metadata yet')
            }else {
                console.warn('[Unknown message type]', m);
            }
        } catch (error) {
            return handleError(error);
        }
    };

    ws.onopen = function handleOpen() {
        debug('[Websocket open]');
        //call every listener upon connect
        if (openListeners !== undefined)
            for (const handler of openListeners)
                handler();
        openListeners = undefined;
    };

    function handleError(error: Error) {
        console.error('[Websocket error]', error);
        //if debug, stop, else try reload page
        if (!grage.options.debug)
            grage.terminate(error);
        else {
            console.log('[Debug mode] frozen');
            debugger;
        }
    }

    ws.onerror = (ev) => {

        handleError(ev as any as Error);
    };

    ws.onclose = grage.terminate;

    return grage;
}
