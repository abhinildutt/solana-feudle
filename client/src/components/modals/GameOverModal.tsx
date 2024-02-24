import { BaseModal } from './BaseModal'
import styles from './gameovermodal.module.css'

import redarrow from './img/redarrow.png'
import greenarrow from './img/greenarrow.png'
import roger from './img/player1.jpeg'
import abhinil from './img/player2.jpeg'

import { ReactChild, ReactFragment, ReactPortal } from 'react'
import Avatar from '@mui/material/Avatar';

type Props = {
  isOpen: boolean
  handleClose: () => void
}

const get_player = () => {
  return 'scdivad';
}

function VerticalStack(props: { children: boolean | ReactChild | ReactFragment | ReactPortal | null | undefined }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    }}>
      {props.children}
    </div>
  );
}

export const GameOverModal = ({ 
  isOpen, 
  handleClose
}: Props) => {
  const abs_sol = 0.5
  const playerWon = true;

  return (
    <BaseModal title={`${get_player()} wins!`} isOpen={isOpen} handleClose={handleClose} isWide={true}>
      <p className="text-sm text-gray-500 dark:text-gray-300"
        style={{ 
          padding: '70px',
          marginLeft: '-50px',
          marginRight: '-50px',
        }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
            <Avatar 
              sx={{ width: 96, height: 96 }}
              alt="Roger Wang" src={roger} 
            />
            <VerticalStack
              children={[
                <img className={`${styles.leftArrow}`} src={playerWon ? greenarrow : redarrow} />,
                <div>{playerWon ? '+' : '-'}{abs_sol} sol</div>
              ]}
            />
            <img className={`${styles.solanaIcon}`} src={'https://freelogopng.com/images/all_img/1679564153solana-icon-png.png'} />
            <VerticalStack
              children={[
                <img className={`${styles.rightArrow}`} src={playerWon ? redarrow : greenarrow} />,
                <div>{playerWon ? '-' : '+'}{abs_sol} sol</div>
              ]}
            />
            <Avatar 
              sx={{ width: 96, height: 96 }}
              // className={`${styles.avatar}`}
              alt="Abhinil Dutt" src={abhinil}
            />
        </div>

      </p>
    </BaseModal>
  )
}