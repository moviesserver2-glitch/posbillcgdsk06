import React, { useState } from 'react';
import './PinScreen.css';

interface PinScreenProps {
  onUnlock: () => void;
}

const PinScreen: React.FC<PinScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const correctPin = '2244';

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="pin-screen">
      <form onSubmit={handleSubmit} className="pin-form">
        <h2>Enter Security PIN</h2>
        <input
          type="password"
          value={pin}
          onChange={handlePinChange}
          maxLength={4}
          className="pin-input"
        />
        {error && <p className="pin-error">Invalid PIN</p>}
        <button type="submit" className="pin-submit">Unlock</button>
      </form>
    </div>
  );
};

export default PinScreen;
