const { dropdown } = require('./shared');

const showWalletOption = ({ state, Localize }) => {
  const showWallet = state.get('showWallet');
  return `
    <div class="option-container">
      <p class="option-title">${Localize.text('Wallet Balance', 'generalSettingsWindow')}</p>
      <p class="option-description">${Localize.text('The "Wallet" balance is the <em>total</em> balance of your Scalaris wallet. This is useful when using a separate Scalaris wallet for trading and want to see the balance of your main Scalaris wallet, which is where fees are paid from.', 'generalSettingsWindow')}</p>
      ${dropdown({ id: 'js-showWalletDropdown', label: Localize.text('Show "Wallet" in Balances?', 'generalSettingsWindow'), value: showWallet ? Localize.text('Yes', 'universal') : Localize.text('No', 'universal') })}
    </div>
  `;
};

const renderBalances = ({ state, Localize }) => {
  const html = `
    <div id="js-mainConfigurationArea" class="main-area">
      ${showWalletOption({ state, Localize })}
    </div>
  `;
  return html;
};

module.exports = renderBalances;
