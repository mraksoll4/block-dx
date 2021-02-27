const path = require('path');
const fs = require('fs-extra-promise');
const electron = require('electron');
const { scalarisDir3, scalarisDir4, SCALARIS_CONF_NAME3, SCALARIS_CONF_NAME4, X_BRIDGE_CONF_NAME } = require('./constants');

const { platform } = process;

const clearScalarisdxData = async function(storage) {
  const storageKeysToClear = [
    'addresses',
    'port',
    'scalarisIP',
    'tokenPaths',
    'user',
    'password',
    'selectedWallets',
    'keyPair',
    'xbridgeConfPath'
  ];
  storage.removeItems(storageKeysToClear, true);
};

module.exports.checkAndCopyV3Configs = async function(basePath, app, Localize, storage) {
  const v3DirPath = path.join(basePath, scalarisDir3[platform]);
  const v3XbridgeConfPath = path.join(v3DirPath, X_BRIDGE_CONF_NAME);
  const v3ScalarisConfPath = path.join(v3DirPath, SCALARIS_CONF_NAME3);
  const v4DirPath = path.join(basePath, scalarisDir4[platform]);
  const v4XbridgeConfPath = path.join(v4DirPath, X_BRIDGE_CONF_NAME);
  const v4ScalarisConfPath = path.join(v4DirPath, SCALARIS_CONF_NAME4);
  const v3DirExists = await fs.existsAsync(v3DirPath);
  const v4DirExists = await fs.existsAsync(v4DirPath);
  if(v3DirExists && v4DirExists) {
    const v3XbridgeConfExists = await fs.existsAsync(v3XbridgeConfPath);
    const v3ScalarisConfExists = await fs.existsAsync(v3ScalarisConfPath);
    if(v3XbridgeConfExists && v3ScalarisConfExists) {
      await fs.copyAsync(v3XbridgeConfPath, v4XbridgeConfPath);
      await fs.copyAsync(v3ScalarisConfPath, v4ScalarisConfPath);
      storage.removeItem('addresses', true);
      storage.setItem('xbridgeConfPath', v4XbridgeConfPath, true);
      await electron.dialog.showMessageBox({
        type: 'info',
        title: Localize.text('Scalaris Configs Updated', 'universal'),
        message: Localize.text('The configuration files for your new Scalaris wallet have been updated. In order for Scalaris DX to connect to the RPC server, you will need to restart your Scalaris wallet and then re-open Scalaris DX.', 'universal'),
        buttons: [
          Localize.text('OK', 'universal')
        ]
      });
      app.quit();
    } else {
      clearScalarisdxData(storage);
    }
  } else {
    clearScalarisdxData(storage);
  }
};
