import { ActionOptionModal } from '@/components/ActionOptionModal';

type ProfileCameraMenuProps = {
  onClose: () => void;
  onPickBackground: () => void;
  onSaveCardImage: () => void;
  visible: boolean;
};

/**
 * 名片图片操作菜单：更换背景 / 保存图片 / 取消。
 */
export function ProfileCameraMenu({
  onClose,
  onPickBackground,
  onSaveCardImage,
  visible,
}: ProfileCameraMenuProps) {
  return (
    <ActionOptionModal
      onClose={onClose}
      options={[
        {
          label: '更换名片背景',
          onPress: onPickBackground,
          tone: 'primary',
        },
        {
          label: '保存名片图片',
          onPress: onSaveCardImage,
        },
        {
          label: '取消',
          onPress: () => {},
        },
      ]}
      title="名片图片"
      visible={visible}
    />
  );
}
