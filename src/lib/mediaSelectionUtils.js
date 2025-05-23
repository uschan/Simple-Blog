/**
 * 批量选择工具函数
 */

/**
 * 切换单个项目的选择状态
 * @param {string} id - 要切换的项目ID
 * @param {Array<string>} selectedItems - 当前已选择的项目ID数组
 * @param {Function} setSelectedItems - 设置选择项目的状态函数
 */
export const toggleItemSelection = (id, selectedItems, setSelectedItems) => {
  if (selectedItems.includes(id)) {
    // 取消选择
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  } else {
    // 添加选择
    setSelectedItems([...selectedItems, id]);
  }
};

/**
 * 全选或取消全选
 * @param {Array<Object>} items - 所有可选择的项目
 * @param {Array<string>} selectedItems - 当前已选择的项目ID数组
 * @param {Function} setSelectedItems - 设置选择项目的状态函数
 */
export const toggleSelectAll = (items, selectedItems, setSelectedItems) => {
  if (selectedItems.length === items.length) {
    // 如果已全选，取消全选
    setSelectedItems([]);
  } else {
    // 否则全选
    setSelectedItems(items.map(item => item.id));
  }
}; 