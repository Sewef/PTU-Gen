function setupSkillsEditor(pokemon) {
    document.querySelectorAll('.skill-input').forEach(input => {
        input.addEventListener('change', function () {
            const skillName = this.getAttribute('data-skill-name');
            const newValue = this.value.trim();
            
            if (skillName && pokemon.skills) {
                pokemon.skills[skillName] = newValue;
            }
        });
    });
}

// Update capabilities display
function updateCapabilitiesDisplay(pokemon) {
    // Save the updated pokemon to localStorage before reloading
    localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
    
    // Simply reload the entire pokemon details
    loadPokemonDetails();
}

// Setup abilities editor
function setupAbilitiesEditor(pokemon) {
    const addAbilityBtn = document.getElementById('addAbilityBtn');
    const addBlankAbilityBtn = document.getElementById('addBlankAbilityBtn');
    if (!addAbilityBtn) return;

    // Generate the dynamic abilities display with all ability cards
    updateAbilitiesDisplay(pokemon);

    addAbilityBtn.addEventListener('click', function () {
        showAddAbilityModal(pokemon);
    });

    if (addBlankAbilityBtn) {
        addBlankAbilityBtn.addEventListener('click', function () {
            addBlankAbility(pokemon);
        });
    }
}

// Toggle ability usage tracking
function toggleAbilityUsage(pokemon, abilityName, usageIndex) {
    const ability = pokemon.abilities.find(a => a.name === abilityName);
    if (!ability) return;

    // Initialize usageCount if not present
    if (!ability.usageCount) {
        ability.usageCount = 0;
    }

    // Toggle the usage at this index
    if (ability.usageCount > usageIndex) {
        ability.usageCount = usageIndex;
    } else if (ability.usageCount === usageIndex) {
        ability.usageCount = usageIndex + 1;
    } else {
        ability.usageCount = usageIndex + 1;
    }

    updateAbilitiesDisplay(pokemon);
}

// Remove an ability from the pokemon
function removeAbility(pokemon, abilityName) {
    pokemon.abilities = pokemon.abilities.filter(a => a.name !== abilityName);
    updateAbilitiesDisplay(pokemon);
}

// Add an ability to the pokemon
function addAbility(pokemon, abilityData) {
    // Check if ability already exists - if so, remove it instead
    const exists = pokemon.abilities.some(a => a.name === abilityData.name);
    if (exists) {
        removeAbility(pokemon, abilityData.name);
    } else {
        pokemon.abilities.push(abilityData);
        updateAbilitiesDisplay(pokemon);
    }
    
    // Update modal button state if modal is open
    const btn = document.querySelector(`button[data-ability-name="${abilityData.name.toLowerCase()}"]`);
    if (btn) {
        const newExists = pokemon.abilities.some(a => a.name === abilityData.name);
        if (newExists) {
            btn.classList.add('exists');
            // Add checkmark if not present
            if (!btn.querySelector('.ability-btn-checkmark')) {
                const titleDiv = btn.querySelector('.ability-btn-title');
                const checkmark = document.createElement('span');
                checkmark.className = 'ability-btn-checkmark';
                checkmark.textContent = ' ✓';
                titleDiv.appendChild(checkmark);
            }
        } else {
            btn.classList.remove('exists');
            // Remove checkmark if present
            const checkmark = btn.querySelector('.ability-btn-checkmark');
            if (checkmark) checkmark.remove();
        }
    }
}

// Add a blank ability
function addBlankAbility(pokemon) {
    let counter = 1;
    let newName = `Custom Ability ${counter}`;
    while (pokemon.abilities.some(a => a.name === newName)) {
        counter++;
        newName = `Custom Ability ${counter}`;
    }
    
    const blankAbility = {
        name: newName,
        frequency: '',
        effect: '',
        editable: true
    };
    
    pokemon.abilities.push(blankAbility);
    localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
    updateAbilitiesDisplay(pokemon);
}

// Update abilities display
function updateAbilitiesDisplay(pokemon) {
    const abilitiesList = document.getElementById('abilitiesList');
    abilitiesList.innerHTML = pokemon.abilities.map(ability => {
        const isCustom = ability.editable === true;
        if (isCustom) {
            return `
                <div class="section-card" data-ability-name="${ability.name}">
                    <div class="section-card-header">
                        <input type="text" class="custom-ability-name-input" value="${ability.name}" placeholder="Ability name" style="flex: 1; padding: 4px; border: 1px solid #ccc; border-radius: 4px;" />
                        <button class="remove-ability-btn" title="Remove this ability">✕ Remove</button>
                    </div>
                    <div class="section-card-field"><strong>Frequency:</strong> <input type="text" class="custom-ability-field-input" data-field="frequency" value="${ability.frequency || ''}" placeholder="e.g., Static, Daily x3" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 200px;" /></div>
                    <div class="section-card-field"><strong>Effect:</strong> <input type="text" class="custom-ability-field-input" data-field="effect" value="${ability.effect || ''}" placeholder="Ability effect" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; width: 100%;" /></div>
                </div>
            `;
        } else {
            return `
                <div class="section-card" data-ability-name="${ability.name}">
                    <div class="section-card-header">
                        <div class="section-card-name">${ability.name}</div>
                        <button class="remove-ability-btn" title="Remove this ability">✕ Remove</button>
                    </div>
                    ${ability.frequency ? `<div class="section-card-field"><strong>Frequency:</strong> ${ability.frequency}
                        <span class="usage-tracker" data-ability-name="${ability.name}">
                            <span class="usage-label">Uses:</span>
                            <div class="usage-boxes">
                                ${(() => {
                                    const freqMatch = /\d+/.test(ability.frequency) ? parseInt(ability.frequency.match(/\d+/)[0]) : 1;
                                    const count = ability.usageCount || 0;
                                    return Array.from({length: freqMatch}, (_, i) => `<button class="usage-checkbox ${count > i ? 'checked' : ''}" data-index="${i}" title="Use #${i+1}"></button>`).join('');
                                })()}
                            </div>
                        </span>
                    </div>` : ''}
                    ${ability.trigger ? `<div class="section-card-field"><strong>Trigger:</strong> ${ability.trigger}</div>` : ''}
                    ${ability.effect ? `<div class="section-card-field"><strong>Effect:</strong> ${ability.effect}</div>` : ''}
                    ${ability.bonus ? `<div class="section-card-field"><strong>Bonus:</strong> ${ability.bonus}</div>` : ''}
                    ${ability.special ? `<div class="section-card-field"><strong>Special:</strong> ${ability.special}</div>` : ''}
                    ${ability.note ? `<div class="section-card-field note"><strong>Note:</strong> ${ability.note}</div>` : ''}
                </div>
            `;
        }
    }).join('');

    // Re-attach remove listeners
    document.querySelectorAll('.remove-ability-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const abilityElement = btn.closest('.section-card');
            const abilityName = abilityElement.getAttribute('data-ability-name');
            removeAbility(pokemon, abilityName);
        });
    });

    // Re-attach usage tracker listeners for abilities
    document.querySelectorAll('.section-card .usage-checkbox').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const tracker = btn.closest('.usage-tracker');
            const abilityName = tracker.getAttribute('data-ability-name');
            const index = parseInt(btn.getAttribute('data-index'));
            toggleAbilityUsage(pokemon, abilityName, index);
        });
    });
}

// Show modal to add an ability
async function showAddAbilityModal(pokemon) {
    try {
        // Get available abilities for this pokemon
        const availableAbilities = await getAvailableAbilitiesForPokemon(pokemon);
        
        // Create modal with categorized abilities
        const modalHTML = createAddAbilityModalHTML(availableAbilities);
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('addAbilityModal');
        const closeBtn = document.getElementById('closeAddAbilityBtn');
        const searchInput = document.getElementById('abilitySearchInput');
        const abilitiesGrid = document.getElementById('abilitiesGrid');
        const toggleBtn = document.getElementById('toggleAllAbilitiesBtn');
        const abilityCountSpan = document.getElementById('abilityCountSpan');

        let showingAllAbilities = false;
        let allAbilitiesData = null;

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

        // Toggle button for showing all abilities
        toggleBtn.addEventListener('click', async function () {
            showingAllAbilities = !showingAllAbilities;
            
            if (showingAllAbilities) {
                // Load all abilities from database
                if (!allAbilitiesData) {
                    allAbilitiesData = await getAllAbilitiesFromDatabase();
                }
                displayAllAbilitiesInGrid(abilitiesGrid, allAbilitiesData, pokemon);
                toggleBtn.textContent = 'Show Available Abilities';
                abilityCountSpan.textContent = allAbilitiesData.all?.length || 0;
                searchInput.value = '';
            } else {
                // Show only available abilities
                displayAbilitiesInGrid(abilitiesGrid, availableAbilities, pokemon);
                toggleBtn.textContent = 'Show All Abilities';
                abilityCountSpan.textContent = (availableAbilities.basic?.length || 0) + (availableAbilities.advanced?.length || 0) + (availableAbilities.high?.length || 0);
                searchInput.value = '';
            }
        });

        // Search functionality
        searchInput.addEventListener('input', function () {
            if (showingAllAbilities) {
                filterAllAbilities(abilitiesGrid, this.value.toLowerCase(), allAbilitiesData);
            } else {
                filterAbilities(abilitiesGrid, this.value.toLowerCase(), availableAbilities);
            }
        });

        // Display all abilities initially
        displayAbilitiesInGrid(abilitiesGrid, availableAbilities, pokemon);
    } catch (error) {
        console.error('Failed to load available abilities:', error);
        alert('Failed to load available abilities');
    }
}

// Get available abilities for a pokemon
async function getAvailableAbilitiesForPokemon(pokemon) {
    try {
        const dataset = pokemon.dataset || 'core';
        const response = await fetch(`/api/pokemon/abilities/${encodeURIComponent(pokemon.name)}?dataset=${dataset}`);
        if (!response.ok) {
            console.error('Failed to fetch abilities:', response.statusText);
            return { basic: [], advanced: [], high: [] };
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching abilities:', error);
        return { basic: [], advanced: [], high: [] };
    }
}

// Get all abilities from database
async function getAllAbilitiesFromDatabase() {
    try {
        const response = await fetch('/api/pokemon/all-abilities');
        if (!response.ok) {
            console.error('Failed to fetch all abilities:', response.statusText);
            return { all: [] };
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching all abilities:', error);
        return { all: [] };
    }
}

// Create modal HTML for adding an ability
function createAddAbilityModalHTML(availableAbilities) {
    return `
        <div id="addAbilityModal" class="modal-overlay">
            <div class="modal-content" style="max-width: 800px;">
                <h2 class="modal-title">Edit</h2>
                <div class="modal-search-bar">
                    <input type="text" id="abilitySearchInput" placeholder="Search abilities..." class="modal-search-input" />
                    <button id="toggleAllAbilitiesBtn" class="modal-action-btn">Show All Abilities</button>
                </div>
                <div class="modal-info-box" style="margin-bottom: 20px;">
                    <p class="modal-info-text"><strong>Total abilities available:</strong> <span id="abilityCountSpan">${(availableAbilities.basic?.length || 0) + (availableAbilities.advanced?.length || 0) + (availableAbilities.high?.length || 0)}</span></p>
                </div>
                <div id="abilitiesGrid" class="move-grid"></div>
                <div class="modal-buttons">
                    <button id="closeAddAbilityBtn" class="modal-btn modal-btn-secondary">Close</button>
                </div>
            </div>
        </div>
    `;
}

// Display abilities in grid with categories
function displayAbilitiesInGrid(grid, availableAbilities, pokemon) {
    grid.innerHTML = '';
    let hasAnyAbilities = false;

    // Basic Abilities
    if (availableAbilities.basic && availableAbilities.basic.length > 0) {
        hasAnyAbilities = true;
        const section = document.createElement('div');
        section.className = 'move-section';
        section.innerHTML = `<div class="move-section-header">⭐ Basic Abilities</div>`;
        
        const abilitiesList = document.createElement('div');
        abilitiesList.className = 'move-section-list';
        
        availableAbilities.basic.forEach(ability => {
            const btn = createAbilityButton(ability, pokemon, 'basic');
            abilitiesList.appendChild(btn);
        });
        
        section.appendChild(abilitiesList);
        grid.appendChild(section);
    }

    // Advanced Abilities
    if (availableAbilities.advanced && availableAbilities.advanced.length > 0) {
        hasAnyAbilities = true;
        const section = document.createElement('div');
        section.className = 'move-section';
        section.innerHTML = `<div class="move-section-header">🔷 Advanced Abilities</div>`;
        
        const abilitiesList = document.createElement('div');
        abilitiesList.className = 'move-section-list';
        
        availableAbilities.advanced.forEach(ability => {
            const btn = createAbilityButton(ability, pokemon, 'advanced');
            abilitiesList.appendChild(btn);
        });
        
        section.appendChild(abilitiesList);
        grid.appendChild(section);
    }

    // High Ability
    if (availableAbilities.high && availableAbilities.high.length > 0) {
        hasAnyAbilities = true;
        const section = document.createElement('div');
        section.className = 'move-section';
        section.innerHTML = `<div class="move-section-header">👑 High Ability</div>`;
        
        const abilitiesList = document.createElement('div');
        abilitiesList.className = 'move-section-list';
        
        availableAbilities.high.forEach(ability => {
            const btn = createAbilityButton(ability, pokemon, 'high');
            abilitiesList.appendChild(btn);
        });
        
        section.appendChild(abilitiesList);
        grid.appendChild(section);
    }

    if (!hasAnyAbilities) {
        grid.innerHTML = '<div class="empty-grid-message">No abilities available for this Pokémon</div>';
    }
}

// Create an ability button
function createAbilityButton(ability, pokemon, category) {
    const btn = document.createElement('button');
    
    // Check if ability already exists
    const abilityExists = pokemon.abilities.some(a => a.name === ability.name);
    
    btn.className = `modal-ability-btn ${abilityExists ? 'exists' : ''}`;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'ability-btn-title';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'ability-btn-name';
    nameSpan.textContent = ability.name;
    titleDiv.appendChild(nameSpan);
    
    if (abilityExists) {
        const checkmarkSpan = document.createElement('span');
        checkmarkSpan.className = 'ability-btn-checkmark';
        checkmarkSpan.textContent = ' ✓';
        titleDiv.appendChild(checkmarkSpan);
    }

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'ability-btn-details';
    detailsDiv.textContent = ability.frequency || 'N/A';

    btn.appendChild(titleDiv);
    btn.appendChild(detailsDiv);

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        addAbility(pokemon, ability);
    });

    btn.dataset.abilityName = ability.name.toLowerCase();

    return btn;
}

// Filter abilities based on search
function filterAbilities(grid, searchTerm, availableAbilities) {
    filterGridItems(grid, searchTerm, 'button[data-ability-name]',
        btn => btn.dataset.abilityName.includes(searchTerm),
        'no-results-abilities', 'No abilities match your search');
}

// Display all abilities from database in grid
function displayAllAbilitiesInGrid(grid, allAbilities, pokemon) {
    grid.innerHTML = '';
    
    if (!allAbilities.all || allAbilities.all.length === 0) {
        grid.innerHTML = '<div class="empty-grid-message">No abilities available in database</div>';
        return;
    }

    const section = document.createElement('div');
    section.style.marginBottom = '15px';
    section.innerHTML = `<div class="move-section-header">📚 All Abilities</div>`;
    
    const abilitiesList = document.createElement('div');
    abilitiesList.style.display = 'grid';
    abilitiesList.style.gap = '8px';
    
    allAbilities.all.forEach(ability => {
        const btn = createAbilityButton(ability, pokemon, 'all');
        abilitiesList.appendChild(btn);
    });
    
    section.appendChild(abilitiesList);
    grid.appendChild(section);
}

// Filter all abilities based on search
function filterAllAbilities(grid, searchTerm, allAbilities) {
    filterGridItems(grid, searchTerm, 'button[data-ability-name]',
        btn => btn.dataset.abilityName.includes(searchTerm),
        'no-results-abilities', 'No abilities match your search');
}

// Load on page load
