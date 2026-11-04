import {
  ActionOptionModal,
  type ActionOption,
} from '@/components/ActionOptionModal';
import type { UpdateRelease } from '@/features/updates/updateManifest';
import type { UpdateDialogState } from '@/features/updates/useAppUpdate';
import { formatBytes } from '@/utils/formatBytes';

type AboutUpdateDialogProps = {
  dialog: UpdateDialogState | null;
  onCancelDownload: () => void;
  onClose: () => void;
  onStartUpdate: (release: UpdateRelease) => void;
};

export function AboutUpdateDialog({
  dialog,
  onCancelDownload,
  onClose,
  onStartUpdate,
}: AboutUpdateDialogProps) {
  const releaseNotes =
    dialog && dialog.kind !== 'error'
      ? dialog.release.notes.replace(/\s+/g, ' ').trim().slice(0, 240)
      : '';
  const title =
    dialog?.kind === 'available'
      ? `发现新版本 v${dialog.release.version}`
      : dialog?.kind === 'downloading'
        ? '正在下载更新'
        : dialog?.kind === 'error'
          ? '更新失败'
          : '';
  const message =
    dialog?.kind === 'available'
      ? `${releaseNotes || '发现可安装的新版本。'}\n\n安装包 ${formatBytes(dialog.release.size ?? undefined)}。下载完成后会打开 Android 系统安装器，请确认覆盖安装。`
      : dialog?.kind === 'downloading'
        ? `正在下载 v${dialog.release.version}（${dialog.progress}%）。请保持网络连接。`
        : dialog?.kind === 'error'
          ? `${dialog.message}\n\n请确认已允许本应用安装未知来源应用，或稍后重试。`
          : undefined;

  let options: ActionOption[] = [];
  if (dialog?.kind === 'available') {
    options = [
      {
        label: '下载并安装',
        onPress: () => {
          onStartUpdate(dialog.release);
        },
        tone: 'primary',
      },
      { label: '稍后', onPress: () => {} },
    ];
  } else if (dialog?.kind === 'downloading') {
    options = [
      { label: '取消下载', onPress: onCancelDownload, tone: 'danger' },
    ];
  } else if (dialog?.kind === 'error') {
    options = [
      {
        label: '重试',
        onPress: () => {
          onStartUpdate(dialog.release);
        },
        tone: 'primary',
      },
      { label: '关闭', onPress: () => {} },
    ];
  }

  return (
    <ActionOptionModal
      message={message}
      onClose={onClose}
      options={options}
      title={title}
      visible={dialog !== null}
    />
  );
}
