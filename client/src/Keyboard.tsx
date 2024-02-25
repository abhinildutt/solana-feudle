import React, { useState, useEffect } from 'react';
import './Keyboard.css'; // Make sure to create a corresponding CSS file
import { Cell } from './components/grid/Cell';
import { CharStatus } from './lib/statuses';
import { get } from 'http';
const Key = (props: { shouldShow: boolean; letter: string; key_status: CharStatus }) => {
  const { shouldShow, letter, key_status } = props;
  return (
    <div
      style={{
        // visibility: shouldShow ? 'visible' : 'hidden',
        opacity: shouldShow ? 1 : 0.7,
      }}
      key={letter}
      className={`key ${shouldShow ? 'pressed' : ''}`}
    >
      <Cell 
        value={letter}
        status={key_status}
        isBig={true}
      />
    </div>
  );
}

const Keyboard = () => {
  // State to track pressed keys
  const [pressedKeys, setPressedKeys] = useState({});

  const [wasIpressed, setWasIpressed] = useState(false);

  // const CODE_WORD = 'play';
  // const [lastKeys, setLastKeys] = useState<string[]>([]);

  useEffect(() => {
    // Function to update state when a key is pressed
    const handleKeyDown = (event: { key: string; }) => {
      setPressedKeys((prevKeys) => ({ ...prevKeys, [event.key.toUpperCase()]: true }));
      if (event.key.toUpperCase() === 'I') {
        setWasIpressed((prev) => !prev);
      }
      // setLastKeys((prevKeys: string[]) => {
      //   if (CODE_WORD.startsWith(prevKeys.join('') + (event.key))) {
      //     return [...prevKeys, event.key]
      //   } else {
      //     return [];
      //   }
      // });
      
      // if (CODE_WORD[lastKeys.length] === event.key) {
      //   setLastKeys((prevKeys: string[]) => [...prevKeys, event.key]);
      // } else {
      //   setLastKeys([]);
      // }
    };

    // Function to clear the highlight when key is released
    const handleKeyUp = (event: { key: string; }) => {
      setPressedKeys((prevKeys) => ({ ...prevKeys, [event.key.toUpperCase()]: false }));
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const get_key_status = (key: string) => {
    // generate random status
    const status = ['correct', 'present', 'absent', 'vsdkufghahf'];
    return status[Math.floor(Math.random() * status.length)] as CharStatus;
  }
  return (
    <div className="keyboard">
      {/* <div>{lastKeys.length == CODE_WORD.length ? 'UNLOCKED' : 'LOCKED'}</div> */}
      {/* First row: Q to P */}
      <div className="keyboard-row">
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
          (key === 'I' && wasIpressed) ? (
            <img 
              src="https://brand.illinois.edu/wp-content/uploads/2024/02/Block-I-orange-blue-background.png" 
              style={{
                width: '15vw',
                height: '15vh',
                padding: '2px',
                boxShadow: '0 0 10px 5px #f3f3f3',
                // border: '1px solid #f3f3f3',
                margin: '2px',
              }}
            />
          ) :
          (<Key 
            shouldShow={pressedKeys[key as keyof typeof pressedKeys]} 
            letter={key} 
            key_status={get_key_status(key)}
          />)
        ))}
      </div>
      
      {/* Second row: A to L */}
      <div className="keyboard-row">
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
          <Key 
            shouldShow={pressedKeys[key as keyof typeof pressedKeys]}
            letter={key} 
            key_status={get_key_status(key)}
          />
        ))}
      </div>
      
      {/* Third row: Z to M */}
      <div className="keyboard-row">
        {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
          <Key shouldShow={
            pressedKeys[key as keyof typeof pressedKeys]
          } letter={key} 
          key_status={get_key_status(key)}
          />
        ))}
      </div>
    </div>
  );
  
};

export default Keyboard;
