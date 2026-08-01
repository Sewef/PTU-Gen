function setupMovesEditor(pokemon) {
    const addMoveBtn = document.getElementById('addMoveBtn');
    const addBlankMoveBtn = document.getElementById('addBlankMoveBtn');
    if (!addMoveBtn) return;

    // Generate the dynamic moves display with all move cards
    updateMovesDisplay(pokemon);

    addMoveBtn.addEventListener('click', function () {
        showAddMoveModal(pokemon);
    });

    if (addBlankMoveBtn) {
        addBlankMoveBtn.addEventListener('click', function () {
            addBlankMove(pokemon);
        });
    }
}

// Remove a move from the pokemon
function removeMove(pokemon, moveName) {
    pokemon.moves = pokemon.moves.filter(m => m.name !== moveName);
    updateMovesDisplay(pokemon);
}

// Adjust Damage Base for a move
function adjustMoveDB(pokemon, moveName, delta) {
    const move = pokemon.moves.find(m => m.name === moveName);
    if (!move || !move.damageBase) return;

    // Damage Base conversion table
    const DAMAGE_BASE_TABLE = {
        1: { dmg: '1d6+1', min: 2, avg: 5, max: 7 },
        2: { dmg: '1d6+3', min: 4, avg: 7, max: 9 },
        3: { dmg: '1d6+5', min: 6, avg: 9, max: 11 },
        4: { dmg: '1d8+6', min: 7, avg: 11, max: 14 },
        5: { dmg: '1d8+8', min: 9, avg: 13, max: 16 },
        6: { dmg: '2d6+8', min: 10, avg: 15, max: 20 },
        7: { dmg: '2d6+10', min: 12, avg: 17, max: 22 },
        8: { dmg: '2d8+10', min: 12, avg: 19, max: 26 },
        9: { dmg: '2d10+10', min: 12, avg: 21, max: 30 },
        10: { dmg: '3d8+10', min: 13, avg: 24, max: 34 },
        11: { dmg: '3d10+10', min: 13, avg: 27, max: 40 },
        12: { dmg: '3d12+10', min: 13, avg: 30, max: 46 },
        13: { dmg: '4d10+10', min: 14, avg: 35, max: 50 },
        14: { dmg: '4d10+15', min: 19, avg: 40, max: 55 },
        15: { dmg: '4d10+20', min: 24, avg: 45, max: 60 },
        16: { dmg: '5d10+20', min: 25, avg: 50, max: 70 },
        17: { dmg: '5d12+25', min: 30, avg: 60, max: 85 },
        18: { dmg: '6d12+25', min: 31, avg: 65, max: 97 },
        19: { dmg: '6d12+30', min: 36, avg: 70, max: 102 },
        20: { dmg: '6d12+35', min: 41, avg: 75, max: 107 },
        21: { dmg: '6d12+40', min: 46, avg: 80, max: 112 },
        22: { dmg: '6d12+45', min: 51, avg: 85, max: 117 },
        23: { dmg: '6d12+50', min: 56, avg: 90, max: 122 },
        24: { dmg: '6d12+55', min: 61, avg: 95, max: 127 },
        25: { dmg: '6d12+60', min: 66, avg: 100, max: 132 },
        26: { dmg: '7d12+65', min: 72, avg: 110, max: 149 },
        27: { dmg: '8d12+70', min: 78, avg: 120, max: 166 },
        28: { dmg: '8d12+80', min: 88, avg: 130, max: 176 }
    };

    // Get current DB - it's stored as 'DB11', 'DB12', etc.
    let currentDB = move.damageBase.short;
    if (typeof currentDB === 'string') {
        // Extract the number from 'DB11' format
        currentDB = parseInt(currentDB.replace('DB', ''));
    }
    if (typeof currentDB !== 'number' || isNaN(currentDB)) {
        console.error('Invalid DB value:', move.damageBase);
        return;
    }

    let newDB = currentDB + delta;

    // Clamp to valid range
    newDB = Math.max(1, Math.min(28, newDB));

    if (newDB === currentDB) return; // No change

    // Update the damage base
    const newDamageData = DAMAGE_BASE_TABLE[newDB];
    if (!newDamageData) {
        console.error('No damage data for DB:', newDB);
        return;
    }

    move.damageBase.short = 'DB' + newDB;
    move.damageBase.dmg = newDamageData.dmg;
    move.damageBase.min = newDamageData.min;
    move.damageBase.avg = newDamageData.avg;
    move.damageBase.max = newDamageData.max;

    updateMovesDisplay(pokemon);
}

// Toggle move usage tracking
function toggleMoveUsage(pokemon, moveName, usageIndex) {
    const move = pokemon.moves.find(m => m.name === moveName);
    if (!move) return;

    // Initialize usageCount if not present
    if (!move.usageCount) {
        move.usageCount = 0;
    }

    // Toggle the usage at this index
    if (move.usageCount > usageIndex) {
        // If we're toggling off a previous usage, set count to this index
        move.usageCount = usageIndex;
    } else if (move.usageCount === usageIndex) {
        // If toggling on the next one, increment
        move.usageCount = usageIndex + 1;
    } else {
        // Fill in gaps - if clicking further ahead, set to that index + 1
        move.usageCount = usageIndex + 1;
    }

    updateMovesDisplay(pokemon);
}

function addMove(pokemon, moveData) {
    // Check if move already exists - if so, remove it instead
    const exists = pokemon.moves.some(m => m.name === moveData.name);
    if (exists) {
        removeMove(pokemon, moveData.name);
    } else {
        pokemon.moves.push(moveData);
        updateMovesDisplay(pokemon);
    }

    // Update modal button state if modal is open
    const btn = document.querySelector(`button[data-move-name="${moveData.name.toLowerCase()}"]`);
    if (btn) {
        const newExists = pokemon.moves.some(m => m.name === moveData.name);
        if (newExists) {
            btn.classList.add('exists');
            // Add checkmark if not present
            if (!btn.querySelector('.move-btn-checkmark')) {
                const checkmark = document.createElement('span');
                checkmark.className = 'move-btn-checkmark';
                checkmark.textContent = ' ✓';
                btn.appendChild(checkmark);
            }
        } else {
            btn.classList.remove('exists');
            // Remove checkmark if present
            const checkmark = btn.querySelector('.move-btn-checkmark');
            if (checkmark) checkmark.remove();
        }
    }
}

// Add a blank move
function addBlankMove(pokemon) {
    let counter = 1;
    let newName = `Custom Move ${counter}`;
    while (pokemon.moves.some(m => m.name === newName)) {
        counter++;
        newName = `Custom Move ${counter}`;
    }

    const blankMove = {
        name: newName,
        type: '',
        frequency: '',
        class: '',
        range: '',
        ac: '',
        db: '',
        effect: '',
        usageCount: 0,
        editable: true
    };

    pokemon.moves.push(blankMove);
    localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
    updateMovesDisplay(pokemon);
}

function getMoveAttackValue(pokemon, move) {
    const moveClass = String(move.class || '').toLowerCase();
    if (moveClass === 'physical') return Number(pokemon.stats?.atk) || 0;
    if (moveClass === 'special') return Number(pokemon.stats?.spA) || 0;
    return null;
}

function getMoveRollFormula(pokemon, move) {
    if (!move.damageBase?.dmg) return null;
    const attackValue = getMoveAttackValue(pokemon, move);
    return attackValue === null ? null : `${move.damageBase.dmg}+${attackValue}`;
}

async function copyMoveRollFormula(button) {
    const command = `/r ${button.dataset.rollFormula}`;

    try {
        await navigator.clipboard.writeText(command);
    } catch (error) {
        const textarea = document.createElement('textarea');
        textarea.value = command;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }

    const originalText = button.textContent;
    button.textContent = '✓ Copied';
    setTimeout(() => {
        button.textContent = originalText;
    }, 1200);
}

// Update moves display
function updateMovesDisplay(pokemon) {
    const movesList = document.getElementById('movesList');
    movesList.innerHTML = pokemon.moves.map((move, moveIndex) => {
        const isCustom = move.editable === true;
        if (isCustom) {
            return `
                <div class="section-card move type-${(move.type || 'normal').toLowerCase().replace(' ', '-')}" data-move-index="${moveIndex}" data-move-name="${move.name}">
                    <div class="section-card-header">
                        <input type="text" class="custom-move-name-input" value="${move.name}" placeholder="Move name" style="flex: 1; padding: 4px; border: 1px solid #ccc; border-radius: 4px;" />
                        <button class="remove-move-btn" title="Remove this move">✕ Remove</button>
                    </div>
                    <div class="section-card-field"><strong>Type:</strong> <input type="text" class="custom-move-field-input" data-field="type" value="${move.type || ''}" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 150px;" /></div>
                    <div class="section-card-field">
                        <strong>Frequency:</strong> <input type="text" class="custom-move-field-input" data-field="frequency" value="${move.frequency || ''}" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 150px;" />
                        <span class="usage-tracker" data-move-name="${move.name}">
                            <span class="usage-label">Uses:</span>
                            <div class="usage-boxes">
                                ${Array.from({ length: 4 }, (_, i) => `<button class="usage-checkbox ${(move.usageCount || 0) > i ? 'checked' : ''}" data-index="${i}" title="Use #${i + 1}"></button>`).join('')}
                            </div>
                        </span>
                    </div>
                    <div class="section-card-field"><strong>Class:</strong> <input type="text" class="custom-move-field-input" data-field="class" value="${move.class || ''}" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 150px;" /></div>
                    <div class="section-card-field"><strong>Range:</strong> <input type="text" class="custom-move-field-input" data-field="range" value="${move.range || ''}" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 150px;" /></div>
                    <div class="section-card-field"><strong>AC:</strong> <input type="text" class="custom-move-field-input" data-field="ac" value="${move.ac || ''}" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 100px;" /></div>
                    <div class="section-card-field"><strong>DB:</strong> <input type="text" class="custom-move-field-input" data-field="db" value="${move.db || ''}" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 100px;" /></div>
                    <div class="section-card-field"><strong>Effect:</strong> <input type="text" class="custom-move-field-input" data-field="effect" value="${move.effect || ''}" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 100%;" /></div>
                </div>
            `;
        } else {
            return `
                <div class="section-card move type-${(move.type || 'normal').toLowerCase().replace(' ', '-')}" data-move-name="${move.name}">
                    <div class="section-card-header">
                        <div class="section-card-name">${move.name}${move.type ? `<span class="move-badge type-${move.type.toLowerCase().replace(' ', '-')}">${move.type}</span>` : ''}${move.class ? `<span class="move-badge move-class-${move.class.toLowerCase()}">${move.class}</span>` : ''}</div>
                        <button class="remove-move-btn" title="Remove this move">✕ Remove</button>
                    </div>
                    <div class="section-card-field"><strong>Type:</strong> ${move.type || 'N/A'}</div>
                    <div class="section-card-field">
                        <strong>Frequency:</strong> ${move.frequency || 'N/A'}
                        ${move.frequency ? `<span class="usage-tracker" data-move-name="${move.name}"><span class="usage-label">Uses:</span><div class="usage-boxes">${Array.from({ length: /\d+/.test(move.frequency) ? parseInt(move.frequency.match(/\d+/)[0]) : 1 }, (_, i) => `<button class="usage-checkbox ${move.usageCount && move.usageCount > i ? 'checked' : ''}" data-index="${i}" title="Use #${i + 1}"></button>`).join('')}</div></span>` : ''}
                    </div>
                    <div class="section-card-field"><strong>Class:</strong> ${move.class || 'N/A'}</div>
                    <div class="section-card-field"><strong>Range:</strong> ${move.range || 'N/A'}</div>
                    ${move.ac ? `<div class="section-card-field"><strong>AC:</strong> ${move.ac}</div>` : ''}
                    ${move.damageBase ? `<div class="section-card-field db-field" data-move-name="${move.name}"><strong>${move.damageBase.short}${move.damageBase.stab ? ' (STAB)' : ''}:</strong> ${move.damageBase.dmg}${getMoveAttackValue(pokemon, move) !== null ? ` + ${getMoveAttackValue(pokemon, move)}` : ''} (${move.damageBase.min} | <strong>${move.damageBase.avg}</strong> | ${move.damageBase.max})
                        <button class="db-adjust-btn db-decrease" title="Decrease DB">−</button>
                        <button class="db-adjust-btn db-increase" title="Increase DB">+</button>
                        ${getMoveRollFormula(pokemon, move) ? `<button class="copy-roll-formula-btn" data-roll-formula="${getMoveRollFormula(pokemon, move)}" title="Copy /r ${getMoveRollFormula(pokemon, move)}">Copy roll</button>` : ''}
                    </div>` : ''}
                    ${move.effect ? `<div class="section-card-field"><strong>Effect:</strong> ${move.effect}</div>` : ''}
                </div>
            `;
        }
    }).join('');

    // Keep editable cards in sync with the model. Without this, their values only
    // live in the DOM and are lost whenever adding/removing a move rerenders the list.
    document.querySelectorAll('#movesList .section-card[data-move-index]').forEach(card => {
        const moveIndex = parseInt(card.getAttribute('data-move-index'), 10);
        const move = pokemon.moves[moveIndex];
        if (!move) return;

        const nameInput = card.querySelector('.custom-move-name-input');
        nameInput?.addEventListener('input', function () {
            move.name = this.value;
            card.setAttribute('data-move-name', move.name);
            card.querySelector('.usage-tracker')?.setAttribute('data-move-name', move.name);
            localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
        });

        card.querySelectorAll('.custom-move-field-input').forEach(input => {
            input.addEventListener('input', function () {
                move[this.getAttribute('data-field')] = this.value;
                localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
            });
        });
    });

    // Re-attach remove listeners
    document.querySelectorAll('.remove-move-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const moveElement = btn.closest('.section-card');
            const moveName = moveElement.getAttribute('data-move-name');
            removeMove(pokemon, moveName);
        });
    });

    // Re-attach DB adjustment listeners
    document.querySelectorAll('.db-adjust-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const dbField = btn.closest('.db-field');
            const moveName = dbField.getAttribute('data-move-name');
            const isIncrease = btn.classList.contains('db-increase');
            adjustMoveDB(pokemon, moveName, isIncrease ? 1 : -1);
        });
    });

    document.querySelectorAll('.copy-roll-formula-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            copyMoveRollFormula(btn);
        });
    });

    // Re-attach usage tracker listeners
    document.querySelectorAll('.usage-checkbox').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const tracker = btn.closest('.usage-tracker');
            const moveName = tracker.getAttribute('data-move-name');
            const index = parseInt(btn.getAttribute('data-index'));
            toggleMoveUsage(pokemon, moveName, index);
        });
    });
}

// Show modal to add a move
async function showAddMoveModal(pokemon) {
    try {
        // Get available moves for this pokemon
        const availableMoves = await getAvailableMovesForPokemon(pokemon);

        // Create modal with categorized moves
        const modalHTML = createAddMoveModalHTML(availableMoves);
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('addMoveModal');
        const closeBtn = document.getElementById('closeAddMoveBtn');
        const searchInput = document.getElementById('moveSearchInput');
        const moveGrid = document.getElementById('moveGrid');
        const toggleBtn = document.getElementById('toggleAllMovesBtn');
        const moveCountSpan = document.getElementById('moveCountSpan');

        let showingAllMoves = false;
        let allMovesData = null;

        // Close button
        closeBtn.addEventListener('click', function () {
            modal.remove();
        });

        // Close on outside click
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Toggle button for showing all moves
        toggleBtn.addEventListener('click', async function () {
            showingAllMoves = !showingAllMoves;

            if (showingAllMoves) {
                // Load all moves from database
                if (!allMovesData) {
                    allMovesData = await getAllMovesFromDatabase(pokemon.dataset || 'core', pokemon.fandex || []);
                }
                displayAllMovesInGrid(moveGrid, allMovesData, pokemon);
                toggleBtn.textContent = 'Show Available Moves';
                moveCountSpan.textContent = allMovesData.all?.length || 0;
                searchInput.value = '';
            } else {
                // Show only available moves
                displayMovesInGrid(moveGrid, availableMoves, pokemon);
                toggleBtn.textContent = 'Show All Moves';
                moveCountSpan.textContent = (availableMoves.levelUp?.length || 0) + (availableMoves.tm?.length || 0) + (availableMoves.tutor?.length || 0);
                searchInput.value = '';
            }
        });

        // Search functionality
        searchInput.addEventListener('input', function () {
            if (showingAllMoves) {
                filterAllMoves(moveGrid, this.value.toLowerCase(), allMovesData);
            } else {
                filterMoves(moveGrid, this.value.toLowerCase(), availableMoves);
            }
        });

        // Display all moves initially
        displayMovesInGrid(moveGrid, availableMoves, pokemon);
    } catch (error) {
        console.error('Failed to load available moves:', error);
        alert('Failed to load available moves');
    }
}

// Get available moves for a pokemon
async function getAvailableMovesForPokemon(pokemon) {
    try {
        const dataset = pokemon.dataset || 'core';
        const fandex = pokemon.fandex ? pokemon.fandex.join(',') : '';
        let url = `/api/pokemon/moves/${encodeURIComponent(pokemon.name)}?dataset=${dataset}`;
        if (fandex) url += `&fandex=${encodeURIComponent(fandex)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Failed to fetch moves:', response.statusText);
            return { levelUp: [], tm: [], tutor: [] };
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching moves:', error);
        return { levelUp: [], tm: [], tutor: [] };
    }
}

// Get all moves from database
async function getAllMovesFromDatabase(dataset = 'core', fandex = []) {
    try {
        let url = `/api/pokemon/all-moves?dataset=${dataset}`;
        if (fandex.length > 0) url += `&fandex=${encodeURIComponent(fandex.join(','))}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Failed to fetch all moves:', response.statusText);
            return { all: [] };
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching all moves:', error);
        return { all: [] };
    }
}

// Create modal HTML for adding moves
function createAddMoveModalHTML(availableMoves) {
    return `
        <div id="addMoveModal" class="modal-overlay">
            <div class="modal-content" style="max-width: 800px;">
                <h2 class="modal-title">Add Move</h2>
                <div class="modal-search-bar">
                    <input type="text" id="moveSearchInput" placeholder="Search moves..." class="modal-search-input" />
                    <button id="toggleAllMovesBtn" class="modal-action-btn">Show All Moves</button>
                </div>
                <div class="modal-info-box"">
                    <p class="modal-info-text"><strong>Total moves available:</strong> <span id="moveCountSpan">${(availableMoves.levelUp?.length || 0) + (availableMoves.tm?.length || 0) + (availableMoves.tutor?.length || 0)}</span></p>
                </div>
                <div id="moveGrid" class="move-grid"></div>
                <div class="modal-buttons">
                    <button id="closeAddMoveBtn" class="modal-btn modal-btn-secondary">Close</button>
                </div>
            </div>
        </div>
    `;
}

// Display moves in grid with categories
function displayMovesInGrid(grid, availableMoves, pokemon) {
    grid.innerHTML = '';
    let hasAnyMoves = false;

    // Level Up Moves
    if (availableMoves.levelUp && availableMoves.levelUp.length > 0) {
        hasAnyMoves = true;
        const section = document.createElement('div');
        section.className = 'move-section';
        section.innerHTML = `<div class="move-section-header">📖 Level Up Moves</div>`;

        const movesList = document.createElement('div');
        movesList.className = 'move-section-list';

        availableMoves.levelUp.forEach(move => {
            const moveBtn = createMoveButton(move, pokemon, 'levelUp');
            movesList.appendChild(moveBtn);
        });

        section.appendChild(movesList);
        grid.appendChild(section);
    }

    // TM/HM Moves
    if (availableMoves.tm && availableMoves.tm.length > 0) {
        hasAnyMoves = true;
        const section = document.createElement('div');
        section.className = 'move-section';
        section.innerHTML = `<div class="move-section-header">💿 TM/HM Moves</div>`;

        const movesList = document.createElement('div');
        movesList.className = 'move-section-list';

        availableMoves.tm.forEach(move => {
            const moveBtn = createMoveButton(move, pokemon, 'tm');
            movesList.appendChild(moveBtn);
        });

        section.appendChild(movesList);
        grid.appendChild(section);
    }

    // Tutor Moves
    if (availableMoves.tutor && availableMoves.tutor.length > 0) {
        hasAnyMoves = true;
        const section = document.createElement('div');
        section.className = 'move-section';
        section.innerHTML = `<div class="move-section-header">👨‍🏫 Tutor Moves</div>`;

        const movesList = document.createElement('div');
        movesList.className = 'move-section-list';

        availableMoves.tutor.forEach(move => {
            const moveBtn = createMoveButton(move, pokemon, 'tutor');
            movesList.appendChild(moveBtn);
        });

        section.appendChild(movesList);
        grid.appendChild(section);
    }

    if (!hasAnyMoves) {
        grid.innerHTML = '<div class="empty-grid-message">No moves available for this Pokémon</div>';
    }
}

// Create a move button
function createMoveButton(move, pokemon, category) {
    const btn = document.createElement('button');
    const levelInfo = category === 'levelUp' && move.level ? ` (Lv. ${move.level})` : '';

    // Check if move already exists
    const moveExists = pokemon.moves.some(m => m.name === move.name);

    btn.className = `modal-move-btn ${moveExists ? 'exists' : ''}`;

    // Create text content container
    const textSpan = document.createElement('span');
    textSpan.className = 'move-btn-text';
    textSpan.textContent = `${move.name}${levelInfo} - ${move.type || 'N/A'}`;
    btn.appendChild(textSpan);

    if (moveExists) {
        const checkmark = document.createElement('span');
        checkmark.className = 'move-btn-checkmark';
        checkmark.textContent = ' ✓';
        btn.appendChild(checkmark);
    }

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        addMove(pokemon, move);
    });

    btn.dataset.moveName = move.name.toLowerCase();
    btn.dataset.moveType = (move.type || 'N/A').toLowerCase();
    btn.dataset.category = category;

    return btn;
}

// Generic filter function for items in grid
function filterGridItems(grid, searchTerm, itemSelector, matchFn, noResultsClass, noResultsText) {
    let visibleCount = 0;

    // Filter buttons and track visibility
    grid.querySelectorAll(itemSelector).forEach(btn => {
        btn.classList.remove('btn-hidden');
        if (!matchFn(btn)) {
            btn.classList.add('btn-hidden');
        } else {
            visibleCount++;
        }
    });

    // Show/hide sections based on visible buttons
    const sections = Array.from(grid.children).filter(child =>
        child.style.marginBottom === '15px' &&
        child.querySelectorAll(itemSelector).length > 0
    );

    sections.forEach(section => {
        const hasVisibleButtons = Array.from(section.querySelectorAll(itemSelector))
            .some(btn => !btn.classList.contains('btn-hidden'));

        section.style.display = hasVisibleButtons ? 'block' : 'none';
        const listDiv = section.children[1];
        if (listDiv && listDiv.tagName === 'DIV') {
            listDiv.style.display = hasVisibleButtons ? 'grid' : 'none';
        }
    });

    // Show/hide no results message
    if (visibleCount === 0) {
        if (!grid.querySelector('.' + noResultsClass)) {
            const noResults = document.createElement('div');
            noResults.className = noResultsClass;
            noResults.style.cssText = 'padding: 20px; text-align: center; color: #999; grid-column: 1 / -1;';
            noResults.textContent = noResultsText;
            grid.appendChild(noResults);
        }
    } else {
        const noResults = grid.querySelector('.' + noResultsClass);
        if (noResults) noResults.remove();
    }
}

// Filter moves based on search
function filterMoves(grid, searchTerm, availableMoves) {
    filterGridItems(grid, searchTerm, 'button[data-move-name]',
        btn => btn.dataset.moveName.includes(searchTerm) || btn.dataset.moveType.includes(searchTerm),
        'no-results', 'No moves match your search');
}

// Display all moves from database in grid
function displayAllMovesInGrid(grid, allMoves, pokemon) {
    grid.innerHTML = '';

    if (!allMoves.all || allMoves.all.length === 0) {
        grid.innerHTML = '<div class="empty-grid-message">No moves available in database</div>';
        return;
    }

    const section = document.createElement('div');
    section.style.marginBottom = '15px';
    section.innerHTML = `<div class="move-section-header">📚 All Moves</div>`;

    const movesList = document.createElement('div');
    movesList.style.display = 'grid';
    movesList.style.gap = '8px';

    allMoves.all.forEach(move => {
        const moveBtn = createMoveButton(move, pokemon, 'all');
        movesList.appendChild(moveBtn);
    });

    section.appendChild(movesList);
    grid.appendChild(section);
}

// Filter all moves based on search
function filterAllMoves(grid, searchTerm, allMoves) {
    filterGridItems(grid, searchTerm, 'button[data-move-name]',
        btn => btn.dataset.moveName.includes(searchTerm) || btn.dataset.moveType.includes(searchTerm),
        'no-results', 'No moves match your search');
}

// Setup skills editor
