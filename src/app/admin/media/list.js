// 媒体项目选择逻辑 - 简单JS版本
// 此文件提供无TypeScript约束的逻辑，用于测试和替换

// 切换单个项目的选择状态
export const toggleItem = (id, selectedItems, setSelectedItems) => {
  console.log("切换选择状态:", id);
  
  if (selectedItems.includes(id)) {
    // 如果已选中，则取消选择
    console.log("取消选择项目");
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  } else {
    // 如果未选中，则添加选择
    console.log("添加选择项目");
    setSelectedItems([...selectedItems, id]);
  }
};

// 全选或取消全选
export const toggleAll = (items, selectedItems, setSelectedItems) => {
  if (selectedItems.length === items.length) {
    // 如果已全选，则取消全选
    console.log("取消全选");
    setSelectedItems([]);
  } else {
    // 否则全选所有项目
    console.log("全选所有项目");
    setSelectedItems(items.map(item => item.id));
  }
};

// 处理项目点击事件
export const handleItemClick = (e, item, selectedItems, setSelectedItems) => {
  // 检查是否点击了操作按钮区域
  if (e.target.closest('.media-actions') || e.target.closest('button')) {
    console.log("点击了操作区域，不处理选择");
    return;
  }
  
  // 切换选择状态
  toggleItem(item.id, selectedItems, setSelectedItems);
}; 