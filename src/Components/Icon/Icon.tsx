import React from 'react';

import './style.css';

type IconName = 'up' | 'down' | 'edit' | 'delete' | 'user';

const Icon = ({ name }: { name?: IconName }) => {

  return (
    <div className='icon'>
      <img src={`/icons/${name}.png`} alt={name}/>
    </div>
  )
}

export default Icon;
