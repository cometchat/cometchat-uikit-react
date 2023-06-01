import {CSSProperties} from 'react';

export const WithMessagesWrapperStyle = {
    display: 'flex',
    height: '100%',
    width: '100%',
    boxSizing: 'border-box'
} as CSSProperties;

export const WithMessagesSidebarStyle = {
    width: '280px',
    height: '100%',
    position: 'relative'
} as CSSProperties;

export const WithMessagesMainStyle = {
    width: 'calc(100% - 280px)',
    height: '100%'
} as CSSProperties;

export const MobileLayoutStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute'
} as CSSProperties;

export const EmptyMessagesDivStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
} as CSSProperties;