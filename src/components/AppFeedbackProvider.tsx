import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ActionOptionModal,
  type ActionOption,
} from './ActionOptionModal';

type ConfirmOptions = {
  cancelLabel?: string;
  confirmLabel: string;
  danger?: boolean;
  message: string;
  onConfirm: () => void;
  title: string;
};

type FeedbackContextValue = {
  showConfirm: (options: ConfirmOptions) => void;
  showNotice: (title: string, message?: string) => void;
};

type ModalState = {
  message?: string;
  options: ActionOption[];
  title: string;
} | null;

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

type AppFeedbackProviderProps = {
  children: ReactNode;
};

export function AppFeedbackProvider({
  children,
}: AppFeedbackProviderProps) {
  const [modal, setModal] = useState<ModalState>(null);

  const showNotice = useCallback((title: string, message?: string) => {
    setModal({
      message,
      options: [
        {
          label: '知道了',
          onPress: () => {},
          tone: 'primary',
        },
      ],
      title,
    });
  }, []);

  const showConfirm = useCallback(
    ({
      cancelLabel = '取消',
      confirmLabel,
      danger = false,
      message,
      onConfirm,
      title,
    }: ConfirmOptions) => {
      setModal({
        message,
        options: [
          {
            label: confirmLabel,
            onPress: onConfirm,
            tone: danger ? 'danger' : 'primary',
          },
          {
            label: cancelLabel,
            onPress: () => {},
          },
        ],
        title,
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ showConfirm, showNotice }),
    [showConfirm, showNotice],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ActionOptionModal
        message={modal?.message}
        onClose={() => setModal(null)}
        options={modal?.options ?? []}
        title={modal?.title ?? ''}
        visible={modal !== null}
      />
    </FeedbackContext.Provider>
  );
}

export function useAppFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useAppFeedback must be used inside AppFeedbackProvider');
  }
  return context;
}
