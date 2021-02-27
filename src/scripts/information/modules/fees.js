const renderFees = ({ Localize }) => {
  const html = `
    <div class="main-area">

      <div class="section intro">
        <p class="no-header">
          ${Localize.text('Using Scalaris DX is cheaper than using centralized exchanges, especially since there are no withdrawal fees. Below is Scalaris DX’s fee structure. For the most up-to-date information on fees, <a href="#" class="text-link js-externalLink" data-link="https://docs.scalaris.info/scalarisdx/fees/">click here</a>.', 'informationWindowFees')}
        </p>
      </div>

      <div class="section">
        <div class="section-header">
          <div class="section-header-text">${Localize.text('Maker Fee', 'informationWindowFees')}</div><div class="section-header-line"></div>
        </div>
        <p>
    ${Localize.text('When creating an order on Scalaris DX, there is no fee other than the network fee of the asset being sold. This is the same type of fee you would incur if sending this asset to another party.', 'informationWindowFees')}
  </p>
</div>

<div class="section">
  <div class="section-header">
    <div class="section-header-text">${Localize.text('Taker Fee', 'informationWindowFees')}</div><div class="section-header-line"></div>
  </div>
  <p>
    ${Localize.text('When accepting an order on Scalaris DX, a static fee of 0.015 BLOCK is charged at the time the order is taken. This fee is charged even if a trade is canceled or fails and is meant to discourage malicious behavior on the network.', 'informationWindowFees')}
  </p>
  <p>  
    ${Localize.text('In addition to the 0.015 BLOCK fee, there is also the network fee of the asset being sold. This is the same type of fee you would incur if sending this asset to another party.', 'informationWindowFees')}
  </p>
</div>

<div class="section">
  <div class="section-header">
    <div class="section-header-text">${Localize.text('Fees Distribution', 'informationWindowFees')}</div><div class="section-header-line"></div>
  </div>
  <p>
    ${Localize.text('100% of trade fees are distributed to Scalaris Service Node operators for supporting the network.', 'informationWindowFees')}
  </p>
</div>

</div>
`;

return html;
};

module.exports = renderFees;
