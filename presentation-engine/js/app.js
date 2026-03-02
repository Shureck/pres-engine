/**
 * Main Application — ties everything together.
 * Handles UI, file loading, theme switching, etc.
 */
(function () {
    'use strict';

    const $loadingScreen = document.getElementById('loading-screen');
    const $homeScreen = document.getElementById('home-screen');
    const $presScreen = document.getElementById('presentation-screen');

    const $btnLoadFile = document.getElementById('btn-load-file');
    const $fileInput = document.getElementById('file-input');
    const $dropZone = document.getElementById('drop-zone');
    const $presGrid = document.getElementById('presentations-grid');

    const $slidesViewport = document.getElementById('slides-viewport');
    const $slidesContainer = document.getElementById('slides-container');
    const $presTitle = document.getElementById('pres-title');
    const $presLecture = document.getElementById('pres-lecture');
    const $currentSlideNum = document.getElementById('current-slide-num');
    const $totalSlidesNum = document.getElementById('total-slides-num');
    const $progressBar = document.getElementById('progress-bar');
    const $slideDots = document.getElementById('slide-dots');

    const $btnPrev = document.getElementById('btn-prev');
    const $btnNext = document.getElementById('btn-next');
    const $btnBackHome = document.getElementById('btn-back-home');
    const $btnToc = document.getElementById('btn-toc');
    const $btnTheme = document.getElementById('btn-theme');
    const $btnFullscreen = document.getElementById('btn-fullscreen');
    const $btnZoomIn = document.getElementById('btn-zoom-in');
    const $btnZoomOut = document.getElementById('btn-zoom-out');
    const $zoomValue = document.getElementById('zoom-value');

    const $tocPanel = document.getElementById('toc-panel');
    const $tocList = document.getElementById('toc-list');
    const $btnCloseToc = document.getElementById('btn-close-toc');
    const $tocOverlay = document.getElementById('toc-overlay');

    const $modalOverlay = document.getElementById('modal-overlay');
    const $modal = document.getElementById('modal');
    const $modalTitle = document.getElementById('modal-title');
    const $modalBody = document.getElementById('modal-body');
    const $btnCloseModal = document.getElementById('btn-close-modal');

    const $notifications = document.getElementById('notifications');
    const $presHeader = document.getElementById('pres-header');

    let engine = null;
    let currentTheme = localStorage.getItem('codeslides-theme') || 'light';
    let presScale = parseFloat(localStorage.getItem('codeslides-scale')) || 1;
    const PRES_SCALE_MIN = 0.5;
    const PRES_SCALE_MAX = 1.5;
    const PRES_SCALE_STEP = 0.1;
    let headerAutoHide = false;
    let headerHideTimeout = null;
    let builtInPresentations = [];

    function init() {
        applyTheme(currentTheme);
        applyPresScale(presScale);
        setupEventListeners();
        loadBuiltInPresentations();

        setTimeout(() => {
            $loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                $loadingScreen.classList.add('hidden');
                $homeScreen.classList.remove('hidden');
            }, 500);
        }, 800);
    }

    function applyTheme(theme) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('codeslides-theme', theme);
    }

    function toggleTheme() {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    function applyPresScale(scale) {
        presScale = Math.max(PRES_SCALE_MIN, Math.min(PRES_SCALE_MAX, scale));
        if ($slidesViewport) {
            $slidesViewport.style.setProperty('--pres-scale', String(presScale));
        }
        if ($zoomValue) {
            $zoomValue.textContent = Math.round(presScale * 100) + '%';
        }
        localStorage.setItem('codeslides-scale', String(presScale));
    }

    function zoomIn() {
        applyPresScale(presScale + PRES_SCALE_STEP);
    }

    function zoomOut() {
        applyPresScale(presScale - PRES_SCALE_STEP);
    }

    function notify(message, type = 'info') {
        const el = document.createElement('div');
        el.className = `notification ${type}`;
        el.textContent = message;
        $notifications.appendChild(el);
        setTimeout(() => {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    function handleFileSelect(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.json')) {
            notify('Пожалуйста, выберите JSON файл', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                validateAndLoadPresentation(data);
            } catch (err) {
                notify('Ошибка парсинга JSON: ' + err.message, 'error');
                console.error('JSON parse error:', err);
            }
        };
        reader.onerror = () => notify('Ошибка чтения файла', 'error');
        reader.readAsText(file);
    }

    function validateAndLoadPresentation(data) {
        if (!data.slides || !Array.isArray(data.slides) || data.slides.length === 0) {
            notify('JSON файл не содержит слайдов (поле "slides" пустое или отсутствует)', 'error');
            return;
        }
        if (!data.meta) data.meta = {};
        if (!data.meta.title) data.meta.title = 'Презентация';
        startPresentation(data);
    }

    function loadBuiltInPresentations() {
        const demoFiles = ['presentations/demo.json', 'presentations/example.json'];
        demoFiles.forEach(url => {
            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error('Not found');
                    return res.json();
                })
                .then(data => {
                    if (data.meta && data.slides) {
                        builtInPresentations.push({ data, url });
                        renderPresentationCards();
                    }
                })
                .catch(() => {});
        });
    }

    function renderPresentationCards() {
        $presGrid.innerHTML = '';
        builtInPresentations.forEach((pres) => {
            const meta = pres.data.meta || {};
            const card = document.createElement('div');
            card.className = 'pres-card';
            card.innerHTML = `
                <span class="pres-card-lang">${escapeHtml(meta.language || 'Code')}</span>
                <h3>${escapeHtml(meta.title || 'Презентация')}</h3>
                <p>${escapeHtml(meta.description || meta.subtitle || '')}</p>
                <div class="pres-card-meta">
                    <span>📄 ${pres.data.slides.length} слайдов</span>
                    ${meta.author ? `<span>👤 ${escapeHtml(meta.author)}</span>` : ''}
                </div>
            `;
            card.addEventListener('click', () => startPresentation(pres.data));
            $presGrid.appendChild(card);
        });
    }

    function startPresentation(data) {
        $homeScreen.classList.add('hidden');
        $presScreen.classList.remove('hidden');

        engine = new PresentationEngine($slidesContainer, {
            onSlideChange: handleSlideChange,
            onReady: handlePresentationReady
        });
        engine.load(data);
    }

    function exitPresentation() {
        if (engine) {
            engine.destroy();
            engine = null;
        }
        closeToc();
        $presScreen.classList.add('hidden');
        $homeScreen.classList.remove('hidden');
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    }

    function handlePresentationReady(data) {
        const meta = data.meta || {};
        $presTitle.textContent = meta.title || 'Презентация';
        $presLecture.textContent = meta.subtitle || meta.lecture || '';
        $totalSlidesNum.textContent = engine.totalSlides;
        buildDots();
        buildToc();
        notify(`Загружено: ${meta.title || 'Презентация'} (${engine.totalSlides} слайдов)`, 'success');
    }

    function handleSlideChange(index, total, slideData) {
        $currentSlideNum.textContent = index + 1;
        const progress = total > 1 ? (index / (total - 1)) * 100 : 100;
        $progressBar.style.width = `${progress}%`;
        updateDots(index);
        $btnPrev.disabled = index === 0;
        $btnNext.disabled = index === total - 1;
        updateTocActive(index);
        resetHeaderAutoHide();
    }

    function buildDots() {
        $slideDots.innerHTML = '';
        if (!engine) return;
        const toc = engine.getTableOfContents();
        toc.forEach((item, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'slide-dot';
            if (item.isSection) dot.classList.add('section-start');
            dot.title = item.title;
            dot.setAttribute('aria-label', 'Слайд ' + (index + 1));
            dot.addEventListener('click', () => engine.goToSlide(index));
            $slideDots.appendChild(dot);
        });
        updateDots(0);
    }

    function updateDots(activeIndex) {
        const dots = $slideDots.querySelectorAll('.slide-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
        });
        const activeDot = dots[activeIndex];
        if (activeDot) {
            activeDot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    function buildToc() {
        $tocList.innerHTML = '';
        if (!engine) return;
        const toc = engine.getTableOfContents();
        toc.forEach((item) => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            if (item.isSection) tocItem.classList.add('section-heading');
            tocItem.innerHTML = `
                <span class="toc-item-num">${item.index + 1}</span>
                <span class="toc-item-title">${escapeHtml(item.title)}</span>
            `;
            tocItem.addEventListener('click', () => {
                engine.goToSlide(item.index);
                closeToc();
            });
            $tocList.appendChild(tocItem);
        });
    }

    function updateTocActive(index) {
        const items = $tocList.querySelectorAll('.toc-item');
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        const activeItem = items[index];
        if (activeItem && $tocPanel.classList.contains('open')) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function openToc() {
        $tocPanel.classList.add('open');
        $tocOverlay.classList.add('visible');
        updateTocActive(engine ? engine.currentIndex : 0);
    }

    function closeToc() {
        $tocPanel.classList.remove('open');
        $tocOverlay.classList.remove('visible');
    }

    function toggleToc() {
        if ($tocPanel.classList.contains('open')) closeToc();
        else openToc();
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                notify('Не удалось перейти в полноэкранный режим', 'error');
            });
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    function resetHeaderAutoHide() {
        $presHeader.classList.remove('header-hidden');
        clearTimeout(headerHideTimeout);
        if (headerAutoHide) {
            headerHideTimeout = setTimeout(() => {
                $presHeader.classList.add('header-hidden');
            }, 3000);
        }
    }

    function openModal(title, contentHtml) {
        $modalTitle.textContent = title;
        $modalBody.innerHTML = contentHtml;
        $modalOverlay.classList.add('visible');
    }

    function closeModal() {
        $modalOverlay.classList.remove('visible');
    }

    function showKeyboardHelp() {
        openModal('Горячие клавиши', `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Следующий слайд</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">→</kbd> <kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">↓</kbd> <kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">Space</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Предыдущий слайд</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">←</kbd> <kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">↑</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Первый слайд</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">Home</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Последний слайд</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">End</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Содержание</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">T</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Полный экран</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">F</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Сменить тему</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">D</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Увеличить масштаб</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">Ctrl</kbd> + <kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">+</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Уменьшить масштаб</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">Ctrl</kbd> + <kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">−</kbd></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span>Горячие клавиши</span>
                    <span><kbd style="padding: 4px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem;">?</kbd></span>
                </div>
            </div>
        `);
    }

    function setupEventListeners() {
        $btnLoadFile.addEventListener('click', () => $fileInput.click());
        $fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
                e.target.value = '';
            }
        });

        $dropZone.addEventListener('click', () => $fileInput.click());
        $dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            $dropZone.classList.add('drag-over');
        });
        $dropZone.addEventListener('dragleave', () => $dropZone.classList.remove('drag-over'));
        $dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            $dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
        });

        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());

        $btnPrev.addEventListener('click', () => engine && engine.prev());
        $btnNext.addEventListener('click', () => engine && engine.next());
        $btnBackHome.addEventListener('click', exitPresentation);
        $btnToc.addEventListener('click', toggleToc);
        $btnCloseToc.addEventListener('click', closeToc);
        $tocOverlay.addEventListener('click', closeToc);
        $btnTheme.addEventListener('click', toggleTheme);
        $btnFullscreen.addEventListener('click', toggleFullscreen);
        if ($btnZoomIn) $btnZoomIn.addEventListener('click', zoomIn);
        if ($btnZoomOut) $btnZoomOut.addEventListener('click', zoomOut);

        $btnCloseModal.addEventListener('click', closeModal);
        $modalOverlay.addEventListener('click', (e) => {
            if (e.target === $modalOverlay) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'Escape') {
                if ($modalOverlay.classList.contains('visible')) closeModal();
                else if ($tocPanel.classList.contains('open')) closeToc();
                else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                return;
            }
            if ($presScreen.classList.contains('hidden')) return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    zoomIn();
                    return;
                }
                if (e.key === '-') {
                    e.preventDefault();
                    zoomOut();
                    return;
                }
            }
            switch (e.key.toLowerCase()) {
                case 't':
                    e.preventDefault();
                    toggleToc();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'd':
                    e.preventDefault();
                    toggleTheme();
                    break;
                case '?':
                    e.preventDefault();
                    showKeyboardHelp();
                    break;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if ($presScreen.classList.contains('hidden')) return;
            if (e.clientY < 80) resetHeaderAutoHide();
        });

        document.addEventListener('fullscreenchange', () => {
            headerAutoHide = !!document.fullscreenElement;
            if (!document.fullscreenElement) {
                $presHeader.classList.remove('header-hidden');
                clearTimeout(headerHideTimeout);
            }
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', init);
})();
