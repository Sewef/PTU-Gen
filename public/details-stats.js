async function setupNatureDropdown(pokemon) {
    try {
        const response = await fetch('/api/pokemon/natures');
        if (response.ok) {
            const data = await response.json();
            const natureSelect = document.getElementById('natureSelect');

            // Clear existing options
            natureSelect.innerHTML = '';

            // Add options for each nature
            data.natures.forEach(nature => {
                const option = document.createElement('option');
                option.value = nature.name;
                option.textContent = `${nature.name} (+${nature.raise} -${nature.lower})`;
                if (nature.name === pokemon.nature.name) {
                    option.selected = true;
                }
                natureSelect.appendChild(option);
            });

            // Add event listener for nature changes
            natureSelect.addEventListener('change', function () {
                const selectedNature = data.natures.find(n => n.name === this.value);
                if (selectedNature) {
                    // Update nature display
                    document.getElementById('natureRaise').textContent = `+${selectedNature.raise}`;
                    document.getElementById('natureLower').textContent = `-${selectedNature.lower}`;

                    // Update pokemon object
                    pokemon.nature = selectedNature;

                    // Full workflow: apply nature → recompute groups → redistribute
                    recalculateStatsWithDistribution(pokemon, pokemon.distribution || 'RANDOM');
                }
            });
        }
    } catch (error) {
        console.error('Failed to load natures:', error);
    }
}

// Recalculate and display HP
function updateHPDisplay(pokemon) {
    const hpFormula = pokemon.hpFormula || 'LEVEL + (HP * 3) + 10';
    pokemon.hitPointsMax = calculateHPValue(pokemon.level, pokemon.stats.HP, hpFormula);
    pokemon.hitPoints = pokemon.hitPointsMax;
    const hpDisplay = document.getElementById('hpDisplay');
    if (hpDisplay) hpDisplay.textContent = pokemon.hitPoints;
}

function calculateHPValue(level, hpStat, formula) {
    try {
        const formulaStr = formula.toUpperCase().replace(/LEVEL/g, level).replace(/HP/g, hpStat);
        if (!/^[\d+\-*/(). ]+$/.test(formulaStr)) throw new Error('Invalid formula');
        return Math.max(1, Math.floor(eval(formulaStr)));
    } catch (e) {
        return Math.max(1, Math.floor(level + (hpStat * 3) + 10));
    }
}

// Setup type editor

function updateRemainingPoints(pokemon) {
    const totalPoints = pokemon.level + 10;
    const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];
    const baseStatsKeyMap = {
        'HP': 'HP',
        'atk': 'Attack',
        'def': 'Defense',
        'spA': 'Special Attack',
        'spD': 'Special Defense',
        'spe': 'Speed'
    };

    let distributedPoints = 0;

    // Calculate distributed points from the input fields, not from pokemon.stats
    shortNames.forEach(shortName => {
        const row = document.querySelector(`[data-stat="${shortName}"]`);
        if (row) {
            const levelInput = row.querySelector('.level-points-input');
            const levelPts = parseInt(levelInput?.value) || 0;
            distributedPoints += levelPts;
        }
    });

    const remaining = totalPoints - distributedPoints;
    const display = document.getElementById('remainingPointsDisplay');
    if (display) {
        display.textContent = `Remaining: ${remaining}`;
        // Color it based on remaining points
        if (remaining === 0) {
            display.style.background = '#d4edda';
            display.style.borderColor = '#28a745';
            display.style.color = '#28a745';
        } else if (remaining < 0) {
            display.style.background = '#f8d7da';
            display.style.borderColor = '#dc3545';
            display.style.color = '#dc3545';
        } else {
            display.style.background = '#f0f7ff';
            display.style.borderColor = '#667eea';
            display.style.color = '#667eea';
        }
    }
}

// Setup level editor
function setupLevelEditor(pokemon) {
    const levelInput = document.getElementById('levelInput');
    if (!levelInput) return;

    levelInput.addEventListener('change', function () {
        const newLevel = parseInt(this.value);
        if (newLevel >= 1 && newLevel <= 100) {
            pokemon.level = newLevel;

            // Recalculate HP with new level
            const hpFormula = pokemon.hpFormula || 'LEVEL + (HP * 3) + 10';
            pokemon.hitPointsMax = calculateHPValue(newLevel, pokemon.stats.HP, hpFormula);
            pokemon.hitPoints = pokemon.hitPointsMax;

            // Update HP current display
            const hpCurrentInput = document.getElementById('hpCurrentInput');
            if (hpCurrentInput) hpCurrentInput.value = pokemon.hitPoints;

            // Update HP max display
            const hpMaxDisplay = document.getElementById('hpMaxDisplay');
            if (hpMaxDisplay) hpMaxDisplay.textContent = pokemon.hitPointsMax;

            // Update header level
            const headerLevel = document.getElementById('headerLevel');
            if (headerLevel) headerLevel.textContent = `Level ${newLevel}`;

            // Update page title
            const pageTitle = `${pokemon.name} - Lvl ${newLevel} - Pokémon Details`;
            document.getElementById('pageTitle').textContent = pageTitle;

            // Update remaining points display
            updateRemainingPoints(pokemon);

            if (!pokemon.tutorPointsManual && typeof calculateDefaultTutorPoints === 'function') {
                pokemon.tutorPoints = calculateDefaultTutorPoints(newLevel);
                const tutorPointsInput = document.getElementById('tutorPointsInput');
                if (tutorPointsInput) {
                    tutorPointsInput.value = pokemon.tutorPoints;
                }
            }

            // Save to localStorage
            localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
        } else {
            this.value = pokemon.level;
        }
    });
}

// Setup HP Formula editor
function setupHPFormulaEditor(pokemon) {
    const hpFormulaInput = document.getElementById('hpFormulaInput');
    if (!hpFormulaInput) return;

    // Real-time update on input event
    hpFormulaInput.addEventListener('input', function () {
        const newFormula = this.value.trim();
        if (!newFormula) return;

        const newHP = calculateHPValue(pokemon.level, pokemon.stats.HP, newFormula);
        if (newHP > 0) {
            pokemon.hitPointsMax = newHP;
            pokemon.hitPoints = newHP;
            const hpCurrentInput = document.getElementById('hpCurrentInput');
            if (hpCurrentInput) hpCurrentInput.value = newHP;
            const hpMaxDisplay = document.getElementById('hpMaxDisplay');
            if (hpMaxDisplay) hpMaxDisplay.textContent = newHP;
            hpFormulaInput.style.borderColor = '#28a745';
            hpFormulaInput.style.backgroundColor = '#f0fff4';
        } else {
            hpFormulaInput.style.borderColor = '#dc3545';
            hpFormulaInput.style.backgroundColor = '#fff5f5';
        }
    });

    hpFormulaInput.addEventListener('change', function () {
        let newFormula = this.value.trim();
        if (!newFormula) {
            newFormula = 'LEVEL + (HP * 3) + 10';
            this.value = newFormula;
        }

        const newHP = calculateHPValue(pokemon.level, pokemon.stats.HP, newFormula);
        if (newHP > 0) {
            pokemon.hpFormula = newFormula;
            pokemon.hitPointsMax = newHP;
            pokemon.hitPoints = newHP;
            const hpCurrentInput = document.getElementById('hpCurrentInput');
            if (hpCurrentInput) hpCurrentInput.value = newHP;
            const hpMaxDisplay = document.getElementById('hpMaxDisplay');
            if (hpMaxDisplay) hpMaxDisplay.textContent = newHP;
            localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
            hpFormulaInput.style.borderColor = '#28a745';
            hpFormulaInput.style.backgroundColor = '#f0fff4';
            setTimeout(() => {
                hpFormulaInput.style.borderColor = '';
                hpFormulaInput.style.backgroundColor = '';
            }, 1500);
        } else {
            hpFormulaInput.style.borderColor = '#dc3545';
            hpFormulaInput.style.backgroundColor = '#fff5f5';
            setTimeout(() => {
                hpFormulaInput.style.borderColor = '';
                hpFormulaInput.style.backgroundColor = '';
            }, 1500);
        }
    });
}

// Setup stat distribution buttons
function setupStatDistributionButtons(pokemon) {
    const randomBtn = document.getElementById('distributionRandomBtn');
    const balancedBtn = document.getElementById('distributionBalancedBtn');
    const minmaxedBtn = document.getElementById('distributionMinmaxedBtn');

    if (!randomBtn || !balancedBtn || !minmaxedBtn) return;

    randomBtn.addEventListener('click', function () {
        recalculateStatsWithDistribution(pokemon, 'RANDOM');
    });

    balancedBtn.addEventListener('click', function () {
        recalculateStatsWithDistribution(pokemon, 'BALANCED');
    });

    minmaxedBtn.addEventListener('click', function () {
        recalculateStatsWithDistribution(pokemon, 'MINMAXED');
    });
}

// Recalculate stats with a specific distribution
function recalculateStatsWithDistribution(pokemon, distribution) {
    const totalPoints = pokemon.level + 10;
    const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];
    const baseWithNature = getBaseStatsWithNature(pokemon.baseStats, pokemon.nature);
    const groups = getStatGroups(baseWithNature, pokemon.ignoreBaseRelation);
    let distributedPoints = {};

    if (distribution === 'BALANCED') {
        distributedPoints = distributePointsBalanced(totalPoints, groups, pokemon.ignoreBaseRelation !== 'IGNORE');
    } else if (distribution === 'MINMAXED') {
        distributedPoints = distributePointsMinmaxed(totalPoints, groups, pokemon.ignoreBaseRelation !== 'IGNORE');
    } else {
        distributedPoints = distributePointsRandom(totalPoints, groups, pokemon.ignoreBaseRelation !== 'IGNORE');
    }

    pokemon.baseWithNature = baseWithNature;
    pokemon.distribution = distribution;

    shortNames.forEach(shortName => {
        pokemon.stats[shortName] = baseWithNature[shortName] + distributedPoints[shortName];
    });

    // Update display
    updateStatsDisplay(pokemon);
    updateRemainingPoints(pokemon);
    updateHPDisplay(pokemon);
}

// Update stats display after recalculation
function updateStatsDisplay(pokemon) {
    const statsBreakdownContainer = document.getElementById('statsBreakdown');
    const statRows = statsBreakdownContainer.querySelectorAll('.stat-breakdown-row');
    const csMultipliers = {
        '-6': 0.4, '-5': 0.5, '-4': 0.6, '-3': 0.7, '-2': 0.8, '-1': 0.9,
        '0': 1, '1': 1.2, '2': 1.4, '3': 1.6, '4': 1.8, '5': 2, '6': 2.2
    };

    // Refresh the base-relation summary (groups can change when nature changes)
    const naturalGroups = groupStatsByValue(pokemon.baseWithNature);
    const ignoredStatsSet = new Set(
        pokemon.ignoreBaseRelation === 'IGNORE' ? ['HP', 'atk', 'def', 'spA', 'spD', 'spe']
        : (pokemon.ignoreBaseRelation ? pokemon.ignoreBaseRelation.split(',').map(s => s.trim()) : [])
    );
    const summaryEl = document.getElementById('baseRelationSummary');
    if (summaryEl) {
        summaryEl.innerHTML = naturalGroups
            .map(group => group.stats
                .map(stat => `<span class="br-stat${ignoredStatsSet.has(stat) ? ' br-stat-ignored' : ''}">${stat}</span>`)
                .join(' <span class="br-sep">=</span> '))
            .join(' <span class="br-sep br-gt">&gt;</span> ');
    }


    statRows.forEach(row => {
        const statName = row.getAttribute('data-stat');
        const baseStatEl = row.querySelector('.base-stat-value');
        const levelInput = row.querySelector('.level-points-input');
        const csInput = row.querySelector('.cs-input');

        // Effective base = base with nature applied
        const effectiveBase = pokemon.baseWithNature[statName] || 0;
        // Level points = final stat - effective base
        const levelPts = (pokemon.stats[statName] || 0) - effectiveBase;

        // Update base stat display (effective base after nature)
        if (baseStatEl) baseStatEl.textContent = effectiveBase;

        // Update nature modifier tag
        const natMod = getNatureModifier(statName, pokemon.nature);
        const natModDisplay = natMod > 0 ? `+${natMod}` : natMod < 0 ? `${natMod}` : '';
        const natModClass = natMod > 0 ? 'nature-raise' : natMod < 0 ? 'nature-lower' : '';
        let natTag = row.querySelector('.nature-modifier-tag');
        if (natModDisplay) {
            if (!natTag) {
                natTag = document.createElement('span');
                baseStatEl.parentElement.appendChild(natTag);
            }
            natTag.className = `nature-modifier-tag ${natModClass}`;
            natTag.textContent = natModDisplay;
        } else if (natTag) {
            natTag.remove();
        }

        // Update level points
        if (levelInput) levelInput.value = Math.max(0, levelPts);

        // Recalculate total with CS
        const cs = csInput ? parseInt(csInput.value) : 0;
        const multiplier = csMultipliers[cs] || 1;
        const total = Math.floor((effectiveBase + levelPts) * multiplier);
        row.querySelector('.stat-total').textContent = total;
    });

    // Nature/distribution changes can alter Attack and Special Attack too.
    if (document.getElementById('movesList') && typeof updateMovesDisplay === 'function') {
        updateMovesDisplay(pokemon);
    }
}

// Setup moves editor
