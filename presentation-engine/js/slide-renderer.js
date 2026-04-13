/**
 * SlideRenderer — converts JSON slide data into HTML elements
 */
class SlideRenderer {
    constructor() {
        this.highlighter = new CodeHighlighter();
    }

    /**
     * Render a single slide from JSON data
     * @param {object} slideData - Slide data object
     * @param {number} index - Slide index
     * @param {object} meta - Presentation metadata
     * @returns {HTMLElement}
     */
    renderSlide(slideData, index, meta) {
        const slide = document.createElement('div');
        slide.className = `slide slide-${slideData.type || 'content'}`;
        slide.dataset.index = index;

        try {
            switch (slideData.type) {
                case 'title':
                    this._renderTitleSlide(slide, slideData, meta);
                    break;
                case 'section':
                    this._renderSectionSlide(slide, slideData);
                    break;
                case 'content':
                default:
                    this._renderContentSlide(slide, slideData);
                    break;
            }
        } catch (err) {
            console.error('Slide render error at index', index, err);
            this._renderFallbackSlide(slide, slideData, index);
        }

        if (slideData.type !== 'title') {
            const num = document.createElement('div');
            num.className = 'slide-number';
            num.textContent = index + 1;
            slide.appendChild(num);
        }

        return slide;
    }

    _renderFallbackSlide(slide, slideData, index) {
        const heading = document.createElement('h2');
        heading.className = 'slide-heading';
        heading.textContent = slideData.title || slideData.sectionTitle || `Слайд ${index + 1}`;
        slide.appendChild(heading);

        const body = document.createElement('div');
        body.className = 'slide-body';

        const msg = document.createElement('div');
        msg.className = 'content-callout callout-error';
        msg.innerHTML = `
            <span class="callout-icon">⚠️</span>
            <div class="callout-content">
                <div class="callout-title">Ошибка рендера слайда</div>
                <div class="callout-text">Откройте консоль браузера для деталей.</div>
            </div>
        `;
        body.appendChild(msg);
        slide.appendChild(body);
    }

    _renderTitleSlide(slide, data, meta) {
        if (data.title) {
            const h1 = document.createElement('h1');
            h1.className = 'slide-title-text slide-animate';
            h1.innerHTML = this._processInlineMarkup(data.title);
            slide.appendChild(h1);
        }

        if (data.subtitle) {
            const sub = document.createElement('p');
            sub.className = 'slide-subtitle-text slide-animate';
            sub.innerHTML = this._processInlineMarkup(data.subtitle);
            slide.appendChild(sub);
        }

        if (data.author || (meta && meta.author)) {
            const author = document.createElement('p');
            author.className = 'slide-author slide-animate';
            author.textContent = data.author || meta.author;
            slide.appendChild(author);
        }

        if (data.date || (meta && meta.date)) {
            const date = document.createElement('p');
            date.className = 'slide-author slide-animate';
            date.textContent = data.date || meta.date;
            slide.appendChild(date);
        }
    }

    _renderSectionSlide(slide, data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'section-wrapper';

        if (data.sectionNumber) {
            const num = document.createElement('div');
            num.className = 'section-number';

            const parsed = this._parseSectionNumber(data.sectionNumber);
            if (parsed) {
                const label = document.createElement('span');
                label.className = 'section-number-label';
                label.textContent = parsed.label;

                const value = document.createElement('span');
                value.className = 'section-number-value';
                value.textContent = parsed.value;

                num.appendChild(label);
                num.appendChild(value);
            } else {
                num.textContent = data.sectionNumber;
            }

            wrapper.appendChild(num);
        }

        const title = document.createElement('h2');
        title.className = 'section-title';
        title.innerHTML = this._processInlineMarkup(data.title || data.sectionTitle || '');
        wrapper.appendChild(title);

        slide.appendChild(wrapper);
    }

    _parseSectionNumber(sectionNumber) {
        const raw = String(sectionNumber || '').trim();
        if (!raw) return null;

        const match = raw.match(/^(.*?)(\d+)\s*$/);
        if (!match) return null;

        const label = match[1].trim();
        const value = match[2];

        if (!label || !value) return null;

        return { label, value };
    }

    _renderContentSlide(slide, data) {
        const headingText = data.title || data.heading;
        if (headingText) {
            const heading = document.createElement('h2');
            heading.className = 'slide-heading slide-animate';
            heading.innerHTML = this._processInlineMarkup(headingText);
            slide.appendChild(heading);
        }

        const body = document.createElement('div');
        body.className = 'slide-body';

        if (data.content && Array.isArray(data.content)) {
            data.content.forEach(block => {
                const el = this._renderContentBlock(block);
                if (el) {
                    if (data.animate !== false) {
                        el.classList.add('slide-animate');
                    }
                    body.appendChild(el);
                }
            });
        }

        if (data.reference) {
            const ref = document.createElement('div');
            ref.className = 'slide-reference slide-animate';
            ref.innerHTML = `📎 <a href="${this._escapeHtml(data.reference)}" target="_blank" rel="noopener">${this._escapeHtml(data.reference)}</a>`;
            body.appendChild(ref);
        }

        slide.appendChild(body);
    }

    _renderContentBlock(block) {
        switch (block.type) {
            case 'text': return this._renderText(block);
            case 'code': return this._renderCode(block);
            case 'list': return this._renderList(block);
            case 'ordered-list': return this._renderOrderedList(block);
            case 'callout': return this._renderCallout(block);
            case 'table': return this._renderTable(block);
            case 'columns': return this._renderColumns(block);
            case 'image': return this._renderImage(block);
            case 'divider': return this._renderDivider();
            case 'quote': return this._renderQuote(block);
            case 'formula': return this._renderFormula(block);
            case 'definition': return this._renderDefinition(block);
            case 'steps': return this._renderSteps(block);
            case 'comparison': return this._renderComparison(block);
            case 'link': return this._renderLink(block);
            default:
                console.warn('Unknown content block type:', block.type);
                return null;
        }
    }

    _renderText(block) {
        const el = document.createElement('div');
        el.className = 'content-text';
        const text = block.text || block.value || block.content || '';
        el.innerHTML = this._processInlineMarkup(text);
        return el;
    }

    _renderCode(block) {
        const wrapper = document.createElement('div');
        wrapper.className = 'content-code';

        const lang = block.language || 'kotlin';
        const showLineNumbers = block.lineNumbers !== false;
        const highlightLines = block.highlightLines || [];
        const code = (block.code || '').replace(/\r\n/g, '\n');

        const header = document.createElement('div');
        header.className = 'code-header';

        const dotsDiv = document.createElement('div');
        dotsDiv.className = 'code-dots';
        dotsDiv.innerHTML = '<span class="code-dot"></span><span class="code-dot"></span><span class="code-dot"></span>';

        const langLabel = document.createElement('span');
        langLabel.className = 'code-lang';
        langLabel.textContent = block.filename || lang;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn';
        copyBtn.textContent = 'Копировать';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.textContent = '✓ Скопировано';
                setTimeout(() => { copyBtn.textContent = 'Копировать'; }, 2000);
            }).catch(() => {
                copyBtn.textContent = 'Ошибка';
                setTimeout(() => { copyBtn.textContent = 'Копировать'; }, 2000);
            });
        });

        header.appendChild(dotsDiv);
        header.appendChild(langLabel);
        header.appendChild(copyBtn);
        wrapper.appendChild(header);

        const highlighted = this.highlighter.highlight(
            code,
            lang,
            { lineNumbers: showLineNumbers, highlightLines }
        );

        if (highlighted.type === 'numbered') {
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'code-with-lines';

            const linesDiv = document.createElement('div');
            linesDiv.className = 'code-line-numbers';
            linesDiv.innerHTML = highlighted.lineNumbers;

            const codeDiv = document.createElement('div');
            codeDiv.className = 'code-lines';
            codeDiv.innerHTML = `<pre><code>${highlighted.code}</code></pre>`;

            bodyDiv.appendChild(linesDiv);
            bodyDiv.appendChild(codeDiv);
            wrapper.appendChild(bodyDiv);
        } else {
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'code-body';
            bodyDiv.innerHTML = `<pre><code>${highlighted.code}</code></pre>`;
            wrapper.appendChild(bodyDiv);
        }

        return wrapper;
    }

    _renderList(block) {
        const ul = document.createElement('ul');
        ul.className = 'content-list';
        (block.items || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = this._processInlineMarkup(
                typeof item === 'string' ? item : (item.text || item.content || '')
            );
            ul.appendChild(li);
        });
        return ul;
    }

    _renderOrderedList(block) {
        const ol = document.createElement('ol');
        ol.className = 'content-list-ordered';
        (block.items || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = this._processInlineMarkup(
                typeof item === 'string' ? item : (item.text || item.content || '')
            );
            ol.appendChild(li);
        });
        return ol;
    }

    _renderCallout(block) {
        const div = document.createElement('div');
        const variant = block.variant || 'info';
        div.className = `content-callout callout-${variant}`;

        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            success: '✅',
            tip: '💡'
        };

        const text = block.text || block.content || '';
        div.innerHTML = `
            <span class="callout-icon">${icons[variant] || 'ℹ️'}</span>
            <div class="callout-content">
                ${block.title ? `<div class="callout-title">${this._escapeHtml(block.title)}</div>` : ''}
                <div class="callout-text">${this._processInlineMarkup(text)}</div>
            </div>
        `;
        return div;
    }

    _renderTable(block) {
        const wrapper = document.createElement('div');
        wrapper.className = 'content-table-wrapper';

        const table = document.createElement('table');
        table.className = 'content-table';

        if (block.headers && block.headers.length > 0) {
            const thead = document.createElement('thead');
            const tr = document.createElement('tr');
            block.headers.forEach(h => {
                const th = document.createElement('th');
                th.innerHTML = this._processInlineMarkup(h);
                tr.appendChild(th);
            });
            thead.appendChild(tr);
            table.appendChild(thead);
        }

        if (block.rows && block.rows.length > 0) {
            const tbody = document.createElement('tbody');
            block.rows.forEach(row => {
                const tr = document.createElement('tr');
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.innerHTML = this._processInlineMarkup(cell);
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
        }

        wrapper.appendChild(table);
        return wrapper;
    }

    _renderColumns(block) {
        const div = document.createElement('div');
        let className = 'content-columns';
        if (block.ratio === '60-40') className += ' col-60-40';
        else if (block.ratio === '40-60') className += ' col-40-60';
        div.className = className;

        (block.columns || []).forEach(col => {
            const colDiv = document.createElement('div');
            colDiv.className = 'content-column';

            if (Array.isArray(col)) {
                col.forEach(subBlock => {
                    const el = this._renderContentBlock(subBlock);
                    if (el) colDiv.appendChild(el);
                });
            } else if (col.content && Array.isArray(col.content)) {
                col.content.forEach(subBlock => {
                    const el = this._renderContentBlock(subBlock);
                    if (el) colDiv.appendChild(el);
                });
            }

            div.appendChild(colDiv);
        });

        return div;
    }

    _renderImage(block) {
        const div = document.createElement('div');
        div.className = 'content-image';

        const img = document.createElement('img');
        img.src = block.src || '';
        img.alt = block.alt || '';
        if (block.width) img.style.maxWidth = block.width;
        div.appendChild(img);

        if (block.caption) {
            const cap = document.createElement('p');
            cap.className = 'image-caption';
            cap.textContent = block.caption;
            div.appendChild(cap);
        }

        return div;
    }

    _renderDivider() {
        const div = document.createElement('div');
        div.className = 'content-divider';
        return div;
    }

    _renderQuote(block) {
        const div = document.createElement('blockquote');
        div.className = 'content-quote';
        div.innerHTML = this._processInlineMarkup(block.text || block.content || '');
        if (block.author) {
            div.innerHTML += `<span class="quote-author">— ${this._escapeHtml(block.author)}</span>`;
        }
        return div;
    }

    _renderFormula(block) {
        const div = document.createElement('div');
        div.className = 'content-formula';
        div.textContent = block.formula || block.text || '';
        return div;
    }

    _renderDefinition(block) {
        const div = document.createElement('div');
        div.className = 'content-definition';
        div.innerHTML = `
            <span class="definition-term">${this._escapeHtml(block.term || '')}</span>
            <span class="definition-desc">${this._processInlineMarkup(block.description || '')}</span>
        `;
        return div;
    }

    _renderSteps(block) {
        const div = document.createElement('div');
        div.className = 'content-steps';

        (block.steps || []).forEach((step, i) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-item';
            stepDiv.innerHTML = `
                <div class="step-number">${i + 1}</div>
                <div class="step-content">
                    ${step.title ? `<h4>${this._escapeHtml(step.title)}</h4>` : ''}
                    <p>${this._processInlineMarkup(step.text || step.description || '')}</p>
                </div>
            `;
            div.appendChild(stepDiv);
        });

        return div;
    }

    _renderComparison(block) {
        const div = document.createElement('div');
        div.className = 'content-comparison';

        if (block.good) {
            const goodDiv = document.createElement('div');
            goodDiv.className = 'comparison-item good';
            goodDiv.innerHTML = `
                <div class="comparison-label">✅ ${block.goodLabel || 'Правильно'}</div>
                <div>${this._renderComparisonContent(block.good)}</div>
            `;
            div.appendChild(goodDiv);
        }

        if (block.bad) {
            const badDiv = document.createElement('div');
            badDiv.className = 'comparison-item bad';
            badDiv.innerHTML = `
                <div class="comparison-label">❌ ${block.badLabel || 'Неправильно'}</div>
                <div>${this._renderComparisonContent(block.bad)}</div>
            `;
            div.appendChild(badDiv);
        }

        return div;
    }

    _renderComparisonContent(content) {
        if (typeof content === 'string') {
            return this._processInlineMarkup(content);
        }
        if (Array.isArray(content)) {
            return content.map(block => {
                const el = this._renderContentBlock(block);
                return el ? el.outerHTML : '';
            }).join('');
        }
        return '';
    }

    _renderLink(block) {
        const a = document.createElement('a');
        a.className = 'content-link';
        a.href = block.url || '#';
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            ${this._escapeHtml(block.text || block.url || 'Ссылка')}
        `;
        return a;
    }

    _processInlineMarkup(text) {
        if (!text) return '';

        let result = String(text);

        result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
        result = result.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
        result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        result = result.replace(/\\n/g, '<br>');

        return result;
    }

    _escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

window.SlideRenderer = SlideRenderer;
