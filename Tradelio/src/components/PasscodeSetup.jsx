import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

function PasscodeSetup({ onComplete }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1 = enter, 2 = confirm
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinInput = (digit) => {
    if (step === 1 && pin.length < 6) {
      setPin(pin + digit);
      if (pin.length + 1 === 6) {
        // Auto-advance to confirmation
        setTimeout(() => setStep(2), 300);
      }
    } else if (step === 2 && confirmPin.length < 6) {
      setConfirmPin(confirmPin + digit);
    }
  };

  const handleDelete = () => {
    if (step === 1) {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      setError("PINs don't match");
      setConfirmPin('');
      setStep(1);
      setPin('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await invoke('setup_passcode', { passcode: pin });
      onComplete();
    } catch (err) {
      setError(err.toString());
      setPin('');
      setConfirmPin('');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when confirm PIN is complete
  if (step === 2 && confirmPin.length === 6 && !loading) {
    handleSubmit();
  };
// Keyboard support
useEffect(() => {
  const handleKeyPress = (e) => {
    if (loading) return;

    // Number keys (0-9)
    if (e.key >= '0' && e.key <= '9') {
      handlePinInput(e.key);
    }
    // Backspace or Delete
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      handleDelete();
    }
    // Enter key to submit when PIN is complete
    else if (e.key === 'Enter' && pin.length === 6) {
      handleSubmit();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [pin, confirmPin, step, loading]);
  
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
      <div className="text-center max-w-md w-full px-6">
        <div className="mb-6">
            
            <h2 className="text-xl font-semibold text-white mb-2">
                {step === 1 ? 'Create PIN' : 'Confirm PIN'}
            </h2>
            <p className="text-zinc-500 text-sm">
                {step === 1 ? 'Enter a 6-digit PIN to secure your app' : 'Re-enter your PIN to confirm'}
            </p>
            </div>

            {/* PIN Display */}
            <div className="flex justify-center gap-2.5 mb-6">
            {[...Array(6)].map((_, i) => (
                <div
                key={i}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                (step === 1 ? pin.length : confirmPin.length) > i
                  ? 'border-white bg-white'
                  : 'border-zinc-700 bg-zinc-900'
              }`}
            >
              {(step === 1 ? pin.length : confirmPin.length) > i && (
                <div className="w-3 h-3 bg-black rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-900 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
            key={num}
            onClick={() => handlePinInput(num.toString())}
            disabled={loading}
            className="h-14 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xl font-semibold text-white transition-colors disabled:opacity-50"
            >
            {num}
            </button>
        ))}
        <div /> {/* Empty space */}
        <button
            onClick={() => handlePinInput('0')}
            disabled={loading}
            className="h-14 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xl font-semibold text-white transition-colors disabled:opacity-50"
        >
            0
        </button>
        <button
            onClick={handleDelete}
            disabled={loading}
            className="h-14 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-lg text-zinc-400 transition-colors disabled:opacity-50"
        >
            ⌫
        </button>
        </div>

        {loading && (
          <div className="text-zinc-500 text-sm animate-pulse">
            Setting up PIN...
          </div>
        )}
      </div>
    </div>
  );
}

export default PasscodeSetup;