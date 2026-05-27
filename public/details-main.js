function loadPokemonDetails() {
    const pokemon = JSON.parse(localStorage.getItem('selectedPokemon'));

    if (!pokemon) {
        document.getElementById('pokemonDisplay').innerHTML = '<div class="error">❌ No Pokémon data found. Please generate a Pokémon first.</div>';
        return;
    }


    // Ensure capabilities is an array
    if (!pokemon.capabilities) {
        pokemon.capabilities = [];
    }

    // Ensure hpFormula is present if exists in original object (from API or localStorage)
    if (!pokemon.hpFormula && pokemon.hp_formula) {
        pokemon.hpFormula = pokemon.hp_formula;
    }

    // Debug: log the pokemon object structure
    console.log('Pokemon object:', pokemon);

    // Update page title and favicon
    const pageTitle = `${pokemon.name} - Lvl ${pokemon.level} - Pokémon Details`;
    document.getElementById('pageTitle').textContent = pageTitle;
    const iconNumber = pokemon.Icon || pokemon.id;
    
    // Load and crop favicon to remove transparency padding
    const faviconUrl = `https://sewef.github.io/ptu/img/pokemon/icons/${iconNumber}.png`;
    const faviconImg = new Image();
    faviconImg.crossOrigin = 'anonymous';
    faviconImg.onload = function() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = faviconImg.width;
            canvas.height = faviconImg.height;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(faviconImg, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Find bounds of non-transparent pixels
            let minX = canvas.width, maxX = 0;
            let minY = canvas.height, maxY = 0;
            
            for (let i = 3; i < data.length; i += 4) {
                const alpha = data[i];
                if (alpha > 128) {
                    const pixelIndex = (i - 3) / 4;
                    const x = pixelIndex % canvas.width;
                    const y = Math.floor(pixelIndex / canvas.width);
                    
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
            
            // Add padding around subject
            const padding = 4;
            const cropX = Math.max(0, minX - padding);
            const cropY = Math.max(0, minY - padding);
            const cropWidth = Math.min(canvas.width - cropX, maxX - minX + 2 * padding + 1);
            const cropHeight = Math.min(canvas.height - cropY, maxY - minY + 2 * padding + 1);
            
            // Create cropped image
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = cropWidth;
            croppedCanvas.height = cropHeight;
            const croppedCtx = croppedCanvas.getContext('2d');
            
            croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            
            // Set as favicon
            const dataUrl = croppedCanvas.toDataURL('image/png');
            document.getElementById('dynamicFavicon').href = dataUrl;
        } catch (e) {
            // Fallback if cropping fails
            document.getElementById('dynamicFavicon').href = faviconUrl;
        }
    };
    faviconImg.onerror = function() {
        document.getElementById('dynamicFavicon').href = faviconUrl;
    };
    faviconImg.src = faviconUrl;

    // Get the actual types for styling
    let typesToUse = pokemon.actualTypes || pokemon.types || ['Normal'];
    if (typesToUse.isFormeVariant) {
        typesToUse = typesToUse.formes[typesToUse.selectedForme] || ['Normal'];
    }
    const typeClass = (typeof typesToUse[0] === 'string' ? typesToUse[0] : 'Normal').toLowerCase().replace(' ', '-');
    const statsEntries = Object.entries(pokemon.stats);
    const maxStat = Math.max(...statsEntries.map(([_, v]) => v));

    const imageNumber = pokemon.Icon || pokemon.id;
    const imageUrl = `https://sewef.github.io/ptu/img/pokemon/full/${imageNumber}.png`;

    let html = `
        <div class="pokemon-header">
            <div class="pokemon-header-content">
                <img src="${imageUrl}" alt="${pokemon.name}" class="pokemon-header-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23eee%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'" />
                <div class="pokemon-header-text">
                    <div class="flex-header">
                        <div class="pokemon-title">#${pokemon.id} ${pokemon.name}</div>
                        ${pokemon.shiny ? '<div class="shiny-badge">✨ SHINY</div>' : ''}
                        ${pokemon.types?.isFormeVariant ? `<div class="forme-badge-inline">${pokemon.types.selectedForme}</div>` : ''}
                        ${pokemon.statVariant ? `<div class="variant-badge-inline">${pokemon.statVariant.selectedVariant}</div>` : ''}
                    </div>
                    <input type="text" id="nicknameInput" placeholder="Nickname" value="${pokemon.nickname || ''}" class="nickname-field" maxlength="20" />
                    <div class="pokemon-meta" id="headerLevel">Level ${pokemon.level} • ${pokemon.dataset ? pokemon.dataset.charAt(0).toUpperCase() + pokemon.dataset.slice(1) : 'Core'} Dataset</div>
                </div>
                <div class="export-button-wrapper">
                    <button id="exportBtn" title="Export options" class="export-btn-main">📥 Export <span class="dropdown-arrow">▼</span></button>
                    <div id="exportDropdown" class="export-dropdown">
                        <button id="exportJsonBtn" class="export-dropdown-item">📄 Export PTU-Gen JSON</button>
                        <button id="exportRoll20Btn" class="export-dropdown-item">🎲 Export Roll20</button>
                        <button id="exportPokesheetsBtn" class="export-dropdown-item">📊 Export Pokésheets</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="details-content">
            <div class="details-left">
                <div class="pokemon-info">
                    <div class="info-box">
                        <div class="flex-between-center">
                            <div class="info-label">Type(s)</div>
                            <button id="editTypesBtn" title="Edit types" class="edit-action-btn">✎ Edit</button>
                        </div>
                        <div id="typesDisplay" class="types">
                            ${(() => {
                                let typesToShow = pokemon.actualTypes || pokemon.types || [];
                                if (typesToShow.isFormeVariant) {
                                    typesToShow = typesToShow.formes[typesToShow.selectedForme] || [];
                                }
                                return typesToShow.map(type => `<span class="type-badge type-${type.toLowerCase().replace(' ', '-')}">${type}</span>`).join('');
                            })()}
                        </div>
                    </div>


                    <div class="info-box">
                        <div class="info-label">Level & HP</div>
                        <div class="level-hp-wrapper">
                            <div class="level-input-group">
                                <span class="text-secondary">Lvl:</span>
                                <input type="number" id="levelInput" min="1" max="100" value="${pokemon.level}" class="level-number-input" />
                            </div>
                            <div class="level-input-group">
                                <span class="text-secondary">HP:</span>
                                <div id="hpDisplay" class="hp-display">${pokemon.hitPoints}</div>
                            </div>
                        </div>
                        <div class="margin-top-8">
                            <input type="text" id="hpFormulaInput" value="${pokemon.hpFormula || 'LEVEL + (HP * 3) + 10'}" class="skill-input" placeholder="e.g., LEVEL + (HP * 3) + 10" />
                        </div>
                    </div>

                    <div class="info-box">
                        <div class="info-label">Nature</div>
                        <select id="natureSelect" class="nature-select">
                            <option value="">Loading natures...</option>
                        </select>
                        <div class="flex-center-gap-15 margin-top-8">
                            <span class="nature-raise" id="natureRaise">+${pokemon.nature.raise}</span>
                            <span class="nature-lower" id="natureLower">-${pokemon.nature.lower}</span>
                        </div>
                    </div>

                    ${pokemon.otherInfo ? `
                        <div class="info-box">
                            <div class="info-label">Other Information</div>
                            <div class="other-info-grid">
                                <div><strong>Size:</strong> ${pokemon.otherInfo.sizeCategory || 'Unknown'}</div>
                                <div><strong>Weight Class:</strong> ${pokemon.otherInfo.weightClass || 'Unknown'}</div>
                                <div><strong>Gender:</strong> ${pokemon.otherInfo.gender || 'Unknown'}</div>
                                <div><strong>Diet:</strong> ${pokemon.otherInfo.diet || 'Unknown'}</div>
                                <div><strong>Habitat:</strong> ${pokemon.otherInfo.habitat || 'Unknown'}</div>
                            </div>
                        </div>
                    ` : ''}

                </div>
                    
                <div>
                    <div class="stats-section-header">
                        <h3 class="section-title">📈 Stats</h3>
                        <div class="stats-buttons-group">
                            <button id="distributionRandomBtn" title="Random distribution" class="distribution-button">RANDOM</button>
                            <button id="distributionBalancedBtn" title="Balanced distribution" class="distribution-button">BALANCED</button>
                            <button id="distributionMinmaxedBtn" title="MinMaxed distribution" class="distribution-button">MINMAXED</button>
                            <div id="remainingPointsDisplay" class="remaining-points-display">Remaining: 0</div>
                        </div>
                    </div>
                    <div class="stats-breakdown" id="statsBreakdown">
                        <!-- Stats will be generated here -->
                    </div>
                </div>

                ${Object.keys(pokemon.skills || {}).length > 0 ? `
                    <h3 class="section-title">📊 Skills</h3>
                    <div class="section-container skills">
                        <div class="section-grid skills">
                            ${Object.entries(pokemon.skills).map(([skillName, skillFormula]) => `
                                <div class="grid-item skill">
                                    <div class="grid-item-title">${skillName}</div>
                                    <input type="text" class="skill-input" data-skill-name="${skillName}" value="${skillFormula}" />
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${pokemon.capabilities && pokemon.capabilities.length > 0 ? `
                    <h3 class="section-title">🔧 Capabilities</h3>
                    <div class="section-container capabilities">
                        <div id="capabilitiesContainer" class="section-grid capabilities">
                            ${(() => {
                const withValues = [];
                const withoutValues = [];

                pokemon.capabilities.forEach((cap, idx) => {
                    const match = cap.match(/^(.+?)\s+([\d/]+)$/);
                    if (match) {
                        withValues.push({ idx, name: match[1], value: match[2] });
                    } else {
                        withoutValues.push(cap);
                    }
                });

                let html = '';

                // Capabilities with values - as cards
                withValues.forEach(({ idx, name, value }) => {
                    html += `<div class="grid-item capability">
                                        <div class="grid-item-title" title="${name}">${name}</div>
                                        <input type="text" class="capability-value-input" data-index="${idx}" value="${value}" />
                                    </div>`;
                });

                // Capabilities without values as one row
                if (withoutValues.length > 0) {
                    html += `<div class="grid-item capability capability-full">
                                        <div class="grid-item-title">Other</div>
                                        <input type="text" id="capabilitiesNoValueInput" class="capability-no-value-input" value="${withoutValues.join(', ')}" />
                                    </div>`;
                }

                return html;
            })()}
                        </div>
                        <div class="section-buttons">
                            <button class="section-btn" data-capability="Overland" title="Add Overland capability">+ Overland</button>
                            <button class="section-btn" data-capability="Swim" title="Add Swim capability">+ Swim</button>
                            <button class="section-btn" data-capability="Sky" title="Add Sky capability">+ Sky</button>
                            <button class="section-btn" data-capability="Levitate" title="Add Levitate capability">+ Levitate</button>
                            <button class="section-btn" data-capability="Burrow" title="Add Burrow capability">+ Burrow</button>
                        </div>
                    </div>
                ` : `
                    <h3 class="section-title">🔧 Capabilities</h3>
                    <div class="section-container capabilities">
                        <div id="capabilitiesContainer" class="section-grid capabilities">
                            No capabilities yet.
                        </div>
                        <div class="section-buttons">
                            <button class="section-btn" data-capability="Overland" title="Add Overland capability">+ Overland</button>
                            <button class="section-btn" data-capability="Swim" title="Add Swim capability">+ Swim</button>
                            <button class="section-btn" data-capability="Sky" title="Add Sky capability">+ Sky</button>
                            <button class="section-btn" data-capability="Levitate" title="Add Levitate capability">+ Levitate</button>
                            <button class="section-btn" data-capability="Burrow" title="Add Burrow capability">+ Burrow</button>
                        </div>
                    </div>
                `}
                
                <div class="section">
                    <div class="section-header">
                        <h3 class="section-title">🎯 Abilities</h3>
                        <button id="addAbilityBtn" title="Add ability" class="add-ability-btn">✎ Edit</button>
                    </div>
                    <div class="section-list" id="abilitiesList">
                        ${pokemon.abilities.map(ability => `
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
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="details-right">
                <div class="info-box">
                    <div class="flex-between-center-15">
                        <div class="info-label">Type Effectiveness</div>
                        <div class="flex-gap-5">
                            <button id="multiplyBtn15" class="multiplier-btn inactive" title="Alternative scaling: start from 1x, each weakness adds +0.5, each resistance still halves the value.">×1.5</button>
                            <button id="multiplyBtn2" class="multiplier-btn active" title="Standard scaling: each weakness doubles the value, each resistance halves it.">×2</button>
                        </div>
                    </div>
                    <div id="typeEffectiveness" class="type-effectiveness-display">
                        <!-- Type effectiveness will be generated here -->
                    </div>
                </div>

                <div class="section">
                    <div class="flex-between-center-15">
                        <h3 class="section-title">⚔️ Moves</h3>
                        <button id="addMoveBtn" title="Edit" class="edit-action-btn">✎ Edit</button>
                    </div>
                    <div class="section-list" id="movesList">
                        ${pokemon.moves.map(move => `
                            <div class="section-card move type-${(move.type || 'normal').toLowerCase().replace(' ', '-')}" data-move-name="${move.name}">
                                <div class="section-card-header">
                                    <div class="section-card-name">${move.name}${move.class ? `<span class="move-class-badge move-class-${move.class.toLowerCase()}">${move.class}</span>` : ''}</div>
                                    <button class="remove-move-btn" title="Remove this move">✕ Remove</button>
                                </div>
                                <div class="section-card-field"><strong>Type:</strong> ${move.type || 'N/A'}</div>
                                <div class="section-card-field">
                                    <strong>Frequency:</strong> ${move.frequency || 'N/A'}
                                    ${move.frequency ? `<span class="usage-tracker" data-move-name="${move.name}"><span class="usage-label">Uses:</span><div class="usage-boxes">${Array.from({length: /\d+/.test(move.frequency) ? parseInt(move.frequency.match(/\d+/)[0]) : 1}, (_, i) => `<button class="usage-checkbox ${move.usageCount && move.usageCount > i ? 'checked' : ''}" data-index="${i}" title="Use #${i+1}"></button>`).join('')}</div></span>` : ''}
                                </div>
                                <div class="section-card-field"><strong>Class:</strong> ${move.class || 'N/A'}</div>
                                <div class="section-card-field"><strong>Range:</strong> ${move.range || 'N/A'}</div>
                                ${move.ac ? `<div class="section-card-field"><strong>AC:</strong> ${move.ac}</div>` : ''}
                                ${move.damageBase ? `<div class="section-card-field db-field" data-move-name="${move.name}"><strong>${move.damageBase.short}${move.damageBase.stab ? ' (STAB)' : ''}:</strong> ${move.damageBase.dmg} (${move.damageBase.min} | <strong>${move.damageBase.avg}</strong> | ${move.damageBase.max})
                                    <button class="db-adjust-btn db-decrease" title="Decrease DB">−</button>
                                    <button class="db-adjust-btn db-increase" title="Increase DB">+</button>
                                </div>` : ''}
                                ${move.effect ? `<div class="section-card-field"><strong>Effect:</strong> ${move.effect}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('pokemonDisplay').innerHTML = html;

    // Combat Stage multipliers
    const csMultipliers = {
        '-6': 0.4, '-5': 0.5, '-4': 0.6, '-3': 0.7, '-2': 0.8, '-1': 0.9,
        '0': 1, '1': 1.2, '2': 1.4, '3': 1.6, '4': 1.8, '5': 2, '6': 2.2
    };

    // Generate detailed stats breakdown
    const statsBreakdownContainer = document.getElementById('statsBreakdown');

    // Map short stat names to display names and back to baseStats keys
    const statDisplayNames = {
        'HP': 'HP',
        'atk': 'Attack',
        'def': 'Defense',
        'spA': 'Special Attack',
        'spD': 'Special Defense',
        'spe': 'Speed'
    };

    // Liste des noms courts pour les stats
    const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];

    // Reverse map for looking up baseStats
    const baseStatsKeyMap = {
        'HP': 'HP',
        'atk': 'Attack',
        'def': 'Defense',
        'spA': 'Special Attack',
        'spD': 'Special Defense',
        'spe': 'Speed'
    };

    // Base-relation summary line: "atk = def > HP = spA = spD > spe"
    const naturalGroups = groupStatsByValue(pokemon.baseWithNature);
    const ignoredStatsSet = new Set(
        pokemon.ignoreBaseRelation === 'IGNORE' ? shortNames
        : (pokemon.ignoreBaseRelation ? pokemon.ignoreBaseRelation.split(',').map(s => s.trim()) : [])
    );
    const baseRelationSummary = naturalGroups
        .map(group => group.stats
            .map(stat => `<span class="br-stat${ignoredStatsSet.has(stat) ? ' br-stat-ignored' : ''}">${stat}</span>`)
            .join(' <span class="br-sep">=</span> '))
        .join(' <span class="br-sep br-gt">&gt;</span> ');
    let statsHTML = `<div class="base-relation-summary" id="baseRelationSummary">${baseRelationSummary}</div>`;

    statsEntries.forEach(([statName, finalValue]) => {
        // Effective base stat = raw base + nature modifier (min 1)
        const effectiveBase = pokemon.baseWithNature?.[statName] || 0;

        // Level points = final stat - effective base
        const levelPoints = finalValue - effectiveBase;

        const isHP = statName === 'HP';

        // Nature modifier for display
        const natMod = getNatureModifier(statName, pokemon.nature);
        const natModDisplay = natMod > 0 ? `+${natMod}` : natMod < 0 ? `${natMod}` : '';
        const natModClass = natMod > 0 ? 'nature-raise' : natMod < 0 ? 'nature-lower' : '';

        const isIgnored = ignoredStatsSet.has(statName);

        statsHTML += `
            <div class="stat-breakdown-row" data-stat="${statName}">
                <div class="stat-breakdown-label">
                    <div>${statDisplayNames[statName] || statName}</div>
                    <span class="stat-ignore-btn ${isIgnored ? 'ignored' : ''}" data-stat="${statName}" title="Toggle ignore base relation">
                        ${isIgnored ? 'Ignored' : 'In Relation'}
                    </span>
                </div>
                <div class="stat-breakdown-component">
                    <label>Base</label>
                    <div class="base-stat-wrapper">
                        <span class="base-stat-value" data-stat="${statName}">${effectiveBase}</span>
                        ${natModDisplay ? `<span class="nature-modifier-tag ${natModClass}">${natModDisplay}</span>` : ''}
                    </div>
                </div>
                <div class="stat-breakdown-component">
                    <label>Lvl Pts</label>
                    <input type="number" class="level-points-input" data-stat="${statName}" value="${levelPoints}" />
                </div>
                ${!isHP ? `
                    <div class="stat-breakdown-component">
                        <label>CS</label>
                        <input type="number" class="cs-input" data-stat="${statName}" min="-6" max="6" value="0" />
                    </div>
                ` : ''}
                <div class="stat-breakdown-component total">
                    <label>Total</label>
                    <span class="stat-total" data-stat="${statName}">${finalValue}</span>
                </div>
            </div>
        `;
    });

    statsBreakdownContainer.innerHTML = statsHTML;

    // Add event listeners for stat ignore toggle (après rendu)
    statsBreakdownContainer.querySelectorAll('.stat-ignore-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const stat = btn.dataset.stat;
            let ignoredStats = (pokemon.ignoreBaseRelation === 'IGNORE') ? shortNames : (pokemon.ignoreBaseRelation ? pokemon.ignoreBaseRelation.split(',').map(s => s.trim()) : []);
            if (pokemon.ignoreBaseRelation === 'IGNORE') {
                // Toggle off for this stat: switch to comma list minus this stat
                ignoredStats = shortNames.filter(s => s !== stat);
                pokemon.ignoreBaseRelation = ignoredStats.length === 0 ? undefined : ignoredStats.join(',');
            } else {
                if (ignoredStats.includes(stat)) {
                    // Remove from ignored
                    ignoredStats = ignoredStats.filter(s => s !== stat);
                } else {
                    // Add to ignored
                    ignoredStats.push(stat);
                }
                // If all stats are ignored, use 'IGNORE'
                if (ignoredStats.length === shortNames.length) {
                    pokemon.ignoreBaseRelation = 'IGNORE';
                } else {
                    pokemon.ignoreBaseRelation = ignoredStats.length === 0 ? undefined : ignoredStats.join(',');
                }
            }
            localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
            loadPokemonDetails();
        });
    });

    // Add event listeners for stat modifications
    document.querySelectorAll('.level-points-input, .cs-input').forEach(input => {
        input.addEventListener('change', function (e) {
            updateStatTotal(e);
            updateRemainingPoints(pokemon);
        });
        // Also listen to 'input' event for real-time updates of remaining points
        if (input.classList.contains('level-points-input')) {
            input.addEventListener('input', function (e) {
                updateStatTotal(e);
                updateRemainingPoints(pokemon);
            });
        }
    });

    // Initial update of remaining points
    updateRemainingPoints(pokemon);

    function updateStatTotal(e) {
        const statName = e.target.dataset.stat;
        const row = document.querySelector(`[data-stat="${statName}"]`);

        const baseStatEl = row.querySelector('.base-stat-value');
        const levelInput = row.querySelector('.level-points-input');
        const csInput = row.querySelector('.cs-input');

        // base-stat-value already shows baseWithNature (effective base)
        const effectiveBase = parseInt(baseStatEl?.textContent) || 0;
        const levelPts = parseInt(levelInput?.value) || 0;
        const cs = parseInt(csInput?.value) || 0;

        const subtotal = effectiveBase + levelPts;
        const multiplier = csMultipliers[cs] || 1;
        const total = Math.floor(subtotal * multiplier);

        row.querySelector('.stat-total').textContent = total;
    }

    // Handle capability value changes
    document.querySelectorAll('.capability-value-input').forEach(input => {
        input.addEventListener('change', function () {
            // Just update the value - it's already modifiable
            // Values persist in the input element
        });
    });

    // Handle capability without value changes
    const capNoValueInput = document.getElementById('capabilitiesNoValueInput');
    if (capNoValueInput) {
        capNoValueInput.addEventListener('change', function () {
            // Parse the comma-separated input and update pokemon.capabilities
            const capabilitiesWithValues = pokemon.capabilities.filter(cap => /^.+\s+[\d/]+$/.test(cap));
            const newCapNoValues = this.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
            pokemon.capabilities = [...capabilitiesWithValues, ...newCapNoValues];
        });
    }

    // Handle add capability buttons
    document.querySelectorAll('.section-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const capabilityName = this.getAttribute('data-capability');
            
            // Check if already exists (case-insensitive)
            const exists = pokemon.capabilities.some(cap => 
                cap.toLowerCase().startsWith(capabilityName.toLowerCase())
            );
            
            if (!exists) {
                // Add with default value of 0 (can be edited)
                pokemon.capabilities.push(`${capabilityName} 0`);
                // Re-render the capabilities section
                updateCapabilitiesDisplay(pokemon);
            }
        });
    });

    // Setup nature dropdown
    setupNatureDropdown(pokemon);

    // Setup type editor
    setupTypeEditor(pokemon);

    // Setup level editor
    setupLevelEditor(pokemon);

    // Setup HP formula editor
    setupHPFormulaEditor(pokemon);

    // Display type effectiveness
    currentPokemon = pokemon;
    displayTypeEffectiveness(pokemon);

    // Setup stat distribution buttons
    setupStatDistributionButtons(pokemon);

    // Setup type effectiveness multiplier buttons
    setupTypeMultiplierButtons(pokemon);

    // Setup moves editor
    setupMovesEditor(pokemon);

    // Setup skills editor
    setupSkillsEditor(pokemon);

    // Setup abilities editor
    setupAbilitiesEditor(pokemon);

    // Setup nickname input
    const nicknameInput = document.getElementById('nicknameInput');
    if (nicknameInput) {
        nicknameInput.addEventListener('input', function () {
            pokemon.nickname = this.value;
            updateDisplayName(pokemon);
        });
    }

    // Setup export buttons
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.getElementById('exportDropdown');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportRoll20Btn = document.getElementById('exportRoll20Btn');
    const exportPokesheetsBtn = document.getElementById('exportPokesheetsBtn');
    
    // Helper function to sync all pending changes to pokemon object before export
    const syncPokemonBeforeExport = () => {
        // Sync stats from DOM (level points may have been manually edited)
        const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];
        shortNames.forEach(statName => {
            const row = document.querySelector(`[data-stat="${statName}"]`);
            if (!row) return;
            const baseStatEl = row.querySelector('.base-stat-value');
            const levelInput = row.querySelector('.level-points-input');
            const effectiveBase = parseInt(baseStatEl?.textContent) || 0;
            const levelPts = parseInt(levelInput?.value) || 0;
            pokemon.stats[statName] = effectiveBase + levelPts;
        });
        // Re-sync HP display value
        const hpFormula = pokemon.hpFormula || 'LEVEL + (HP * 3) + 10';
        pokemon.hitPoints = calculateHPValue(pokemon.level, pokemon.stats.HP, hpFormula);

        // Sync skill inputs
        document.querySelectorAll('.skill-input').forEach(input => {
            const skillName = input.getAttribute('data-skill-name');
            if (skillName && pokemon.skills) {
                pokemon.skills[skillName] = input.value.trim();
            }
        });
        
        // Sync capability value inputs
        document.querySelectorAll('.capability-value-input').forEach(input => {
            const idx = parseInt(input.getAttribute('data-index'));
            const newValue = input.value;
            if (pokemon.capabilities[idx]) {
                const match = pokemon.capabilities[idx].match(/^(.+?)\s+[\d/]+$/);
                if (match) {
                    pokemon.capabilities[idx] = match[1] + ' ' + newValue;
                }
            }
        });
        
        // Sync capability no-value input
        const capNoValueInput = document.getElementById('capabilitiesNoValueInput');
        if (capNoValueInput) {
            const capabilitiesWithValues = pokemon.capabilities.filter(cap => /^.+\s+[\d/]+$/.test(cap));
            const newCapNoValues = capNoValueInput.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
            pokemon.capabilities = capabilitiesWithValues.concat(newCapNoValues);
        }
    };
    
    if (exportBtn && exportDropdown) {
        // Toggle dropdown
        exportBtn.onclick = (e) => {
            e.stopPropagation();
            exportDropdown.style.display = exportDropdown.style.display === 'none' ? 'block' : 'none';
        };
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            exportDropdown.style.display = 'none';
        });
        
        // Export JSON
        if (exportJsonBtn) {
            exportJsonBtn.onclick = (e) => {
                e.stopPropagation();
                syncPokemonBeforeExport();
                exportPokemon(pokemon);
                exportDropdown.style.display = 'none';
            };
        }
        
        // Export Roll20
        if (exportRoll20Btn) {
            exportRoll20Btn.onclick = (e) => {
                e.stopPropagation();
                syncPokemonBeforeExport();
                exportPokemonRoll20(pokemon);
                exportDropdown.style.display = 'none';
            };
        }
        
        // Export Pokésheets
        if (exportPokesheetsBtn) {
            exportPokesheetsBtn.onclick = (e) => {
                e.stopPropagation();
                syncPokemonBeforeExport();
                exportPokemonPokesheets(pokemon);
                exportDropdown.style.display = 'none';
            };
        }
    }
}

window.addEventListener('load', function () {
    loadPokemonDetails();
});
