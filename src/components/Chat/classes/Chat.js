import WsConnector from "./WsConnector";
import Widget from "./Widget";
import Request from "./Request";
import authForm from "../template/authForm.html";
import chatTemplate from "../template/chatTemplate.html";
import sendMessageForm from "../template/sendMessageForm.html";

export default class Chat {
    constructor(parentNode) {
        this.parentNode = parentNode ?? document.body;
        this.nickname = false;
        this.request = new Request();
        this.formAuth = null;
        this.chatWidget = null;
        this.ws = null;

        this._initAuthForm();
    }

    _initAuthForm() {
        const formTemplate = authForm.replace('{{nickname}}', 'nickname')
            .replaceAll('{{class}}', 'form-auth');
        const formWidget = new Widget("auth-form", formTemplate, "div");
        const form = formWidget.element.querySelector('form');

        this.formAuth = formWidget;
        document.body.insertAdjacentElement('afterbegin', formWidget.element);
        form.addEventListener('submit', this.authUser.bind(this));
    }

    _initChatForm() {
        //sendMessageForm
        const chatWidget = new Widget("chat-wrapp", chatTemplate, "div");
        const sendMessageTemplate = sendMessageForm.replaceAll('{{class}}', 'send-message-form');

        this.chatWidget = chatWidget;

        this.parentNode.insertAdjacentElement('afterbegin', chatWidget.element);
        this.chatWidget.addElement(sendMessageTemplate, '.chat__sendform-wrapper');

        //addEventListener
        const chatFormElem = this.chatWidget.element.querySelector('.chat__sendform-wrapper form');

        chatFormElem.querySelector('input[name="message"]').addEventListener('keydown', this._sendMessage.bind(this));
    }

    _renderList(list, listSelector, paternCallback=null) {
        if(!list) {
            return;
        }

        const listWidget = new Widget(listSelector, null, "ul");

        list.forEach(element => {
            const isYou = this.nickname == element.nickname ? 'self' : '';
            const userItem = `<li class="${listSelector}__item ${isYou}">${paternCallback(element)}</li>`;

            listWidget.addElement(userItem);
        });

        return listWidget.element;
    }

    _renderMessageList(messageList) {
        if(!messageList) {
            return;
        }

    }

    _sendMessage(event) {
        if(event.key == 'Enter') {
            event.preventDefault();
            event.stopPropagation();

            if(event.target.value.trim() == '') {
                return;
            }

            const mess = event.target.value.trim();
            const now = new Date();
            const formattedDate = `${(now.getHours()<10?'0':'')}${now.getHours()}:${(now.getMinutes()<10?'0':'')}${now.getMinutes()} ${now.getDate()}.${now.getMonth()+1}.${now.getFullYear()}`;

            const data = {
                eventType: 'addedMessage',
                message: {
                    nickname: this.nickname,
                    mess,
                    date: `${new Date().toLocaleTimeString("ru-RU")} ${new Date().toLocaleDateString("ru-RU")}`
                }
            }

            this.ws.server.send(JSON.stringify(data));
            event.target.value = '';
        }

        return;
    }

    initChat() {
        this._initChatForm();
    }

    async authUser(event) {
        event.preventDefault();
        const nickname = event.target.querySelector('input[name="nickname"]').value;
        const request = this.request.send({nickname}, 'POST', '/auth');

        await request.then(response => response.json()).then(data => {
            if(data.status == 'true') {
                this.nickname = data.nickname;
                this.formAuth.element.remove();
                this.formAuth = null;

                //init ws connection
                this.ws = new WsConnector();
                //addEventListener ws
                this.ws.server.addEventListener('open', this.onOpen.bind(this));
                this.ws.server.addEventListener('message', this.onMessage.bind(this));
                window.addEventListener('beforeunload', this.onClose.bind(this));
            }

            if(data.status == 'false') {
                const errorMess = data.message;
                const errorField = this.formAuth.element.querySelector('.form__error');
                this.sendErrorForm(errorMess, this.formAuth.element);
            }

            return;
        });
    }

    sendErrorForm(errorMess, form) {
        const inputError = form.querySelector('.form__error');
        const submitBtn = form.querySelector('[type=submit]');

        if(!inputError && !submitBtn) {
            return;
        }

        inputError.classList.add('error');
        inputError.insertAdjacentHTML('beforeend', `<p class="error-message">${errorMess}</p>`);
        submitBtn.disabled = true;

        setTimeout(() => {
            inputError.classList.remove('error');
            inputError.querySelector('.error-message').remove();
            submitBtn.disabled = false;
        }, 3000);
    }

    onOpen(event) {
        console.log('open', event.type);
        this.initChat();
        //this.ws.server.send('Hello Server!');
    }

    onMessage(event) {
        const data = JSON.parse(event.data);

        //update user list
        const userListParent = this.chatWidget.element.querySelector('.chat__list');
        userListParent.innerHTML = '';
        userListParent.insertAdjacentElement(
            "beforeend", 
            this._renderList(
                data.users, 
                'user-list',
                (elem => this.nickname == elem.nickname ? 'You': elem.nickname)
            )
        );

        //update message list
        const messageListParent = this.chatWidget.element.querySelector('.chat__monitor');
        messageListParent.innerHTML = '';
        messageListParent.insertAdjacentElement(
            "beforeend", 
            this._renderList(
                data.messages, 
                'messages-list',
                (elem) => {
                    const nick = this.nickname == elem.nickname ? 'You': elem.nickname;
                    return `<span class="date">${nick}, ${elem.date}</span><span class="mess-text">${elem.mess}</span>`
                }
            )
        );

        //скролим в конец чата при его ренедере
        const messageList = messageListParent.querySelector(".messages-list");
        messageList.scrollTop = messageList.scrollHeight;
    }
    
    onClose(event) {
        if (this.ws.server.readyState === WebSocket.OPEN) {
            this.ws.server.send(JSON.stringify({
                eventType: 'userLeave',
                nickname: this.nickname
            }));
            this.ws.server.close(1000, 'Браузер закрывается');
        }

        this.initChat();
    }
}