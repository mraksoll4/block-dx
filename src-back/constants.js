const scalarisDir4 = {
  win32: 'Scalaris',
  darwin: 'Scalaris',
  linux: 'scalaris'
};

const scalarisDir3 = {
  win32: 'ScalarisDX',
  darwin: 'ScalarisDX',
  linux: 'scalarisdx'
};

const X_BRIDGE_CONF_NAME = 'xbridge.conf';
const SCALARIS_CONF_NAME4 = 'scalaris.conf';
const SCALARIS_CONF_NAME3 = 'scalarisdx.conf';

const ipcMainListeners = {
  GET_HIDE_REFUND_NOTIFICATION: 'GET_HIDE_REFUND_NOTIFICATION',
  OPEN_REFUND_NOTIFICATION: 'OPEN_REFUND_NOTIFICATION',
  GET_MESSAGE_BOX_TITLE: 'GET_MESSAGE_BOX_TITLE',
  GET_MESSAGE_BOX_MESSAGE: 'GET_MESSAGE_BOX_MESSAGE',
  SET_MESSAGE_BOX_NOT_SHOW_AGAIN: 'SET_MESSAGE_BOX_NOT_SHOW_AGAIN',
  CLOSE_MESSAGE_BOX: 'CLOSE_MESSAGE_BOX'
};

const pricingSources = {
  CLOUD_CHAINS: 'CLOUD_CHAINS',
  CRYPTO_COMPARE: 'CRYPTO_COMPARE',
  COIN_MARKET_CAP: 'COIN_MARKET_CAP',
};

module.exports = {
  scalarisDir4,
  scalarisDir3,
  X_BRIDGE_CONF_NAME,
  SCALARIS_CONF_NAME4,
  SCALARIS_CONF_NAME3,
  ipcMainListeners,
  pricingSources,
};
