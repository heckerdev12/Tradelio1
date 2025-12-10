import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handlePinInput = (digit) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const isValid = await invoke('unlock_app', { passcode: pin });
      
      if (isValid) {
        onUnlock();
      } else {
        setError('Incorrect PIN');
        setPin('');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError(err.toString());
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === 6 && !loading) {
      handleSubmit();
    }
  }, [pin]);

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
}, [pin, loading]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
      <div className="text-center max-w-md w-full px-6">
        <div className="mb-8">
          <div className="text-6xl font-bold text-white mb-4">
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-zinc-500 text-sm">
            Enter your PIN to unlock
          </p>
        </div>

        {/* PIN Display */}
        <div className={`flex justify-center gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                pin.length > i
                  ? error
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-white bg-white'
                  : 'border-zinc-700 bg-zinc-900'
              }`}
            >
              {pin.length > i && (
                <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-black'}`} />
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
            Verifying...
          </div>
        )}
      </div>
    </div>
  );
}

export default LockScreen;