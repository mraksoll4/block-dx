const electron = require('electron');
const fs = require('fs-extra-promise');
const isDev = require('electron-is-dev');
const moment = require('moment');
const path = require('path');
const SimpleStorage = require('./src-back/storage');
const ServiceNodeInterface = require('./src-back/service-node-interface');
const serve = require('electron-serve');

// General Error Handler
const handleError = err => {
  console.error(err);
};

// Handle any uncaught exceptions
process.on('uncaughtException', err => {
  handleError(err);
});

let loadURL;
if(!isDev) {
  loadURL = serve({directory: 'dist'});
}

const { app, BrowserWindow, Menu, ipcMain } = electron;

require('electron-context-menu')();

// Only allow one application instance to be open at a time
const isSecondInstance = app.makeSingleInstance(() => {});
if(isSecondInstance) app.quit();

let appWindow, serverLocation, sn, keyPair, storage, user, password, port;

const openSettingsWindow = (options = {}) => {

  let errorMessage;

  if(options.error) {
    const { error } = options;
    console.log(error);
    switch(error.status) {
      case 401:
        errorMessage = 'There was an authorization problem. Please correct your username and/or password.';
        break;
      default:
        errorMessage = 'There was a problem connecting to the RPC server. Please check the RPC port.';
    }
    console.log(errorMessage);
  }

  ipcMain.on('getPort', e => {
    e.returnValue = storage.getItem('port') || '';
  });
  ipcMain.on('getUser', e => {
    e.returnValue = storage.getItem('user') || '';
  });
  ipcMain.on('saveData', (e, items) => {
    try {
      for(const key of Object.keys(items)) {
        const value = items[key];
        if(key === 'password' && !value && storage.getItem('password')) continue;
        storage.setItem(key, value, true);
      }
      e.sender.send('dataSaved');
    } catch(err) {
      handleError(err);
    }
  });
  ipcMain.on('restart', () => {
    app.relaunch();
    app.quit();
  });

  const settingsWindow = new BrowserWindow({
    show: false,
    width: 500,
    height: 346,
    parent: appWindow
  });
  if(isDev) {
    settingsWindow.loadURL(`file://${path.join(__dirname, 'src', 'settings.html')}`);
  } else {
    settingsWindow.loadURL(`file://${path.join(__dirname, 'dist', 'settings.html')}`);
  }
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    if(errorMessage) {
      settingsWindow.send('errorMessage', errorMessage);
    }
  });

  if(isDev) {
    const menuTemplate = [];
    menuTemplate.push({
      label: 'Window',
      submenu: [
        { label: 'Show Dev Tools', role: 'toggledevtools' }
      ]
    });
    const windowMenu = Menu.buildFromTemplate(menuTemplate);
    settingsWindow.setMenu(windowMenu);
  }

};

const openAppWindow = () => {

  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  appWindow = new BrowserWindow({
    show: false,
    width: width - 100,
    height: height - 100
  });

  appWindow.maximize();

  if(isDev) {
    appWindow.loadURL(serverLocation);
  } else {
    loadURL(appWindow);
  }

  appWindow.once('ready-to-show', () => {
    appWindow.show();
  });

  const menuTemplate = [];

  // File Menu
  menuTemplate.push({
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  });

  // Edit Menu
  menuTemplate.push({
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' }
    ]
  });

  // Window Menu
  if(isDev) {
    menuTemplate.push({
      label: 'Window',
      submenu: [
        { label: 'Show Dev Tools', role: 'toggledevtools' }
      ]
    });
  }

  const appMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(appMenu);

  const sendKeyPair = () => {
    appWindow.send('keyPair', keyPair);
  };
  ipcMain.on('getKeyPair', sendKeyPair);

  let orderBook = {
    maker: '',
    taker: '',
    bids: [],
    asks: []
  };
  const sendOrderBook = force => {
    sn.dxGetOrderBook3(keyPair[0], keyPair[1])
      .then(res => {
        if(force === true || JSON.stringify(res) !== JSON.stringify(orderBook)) {
          orderBook = res;
          appWindow.send('orderBook', orderBook);
        }
      })
      .catch(handleError);
  };
  ipcMain.on('getOrderBook', () => sendOrderBook(true));
  setInterval(sendOrderBook, 4000);

  let tradeHistory = [];
  const sendTradeHistory = force => {
    sn.dxGetOrderFills(keyPair[0], keyPair[1])
      .then(res => {
        if(force === true || JSON.stringify(res) !== JSON.stringify(tradeHistory)) {
          tradeHistory = res;
          appWindow.send('tradeHistory', tradeHistory, keyPair);
        }
      })
      .catch(handleError);
  };
  ipcMain.on('sendTradeHistory', () => sendTradeHistory(true));
  setInterval(sendTradeHistory, 4000);

  const sendLocalTokens = () => {
    sn.dxGetLocalTokens()
      .then(res => appWindow.send('localTokens', res))
      .catch(handleError);
  };
  ipcMain.on('getLocalTokens', sendLocalTokens);

  const sendNetworkTokens = () => {
    sn.dxGetNetworkTokens()
      .then(res => appWindow.send('networkTokens', res))
      .catch(handleError);
  };
  ipcMain.on('getNetworkTokens', sendNetworkTokens);

  let myOrders = [];
  const sendMyOrders = force => {
    sn.dxGetMyOrders()
      .then(res => {
        if(force === true || JSON.stringify(res) !== JSON.stringify(myOrders)) {
          myOrders = res;
          appWindow.send('myOrders', myOrders, keyPair);
        }
      })
      .catch(handleError);
  };
  ipcMain.on('getMyOrders', () => sendMyOrders(true));
  setInterval(sendMyOrders, 4000);

  let orderHistory = [];
  const sendOrderHistory = force => {
    const end = new Date().getTime();
    const start = moment(new Date(end))
      .subtract(1, 'd')
      .toDate()
      .getTime();
    sn.dxGetOrderHistory(keyPair[0], keyPair[1], start, end, 60)
      .then(res => {
        if(force === true || JSON.stringify(res) !== JSON.stringify(orderHistory)) {
          orderHistory = res;
          appWindow.send('orderHistory', orderHistory);
        }
      })
      .catch(handleError);
  };
  ipcMain.on('getOrderHistory', () => sendOrderHistory(true));

  let currentPrice = {};
  const sendCurrentPrice = force => {
    const end = new Date().getTime();
    const start = moment(new Date(end))
      .subtract(1, 'd')
      .toDate()
      .getTime();
    sn.dxGetOrderHistory(keyPair[0], keyPair[1], start, end, 86400)
      .then(res => {
        const [ data ] = res;
        if(force === true || JSON.stringify(data) !== JSON.stringify(currentPrice)) {
          currentPrice = data;
          appWindow.send('currentPrice', data);
        }
      })
      .catch(handleError);
  };
  ipcMain.on('getCurrentPrice', () => sendCurrentPrice(true));

  const sendCurrencies = async function() {
    try {
      const [ localTokens, networkTokens ] = await Promise.all([
        sn.dxGetLocalTokens(),
        sn.dxGetNetworkTokens()
      ]);
      const localTokensSet = new Set(localTokens);
      const comparator = networkTokens.includes('BTC') ? 'BTC' : networkTokens.includes('LTC') ? 'LTC' : networkTokens[0];
      const currencies = [];
      const end = new Date().getTime();
      const start = moment(new Date(end))
        .subtract(1, 'd')
        .toDate()
        .getTime();

      for(const token of networkTokens) {
        const second = token === comparator ? networkTokens.find(t => t !== comparator) : comparator;
        const res = await sn.dxGetOrderHistory(token, second, start, end, 86400);
        if(res.length === 0) {
          currencies.push({
            symbol: token,
            name: token,
            last: 0,
            volume: 0,
            change: 0,
            local: localTokensSet.has(token)
          });
        } else {
          const obj = res[0];
          currencies.push(Object.assign({}, obj, {
            symbol: token,
            name: token,
            last: obj.close,
            change: (obj.close / obj.open) - 1,
            local: localTokensSet.has(token)
          }));
        }
      }
      appWindow.send('currencies', currencies);
    } catch(err) {
      handleError(err);
    }
  };
  ipcMain.on('getCurrencies', sendCurrencies);

  const sendCurrencyComparisons = async function(primary) {
    try {
      const [ localTokens, networkTokens ] = await Promise.all([
        sn.dxGetLocalTokens(),
        sn.dxGetNetworkTokens()
      ]);
      const localTokensSet = new Set(localTokens);
      const currencies = [];
      const end = new Date().getTime();
      const start = moment(new Date(end))
        .subtract(1, 'd')
        .toDate()
        .getTime();

      for(const second of networkTokens) {
        if(second === primary) continue;
        const res = await sn.dxGetOrderHistory(primary, second, start, end, 86400);
        if(res.length === 0) {
          currencies.push({
            symbol: second,
            name: second,
            last: 0,
            volume: 0,
            change: 0,
            local: localTokensSet.has(primary) && localTokensSet.has(second)
          });
        } else {
          const obj = res[0];
          currencies.push(Object.assign({}, obj, {
            symbol: second,
            name: second,
            last: obj.close,
            change: (obj.close / obj.open) - 1,
            local: localTokensSet.has(primary) && localTokensSet.has(second)
          }));
        }
      }
      appWindow.send('currencyComparisons', currencies);
    } catch(err) {
      handleError(err);
    }
  };
  ipcMain.on('getCurrencyComparisons', (e, primary) => sendCurrencyComparisons(primary));

  ipcMain.on('cancelOrder', (e, id) => {
    sn.dxCancelOrder(id)
      .then(res => {
        appWindow.send('orderCancelled', res.id);
        setTimeout(() => {
          sendMyOrders(true);
        }, 1000);
      })
      .catch(handleError);
  });

  ipcMain.on('setKeyPair', (e, pair) => {
    keyPair = pair;
    sendKeyPair();
    sendOrderBook();
    sendTradeHistory();
    sendMyOrders();
    sendOrderHistory();
    sendCurrentPrice();
  });

  ipcMain.on('openSettings', () => {
    openSettingsWindow();
  });

};

const openTOSWindow = () => {

  ipcMain.on('getTOS', e => {
    try {
      const text = fs.readFileSync(path.join(__dirname, 'tos.txt'), 'utf8');
      e.returnValue = text;
    } catch(err) {
      console.error(err);
    }
  });
  ipcMain.on('cancelTOS', () => {
    app.quit();
  });
  ipcMain.on('acceptTOS', () => {
    storage.setItem('tos', true, true);
    app.relaunch();
    app.quit();
  });

  const tosWindow = new BrowserWindow({
    show: false,
    width: 500,
    height: 600,
    parent: appWindow
  });
  if(isDev) {
    tosWindow.loadURL(`file://${path.join(__dirname, 'src', 'tos.html')}`);
  } else {
    tosWindow.loadURL(`file://${path.join(__dirname, 'dist', 'tos.html')}`);
  }
  tosWindow.once('ready-to-show', () => {
    tosWindow.show();
  });

  if(isDev) {
    const menuTemplate = [];
    menuTemplate.push({
      label: 'Window',
      submenu: [
        { label: 'Show Dev Tools', role: 'toggledevtools' }
      ]
    });
    const windowMenu = Menu.buildFromTemplate(menuTemplate);
    tosWindow.setMenu(windowMenu);
  }
};

const onReady = new Promise(resolve => app.on('ready', resolve));

// Run the application within async function for flow control
(async function() {
  try {
    const { name } = fs.readJSONSync(path.join(__dirname, 'package.json'));
    let dataPath;
    if(process.platform === 'win32') {
      dataPath = path.join(process.env.LOCALAPPDATA, name);
      fs.ensureDirSync(dataPath);
    } else {
      dataPath = app.getPath('userData');
    }

    storage = new SimpleStorage(path.join(dataPath, 'meta.json'));
    user = storage.getItem('user');
    password = storage.getItem('password');
    port = storage.getItem('port');

    if(!storage.getItem('tos')) {
      await onReady;
      openTOSWindow();
      return;
    }

    if(!port) {
      port = '41414';
      storage.setItem('port', port);
    }

    if(!user || !password) {
      await onReady;
      openSettingsWindow();
      return;
    }

    sn = new ServiceNodeInterface(user, password, `http://localhost:${port}`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      await sn.getinfo();
    } catch(err) {
      // console.error(err);
      await onReady;
      openSettingsWindow({ error: err });
      return;
    }

    keyPair = storage.getItem('keyPair');
    if(!keyPair) {

      const tokens = await sn.dxGetLocalTokens();

      if(tokens.length < 2) {
        const dif = 2 - tokens.length;
        const networkTokens = await sn.dxGetNetworkTokens();
        for(let i = 0; i < dif; i++) {
          const newToken = networkTokens.find(t => !tokens.includes(t));
          tokens.push(newToken);
        }
      }
      keyPair = tokens.slice(0, 2);
      storage.setItem('keyPair', keyPair);
    }

    const localhost = 'localhost';

    // In development use the live ng server. In production serve the built files
    if(isDev) {
      serverLocation =  `http://${localhost}:4200`;
    }

    await onReady;

    openAppWindow();

  } catch(err) {
    handleError(err);
  }

})();

// Properly close the application
app.on('window-all-closed', () => {
  app.quit();
});