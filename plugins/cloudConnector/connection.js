const _ = require('lodash');
const log = require('../../core/log.js');
const util = require('../../core/util.js');
const moment = require('moment');
const { client, xml, jid } = require('@xmpp/client');
const config = util.getConfig();
var lastRemoteCandle = { start: moment(0) };
var onRemoteCandle;
var onRemoteAdvice;
var onRemoteOrderbook;

const xmpp = client({
  service: 'xmpp://www.think5.de:5230',
  domain: 'www.think5.de',
  resource: 'greengekko',
  gglogin: {
    username: config.cloudConnector.user,
    password: config.cloudConnector.pass
  },
  guestLogin: config.cloudConnector.guestLogin,
  authenticated: false
})

const Conn = function() {
  xmpp.reconnect.delay = 5000;
  xmpp
  .start()
  .catch(err => log.error('⚠ Connection failed: ' + err.message));
};


xmpp.on('error', err => {
  log.error('⚠ ' + err.toString());
})


xmpp.on('offline', () => {
  xmpp.options.authenticated = false;
  log.info('⏹ Cloud Connector: offline');
})


xmpp.on('online', () => {
  log.info('☁ Gekko Cloud server connected.');
})


xmpp.on('disconnect', () => {
  log.info('☁ Gekko Cloud server disconnected.');
})


xmpp.on('stanza', async stanza => {
  // *******************************
  // *** request server login
  if (stanza.is('iq') && stanza.children[0] !== undefined && stanza.children[0].name == 'bind' && stanza.attrs.type == 'result') {
    this.myJID = stanza.children[0].children[0].children[0];
    const auth = xml(
      'iq', {type: 'get', id: 'auth1'}, 
        xml('query', {xmlns: 'jabber:iq:auth'},
          xml('username', {}, this.myJID.split('@')[0]))
    );
    await xmpp.send(auth);
  }


  // *******************************
  // *** perform server login
  if (stanza.is('iq') && stanza.children[0] !== undefined && stanza.children[0].attrs != undefined && stanza.children[0].attrs.xmlns != undefined && stanza.attrs.type !== 'error' && stanza.children[0].attrs.xmlns != undefined && stanza.children[0].attrs.xmlns == 'jabber:iq:auth') {
    //login plain
    const setauth = xml(
      'iq', {type: 'set', id: 'auth1'},
        xml('query', {xmlns: 'jabber:iq:auth'}, [ 
          xml('username', {}, this.myJID.split('@')[0]), 
          xml('password', {}, xmpp.options.gglogin.password),
          xml('resource', {}, '' + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6))
        ])
    );
   
    await xmpp.send(setauth);
    return;
  }


  // *******************************
  // *** auth error
  if (stanza.is('iq') && stanza.children[1] !== undefined && stanza.children[1].attrs.code == '401' && stanza.attrs.type == 'error' && stanza.attrs.id == 'auth1') {
    console.log('');
    log.info('☁ Authentication error: check username/password');
    xmpp.options.authenticated = false;
    return;
  }


  // *******************************
  // *** continue after login
  if (stanza.is('iq') && stanza.children[0] == undefined && stanza.attrs.type == 'result' && stanza.attrs.id != 'set1') {
    console.log('');
    log.info('☁ Authenticated: ' + this.myJID.split('@')[0]);
    //xmpp.emit('online', this.myJID);
    //return;
    xmpp.options.authenticated = true;
    xmpp.emit('authenticated', this.myJID);
    return;
  }


  // *******************************
  // *** receive channel messages
  if (stanza.is('message') && stanza.attrs.type == 'groupchat' && stanza.children[0] !== undefined) {
    let msg = stanza.children[0].children[0]
    xmpp.emit('mucmessage', msg, stanza.attrs.from, stanza.attrs.to);
  }
})


xmpp.on('online', async jid => {
  //indicate own availability
  await xmpp.send(xml('presence'))

  const roster = xml(
    'iq', {type: 'get', id: 'roster1', from: jid}, 
      xml('query', {xmlns: 'jabber:iq:roster'})
  );
  await xmpp.send(roster);
})

xmpp.on('authenticated', async jid => {
  var arrChannels = _.union(config.cloudConnector.channels, [].push(config.cloudConnector.publishChannel));
  // *** enter muc channels now
  arrChannels.forEach(async channel => {
    let mucp = xml(
      'presence', {from: jid, to: channel+'@www.think5.de/' + jid.split('@')[0], id: 'muc1'},
        xml('x', {xmlns: 'http://jabber.org/protocol/muc'})
    );
  
    await xmpp.send(mucp);
  });
})

xmpp.on('mucmessage', (strMsg, from, to) => {
  //do not forward my own msgs (avoid loops)
  if (this.myJID.split('@')[0] === from.split('/')[1]) return;
  
  try {
    var msg = JSON.parse(strMsg);
  }
  catch(err) {
    let strWelcome = strMsg.split('/welcome ')[1];
    if (strWelcome !== undefined ) log.info('☁ Channel connected:', strWelcome);
    return;
  };

  if (onRemoteCandle !== undefined && msg.remote !== undefined && msg.remote === 'candle') {
    msg.candle.start = moment(Number(msg.candle.start) * 1000);
    if (lastRemoteCandle[msg.exchange+msg.pair] == undefined) lastRemoteCandle[msg.exchange+msg.pair] = { start: moment(0) };
    if (msg.candle.start.valueOf() > lastRemoteCandle[msg.exchange+msg.pair].start.valueOf()) {
      log.debug('\n⮈ ☁ ' + strMsg);
      onRemoteCandle(msg);
      lastRemoteCandle[msg.exchange+msg.pair] = _.clone(msg.candle);
    }
  }
  if (onRemoteAdvice !== undefined && msg.remote !== undefined && msg.remote === 'advice') {
    msg.advice.start = moment(Number(msg.advice.start) * 1000);
    log.debug('\n⮈ ☁ ' + strMsg);
    onRemoteAdvice(msg);
  }
  if (onRemoteOrderbook !== undefined && msg.remote !== undefined && msg.remote === 'orderbook') {
    msg.orderbook.start = moment(Number(msg.orderbook.start) * 1000);
    log.debug('\n⮈ ☁ ' + strMsg.substr(0,90) + '...');
    onRemoteOrderbook(msg);
  }
})

xmpp.on('status', async status => {
  //if (config.cloudConnector.debugXMPP) log.debug('🛈 status ' + status)

  if (status == 'open') {
    console.log('');
    log.info('☁ Server connected');

    if (xmpp.options.guestLogin) {
      // *******************************
      // *** iq bind, to receive guest id
      xmpp.options.gglogin.password = 'guest';
      const bind = xml(
        'iq', {type: 'set', id: 'auth1'},
          xml('bind', {xmlns: 'urn:ietf:params:xml:ns:xmpp-bind'})
      );
      await xmpp.send(bind);
      return;
    } else {
      this.myJID = xmpp.options.gglogin.username + '@' + xmpp.options.gglogin.domain
      const auth = xml(
        'iq', {type: 'get', id: 'auth1'}, 
          xml('query', {xmlns: 'jabber:iq:auth'},
            xml('username', {}, this.myJID.split('@')[0]))
      );
      await xmpp.send(auth);
    }
  }
})
xmpp.on('input', input => {
  if (input === ' 	 ') {
    log.debug('☁ heartbeat: connection alive');
  } else if (config.cloudConnector.debugXMPP) {
    log.debug('\n⮈ ' + input);
  }
})
xmpp.on('output', output => {
  if (config.cloudConnector.debugXMPP) log.debug('\n⮊ ' + output)
})



// *********************************************************
// *** Exposed module functionality
Conn.prototype.sendChannelMsg = async function(msg, channel) {
  if (!xmpp.options.authenticated) return;

  const message = xml(
    'message',
    {type: 'groupchat', from: this.myJID, to: channel},
    xml('body', {}, msg)
  )
  await xmpp.send(message);
}


Conn.prototype.publishCandle = async function(candle) {
  if (!config.cloudConnector.publishMySignals) return;

  let msg = 
      `{ ` +
       `"remote": "candle", ` +
       `"pair": "${config.watch.asset.toLowerCase()}${config.watch.currency.toLowerCase()}", ` +
       `"exchange": "${config.watch.exchange.toLowerCase()}", ` +
       `"time": "${candle.start.utc().format()}", ` +
       `"candle": {` + 
          `"start": ${candle.start.unix()}, ` + 
          `"open": ${candle.open}, ` + 
          `"high": ${candle.high}, ` + 
          `"low": ${candle.low}, ` + 
          `"close": ${candle.close}, ` + 
          `"vwp": ${candle.vwp}, ` + 
          `"volume": ${candle.volume}, ` + 
          `"trades": ${candle.trades}` +
        `}` +
     `}`

    log.debug('\n⮊ candle',config.cloudConnector.publishChannel,' ☁ ' + msg);
    this.sendChannelMsg(msg, config.cloudConnector.publishChannel + '@www.think5.de');
}


Conn.prototype.publishAdvice = async function(advice) {
  if (!config.cloudConnector.publishMySignals) return;
  
  let msg =
  `{ ` +
       `"remote": "advice", ` +
       `"pair": "${config.watch.asset.toLowerCase()}${config.watch.currency.toLowerCase()}", ` +
       `"exchange": "${config.watch.exchange.toLowerCase()}", ` +
       `"strategy": "${config.tradingAdvisor.method}", ` +
       `"time": "${moment().utc().format()}", ` +
       `"advice": ${JSON.stringify(advice)}` +
   `}`

  log.debug('\n⮊ ☁ ' + msg);
  this.sendChannelMsg(msg, config.cloudConnector.publishChannel + '@www.think5.de');
}


Conn.prototype.publishOrderbook = async function(ob) {
  if (!config.cloudConnector.publishOrderbook) return;
  
  let msg =
  `{ ` +
       `"remote": "orderbook", ` +
       `"pair": "${config.watch.asset.toLowerCase()}${config.watch.currency.toLowerCase()}", ` +
       `"exchange": "${config.watch.exchange.toLowerCase()}", ` +
       `"time": "${moment().utc().format()}", ` +
       `"orderbook": ${JSON.stringify(ob)}` +
   `}`

   log.debug('\n⮊ ☁ { "remote": "orderbook" ...}');
  this.sendChannelMsg(msg, config.cloudConnector.publishChannel + '@www.think5.de');
}


Conn.prototype.registerListener = function(candle, advice, orderbook) {
  onRemoteCandle = candle;
  onRemoteAdvice = advice;
  onRemoteOrderbook = orderbook;
}


Conn.prototype.exit = async function() {
  await xmpp.send(xml('presence', {type: 'unavailable'}))
  await xmpp.stop();
}

module.exports = Conn;
