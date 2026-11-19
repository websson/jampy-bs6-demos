class KanbanBoard {
    constructor(element, options) {
        this.board = typeof element === 'string' ? document.querySelector(element) : element;
        
        this.settings = Object.assign({
            width: '100%',
            theme: 'light', // Options: 'light', 'dark'
            titles: ['Block 1', 'Block 2', 'Block 3', 'Block 4'],
            colours: [],
            items: [],
            onBeforeDrag: (itemKanban, event) => { return true; }, // Return false to abort drag
            onChange: (itemKanban, sourceBlock, targetBlock) => {}, 
            onReceive: (itemKanban, targetBlock) => {},
            onRemove: (itemId, itemData) => {},
            onRightClick: (itemKanban, event) => {},
            onDblClick: (itemKanban, event) => {}
        }, options);

        this.classes = {
            board: "cd_kanban_board",
            titles: "cd_kanban_board_titles",
            title: "cd_kanban_board_title",
            titleText: "cd_kanban_board_title_text",
            titleCounter: "cd_kanban_board_title_counter",
            blocks: "cd_kanban_board_blocks",
            block: "cd_kanban_board_block",
            itemKanban: "cd_kanban_board_block_item",
            itemTitle: "cd_kanban_board_block_item_title",
            itemFooter: "cd_kanban_board_block_item_footer"
        };

        this.counts = {};
        this.settings.titles.forEach(title => { this.counts[title] = 0; });

        this.init();
    }

    init() {
        this.board.classList.add(this.classes.board);
        this.board.classList.add(`kanban-theme-${this.settings.theme}`);
        this.board.style.width = this.settings.width; 
        
        this.board.innerHTML = `
            <div class="${this.classes.titles}"></div>
            <div class="${this.classes.blocks}"></div>
        `;

        this.calculateInitialCounts();
        this.buildTitles();
        this.buildBlocks();
        this.buildItems();
        this.setupDragAndDrop();
        this.setupEventListeners();
    }

    calculateInitialCounts() {
        this.settings.items.forEach(item => {
            if (this.counts[item.block] !== undefined) {
                this.counts[item.block]++;
            }
        });
    }

    updateCounterUI(blockName) {
        const counterEl = this.board.querySelector(`.${this.classes.title}[data-title-block="${blockName}"] .${this.classes.titleCounter}`);
        if (counterEl) {
            counterEl.textContent = this.counts[blockName] || 0;
        }
    }

    buildTitles() {
        const titlesContainer = this.board.querySelector(`.${this.classes.titles}`);
        this.settings.titles.forEach((title, index) => {
            this.renderTitleNode(titlesContainer, title, this.settings.colours[index]);
        });
    }

    renderTitleNode(container, title, color) {
        const titleEl = document.createElement('div');
        titleEl.className = this.classes.title;
        titleEl.setAttribute('data-title-block', title);
        if (color) {
            titleEl.setAttribute('style', `background: ${color}`);
        }
        
        // Wrap the text and counter in a flex container for perfect alignment
        titleEl.innerHTML = `
            <div class="cd_kanban_board_title_inner">
                <span class="${this.classes.titleText}">${title}</span>
                <span class="${this.classes.titleCounter}">${this.counts[title] || 0}</span>
            </div>
        `;
        container.appendChild(titleEl);
    }

    buildBlocks() {
        const blocksContainer = this.board.querySelector(`.${this.classes.blocks}`);
        this.settings.titles.forEach((title, index) => {
            this.renderBlockNode(blocksContainer, title, index);
        });
    }

    renderBlockNode(container, title, index) {
        const blockEl = document.createElement('div');
        blockEl.className = this.classes.block;
        blockEl.setAttribute('data-block', title);
        blockEl.setAttribute('data-index', index);
        container.appendChild(blockEl);
    }

    buildItems() {
        this.settings.items.forEach(item => this.renderItem(item));
    }

    renderItem(item) {
        const block = this.board.querySelector(`.${this.classes.block}[data-block="${item.block}"]`);
        if (!block) return null;

        const itemEl = document.createElement('div');
        itemEl.className = this.classes.itemKanban;
        itemEl.setAttribute('data-id', item.id);
        itemEl.setAttribute('draggable', 'true');

        let contents = `<div class="${this.classes.itemTitle}">${item.title}</div>`;
        if (item.link) {
            contents += `<a href="${item.link}" target="_blank">${item.link_text || item.link}</a>`;
        }
        if (item.footer) {
            contents += `<div class="${this.classes.itemFooter}">${item.footer}</div>`;
        }

        itemEl.innerHTML = contents;
        block.appendChild(itemEl);

        this.manageItemStyles(itemEl, item);
        return itemEl;
    }

    manageItemStyles(element, data) {
        if (!element || !data) return;

        if (data.textDecoration) {
            element.style.textDecoration = data.textDecoration;
            element.style.opacity = data.textDecoration === "line-through" ? "0.7" : "1";
        } else if (data.block === "Finished" || data.block === "Done") {
            element.style.textDecoration = "line-through";
            element.style.opacity = "0.7";
        } else {
            element.style.textDecoration = "none";
            element.style.opacity = "1";
        }

        if (data.color) {
            element.style.borderLeft = `5px solid ${data.color}`;
        } else {
            element.style.borderLeft = "";
        }
    }

    addBlock(title, color = null) {
        if (!title || this.settings.titles.includes(title)) return false;

        this.settings.titles.push(title);
        this.counts[title] = 0;
        
        if (color) {
            this.settings.colours[this.settings.titles.length - 1] = color;
        }

        const titlesContainer = this.board.querySelector(`.${this.classes.titles}`);
        const blocksContainer = this.board.querySelector(`.${this.classes.blocks}`);
        const newIndex = this.settings.titles.length - 1;

        this.renderTitleNode(titlesContainer, title, color);
        this.renderBlockNode(blocksContainer, title, newIndex);
        return true;
    }

    addItem(item) {
        if (!item || !item.id || !item.block || !item.title) return false;
        if (this.settings.items.some(existingItem => existingItem.id == item.id)) return false;

        this.settings.items.push(item);
        const element = this.renderItem(item);

        if (element) {
            if (this.counts[item.block] !== undefined) {
                this.counts[item.block]++;
                this.updateCounterUI(item.block);
            }

            const enrichedItem = this.enrichItemElement(element);
            const enrichedTarget = this.enrichBlockElement(element.parentElement);
            this.settings.onChange(enrichedItem, null, enrichedTarget);
            return true;
        }
        return false;
    }

    removeItem(id) {
        const itemIndex = this.settings.items.findIndex(item => item.id == id);
        if (itemIndex === -1) return false;

        const removedItemData = this.settings.items[itemIndex];
        const itemElement = this.board.querySelector(`.${this.classes.itemKanban}[data-id="${id}"]`);
        
        if (itemElement) itemElement.remove();
        this.settings.items.splice(itemIndex, 1);

        if (this.counts[removedItemData.block] !== undefined) {
            this.counts[removedItemData.block]--;
            this.updateCounterUI(removedItemData.block);
        }

        this.settings.onRemove(id, removedItemData);
        return true;
    }

    updateItem(id, updatedFields) {
        const itemData = this.settings.items.find(item => item.id == id);
        if (!itemData) return false;

        const oldElement = this.board.querySelector(`.${this.classes.itemKanban}[data-id="${id}"]`);
        const oldBlockName = itemData.block;
        const targetBlockName = updatedFields.block || itemData.block;

        Object.assign(itemData, updatedFields, { block: targetBlockName });

        if (oldElement) {
            const targetBlockContainer = this.board.querySelector(`.${this.classes.block}[data-block="${targetBlockName}"]`);
            if (targetBlockContainer) {
                let contents = `<div class="${this.classes.itemTitle}">${itemData.title}</div>`;
                if (itemData.link) {
                    contents += `<a href="${itemData.link}" target="_blank">${itemData.link_text || itemData.link}</a>`;
                }
                if (itemData.footer) {
                    contents += `<div class="${this.classes.itemFooter}">${itemData.footer}</div>`;
                }
                
                oldElement.innerHTML = contents;
                this.manageItemStyles(oldElement, itemData);

                if (oldElement.parentElement !== targetBlockContainer) {
                    targetBlockContainer.appendChild(oldElement);
                    
                    if (this.counts[oldBlockName] !== undefined) this.counts[oldBlockName]--;
                    if (this.counts[targetBlockName] !== undefined) this.counts[targetBlockName]++;
                    this.updateCounterUI(oldBlockName);
                    this.updateCounterUI(targetBlockName);
                }

                const enrichedItem = this.enrichItemElement(oldElement);
                const enrichedTarget = this.enrichBlockElement(targetBlockContainer);
                this.settings.onChange(enrichedItem, null, enrichedTarget);
                return true;
            }
        }
        return false;
    }

    refreshItems(newItems) {
        if (!Array.isArray(newItems)) return false;

        const currentElements = this.board.querySelectorAll(`.${this.classes.itemKanban}`);
        currentElements.forEach(el => el.remove());

        this.settings.items = [...newItems];

        Object.keys(this.counts).forEach(key => { this.counts[key] = 0; });
        this.calculateInitialCounts();
        
        this.buildItems();
        this.settings.titles.forEach(title => this.updateCounterUI(title));
        return true;
    }

    filterItems(query) {
        const cleanQuery = query.toLowerCase().trim();
        const allItems = this.board.querySelectorAll(`.${this.classes.itemKanban}`);

        allItems.forEach(itemElement => {
            const itemId = itemElement.getAttribute('data-id');
            const data = this.settings.items.find(i => i.id == itemId);

            if (!data) return;

            const matchTitle = data.title ? data.title.toLowerCase().includes(cleanQuery) : false;
            const matchFooter = data.footer ? data.footer.toLowerCase().includes(cleanQuery) : false;

            if (matchTitle || matchFooter || cleanQuery === '') {
                itemElement.style.display = '';
            } else {
                itemElement.style.display = 'none';
            }
        });
    }

    enrichItemElement(element) {
        if (!element) return null;
        const itemId = element.getAttribute('data-id');
        const itemData = this.settings.items.find(i => i.id == itemId) || {};
        
        let verticalIndex = -1;
        if (element.parentElement) {
            const siblings = [...element.parentElement.querySelectorAll(`.${this.classes.itemKanban}`)];
            verticalIndex = siblings.indexOf(element);
        }
        
        return Object.assign(element, {
            itemKanban: {
                id: itemData.id,
                title: itemData.title,
                block: itemData.block,
                link: itemData.link || null,
                link_text: itemData.link_text || null,
                footer: itemData.footer || null,
                color: itemData.color || null,
                textDecoration: itemData.textDecoration || null,
                verticalIndex: verticalIndex, 
                rawItem: itemData
            }
        });
    }

    enrichBlockElement(element) {
        if (!element) return null;
        return Object.assign(element, {
            block: element.getAttribute('data-block'),
            index: parseInt(element.getAttribute('data-index'), 10)
        });
    }

    setupEventListeners() {
        this.board.addEventListener('contextmenu', (e) => {
            const itemElement = e.target.closest(`.${this.classes.itemKanban}`);
            if (itemElement) {
                e.preventDefault();
                const enrichedItem = this.enrichItemElement(itemElement);
                this.settings.onRightClick(enrichedItem, e);
            }
        });

        this.board.addEventListener('dblclick', (e) => {
            const itemElement = e.target.closest(`.${this.classes.itemKanban}`);
            if (itemElement) {
                const enrichedItem = this.enrichItemElement(itemElement);
                this.settings.onDblClick(enrichedItem, e);
            }
        });
    }

    setupDragAndDrop() {
        this.board.addEventListener('dragstart', (e) => {
            const target = e.target.closest(`.${this.classes.itemKanban}`);
            if (target) {
                const enrichedItem = this.enrichItemElement(target);
                
                // --- NEW: BEFORE DRAG CHECK ---
                if (this.settings.onBeforeDrag(enrichedItem, e) === false) {
                    e.preventDefault(); // Condition failed, abort dragging
                    return;
                }

                this.draggedItem = target;
                this.sourceBlock = target.parentElement;
                setTimeout(() => target.classList.add('dragging'), 0);
            }
        });

        this.board.addEventListener('dragend', (e) => {
            const target = e.target.closest(`.${this.classes.itemKanban}`);
            if (target && this.draggedItem) {
                target.classList.remove('dragging');
                
                const blocks = this.board.querySelectorAll(`.${this.classes.block}`);
                blocks.forEach(b => b.classList.remove('drag-over'));

                const currentBlockElement = this.draggedItem.parentElement;
                if (!currentBlockElement) return;

                const oldBlockName = this.sourceBlock.getAttribute('data-block');
                const targetBlockName = currentBlockElement.getAttribute('data-block');
                const itemId = this.draggedItem.getAttribute('data-id');
                const itemData = this.settings.items.find(i => i.id == itemId);
                
                if (itemData) {
                    itemData.block = targetBlockName;
                    if (targetBlockName !== "Finished" && targetBlockName !== "Done" && itemData.textDecoration === "line-through") {
                        itemData.textDecoration = "none";
                    }
                    this.manageItemStyles(this.draggedItem, itemData);
                }

                const movedColumns = this.sourceBlock !== currentBlockElement;
                if (movedColumns) {
                    if (this.counts[oldBlockName] !== undefined) this.counts[oldBlockName]--;
                    if (this.counts[targetBlockName] !== undefined) this.counts[targetBlockName]++;
                    this.updateCounterUI(oldBlockName);
                    this.updateCounterUI(targetBlockName);
                }

                const callbackItem = this.enrichItemElement(this.draggedItem);
                const callbackSource = this.enrichBlockElement(this.sourceBlock);
                const callbackTarget = this.enrichBlockElement(currentBlockElement);

                if (movedColumns) {
                    this.settings.onReceive(callbackItem, callbackTarget);
                }
                
                this.settings.onChange(callbackItem, callbackSource, callbackTarget);
                
                this.draggedItem = null;
                this.sourceBlock = null;
            }
        });

        this.board.addEventListener('dragover', (e) => {
            const block = e.target.closest(`.${this.classes.block}`);
            if (block && this.draggedItem) {
                e.preventDefault(); 
                block.classList.add('drag-over');
                
                const afterElement = this.getDragAfterElement(block, e.clientY);
                if (afterElement == null) {
                    block.appendChild(this.draggedItem);
                } else {
                    block.insertBefore(this.draggedItem, afterElement);
                }
            }
        });

        this.board.addEventListener('dragleave', (e) => {
            const block = e.target.closest(`.${this.classes.block}`);
            if (block) {
                block.classList.remove('drag-over');
            }
        });
        
        this.board.addEventListener('drop', (e) => {
            e.preventDefault();
        });
    }

    getDragAfterElement(block, y) {
        const draggableElements = [...block.querySelectorAll(`.${this.classes.itemKanban}:not(.dragging)`)];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

window.KanbanBoard = KanbanBoard;