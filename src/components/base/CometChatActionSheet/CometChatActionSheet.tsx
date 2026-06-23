import React from 'react';
import { CometChatActionSheetRoot } from './CometChatActionSheetRoot';
import { CometChatActionSheetItem } from './CometChatActionSheetItem';
import { CometChatActionSheetHeader } from './CometChatActionSheetHeader';
import { CometChatActionSheetLayout } from './CometChatActionSheetLayout';
import type {
  CometChatActionSheetRootProps,
  CometChatActionSheetItemData,
} from './CometChatActionSheet.types';

/**
 * Flat API props for CometChatActionSheet.
 * Renders Root + Header + Layout with Items in one call.
 */
export interface CometChatActionSheetProps extends Omit<
  CometChatActionSheetRootProps,
  'children' | 'title'
> {
  /** Header title. */
  title?: string;
  /** Callback for the header close button. Defaults to onClose. */
  onHeaderClose?: () => void;
  /** Items to render in the sheet layout. */
  items?: CometChatActionSheetItemData[];
}

/**
 * CometChatActionSheet — Flat API component.
 *
 * Usage (flat):
 * ```tsx
 * <CometChatActionSheet
 *   isOpen={open}
 *   onClose={close}
 *   title="Actions"
 *   items={actionItems}
 *   layoutMode="list"
 * />
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatActionSheet.Root isOpen={open} onClose={close}>
 *   <CometChatActionSheet.Header title="Actions" onClose={close} />
 *   <CometChatActionSheet.Layout mode="list">
 *     <CometChatActionSheet.Item item={item} />
 *   </CometChatActionSheet.Layout>
 * </CometChatActionSheet.Root>
 * ```
 */
const CometChatActionSheetComponent: React.FC<CometChatActionSheetProps> = ({
  title,
  onHeaderClose,
  items,
  ...rootProps
}) => {
  return (
    <CometChatActionSheetRoot {...rootProps}>
      {title && (
        <CometChatActionSheetHeader title={title} onClose={onHeaderClose ?? rootProps.onClose} />
      )}
      {items && items.length > 0 && (
        <CometChatActionSheetLayout mode={rootProps.layoutMode}>
          {items.map(item => (
            <CometChatActionSheetItem key={item.id} item={item} />
          ))}
        </CometChatActionSheetLayout>
      )}
    </CometChatActionSheetRoot>
  );
};

CometChatActionSheetComponent.displayName = 'CometChatActionSheet';

export const CometChatActionSheet = Object.assign(CometChatActionSheetComponent, {
  Root: CometChatActionSheetRoot,
  Item: CometChatActionSheetItem,
  Header: CometChatActionSheetHeader,
  Layout: CometChatActionSheetLayout,
});
