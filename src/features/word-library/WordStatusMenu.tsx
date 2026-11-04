import { ActionOptionModal } from '@/components/ActionOptionModal';

type WordStatusMenuProps = {
  onClose: () => void;
  onSelect: (status: 'learned' | 'unlearned') => void;
  selectedCount: number;
  visible: boolean;
};

/**
 * 批量修改学习状态的菜单。
 */
export function WordStatusMenu({
  onClose,
  onSelect,
  selectedCount,
  visible,
}: WordStatusMenuProps) {
  return (
    <ActionOptionModal
      message={`将选中的 ${selectedCount} 个单词统一修改为：`}
      onClose={onClose}
      options={[
        {
          label: '已学习',
          onPress: () => {
            onSelect('learned');
          },
        },
        {
          label: '未学习',
          onPress: () => {
            onSelect('unlearned');
          },
        },
        {
          label: '取消',
          onPress: () => {},
          tone: 'danger',
        },
      ]}
      title="修改单词状态"
      visible={visible}
    />
  );
}
