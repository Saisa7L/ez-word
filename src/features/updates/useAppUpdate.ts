import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useRef, useState } from 'react';

import {
  compareVersions,
  type UpdateRelease,
} from '@/features/updates/updateManifest';
import {
  downloadUpdate,
  fetchLatestRelease,
  installUpdate,
} from '@/services/updateService';

export type UpdateDialogState =
  | { kind: 'available'; release: UpdateRelease }
  | { kind: 'downloading'; progress: number; release: UpdateRelease }
  | { kind: 'error'; message: string; release: UpdateRelease };

type UseAppUpdateOptions = {
  currentVersion: string;
  notify: (title: string, message: string) => void;
};

export function useAppUpdate({ currentVersion, notify }: UseAppUpdateOptions) {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [dialog, setDialog] = useState<UpdateDialogState | null>(null);
  const downloadAbortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      downloadAbortRef.current?.abort();
    },
    [],
  );

  async function checkUpdate() {
    if (isCheckingUpdate) {
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const release = await fetchLatestRelease();
      if (compareVersions(release.version, currentVersion) > 0) {
        setDialog({ kind: 'available', release });
      } else {
        notify(
          '已是最新版本',
          `当前版本 ${currentVersion} 已是 GitHub 最新正式版。`,
        );
      }
    } catch {
      notify('检查更新失败', '请自行前往 GitHub Releases 检查最新版本。');
    } finally {
      setIsCheckingUpdate(false);
    }
  }

  async function startUpdate(release: UpdateRelease) {
    const controller = new AbortController();
    downloadAbortRef.current?.abort();
    downloadAbortRef.current = controller;
    let lastProgress = -1;

    setDialog({ kind: 'downloading', progress: 0, release });

    try {
      const file = await downloadUpdate(release, {
        onProgress: (progress) => {
          if (progress === lastProgress) {
            return;
          }
          lastProgress = progress;
          setDialog({ kind: 'downloading', progress, release });
        },
        signal: controller.signal,
      });
      setDialog(null);
      if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        notify(
          '下载和校验完成',
          'Expo Go 无法验收 Android 系统安装器，请使用正式 APK 验证最后一步。',
        );
        return;
      }
      await installUpdate(file);
    } catch (error) {
      if (controller.signal.aborted) {
        setDialog(null);
        return;
      }

      setDialog({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : '下载或安装更新时发生未知错误',
        release,
      });
    } finally {
      if (downloadAbortRef.current === controller) {
        downloadAbortRef.current = null;
      }
    }
  }

  function cancelDownload() {
    downloadAbortRef.current?.abort();
  }

  function closeDialog() {
    if (dialog?.kind === 'downloading') {
      downloadAbortRef.current?.abort();
    }
    setDialog(null);
  }

  return {
    cancelDownload,
    checkUpdate,
    closeDialog,
    dialog,
    isCheckingUpdate,
    startUpdate,
  };
}
