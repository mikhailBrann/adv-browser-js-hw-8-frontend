const wsPort = process.env.PORT ? process.env.PORT : 6868;
const serverUrl = process.env.PROD_SERVER ? process.env.PROD_SERVER : '://adv-browser-js-hw-8-backend.onrender.com';
const serverProtocol = process.env.PROD_PROTOCOL ? process.env.PROD_PROTOCOL : 'https';

export default class Request {
    constructor() {
        this.url = serverUrl;
    }

    async send(body=false, method='GET',  url='', protocol=serverProtocol) {
        const requestParams = this._paramConstructor(url, method, body, protocol);
        return await fetch(requestParams.url, requestParams.params);
    }

    _paramConstructor(uri='', method='GET', body=false, protocol=serverProtocol) {
        return {
            url: `${protocol}${this.url}:${wsPort}${uri}`,
            params: {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                method,
                body: body ? JSON.stringify(body) : null
            }
        }
    }
}