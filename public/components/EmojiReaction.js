// EmojiReaction.js - 表情反应组件
// 检查全局变量是否已存在，防止重复声明
if (typeof window.EmojiReaction === 'undefined') {
    
class EmojiReaction {
    constructor(selector, options = {}) {
        this.containers = document.querySelectorAll(selector);
        this.options = Object.assign({
            initialCount: 0,
            showLabel: false, // 默认不显示标签文字
            showCount: true,
            showAllClicked: true, // 新增：显示所有被点击的表情
            showViews: false, // 是否显示查看次数
            viewCount: 0, // 查看次数
            showShare: false, // 是否显示分享按钮
            reactions: [
                { emoji: 'like', label: 'like', color: '#FFD835' },
                { emoji: 'haha', label: 'haha', color: '#FFD835' },
                { emoji: 'love', label: 'love', color: '#FF493B' },
                { emoji: 'sad', label: 'sad', color: '#7ACE44' },
                { emoji: 'angry', label: 'angry', color: '#FF493B' }
            ]
        }, options);
        
        this.init();
    }
    
    init() {
        // 确保SVG定义存在
        if (!document.getElementById('reactions-svg-defs')) {
            // 使用现有reactions.js的SVG定义，此处不再重复添加
        }
        
        this.containers.forEach(container => {
            // 初始化点击记录
            if (!container.hasAttribute('data-reaction-counts')) {
                // 创建记录各表情点击次数的数据结构
                const counts = {};
                this.options.reactions.forEach(reaction => {
                    counts[reaction.emoji] = 0;
                });
                
                // 如果有初始表情和次数，设置对应值
                const initialReaction = container.getAttribute('data-reaction');
                const initialCount = parseInt(container.getAttribute('data-count') || 0);
                
                if (initialReaction && initialReaction !== 'no-reaction' && initialCount > 0) {
                    counts[initialReaction] = initialCount;
                }
                
                container.setAttribute('data-reaction-counts', JSON.stringify(counts));
            }
            
            this.setupContainer(container);
        });
    }
    
    setupContainer(container) {
        // 容器准备
        container.classList.add('emoji-reaction-container');
        container.innerHTML = '';
        
        // 获取当前数据
        const reactionCounts = JSON.parse(container.getAttribute('data-reaction-counts') || '{}');
        const totalCount = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
        
        // 创建主容器 - 使用flex布局
        const mainContainer = document.createElement('div');
        mainContainer.classList.add('emoji-main-container');
        
        // 创建左侧表情部分
        const leftPart = document.createElement('div');
        leftPart.classList.add('emoji-left-part');
        
        // 如果是初始状态或没有任何点击
        if (totalCount === 0) {
            // 添加初始图标
            const mainIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            mainIcon.classList.add('emotion-icon', 'emoji-icon-no-reaction');
            mainIcon.setAttribute('aria-hidden', 'true');
            
            const mainUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            mainUse.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#emoji-icon-no-reaction');
            mainIcon.appendChild(mainUse);
            
            leftPart.appendChild(mainIcon);
            
            // 添加文本显示
            const textSpan = document.createElement('span');
            textSpan.classList.add('emoji-reaction-text');
            textSpan.textContent = '还没有反应';
            leftPart.appendChild(textSpan);
        } else {
            // 表情选择后的显示
            // 显示被点击的表情
            const clickedEmojis = Object.entries(reactionCounts)
                .filter(([emoji, count]) => count > 0)
                .sort((a, b) => b[1] - a[1]); // 按点击次数降序排序
            
            clickedEmojis.forEach(([emoji, count]) => {
                const emojiIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                emojiIcon.classList.add('emotion-icon', `emoji-icon-${emoji}`);
                emojiIcon.setAttribute('aria-hidden', 'true');
                
                const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#emoji-icon-${emoji}`);
                emojiIcon.appendChild(use);
                
                leftPart.appendChild(emojiIcon);
            });
            
            // 添加总计数
            const totalCountSpan = document.createElement('span');
            totalCountSpan.classList.add('emoji-total-count');
            totalCountSpan.textContent = totalCount;
            leftPart.appendChild(totalCountSpan);
        }
        
        // 添加点击事件打开表情选择器
        leftPart.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openEmojiSelector(container);
        });
        
        // 创建右侧部分
        const rightPart = document.createElement('div');
        rightPart.classList.add('emoji-right-part');
        
        // 添加查看次数
        if (this.options.showViews) {
            const viewsItem = document.createElement('span');
            viewsItem.classList.add('emoji-views-item');
            
            const viewIcon = document.createElement('i');
            viewIcon.className = 'fa-solid fa-eye';
            
            const viewCount = document.createElement('span');
            viewCount.textContent = this.options.viewCount;
            
            viewsItem.appendChild(viewIcon);
            viewsItem.appendChild(viewCount);
            rightPart.appendChild(viewsItem);
        }
        
        // 添加分享按钮
        if (this.options.showShare) {
            const shareItem = document.createElement('span');
            shareItem.classList.add('emoji-share-item');
            
            const shareIcon = document.createElement('i');
            shareIcon.className = 'fa-solid fa-share-nodes';
            
            shareItem.appendChild(shareIcon);
            rightPart.appendChild(shareItem);
            
            // 添加分享点击事件
            shareItem.addEventListener('click', (e) => {
                e.stopPropagation();
                // 这里可以添加分享逻辑
                console.log('Share clicked');
            });
        }
        
        // 组装容器
        mainContainer.appendChild(leftPart);
        mainContainer.appendChild(rightPart);
        container.appendChild(mainContainer);
    }
    
    // 打开表情选择器
    openEmojiSelector(container) {
        // 关闭已经打开的选择器
        document.querySelectorAll('.emoji-selector-active').forEach(el => {
            el.classList.remove('emoji-selector-active');
        });
        
        // 如果已有选择器，则直接显示
        let selector = container.querySelector('.emoji-reaction-selector');
        
        if (!selector) {
            // 创建表情选择器
            selector = document.createElement('div');
            selector.classList.add('emoji-reaction-selector');
            
            this.options.reactions.forEach(reaction => {
                const option = document.createElement('div');
                option.classList.add('emoji-reaction-option');
                option.setAttribute('data-reaction', reaction.emoji);
                
                // 创建SVG图标
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.classList.add('emotion-icon', `emoji-icon-${reaction.emoji}`);
                svg.setAttribute('aria-hidden', 'true');
                
                const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#emoji-icon-${reaction.emoji}`);
                svg.appendChild(use);
                
                // 添加图标 - 先添加图标再添加标签文本(如有)
                option.appendChild(svg);
                
                // 如果需要添加标签
                if (this.options.showLabel) {
                    const label = document.createElement('span');
                    label.textContent = reaction.label;
                    label.classList.add('emoji-reaction-label');
                    option.appendChild(label);
                }
                
                // 添加点击事件
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectReaction(container, reaction.emoji);
                    selector.classList.remove('emoji-selector-active');
                });
                
                selector.appendChild(option);
            });
            
            container.appendChild(selector);
        }
        
        // 显示选择器
        selector.classList.add('emoji-selector-active');
        
        // 添加点击外部关闭选择器
        const clickOutside = (e) => {
            if (!selector.contains(e.target) && !container.querySelector('.emoji-left-part').contains(e.target)) {
                selector.classList.remove('emoji-selector-active');
                document.removeEventListener('click', clickOutside);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', clickOutside);
        }, 10);
    }
    
    selectReaction(container, reactionType) {
        // 获取当前的点击记录
        const reactionCounts = JSON.parse(container.getAttribute('data-reaction-counts') || '{}');
        
        // 增加对应表情的点击次数
        reactionCounts[reactionType] = (reactionCounts[reactionType] || 0) + 1;
        
        // 更新状态
        container.setAttribute('data-reaction-counts', JSON.stringify(reactionCounts));
        
        // 更新主要显示的反应类型
        container.setAttribute('data-reaction', reactionType);
        
        // 计算总点击数
        const totalCount = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
        container.setAttribute('data-count', totalCount);
        
        // 重新渲染容器
        this.setupContainer(container);
    }
    
    // 获取表情反应状态
    static getReactionState(container) {
        return {
            counts: JSON.parse(container.getAttribute('data-reaction-counts') || '{}'),
            totalCount: parseInt(container.getAttribute('data-count') || '0'),
            mainReaction: container.getAttribute('data-reaction') || 'no-reaction'
        };
    }
}

// 将类暴露为全局变量
window.EmojiReaction = EmojiReaction;

} // 结束条件判断

// 添加CSS样式 - 防止重复添加
if (!document.getElementById('emoji-reaction-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'emoji-reaction-styles';
    styleElement.textContent = `
        .emoji-reaction-container {
            min-width: 50px;
            display: inline-flex;
        }
    `;
    document.head.appendChild(styleElement);
} 