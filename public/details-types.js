let currentTypeMultiplier = 2;
let currentPokemon = null;

// Type effectiveness chart - structured as [defendingType][attackingType]
// Based on Vue.js reference (X=attacking type, Y=defending type)
const typeEffectiveness = {"normal": {"bug": 1, "dark": 1, "dragon": 1, "electric": 1, "fairy": 1, "fighting": 2, "fire": 1, "flying": 1, "ghost": 0, "grass": 1, "ground": 1, "ice": 1, "normal": 1, "poison": 1, "psychic": 1, "rock": 1, "steel": 1, "water": 1}, "fire": {"bug": 0.5, "dark": 1, "dragon": 1, "electric": 1, "fairy": 0.5, "fighting": 1, "fire": 0.5, "flying": 1, "ghost": 1, "grass": 0.5, "ground": 2, "ice": 0.5, "normal": 1, "poison": 1, "psychic": 1, "rock": 2, "steel": 0.5, "water": 2}, "water": {"bug": 1, "dark": 1, "dragon": 1, "electric": 2, "fairy": 1, "fighting": 1, "fire": 0.5, "flying": 1, "ghost": 1, "grass": 2, "ground": 1, "ice": 0.5, "normal": 1, "poison": 1, "psychic": 1, "rock": 1, "steel": 0.5, "water": 0.5}, "grass": {"bug": 2, "dark": 1, "dragon": 1, "electric": 0.5, "fairy": 1, "fighting": 1, "fire": 2, "flying": 2, "ghost": 1, "grass": 0.5, "ground": 0.5, "ice": 2, "normal": 1, "poison": 2, "psychic": 1, "rock": 1, "steel": 1, "water": 0.5}, "flying": {"bug": 0.5, "dark": 1, "dragon": 1, "electric": 2, "fairy": 1, "fighting": 0.5, "fire": 1, "flying": 1, "ghost": 1, "grass": 0.5, "ground": 0, "ice": 2, "normal": 1, "poison": 1, "psychic": 1, "rock": 2, "steel": 1, "water": 1}, "fighting": {"bug": 0.5, "dark": 0.5, "dragon": 1, "electric": 1, "fairy": 2, "fighting": 1, "fire": 1, "flying": 2, "ghost": 1, "grass": 1, "ground": 1, "ice": 1, "normal": 1, "poison": 1, "psychic": 2, "rock": 0.5, "steel": 1, "water": 1}, "poison": {"bug": 0.5, "dark": 1, "dragon": 1, "electric": 1, "fairy": 0.5, "fighting": 0.5, "fire": 1, "flying": 1, "ghost": 1, "grass": 0.5, "ground": 2, "ice": 1, "normal": 1, "poison": 0.5, "psychic": 2, "rock": 1, "steel": 1, "water": 1}, "ground": {"bug": 1, "dark": 1, "dragon": 1, "electric": 0, "fairy": 1, "fighting": 1, "fire": 1, "flying": 1, "ghost": 1, "grass": 2, "ground": 1, "ice": 2, "normal": 1, "poison": 0.5, "psychic": 1, "rock": 0.5, "steel": 1, "water": 2}, "rock": {"bug": 1, "dark": 1, "dragon": 1, "electric": 1, "fairy": 1, "fighting": 2, "fire": 0.5, "flying": 0.5, "ghost": 1, "grass": 2, "ground": 2, "ice": 1, "normal": 0.5, "poison": 0.5, "psychic": 1, "rock": 1, "steel": 2, "water": 2}, "psychic": {"bug": 2, "dark": 2, "dragon": 1, "electric": 1, "fairy": 1, "fighting": 0.5, "fire": 1, "flying": 1, "ghost": 2, "grass": 1, "ground": 1, "ice": 1, "normal": 1, "poison": 1, "psychic": 0.5, "rock": 1, "steel": 1, "water": 1}, "ice": {"bug": 1, "dark": 1, "dragon": 1, "electric": 1, "fairy": 1, "fighting": 2, "fire": 2, "flying": 1, "ghost": 1, "grass": 1, "ground": 1, "ice": 0.5, "normal": 1, "poison": 1, "psychic": 1, "rock": 2, "steel": 2, "water": 1}, "bug": {"bug": 1, "dark": 1, "dragon": 1, "electric": 1, "fairy": 1, "fighting": 0.5, "fire": 2, "flying": 2, "ghost": 1, "grass": 0.5, "ground": 0.5, "ice": 1, "normal": 1, "poison": 1, "psychic": 1, "rock": 2, "steel": 0.5, "water": 1}, "ghost": {"bug": 0.5, "dark": 2, "dragon": 1, "electric": 1, "fairy": 1, "fighting": 0, "fire": 1, "flying": 1, "ghost": 2, "grass": 1, "ground": 1, "ice": 1, "normal": 0, "poison": 0.5, "psychic": 1, "rock": 1, "steel": 1, "water": 1}, "steel": {"bug": 0.5, "dark": 1, "dragon": 0.5, "electric": 1, "fairy": 0.5, "fighting": 2, "fire": 2, "flying": 0.5, "ghost": 1, "grass": 0.5, "ground": 2, "ice": 0.5, "normal": 0.5, "poison": 0, "psychic": 0.5, "rock": 0.5, "steel": 0.5, "water": 1}, "dragon": {"bug": 1, "dark": 1, "dragon": 2, "electric": 0.5, "fairy": 2, "fighting": 1, "fire": 0.5, "flying": 1, "ghost": 1, "grass": 0.5, "ground": 1, "ice": 2, "normal": 1, "poison": 1, "psychic": 1, "rock": 1, "steel": 1, "water": 0.5}, "dark": {"bug": 2, "dark": 0.5, "dragon": 1, "electric": 1, "fairy": 2, "fighting": 2, "fire": 1, "flying": 1, "ghost": 0.5, "grass": 1, "ground": 1, "ice": 1, "normal": 1, "poison": 1, "psychic": 0, "rock": 1, "steel": 1, "water": 1}, "fairy": {"bug": 0.5, "dark": 0.5, "dragon": 0, "electric": 1, "fairy": 1, "fighting": 0.5, "fire": 1, "flying": 1, "ghost": 1, "grass": 1, "ground": 1, "ice": 1, "normal": 1, "poison": 2, "psychic": 1, "rock": 1, "steel": 2, "water": 1}, "electric": {"bug": 1, "dark": 1, "dragon": 1, "electric": 0.5, "fairy": 1, "fighting": 1, "fire": 1, "flying": 0.5, "ghost": 1, "grass": 1, "ground": 2, "ice": 1, "normal": 1, "poison": 1, "psychic": 1, "rock": 1, "steel": 0.5, "water": 1}};


function calculateTypeEffectiveness(types) {
    const effectiveness = {};
    const allTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];

    // Initialize all attacking types with 1x effectiveness
    allTypes.forEach(attackingType => {
        effectiveness[attackingType] = 1;
    });

    // For each attacking type, multiply effectiveness against each defending type
    allTypes.forEach(attackingType => {
        types.forEach(defendingType => {
            const defendingTypeLower = defendingType.toLowerCase();
            const defendingTypeData = typeEffectiveness[defendingTypeLower];
            
            if (!defendingTypeData) {
                console.warn(`No type data for defending type: ${defendingTypeLower}`);
                return;
            }
            
            const eff = defendingTypeData[attackingType];
            
            if (eff === undefined) {
                console.warn(`No effectiveness data for ${attackingType} vs ${defendingTypeLower}`);
                return;
            }
            
            effectiveness[attackingType] = effectiveness[attackingType] * eff;
        });
    });

    return effectiveness;
}

function displayTypeEffectiveness(pokemon) {
    // Get the actual types to use
    let typesToUse = pokemon.actualTypes || pokemon.types || [];
    
    // If types is a forme variant object, extract the actual types
    if (typesToUse.isFormeVariant) {
        const selectedForme = typesToUse.selectedForme;
        typesToUse = typesToUse.formes[selectedForme] || [];
    }

    const effectiveness = calculateTypeEffectiveness(typesToUse);
    const container = document.getElementById('typeEffectiveness');

    if (!container) return;

    container.innerHTML = '';

    const allTypes = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];
    const midpoint = Math.ceil(allTypes.length / 2);
    const firstHalf = allTypes.slice(0, midpoint);
    const secondHalf = allTypes.slice(midpoint);

    // Create function to render a table half
    const renderHalf = (types) => {
        let html = `
            <table class="details-table">
                <tbody>
                    <tr class="details-table-header-row">
        `;

        // First row: Type badges
        types.forEach(type => {
            html += `
                <td class="details-table-type-cell">
                    <span class="type-badge type-badge-table type-${type.toLowerCase().replace(' ', '-')}">${type}</span>
                </td>
            `;
        });

        html += `
                    </tr>
                    <tr class="details-table-body-row">
        `;

        // Second row: Effectiveness values
        types.forEach(type => {
            let eff = effectiveness[type.toLowerCase()];
            
            // Apply multiplier logic:
            // Mode x2: multiplicateurs normaux (x2, x4, etc)
            // Mode x1.5: système additif - chaque faiblesse ajoute 0.5 à la valeur de base (1)
            // - Une seule faiblesse (x2) → 1 + 0.5 = 1.5
            // - Double faiblesse (x4) → 1 + 0.5 + 0.5 = 2
            // - Résistances inchangées (x0.5, x0.25)
            if (currentTypeMultiplier === 1.5 && eff > 1) {
                // Compter le nombre de faiblesses (combien de fois on multiplie par 2)
                let weakness_count = 0;
                let temp = eff;
                while (temp > 1) {
                    weakness_count++;
                    temp = temp / 2;
                }
                // En mode x1.5, chaque faiblesse = +0.5
                eff = 1 + (0.5 * weakness_count);
            }
            // Résistances et neutral restent inchangés
            
            let effClass = 'eff-neutral'; // Default
            let effText = '1x';
            
            // Format effectiveness with minimal decimals
            const formatEff = (value) => {
                if (value === 0) return '0x';
                if (value === 1) return '1x';
                if (Number.isInteger(value)) return value + 'x';
                // Show minimal decimals (remove trailing zeros)
                return parseFloat(value.toFixed(2)).toString() + 'x';
            };

            if (eff === 0) {
                effClass = 'eff-immune';
                effText = '0x';
            } else if (eff <= 0.25) {
                effClass = 'eff-strong-resist';
                effText = formatEff(eff);
            } else if (eff <= 0.5) {
                effClass = 'eff-resist';
                effText = formatEff(eff);
            } else if (eff === 1) {
                effClass = 'eff-neutral';
                effText = '1x';
            } else if (eff <= 2) {
                effClass = 'eff-weak';
                effText = formatEff(eff);
            } else {
                effClass = 'eff-strong-weak';
                effText = formatEff(eff);
            }

            html += `
                <td class="type-eff-value-cell ${effClass}">
                    ${effText}
                </td>
            `;
        });

        html += `
                    </tr>
                </tbody>
            </table>
        `;

        return html;
    };

    container.innerHTML = renderHalf(firstHalf) + renderHalf(secondHalf);
}

function setupTypeEditor(pokemon) {
    const editTypesBtn = document.getElementById('editTypesBtn');
    console.log('setupTypeEditor called, editTypesBtn:', editTypesBtn);
    if (!editTypesBtn) return;

    editTypesBtn.addEventListener('click', function () {
        console.log('editTypesBtn clicked');
        showTypeModal(pokemon);
    });
}

// Setup type effectiveness multiplier buttons
function setupTypeMultiplierButtons(pokemon) {
    const multiplyBtn15 = document.getElementById('multiplyBtn15');
    const multiplyBtn2 = document.getElementById('multiplyBtn2');

    if (!multiplyBtn15 || !multiplyBtn2) return;
    
    // Initialize with x2 active
    updateMultiplierButtonStyles();

    multiplyBtn15.addEventListener('click', function () {
        if (currentTypeMultiplier === 1.5) {
            currentTypeMultiplier = 2;
        } else {
            currentTypeMultiplier = 1.5;
        }
        updateMultiplierButtonStyles();
        if (currentPokemon) {
            displayTypeEffectiveness(currentPokemon);
        }
    });

    multiplyBtn2.addEventListener('click', function () {
        if (currentTypeMultiplier === 2) {
            currentTypeMultiplier = 1.5;
        } else {
            currentTypeMultiplier = 2;
        }
        updateMultiplierButtonStyles();
        if (currentPokemon) {
            displayTypeEffectiveness(currentPokemon);
        }
    });
}

// Update multiplier button visual styles
function updateMultiplierButtonStyles() {
    const multiplyBtn15 = document.getElementById('multiplyBtn15');
    const multiplyBtn2 = document.getElementById('multiplyBtn2');
    
    if (!multiplyBtn15 || !multiplyBtn2) return;
    
    if (currentTypeMultiplier === 1.5) {
        multiplyBtn15.classList.remove('inactive');
        multiplyBtn15.classList.add('active');
        multiplyBtn2.classList.remove('active');
        multiplyBtn2.classList.add('inactive');
    } else {
        multiplyBtn2.classList.remove('inactive');
        multiplyBtn2.classList.add('active');
        multiplyBtn15.classList.remove('active');
        multiplyBtn15.classList.add('inactive');
    }
}

// Show type selection modal
function showTypeModal(pokemon) {
    console.log('showTypeModal called');
    const availableTypes = [
        'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting',
        'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
        'Dragon', 'Dark', 'Steel', 'Fairy'
    ];

    // Create modal HTML
    const modalHTML = `
        <div id="typeModal" class="modal-overlay">
            <div class="modal-content">
                <h2 class="modal-title">Select Types</h2>
                <div class="modal-info-box">
                    <p>Selected types: <span id="selectedTypesDisplay">${(() => {
                        let typesToShow = pokemon.actualTypes || pokemon.types || [];
                        if (typesToShow.isFormeVariant) {
                            typesToShow = typesToShow.formes[typesToShow.selectedForme] || [];
                        }
                        return typesToShow.length > 0 ? typesToShow.map(t => `<span class="type-badge type-${t.toLowerCase().replace(' ', '-')}">${t}</span>`).join('') : '<span class="text-tertiary">None</span>';
                    })()}</span></p>
                </div>
                <div class="modal-grid" id="typeGrid"></div>
                <div class="modal-buttons">
                    <button id="saveTypesBtn" class="modal-btn modal-btn-primary">Save</button>
                    <button id="closeTypesBtn" class="modal-btn modal-btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('typeModal');
    const typeGrid = document.getElementById('typeGrid');
    const selectedTypes = [...pokemon.types];

    console.log("About to attach save listener, saveTypesBtn element:", document.getElementById('saveTypesBtn'));

    // Create type buttons
    availableTypes.forEach(type => {
        const isSelected = selectedTypes.includes(type);
        const btn = document.createElement('button');
        btn.textContent = type;
        btn.className = `type-badge type-${type.toLowerCase().replace(' ', '-')}`;
        btn.style.cssText = `
            padding: 8px 12px;
            border: 2px solid ${isSelected ? '#333' : 'transparent'};
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            opacity: ${isSelected ? '1' : '0.6'};
        `;

        btn.addEventListener('click', function () {
            const idx = selectedTypes.indexOf(type);
            if (idx > -1) {
                selectedTypes.splice(idx, 1);
            } else {
                selectedTypes.push(type);
            }
            // Update button styling and selected types display
            const isNowSelected = selectedTypes.includes(type);
            btn.style.borderColor = isNowSelected ? '#333' : 'transparent';
            btn.style.opacity = isNowSelected ? '1' : '0.6';

            // Update selected types display
            const selectedDisplay = document.getElementById('selectedTypesDisplay');
            selectedDisplay.innerHTML = selectedTypes.length > 0 ? selectedTypes.map(t => `<span class="type-badge type-${t.toLowerCase().replace(' ', '-')}">${t}</span>`).join('') : '<span class="text-tertiary">None</span>';
        });

        typeGrid.appendChild(btn);
    });

    // Save button handler
    const saveTypesBtn = document.getElementById('saveTypesBtn');
    const closeTypesBtn = document.getElementById('closeTypesBtn');
    console.log("Save/Close buttons found:", { saveTypesBtn, closeTypesBtn });
    
    saveTypesBtn.addEventListener('click', function () {
        console.log("Save button clicked! selectedTypes:", selectedTypes);
        if (selectedTypes.length === 0) {
            alert('Please select at least one type');
            return;
        }
        pokemon.types = selectedTypes;
        pokemon.actualTypes = selectedTypes; // Correction pour affichage
        updateTypesDisplay(pokemon);
        modal.remove();
    });

    // Close button handler
    closeTypesBtn.addEventListener('click', function () {
        console.log("Close button clicked");
        modal.remove();
    });

    // Close on outside click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Update display name with nickname
function updateDisplayName(pokemon) {
    const headerText = document.querySelector('.pokemon-title');
    if (headerText) {
        if (pokemon.nickname) {
            headerText.textContent = `"${pokemon.nickname}" (${pokemon.name})`;
            document.title = `"${pokemon.nickname}" (${pokemon.name}) - PTU Generator`;
        } else {
            headerText.textContent = `#${pokemon.id} ${pokemon.name}`;
            document.title = `${pokemon.name} - PTU Generator`;
        }
    }
}

// Update types display
function updateTypesDisplay(pokemon) {
    const typesDisplay = document.getElementById('typesDisplay');
    const typesContainer = typesDisplay.parentElement;
    
    // Check if pokemon has forme variants
    if (pokemon.types && pokemon.types.isFormeVariant) {
        // Display forme selector and selected types
        const formeNames = Object.keys(pokemon.types.formes);
        const selectedForme = pokemon.types.selectedForme;
        const selectedTypes = pokemon.types.formes[selectedForme] || [];
        
        // Create forme dropdown if it doesn't exist
        let formeSelect = document.getElementById('formeSelect');
        if (!formeSelect) {
            formeSelect = document.createElement('select');
            formeSelect.id = 'formeSelect';
            formeSelect.style.cssText = 'margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;';
            
            formeNames.forEach(forme => {
                const option = document.createElement('option');
                option.value = forme;
                option.textContent = forme;
                option.selected = forme === selectedForme;
                formeSelect.appendChild(option);
            });
            
            formeSelect.addEventListener('change', function () {
                pokemon.types.selectedForme = this.value;
                pokemon.actualTypes = pokemon.types.formes[this.value] || [];
                updateTypesDisplay(pokemon);
            });
            
            typesContainer.insertBefore(formeSelect, typesDisplay);
        } else {
            formeSelect.value = selectedForme;
        }
        
        // Display types
        typesDisplay.innerHTML = selectedTypes.map(type => `<span class="type-badge type-${type.toLowerCase().replace(' ', '-')}">${type}</span>`).join('');
    } else {
        // Regular pokemon - remove forme selector if it exists
        const formeSelect = document.getElementById('formeSelect');
        if (formeSelect) formeSelect.remove();
        
        // Display normal types
        const typesToDisplay = pokemon.actualTypes || pokemon.types || [];
        typesDisplay.innerHTML = typesToDisplay.map(type => `<span class="type-badge type-${type.toLowerCase().replace(' ', '-')}">${type}</span>`).join('');
    }
    
    // Update type effectiveness display as well
    displayTypeEffectiveness(pokemon);
}

// Update remaining points display