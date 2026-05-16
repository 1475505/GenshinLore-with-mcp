// 公告板功能模块
(function() {
    'use strict';

    const NOTICE_API_URL = 'https://genshinlore.cn/notice.json';
    const COOKIE_NAME = 'read_notices';
    
    // 获取Cookie值
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    // 设置Cookie值
    function setCookie(name, value) {
        const expires = new Date('2999-12-31T23:59:59Z').toUTCString();
        document.cookie = `${name}=${value};expires=${expires};path=/`;
    }
    
    // 获取已读公告ID列表
    function getReadNoticeIds() {
        const cookieValue = getCookie(COOKIE_NAME);
        if (!cookieValue) return [];
        try {
            return JSON.parse(cookieValue);
        } catch (e) {
            return [];
        }
    }
    
    // 标记公告为已读
    function markAsRead(noticeId) {
        const readIds = getReadNoticeIds();
        if (!readIds.includes(noticeId)) {
            readIds.push(noticeId);
            setCookie(COOKIE_NAME, JSON.stringify(readIds));
        }
    }
    
    // 检查公告是否已读
    function isRead(noticeId) {
        const readIds = getReadNoticeIds();
        return readIds.includes(noticeId);
    }
    
    // 创建公告弹窗HTML
    function createNoticeModal() {
        const modal = document.createElement('div');
        modal.id = 'notice-modal';
        modal.className = 'modal notice-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>公告</h3>
                    <button class="close-button" id="notice-close-btn">&times;</button>
                </div>
                <div class="modal-body" id="notice-body">
                    <!-- 公告内容将在这里动态插入 -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = document.getElementById('notice-close-btn');
        closeBtn.addEventListener('click', closeNoticeModal);
        
        // 点击背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeNoticeModal();
            }
        });
        
        return modal;
    }
    
    // 关闭公告弹窗
    function closeNoticeModal() {
        const modal = document.getElementById('notice-modal');
        if (modal) {
            modal.classList.remove('modal-active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }
    
    // 显示公告弹窗
    function showNoticeModal() {
        const modal = document.getElementById('notice-modal');
        if (modal) {
            modal.style.display = 'flex';
            // 触发动画
            setTimeout(() => {
                modal.classList.add('modal-active');
            }, 10);
        }
    }
    
    // 渲染公告内容
    function renderNotices(notices) {
        const noticeBody = document.getElementById('notice-body');
        if (!noticeBody || !notices || notices.length === 0) return;
        
        let html = '';
        notices.forEach((notice, index) => {
            html += `
                <div class="notice-item" data-notice-id="${notice.id}">
                    <div class="notice-title">${escapeHtml(notice.title)}</div>
                    <div class="notice-meta">
                        <span class="notice-date">日期：${notice.date}</span>
                        <span class="notice-author">来源：${escapeHtml(notice.author)}</span>
                    </div>
                    <div class="notice-description">${escapeHtml(notice.description)}</div>
                </div>
            `;
        });
        
        noticeBody.innerHTML = html;
    }
    
    // HTML转义，防止XSS攻击
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 从服务器获取公告
    async function fetchNotices() {
        try {
            const response = await fetch(NOTICE_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const notices = await response.json();
            return notices;
        } catch (error) {
            console.error('获取公告失败:', error);
            return [];
        }
    }
    
    // 初始化公告系统
    async function initNoticeSystem() {
        // 创建弹窗
        createNoticeModal();
        
        // 获取公告数据
        const allNotices = await fetchNotices();
        if (!allNotices || allNotices.length === 0) {
            return;
        }
        
        // 筛选未读公告
        const unreadNotices = allNotices.filter(notice => !isRead(notice.id));
        
        if (unreadNotices.length === 0) {
            return;
        }
        
        // 按日期降序排序（最新的在前）
        unreadNotices.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 渲染并显示公告
        renderNotices(unreadNotices);
        showNoticeModal();
        
        // 标记所有未读公告为已读
        unreadNotices.forEach(notice => {
            markAsRead(notice.id);
        });
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNoticeSystem);
    } else {
        initNoticeSystem();
    }
})();
