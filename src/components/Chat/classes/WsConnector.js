// process.env.PORT
// process.env.PROD_SERVER
// process.env.PROD_PROTOCOL

const wsPort = process.env.PORT || 6868;
const serverUrl = process.env.PROD_SERVER || '://adv-browser-js-hw-8-backend.onrender.com';

export default class WsConnector {
    constructor(url=`ws${serverUrl}`) {
        this.url = `${url}:${wsPort}`;
        this.server = new WebSocket(this.url);
    }
}