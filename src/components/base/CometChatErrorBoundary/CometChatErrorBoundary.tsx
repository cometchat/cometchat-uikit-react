import React from 'react';
import { CometChatErrorBoundaryRoot } from './CometChatErrorBoundaryRoot';
import { CometChatErrorBoundaryFallback } from './CometChatErrorBoundaryFallback';
import type { CometChatErrorBoundaryRootProps } from './CometChatErrorBoundary.types';

export type CometChatErrorBoundaryProps = CometChatErrorBoundaryRootProps;

const CometChatErrorBoundaryComponent: React.FC<CometChatErrorBoundaryProps> = props => {
  return <CometChatErrorBoundaryRoot {...props} />;
};

CometChatErrorBoundaryComponent.displayName = 'CometChatErrorBoundary';

export const CometChatErrorBoundary = Object.assign(CometChatErrorBoundaryComponent, {
  Root: CometChatErrorBoundaryRoot,
  Fallback: CometChatErrorBoundaryFallback,
});
