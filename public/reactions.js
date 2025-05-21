// 表情符号数据
const pressgrid_reactions = [
    { emoji: 'like', label: 'Like' },
    { emoji: 'haha', label: 'Haha' },
    { emoji: 'love', label: 'Love' },
    { emoji: 'sad', label: 'Sad' },
    { emoji: 'angry', label: 'Angry' }
];

// 初始化表情符号
function initReactions() {
    // 如果SVG定义尚未添加到文档，则添加
    if (!document.getElementById('reactions-svg-defs')) {
        const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgDefs.id = 'reactions-svg-defs';
        svgDefs.style.position = 'absolute';
        svgDefs.style.width = '0';
        svgDefs.style.height = '0';
        svgDefs.style.overflow = 'hidden';
        svgDefs.setAttribute('aria-hidden', 'true');
        
        // 添加到body
        document.body.appendChild(svgDefs);
    }
    
    // 替换所有表情符号元素
    replaceEmojisWithSvgIcons();
    
    // 添加点击事件处理
    addReactionClickHandlers();
}

// 将文本emoji替换为SVG图标
function replaceEmojisWithSvgIcons() {
    // 查找所有包含emoji的容器
    const emojiContainers = document.querySelectorAll('.reactions-container');
    
    emojiContainers.forEach(container => {
        // 获取当前的表情符号状态（如已选择哪个）
        const currentReaction = container.getAttribute('data-current-reaction') || 'no-reaction';
        const count = parseInt(container.getAttribute('data-count') || '0');
        
        // 清空容器
        container.innerHTML = '';
        
        // 创建SVG元素
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('emotion-icon', `emoji-icon-${currentReaction}`);
        svg.setAttribute('aria-hidden', 'true');
        
        // 创建use元素
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#emoji-icon-${currentReaction}`);
        
        // 添加use到svg
        svg.appendChild(use);
        
        // 创建计数元素
        const countSpan = document.createElement('span');
        countSpan.classList.add('reaction-count');
        countSpan.textContent = count;
        
        // 添加到容器
        container.appendChild(svg);
        container.appendChild(countSpan);
    });
}

// 添加点击事件处理
function addReactionClickHandlers() {
    const reactionButtons = document.querySelectorAll('.reaction-button');
    
    reactionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const container = this.querySelector('.reactions-container');
            if (!container) return;
            
            // 获取当前表情符号和计数
            const currentReaction = container.getAttribute('data-current-reaction') || 'no-reaction';
            let count = parseInt(container.getAttribute('data-count') || '0');
            
            // 打开表情选择器或切换表情
            if (currentReaction === 'no-reaction') {
                // 显示表情选择器
                showReactionSelector(this, container);
            } else {
                // 切换回无表情状态
                container.setAttribute('data-current-reaction', 'no-reaction');
                container.setAttribute('data-count', Math.max(0, count - 1).toString());
                
                // 更新视图
                replaceEmojisWithSvgIcons();
            }
        });
    });
}

// 显示表情选择器
function showReactionSelector(button, container) {
    // 检查是否已存在选择器
    let selector = document.querySelector('.reaction-selector');
    if (selector) {
        selector.remove();
    }
    
    // 创建选择器
    selector = document.createElement('div');
    selector.classList.add('reaction-selector');
    
    // 添加所有表情选项
    pressgrid_reactions.forEach(reaction => {
        const option = document.createElement('div');
        option.classList.add('reaction-option');
        
        // 创建SVG图标
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('emotion-icon', `emoji-icon-${reaction.emoji}`);
        svg.setAttribute('aria-hidden', 'true');
        
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#emoji-icon-${reaction.emoji}`);
        
        svg.appendChild(use);
        
        // 添加标签
        const label = document.createElement('span');
        label.textContent = reaction.label;
        
        option.appendChild(svg);
        option.appendChild(label);
        
        // 添加点击事件
        option.addEventListener('click', function() {
            // 更新表情状态
            container.setAttribute('data-current-reaction', reaction.emoji);
            
            // 更新计数
            let count = parseInt(container.getAttribute('data-count') || '0');
            container.setAttribute('data-count', (count + 1).toString());
            
            // 更新视图
            replaceEmojisWithSvgIcons();
            
            // 移除选择器
            selector.remove();
        });
        
        selector.appendChild(option);
    });
    
    // 定位选择器
    const rect = button.getBoundingClientRect();
    selector.style.position = 'absolute';
    selector.style.top = `${rect.bottom + window.scrollY}px`;
    selector.style.left = `${rect.left + window.scrollX}px`;
    
    // 添加到body
    document.body.appendChild(selector);
    
    // 点击外部关闭选择器
    document.addEventListener('click', function closeSelector(e) {
        if (!selector.contains(e.target) && !button.contains(e.target)) {
            selector.remove();
            document.removeEventListener('click', closeSelector);
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加SVG定义
    const svgDefs = document.createElement('div');
    svgDefs.innerHTML = `
        <svg style="position: absolute; width: 0; height: 0; overflow: hidden;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
        <symbol id="emoji-icon-no-reaction" viewBox="0 0 111 110.6">
        <g>
        <defs>
        <rect id="svgid_1_r1" width="111" height="110.6"/>
        </defs>
        <clipPath id="svgid_2_c1">
        <use xlink:href="#svgid_1_r1"  overflow="visible"/>
        </clipPath>
        <path clip-path="url(#svgid_2_c1)" fill="#b7b7b7" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path clip-path="url(#svgid_2_c1)" fill="#d6d6d6" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path clip-path="url(#svgid_2_c1)" fill="none" stroke="#2b2b2b" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" d="M38.8,60.1c0,12.5,8.3,16.7,16.7,16.7s16.7-4.2,16.7-16.7"/>
        <path clip-path="url(#svgid_2_c1)" fill="#2b2b2b" d="M42.8,42.2c0,3.4-2.8,6.2-6.2,6.2s-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2S42.8,38.8,42.8,42.2"/>
        <path clip-path="url(#svgid_2_c1)" fill="#2b2b2b" d="M78.6,42.2c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2C75.9,36.1,78.6,38.8,78.6,42.2"/>
        </g>
        </symbol>
        <symbol id="emoji-icon-like" viewBox="0 0 111 110.6">
        <g>
        <defs>
        <rect id="svgid_1_r2" width="111" height="110.6"/>
        </defs>
        <clipPath id="svgid_2_c2">
        <use xlink:href="#svgid_1_r2"  overflow="visible"/>
        </clipPath>
        <path clip-path="url(#svgid_2_c2)" fill="#DDBE3C" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path clip-path="url(#svgid_2_c2)" fill="#FFD835" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path clip-path="url(#svgid_2_c2)" fill="none" stroke="#795523" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" d="M38.8,60.1c0,12.5,8.3,16.7,16.7,16.7s16.7-4.2,16.7-16.7"/>
        <path clip-path="url(#svgid_2_c2)" fill="#795523" d="M42.8,42.2c0,3.4-2.8,6.2-6.2,6.2s-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2S42.8,38.8,42.8,42.2"/>
        <path clip-path="url(#svgid_2_c2)" fill="#795523" d="M78.6,42.2c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2C75.9,36.1,78.6,38.8,78.6,42.2"/>
        </g>
        </symbol>
        <symbol id="emoji-icon-haha" viewBox="0 0 111 110.6">
        <g>
        <defs>
        <rect id="svgid_1_r3" width="111" height="110.6"/>
        </defs>
        <clipPath id="svgid_2_c3">
        <use xlink:href="#svgid_1_r3"  overflow="visible"/>
        </clipPath>
        <path clip-path="url(#svgid_2_c3)" fill="#DDBE3C" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path clip-path="url(#svgid_2_c3)" fill="#FFD835" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path clip-path="url(#svgid_2_c3)" fill="#795523" d="M72.2,58.5H38.8c0,15,8.3,19.9,16.7,19.9S72.2,73.5,72.2,58.5"/>
        <path clip-path="url(#svgid_2_c3)" fill="none" stroke="#795523" stroke-width="4.561" stroke-linecap="round" stroke-linejoin="round" d="M72.2,58.5H38.8c0,15,8.3,19.9,16.7,19.9S72.2,73.5,72.2,58.5z"/>
        <path clip-path="url(#svgid_2_c3)" fill="none" stroke="#00BAFF" stroke-width="8.346" stroke-linecap="round" stroke-linejoin="round" d="M78.5,47.5c0-4.2-3.9-4.2-8.1-4.2"/>
        <polyline clip-path="url(#svgid_2_c3)" fill="none" stroke="#795523" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" points="74.3,34.9 65.9,43.3 78.5,43.3 	"/>
        <path clip-path="url(#svgid_2_c3)" fill="none" stroke="#00BFF7" stroke-width="8.346" stroke-linecap="round" stroke-linejoin="round" d="M39,43.3c-4.2,0-8.6,0-8.6,4.2"/>
        <polyline clip-path="url(#svgid_2_c3)" fill="none" stroke="#795523" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" points="34.5,34.9 42.9,43.3 30.4,43.3 	"/>
        </g>
        </symbol>
        <symbol id="emoji-icon-love" viewBox="0 0 111 110.6">
        <g>
        <defs>
        <rect id="svgid_1_r4" width="111" height="110.6"/>
        </defs>
        <clipPath id="svgid_2_c4">
        <use xlink:href="#svgid_1_r4"  overflow="visible"/>
        </clipPath>
        <path clip-path="url(#svgid_2_c4)" fill="#DDBE3C" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path clip-path="url(#svgid_2_c4)" fill="#FFD835" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path clip-path="url(#svgid_2_c4)" fill="#795523" d="M72.2,58.5H38.8c0,15,8.3,19.9,16.7,19.9S72.2,73.5,72.2,58.5"/>
        <path clip-path="url(#svgid_2_c4)" fill="none" stroke="#795523" stroke-width="4.561" stroke-linecap="round" stroke-linejoin="round" d="M72.2,58.5H38.8c0,15,8.3,19.9,16.7,19.9S72.2,73.5,72.2,58.5z"/>
        <path clip-path="url(#svgid_2_c4)" fill="#FF493B" d="M68.5,35.2c1,0,1.8,0.3,2.5,0.8c0.5,0.3,0.9,0.7,1.3,1.1c0.1,0.1,0.1,0.1,0.2,0c0.5-0.5,1.1-1,1.8-1.3c1.2-0.7,2.5-0.7,3.7-0.2c1.4,0.5,2.2,1.5,2.5,2.9c0.3,1.6-0.2,2.9-1.1,4.2c-0.4,0.5-0.9,1-1.4,1.5c-0.8,0.8-1.7,1.6-2.5,2.4c-0.9,0.9-1.8,1.7-2.7,2.6c-0.3,0.3-0.6,0.3-0.9,0c-1.4-1.4-2.8-2.7-4.2-4.1c-0.5-0.5-1-1-1.5-1.5c-0.8-0.8-1.5-1.8-1.8-2.9c-0.4-1.4-0.2-2.8,0.7-4c0.6-0.8,1.5-1.2,2.5-1.3C67.9,35.2,68.2,35.2,68.5,35.2"/>
        <path clip-path="url(#svgid_2_c4)" fill="#FF493B" d="M33.9,35.2c1,0,1.8,0.3,2.5,0.8c0.5,0.3,0.9,0.7,1.3,1.1c0.1,0.1,0.1,0.1,0.2,0c0.5-0.5,1.1-1,1.8-1.3c1.2-0.7,2.5-0.7,3.7-0.2c1.4,0.5,2.2,1.5,2.5,2.9c0.3,1.6-0.2,2.9-1.1,4.2c-0.4,0.5-0.9,1-1.4,1.5c-0.8,0.8-1.7,1.6-2.5,2.4c-0.9,0.9-1.8,1.7-2.7,2.6c-0.3,0.3-0.6,0.3-0.9,0c-1.4-1.4-2.8-2.7-4.2-4.1c-0.5-0.5-1-1-1.5-1.5c-0.8-0.8-1.5-1.8-1.8-2.9c-0.4-1.4-0.2-2.8,0.7-4c0.6-0.8,1.5-1.2,2.5-1.3C33.3,35.2,33.6,35.2,33.9,35.2"/>
        </g>
        </symbol>
        <symbol id="emoji-icon-sad" viewBox="0 0 111 110.6">
        <g>
        <defs>
        <rect id="svgid_1_r5" width="111" height="110.6"/>
        </defs>
        <clipPath id="svgid_2_c5">
        <use xlink:href="#svgid_1_r5"  overflow="visible"/>
        </clipPath>
        <path clip-path="url(#svgid_2_c5)" fill="#68AA3D" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path clip-path="url(#svgid_2_c5)" fill="#7ACE44" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path clip-path="url(#svgid_2_c5)" fill="none" stroke="#425929" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" d="M72.2,74c0-5-7.5-9.1-16.7-9.1S38.8,69,38.8,74"/>
        <path clip-path="url(#svgid_2_c5)" fill="#425929" d="M42.8,42.2c0,3.4-2.8,6.2-6.2,6.2s-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2S42.8,38.8,42.8,42.2"/>
        <path clip-path="url(#svgid_2_c5)" fill="#425929" d="M78.6,42.2c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2c0-3.4,2.8-6.2,6.2-6.2C75.9,36.1,78.6,38.8,78.6,42.2"/>
        </g>
        </symbol>
        <symbol id="emoji-icon-angry" viewBox="0 0 111 110.6">
        <g>
        <defs>
        <rect id="svgid_1_r6" width="111" height="110.6"/>
        </defs>
        <clipPath id="svgid_2_c6">
        <use xlink:href="#svgid_1_r6"  overflow="visible"/>
        </clipPath>
        <path clip-path="url(#svgid_2_c6)" fill="#D83125" d="M110.8,60.1C99.9,77,79.2,88.4,55.5,88.4c-23.7,0-44.3-11.4-55.2-28.2c0.2,1.9,0.4,3.8,0.8,5.7c0.2,1,0.4,2,0.7,2.9c6.1,24,27.8,41.8,53.8,41.8c26,0,47.7-17.8,53.8-41.8c0.3-1.2,0.6-2.4,0.8-3.6L110.8,60.1z"/>
        <path clip-path="url(#svgid_2_c6)" fill="#FF493B" d="M0,55.3c0,1.6,0.1,3.2,0.2,4.8C11.1,77,31.8,88.4,55.5,88.4c23.7,0,44.4-11.4,55.3-28.3c0.1-1.6,0.2-3.2,0.2-4.8c0-5.3-0.8-10.5-2.2-15.4l0-1.2c-0.1,0-0.2,0.1-0.4,0.1C101.4,16.3,80.4,0,55.5,0C30.7,0,9.6,16.3,2.6,38.7h0v0C0.9,43.9,0,49.5,0,55.3"/>
        <path clip-path="url(#svgid_2_c6)" fill="#7C150B" d="M28.5,42.2c0,3.4,2.8,6.2,6.2,6.2s6.2-2.8,6.2-6.2"/>
        <path clip-path="url(#svgid_2_c6)" fill="none" stroke="#7C150B" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" d="M28.5,42.2c0,3.4,2.8,6.2,6.2,6.2s6.2-2.8,6.2-6.2"/>
        <path clip-path="url(#svgid_2_c6)" fill="#7C150B" d="M80.5,40c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2"/>
        <path clip-path="url(#svgid_2_c6)" fill="none" stroke="#7C150B" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" d="M80.5,40c0,3.4-2.8,6.2-6.2,6.2c-3.4,0-6.2-2.8-6.2-6.2"/>
        <path clip-path="url(#svgid_2_c6)" fill="none" stroke="#7C150B" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" d="M72.2,74c0-5-7.5-9.1-16.7-9.1S38.8,69,38.8,74"/>
        <path clip-path="url(#svgid_2_c6)" fill="none" stroke="#7C150B" stroke-width="4.173" stroke-linecap="round" stroke-linejoin="round" d="M24.5,38.6l14.1,5.9 M72.1,37.8L87,32"/>
        </g>
        </symbol>
        </defs>
        </svg>
    `;
    
    // 添加SVG定义到文档
    document.body.insertAdjacentHTML('beforeend', svgDefs.innerHTML);
    
    // 初始化表情反应
    initReactions();
}); 