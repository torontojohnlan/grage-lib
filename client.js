"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeClient = exports.showDebugMsg = void 0;
const lib_js_1 = require("./lib.js");
const websocket_1 = require("websocket");
// const { w3cwebsocket } = pkg;
function isRequestPing(m) {
    return m.type === 'rping';
}
function isPingMessage(m) {
    return m.type === 'ping';
}
function isChannelMessage(m) {
    return isDataMessage(m) || isRequestPing(m) || isPingMessage(m);
}
function isDataMessage(m) {
    return m.type === 'data';
}
var LiveState;
(function (LiveState) {
    LiveState[LiveState["ALIVE"] = 0] = "ALIVE";
    LiveState[LiveState["DEAD"] = 1] = "DEAD";
    LiveState[LiveState["UNKNOWN"] = 2] = "UNKNOWN";
})(LiveState || (LiveState = {}));
/* console.logs the parameters if debug mode is on
 * @param args the parameters to console.log
*/
function showDebugMsg(...args) {
    if ((process.env.DEBUG === 'true'))
        console.log(...args);
}
exports.showDebugMsg = showDebugMsg;
;
function makeClient(host, onTerminate) {
    let protocol = 'wss';
    if (globalThis.location) {
        if (location.protocol !== 'https:')
            protocol = 'ws';
        host !== null && host !== void 0 ? host : (host = `${location.hostname}:${location.port}`);
    }
    showDebugMsg(`${protocol}://${host}/ws`);
    console.log(websocket_1.w3cwebsocket);
    const ws = new websocket_1.w3cwebsocket(`${protocol}://${host}/ws`);
    //list of listeners for when the websocket connects
    let openListeners = [];
    const channels = {};
    /**
     * Sends a message on the websocket, returns any error which occurs
     * @param m the message to send
     */
    function wsSend(m) {
        try {
            showDebugMsg('[Send]', m);
            ws.send(JSON.stringify(m));
            return false;
        }
        catch (error) {
            handleError(error);
            return error;
        }
    }
    const grage = {
        options: {
            /**
             * how long to wait before reloading the page
             * this prevents exploding if errors occur at page load time
             */
            reloadTime: 5 * 1000,
            /**
             * how long to wait before actively checking if a device is alive //JohnLan. To be exact, this is to check if a channel, rather than a device, is alive
             * This value cannot be too large as if checkAlive(which calls ping in turn) is called in frequent enough interval
             * websocket will be dropped
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
             * how long the door has been consecutively open before an alert is sent
             */
            maxOpenTimeAllowed: 30 * 60 * 1000,
            alertEmailInterval: 60 * 60 * 1000, // 1 hour
        },
        /**
         * Registers a listener which is called upon connection to server
         * @param cb the listener
         */
        onOpen(cb) {
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
        getData(defaultValue) {
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
        saveData(data) {
            window.localStorage.setItem(grage.getAppID(), JSON.stringify(data));
        },
        /**
         * Terminates the connection and reloads the app.
         */
        terminate(reason = undefined) {
            //close ws if not already
            console.log("grage channel closing handler");
            if (ws.readyState === websocket_1.w3cwebsocket.OPEN || ws.readyState === websocket_1.w3cwebsocket.CONNECTING) {
                console.log("closing websocket");
                ws.close();
            }
            // User error handler
            if (onTerminate) {
                return onTerminate(reason);
            }
            if (globalThis.location) {
                //reload page in 5 seconds
                setTimeout(() => window.location.reload(), grage.options.reloadTime);
            }
            else {
                console.log('terminated process');
                globalThis.process.exit(-1);
            }
        },
        /**
         * Request a device to ping
         * @param id the device to request ping from
         */
        requestPing(id) {
            //send ping
            const m = {
                type: "rping",
                id,
                fromDevice: false
            };
            if (wsSend(m))
                return;
        },
        /**
         * Connects to a channel and listens to any messages on channel
         * @param id the id of the channel
         * @param cb the listener for messages
         */
        connect(id, cb) {
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
                const m = {
                    type: "connect",
                    id,
                };
                if (wsSend(m))
                    return;
            }
            channels[id].dataListeners.push(cb);
            //request new data
            //grage.requestPing(id); //sunny's original line. Replace it with Pingtest()
            // because even with the initial connect(), assertDead should be called when no response.
            pingTest(id);
            // only when a device is asserted dead, grage will keep trying to connect. With original "requestPing" call, this re-attempt doesn't happen
        },
        /**
         * Listens to a single message from a channel
         * @param id the channel to listen to
         * @param cb the listener
         */
        once(id, cb) {
            channels[id].dataListenersOnce.push(cb);
        },
        /**
         * Sends data to channel
         * @param id the id of the channel
         * @param data the data to send
         */
        send(id, data) {
            const m = {
                type: "data",
                data,
                id,
                fromDevice: false,
            };
            if (wsSend(m))
                return;
        },
        onAlive(id, cb) {
            const channel = channels[id];
            if (channel.state === LiveState.ALIVE) {
                cb();
            }
            channel.aliveListeners.push(cb);
        },
        onDead(id, cb) {
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
    function assertAlive(id) {
        showDebugMsg('[Alive]', id);
        const channel = channels[id];
        //remove any pending timeout
        clearTimeout(channel.currentTimer);
        //channel just became alive
        if (channel.prevState !== LiveState.ALIVE) {
            channel.prevState = LiveState.ALIVE;
            //protect from stack explosion by running in next tick
            setTimeout(() => {
                showDebugMsg('[Notifying alive]', id);
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
    function pingTest(id) {
        const channel = channels[id];
        showDebugMsg('Pinging', id, '...');
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
    function assertDead(id) {
        showDebugMsg('[Dead]', id);
        const channel = channels[id];
        //remove any pending timeout
        clearTimeout(channel.currentTimer);
        //channel just became dead
        if (channel.prevState !== LiveState.DEAD) {
            channel.prevState = LiveState.DEAD;
            //protect from stack explosion by running in next tick
            setTimeout(() => {
                showDebugMsg('[Notifying dead]', id);
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
            const m = JSON.parse(evt.data);
            showDebugMsg('[recv]', m);
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
            }
            else if ((0, lib_js_1.isMetadataMessage)(m)) { //metadata msg //added by John
                //connect(m.id);
                showDebugMsg('no handler for metadata yet');
            }
            else {
                console.warn('[Unknown message type or msg not from device-type]', m);
            }
        }
        catch (error) {
            return handleError(error);
        }
    };
    ws.onopen = function handleOpen() {
        showDebugMsg('[Websocket open]');
        //call every listener upon connect
        if (openListeners !== undefined)
            for (const handler of openListeners)
                handler();
        openListeners = undefined;
    };
    function handleError(error) {
        console.error('[Websocket error]', error);
        //if debug, stop, else try reload page
        if (!(process.env.DEBUG === 'true'))
            grage.terminate(error);
        else {
            console.log('[Debug mode] frozen');
            debugger;
        }
    }
    ws.onerror = (ev) => {
        handleError(ev);
    };
    ws.onclose = grage.terminate;
    return grage;
}
exports.makeClient = makeClient;
//# sourceMappingURL=client.js.map