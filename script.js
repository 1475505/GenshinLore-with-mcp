const navPageMap = {
    'home': 'main.html',
    'basic': 'basiclore.html',
    'history': 'Teyvathis.html',
    'nations': 'history-country.html',
    'brief': 'genshinbasichis.html',
    'about-manual': 'about.html',
    'about-site': 'aboutsite.html'
};


function goToMain() {
    const currentPage = window.location.href;
    if (!currentPage.includes('main.html')) {
        const basePath = getBasePath();
        window.location.href = basePath + 'main.html';
    }
}

window.goToMain = goToMain;

document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const indicator = document.querySelector('.nav-indicator');
    const navMenu = document.querySelector('.nav-menu');

    function updateIndicator(item) {
        const itemWidth = item.offsetWidth;
        const itemLeft = item.offsetLeft;
        
        indicator.style.width = itemWidth + 'px';
        indicator.style.left = itemLeft + 'px';
    }

    function resetIndicator() {
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) {
            updateIndicator(activeItem);
        }
    }

    navItems.forEach((item, index) => {
        item.addEventListener('mouseenter', function() {
            updateIndicator(this);
        });
    });

    navMenu.addEventListener('mouseleave', function() {
        resetIndicator();
    });

    const activeItem = document.querySelector('.nav-item.active');
    if (activeItem) {
        updateIndicator(activeItem);
    }

    window.addEventListener('resize', function() {
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) {
            updateIndicator(activeItem);
        }
    });

    // 初始化移动端菜单
    initMobileMenu();

    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.getElementById('close-modal');

    function openModal(quoteId) {
        const text = quoteData[quoteId];
        if (text) {
            modalBody.innerHTML = text.content;
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('modal-active');
            }, 10);
        }
    }

    function closeModalFunc() {
        modal.classList.remove('modal-active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    document.querySelectorAll('.quote-block').forEach(block => {
        block.addEventListener('click', function() {
            const quoteId = this.getAttribute('data-quote');
            openModal(quoteId);
        });
    });

    closeModal.addEventListener('click', closeModalFunc);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModalFunc();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModalFunc();
        }
    });

    // TOC toggle functionality
    const tocCollapseBtn = document.getElementById('toc-collapse');
    const tocExpandBtn = document.getElementById('toc-expand');
    const tocSidebar = document.querySelector('.toc-sidebar');
    
    function collapseToc() {
        tocSidebar.classList.add('collapsed');
        tocCollapseBtn.style.display = 'none';
        tocExpandBtn.classList.add('visible');
    }
    
    function expandToc() {
        tocSidebar.classList.remove('collapsed');
        tocCollapseBtn.style.display = 'flex';
        tocExpandBtn.classList.remove('visible');
    }
    
    if (tocCollapseBtn && tocSidebar) {
        tocCollapseBtn.addEventListener('click', collapseToc);
    }
    
    if (tocExpandBtn && tocSidebar) {
        tocExpandBtn.addEventListener('click', expandToc);
    }
    
    // 移动端TOC交互
    initMobileToc();
});

function initMobileToc() {
    const tocSidebar = document.querySelector('.toc-sidebar');
    if (!tocSidebar) return;
    
    const mobileTocBtn = document.createElement('button');
    mobileTocBtn.className = 'mobile-toc-btn';
    mobileTocBtn.setAttribute('aria-label', '打开目录');
    
    const tocOverlay = document.createElement('div');
    tocOverlay.className = 'toc-overlay';
    
    document.body.appendChild(mobileTocBtn);
    document.body.appendChild(tocOverlay);
    
    function isMobile() {
        return window.innerWidth <= 1012;
    }
    
    function updateMobileTocVisibility() {
        if (isMobile()) {
            mobileTocBtn.classList.remove('hidden');
            tocSidebar.classList.remove('collapsed');
            if (!tocSidebar.classList.contains('mobile-active')) {
                tocSidebar.style.display = 'none';
            }
        } else {
            mobileTocBtn.classList.add('hidden');
            tocOverlay.classList.remove('active');
            tocSidebar.classList.remove('mobile-active');
            tocSidebar.style.display = 'block';
        }
    }
    
    function openMobileToc() {
        tocSidebar.classList.add('mobile-active');
        tocOverlay.classList.add('active');
        mobileTocBtn.classList.add('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMobileToc() {
        tocSidebar.classList.remove('mobile-active');
        tocOverlay.classList.remove('active');
        setTimeout(() => {
            mobileTocBtn.classList.remove('hidden');
        }, 350);
        document.body.style.overflow = '';
    }
    
    mobileTocBtn.addEventListener('click', openMobileToc);
    tocOverlay.addEventListener('click', closeMobileToc);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && tocSidebar.classList.contains('mobile-active')) {
            closeMobileToc();
        }
    });
    
    window.addEventListener('resize', updateMobileTocVisibility);
    
    updateMobileTocVisibility();
}

// 初始化移动端汉堡菜单
function initMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileBtn = document.createElement('div');
    mobileBtn.className = 'mobile-menu-btn';
    mobileBtn.innerHTML = '<span></span><span></span><span></span>';
    
    // 将按钮插入到导航菜单中
    navMenu.insertBefore(mobileBtn, navMenu.firstChild);

    // 为按钮添加点击事件
    mobileBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        navMenu.classList.toggle('active');
    });

    // 点击文档其他地方收起菜单
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });

    // 监听窗口大小变化，自动收起菜单
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1012) {
            navMenu.classList.remove('active');
        }
    });
}