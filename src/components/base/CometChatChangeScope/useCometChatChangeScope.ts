import { useState, useCallback, useMemo } from 'react';
import type { CometChatChangeScopeOptionData } from './CometChatChangeScope.types';

interface UseCometChatChangeScopeArgs {
  options: CometChatChangeScopeOptionData[];
  defaultSelection: string;
  onScopeChanged?: ((scopeId: string) => Promise<void>) | undefined;
  onClose?: (() => void) | undefined;
}

interface UseCometChatChangeScopeReturn {
  selectedId: string;
  isLoading: boolean;
  error: string | null;
  hasChanged: boolean;
  selectOption: (id: string) => void;
  confirmChange: () => void;
  cancel: () => void;
}

export function useCometChatChangeScope({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options,
  defaultSelection,
  onScopeChanged,
  onClose,
}: UseCometChatChangeScopeArgs): UseCometChatChangeScopeReturn {
  const [selectedId, setSelectedId] = useState(defaultSelection);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanged = selectedId !== defaultSelection;

  const selectOption = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const confirmChange = useCallback(() => {
    if (!onScopeChanged || !hasChanged) return;

    setError(null);
    setIsLoading(true);

    onScopeChanged(selectedId)
      .then(() => {
        setIsLoading(false);
        onClose?.();
      })
      .catch(() => {
        setError('change_scope_error');
        setIsLoading(false);
      });
  }, [onScopeChanged, hasChanged, selectedId, onClose]);

  const cancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return useMemo(
    () => ({
      selectedId,
      isLoading,
      error,
      hasChanged,
      selectOption,
      confirmChange,
      cancel,
    }),
    [selectedId, isLoading, error, hasChanged, selectOption, confirmChange, cancel]
  );
}
