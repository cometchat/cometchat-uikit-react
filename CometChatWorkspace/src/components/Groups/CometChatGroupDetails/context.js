import React from 'react';

const GroupDetailContext = React.createContext({
    memberlist: [],
    bannedmemberlist: [],
    administratorslist: [],
    moderatorslist: []
});

export default GroupDetailContext;