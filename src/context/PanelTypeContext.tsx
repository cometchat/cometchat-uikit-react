import React, { useContext } from 'react';

export const PanelTypeContext = React.createContext<string | undefined>(undefined);

export const usePanelType = () => useContext(PanelTypeContext);
