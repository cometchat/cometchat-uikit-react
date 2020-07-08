import React from 'react';

import './style.scss';

const backdrop = (props) => (
    props.show ? <div className="popup_overlay"  onClick={props.clicked}></div> : null
);

export default backdrop;