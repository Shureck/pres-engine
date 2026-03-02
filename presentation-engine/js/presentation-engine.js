/**
 * PresentationEngine — handles slide navigation, keyboard events,
 * touch gestures, fullscreen, themes, etc.
 */
class PresentationEngine {
    constructor(containerEl, options = {}) {
        this.container = containerEl;
        this.slides = [];
        this.slideElements = [];
        this.currentIndex = 0;
        this.totalSlides = 0;
        this.presentationData = null;
        this.renderer = new SlideRenderer();
        this.isAnimating = false;
        this.animationTimeout = null;

        this.onSlideChange = options.onSlideChange || null;
        this.onReady = options.onReady || null;

        this._touchStartX = 0;
        this._touchStartY = 0;
        this._touchDeltaX = 0;
        this._isSwiping = false;

        this._bindEvents();
    }

    load(data) {
        this.presentationData = data;
        this.slides = data.slides || [];
        this.totalSlides = this.slides.length;
        this.currentIndex = 0;
        this.slideElements = [];

        this._render();

        if (this.onReady) {
            this.onReady(data);
        }

        this.goToSlide(0, false);
    }

    goToSlide(index, animate = true) {
        if (index < 0 || index >= this.totalSlides) return;
        if (this.isAnimating && animate) return;

        const prevIndex = this.currentIndex;
        this.currentIndex = index;

        if (animate) {
            this.isAnimating = true;
            clearTimeout(this.animationTimeout);

            const goingForward = index > prevIndex;

            if (this.slideElements[prevIndex]) {
                const prevEl = this.slideElements[prevIndex];
                prevEl.classList.remove('active');
                prevEl.classList.add(goingForward ? 'exit-left' : '');

                const nextEl = this.slideElements[index];
                if (nextEl) {
                    nextEl.style.transition = 'none';
                    nextEl.style.transform = goingForward ? 'translateX(60px)' : 'translateX(-60px)';
                    nextEl.style.opacity = '0';

                    nextEl.offsetHeight;

                    nextEl.classList.add('active');
                    nextEl.style.transition = '';
                    nextEl.style.transform = '';
                    nextEl.style.opacity = '';
                }
            }

            this.animationTimeout = setTimeout(() => {
                this.slideElements.forEach((el, i) => {
                    if (i !== this.currentIndex) {
                        el.classList.remove('active', 'exit-left');
                        el.style.transform = '';
                        el.style.opacity = '';
                    }
                });
                this.isAnimating = false;
            }, 550);
        } else {
            this.slideElements.forEach((el, i) => {
                el.classList.remove('active', 'exit-left');
                if (i === index) {
                    el.classList.add('active');
                }
            });
        }

        if (this.slideElements[index]) {
            this.slideElements[index].scrollTop = 0;
        }

        if (this.onSlideChange) {
            this.onSlideChange(index, this.totalSlides, this.slides[index]);
        }
    }

    next() {
        if (this.currentIndex < this.totalSlides - 1) {
            this.goToSlide(this.currentIndex + 1);
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.goToSlide(this.currentIndex - 1);
        }
    }

    first() {
        this.goToSlide(0);
    }

    last() {
        this.goToSlide(this.totalSlides - 1);
    }

    getCurrentSlide() {
        return this.slides[this.currentIndex] || null;
    }

    getTableOfContents() {
        const toc = [];
        this.slides.forEach((slide, index) => {
            toc.push({
                index,
                title: slide.title || slide.heading || slide.sectionTitle || `Слайд ${index + 1}`,
                type: slide.type || 'content',
                isSection: slide.type === 'section' || slide.type === 'title'
            });
        });
        return toc;
    }

    destroy() {
        if (this.container) this.container.innerHTML = '';
        this.slideElements = [];
        this.slides = [];
        this.totalSlides = 0;
        clearTimeout(this.animationTimeout);
    }

    _render() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.slideElements = [];

        const meta = this.presentationData.meta || {};

        this.slides.forEach((slideData, index) => {
            const slideEl = this.renderer.renderSlide(slideData, index, meta);
            this.container.appendChild(slideEl);
            this.slideElements.push(slideEl);
        });
    }

    _bindEvents() {
        document.addEventListener('keydown', (e) => this._handleKeyboard(e));

        if (this.container) {
            this.container.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: true });
            this.container.addEventListener('touchmove', (e) => this._handleTouchMove(e), { passive: true });
            this.container.addEventListener('touchend', (e) => this._handleTouchEnd(e), { passive: true });
        }
    }

    _handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                this.next();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                this.prev();
                break;
            case 'Home':
                e.preventDefault();
                this.first();
                break;
            case 'End':
                e.preventDefault();
                this.last();
                break;
        }
    }

    _handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        this._touchStartX = e.touches[0].clientX;
        this._touchStartY = e.touches[0].clientY;
        this._touchDeltaX = 0;
        this._isSwiping = false;
    }

    _handleTouchMove(e) {
        if (e.touches.length !== 1) return;
        this._touchDeltaX = e.touches[0].clientX - this._touchStartX;
        const deltaY = Math.abs(e.touches[0].clientY - this._touchStartY);
        if (Math.abs(this._touchDeltaX) > deltaY && Math.abs(this._touchDeltaX) > 10) {
            this._isSwiping = true;
        }
    }

    _handleTouchEnd() {
        if (!this._isSwiping) return;
        const threshold = 80;
        if (this._touchDeltaX < -threshold) {
            this.next();
        } else if (this._touchDeltaX > threshold) {
            this.prev();
        }
        this._isSwiping = false;
    }
}

window.PresentationEngine = PresentationEngine;
