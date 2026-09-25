const pokemonStorageKey = new URLSearchParams(window.location.search).get('pokemonKey') || 'selectedPokemon';
const pendingOwlbearCommands = new Map();
let owlbearCurrentPlayer = null;
let owlbearRoomPlayers = [];

function createOwlbearRequestId() {
    return typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function requestOwlbearCommand(command, payload = {}) {
    if (window.parent === window) return Promise.reject(new Error('This action is only available inside Owlbear Rodeo.'));

    const requestId = createOwlbearRequestId();
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            pendingOwlbearCommands.delete(requestId);
            reject(new Error('Owlbear did not respond in time.'));
        }, 10000);

        pendingOwlbearCommands.set(requestId, { resolve, reject, timeoutId });
        window.parent.postMessage({
            type: 'ptu-owlbear-command',
            requestId,
            command,
            payload
        }, window.location.origin);
    });
}

window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'ptu-owlbear-players') {
        owlbearCurrentPlayer = event.data.currentPlayer?.id
            ? { id: String(event.data.currentPlayer.id), name: String(event.data.currentPlayer.name || 'Player') }
            : null;
        owlbearRoomPlayers = (Array.isArray(event.data.players) ? event.data.players : [])
            .filter(player => player?.id && player.id !== owlbearCurrentPlayer?.id)
            .map(player => ({ id: String(player.id), name: String(player.name || 'Unnamed player') }));
        window.dispatchEvent(new CustomEvent('ptu-owlbear-players-updated'));
        return;
    }

    if (event.data?.type !== 'ptu-owlbear-command-result') return;
    const pending = pendingOwlbearCommands.get(event.data.requestId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    pendingOwlbearCommands.delete(event.data.requestId);
    if (event.data.ok) pending.resolve(event.data);
    else pending.reject(new Error(event.data.error || 'The Owlbear command failed.'));
});

function saveSelectedPokemon(pokemon) {
    PTUPokemonStorage.save(pokemon);
    localStorage.setItem(pokemonStorageKey, JSON.stringify(pokemon));

    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'ptu-pokemon-updated',
            storageKey: pokemonStorageKey,
            pokemon
        }, window.location.origin);
    }
}

function loadPokemonDetails() {
    const pokemon = JSON.parse(localStorage.getItem(pokemonStorageKey));

    if (!pokemon) {
        document.getElementById('pokemonDisplay').innerHTML = '<div class="error">❌ No Pokémon data found. Please generate a Pokémon first.</div>';
        return;
    }

    // Clean up Pokémon saved before the multiplier switch was removed.
    if (Object.prototype.hasOwnProperty.call(pokemon, 'typeMultiplierMode')) {
        delete pokemon.typeMultiplierMode;
        saveSelectedPokemon(pokemon);
    }


    // Ensure capabilities is an array
    if (!pokemon.capabilities) {
        pokemon.capabilities = [];
    }

    if (!pokemon.pokeEdges) {
        pokemon.pokeEdges = [];
    }

    if (!pokemon.combatStages || typeof pokemon.combatStages !== 'object') {
        pokemon.combatStages = {};
    }

    if (!pokemon.captureState || typeof pokemon.captureState !== 'object') {
        pokemon.captureState = {};
    }

    const isEmbeddedDetails = new URLSearchParams(window.location.search).get('embedded') === 'true';
    const capturePanelOpen = !isEmbeddedDetails;
    const otherInfoPanelOpen = !isEmbeddedDetails;

    const storedGender = pokemon.otherInfo?.gender || pokemon.gender || 'Unknown';
    const currentGender = storedGender === 'Genderless' ? 'No Gender' : storedGender;
    const genderOptions = [
        ...(currentGender === 'Unknown' ? [{ value: 'Unknown', label: 'Unknown' }] : []),
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'No Gender', label: 'Genderless' }
    ];

    if (pokemon.otherInfo) {
        pokemon.otherInfo.gender = currentGender;
    }
    pokemon.gender = currentGender;

    if (pokemon.tutorPoints === undefined || pokemon.tutorPoints === null) {
        pokemon.tutorPoints = calculateDefaultTutorPoints(pokemon.level);
    }

    // Ensure hpFormula is present if exists in original object (from API or localStorage)
    if (!pokemon.hpFormula && pokemon.hp_formula) {
        pokemon.hpFormula = pokemon.hp_formula;
    }

    // Initialize hitPoints and hitPointsMax if not present
    if (pokemon.stats && pokemon.stats.HP) {
        const defaultHPFormula = 'LEVEL + (HP * 3) + 10';
        const hpFormula = pokemon.hpFormula || defaultHPFormula;
        const hadHitPointsMax = pokemon.hitPointsMax !== undefined && pokemon.hitPointsMax !== null;
        if (!hadHitPointsMax) {
            pokemon.hitPointsMax = calculateHPValue(pokemon.level, pokemon.stats, hpFormula);
        }
        const defaultFormulaHP = calculateHPValue(pokemon.level, pokemon.stats, defaultHPFormula);
        const hasStaleDefaultHP = hpFormula !== defaultHPFormula && pokemon.hitPoints === defaultFormulaHP;
        if (!hadHitPointsMax || hasStaleDefaultHP || pokemon.hitPoints === undefined || pokemon.hitPoints === null) {
            pokemon.hitPoints = pokemon.hitPointsMax;
        }
    }

    // Keep every opened sheet restorable, including imported legacy Pokémon.
    saveSelectedPokemon(pokemon);

    // Debug: log the pokemon object structure
    console.log('Pokemon object:', pokemon);

    // Update page title and favicon
    const pageTitle = `${pokemon.name} - Lvl ${pokemon.level} - Pokémon Details`;
    document.getElementById('pageTitle').textContent = pageTitle;
    const iconNumber = pokemon.Icon || pokemon.id;
    let faviconUrl;
    if (pokemon._fandex) {
        faviconUrl = `https://sewef.github.io/ptu/img/pokemon/icons/${pokemon._fandex}/${iconNumber}.png`;
    } else {
        faviconUrl = `https://sewef.github.io/ptu/img/pokemon/icons/${iconNumber}.png`;
    }
    const faviconImg = new Image();
    faviconImg.crossOrigin = 'anonymous';
    faviconImg.onload = function () {
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
    faviconImg.onerror = function () {
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
    let imageUrl;
    if (pokemon._fandex) {
        imageUrl = `https://sewef.github.io/ptu/img/pokemon/full/${pokemon._fandex}/${imageNumber}.png`;
    } else {
        imageUrl = `https://sewef.github.io/ptu/img/pokemon/full/${imageNumber}.png`;
    }

    let html = `
        <div class="pokemon-header">
            <div class="pokemon-header-content">
                <img src="${imageUrl}" alt="${pokemon.name}" class="pokemon-header-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23eee%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'" />
                <div class="pokemon-header-text">
                    <div class="flex-header">
                        <div class="pokemon-title">#${pokemon.id | 0} ${pokemon.name}</div>
                        ${pokemon.shiny ? '<div class="shiny-badge">✨ SHINY</div>' : ''}
                        ${pokemon.types?.isFormeVariant ? `<div class="forme-badge-inline">${pokemon.types.selectedForme}</div>` : ''}
                        ${pokemon.statVariant ? `<div class="variant-badge-inline">${pokemon.statVariant.selectedVariant}</div>` : ''}
                    </div>
                    <input type="text" id="nicknameInput" placeholder="Nickname" value="${pokemon.nickname || ''}" class="nickname-field" maxlength="20" />
                    <div class="pokemon-meta" id="headerLevel">Level ${pokemon.level} • ${pokemon.dataset ? pokemon.dataset.charAt(0).toUpperCase() + pokemon.dataset.slice(1) : 'Core'} Dataset • ${pokemon._fandex ? `${pokemon._fandex.charAt(0).toUpperCase() + pokemon._fandex.slice(1)}` : ''}</div>
                </div>
                <div class="export-button-wrapper">
                    ${isEmbeddedDetails ? `
                    <div class="owlbear-utilities-panel" aria-label="Owlbear scene utilities">
                        <div class="owlbear-utilities-header">
                            <div class="owlbear-utilities-title">Owlbear Scene</div>
                            <div id="owlbearTokenStatus" class="owlbear-token-status" aria-live="polite">Not inserted</div>
                        </div>
                        <div class="owlbear-utilities-actions">
                            <button id="insertOwlbearTokenBtn" type="button" class="export-btn-main owlbear-insert-btn">Insert token in scene</button>
                            <button id="owlbearVisibilityToggle" type="button" class="owlbear-visibility-toggle" data-visible="true" aria-pressed="true" aria-label="Token visibility">
                                <span class="owlbear-visible-label">Visible</span>
                                <span class="owlbear-hidden-label">Hidden</span>
                            </button>
                            <select id="owlbearOwnerSelect" class="owlbear-owner-select" aria-label="Change token owner" title="Change owner" disabled>
                                <option value="">Loading players…</option>
                            </select>
                        </div>
                    </div>
                    ` : `
                    <div class="owlbear-export-group" aria-label="Owlbear token actions">
                        <button id="exportOwlbearBtn" class="export-btn-main owlbear-copy-btn"><img src="https://www.owlbear.rodeo/assets/logo-DZfycRP_.svg" alt="Owlbear" height="20" width="20" /> Owlbear Token</button>
                        <button id="owlbearConfigBtn" title="Owlbear token settings" class="export-btn-main owlbear-settings-btn">⚙️</button>
                    </div>
                    `}
                    <button id="exportBtn" title="Export options" class="export-btn-main">📥 Export <span class="dropdown-arrow">▼</span></button>
                    <div id="exportDropdown" class="export-dropdown">
                        <button id="exportJsonBtn" class="export-dropdown-item">📄 Export PTU-Gen JSON</button>
                        <button id="exportRoll20Btn" class="export-dropdown-item">🎲 Export Roll20</button>
                        <button id="exportPokesheetsBtn" class="export-dropdown-item">📊 Export Pokésheets</button>
                    </div>
                </div>
                <div id="owlbearConfigModal" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="max-width: 420px;">
                        <div class="modal-title">Owlbear Token Settings</div>
                        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                            <input type="checkbox" id="detailsOwlbearVisible" style="width: auto;">
                            <span>Visible</span>
                        </label>
                        <label style="display: block; margin-bottom: 6px;">Player Id</label>
                        <input type="text" id="detailsOwlbearPlayerId" placeholder="Player Id" autocomplete="off" style="width: 100%; margin-bottom: 16px;">
                        <div class="modal-buttons">
                            <button type="button" id="saveOwlbearConfigBtn" class="modal-btn modal-btn-primary">Save</button>
                            <button type="button" id="closeOwlbearConfigBtn" class="modal-btn modal-btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="details-content">
            <div class="details-left">
                <div class="pokemon-info">
                    <div class="info-box pokemon-info-row pokemon-types-row">
                        <div class="info-label">Type(s)</div>
                        <div class="pokemon-types-content">
                            <div id="typesDisplay" class="types">
                                ${(() => {
            let typesToShow = pokemon.actualTypes || pokemon.types || [];
            if (typesToShow.isFormeVariant) {
                typesToShow = typesToShow.formes[typesToShow.selectedForme] || [];
            }
            return typesToShow.map(type => `<span class="type-badge type-${type.toLowerCase().replace(' ', '-')}">${type}</span>`).join('');
        })()}
                            </div>
                            <button id="editTypesBtn" title="Edit types" class="edit-bn">✎ Edit</button>
                        </div>
                    </div>


                    <div class="info-box pokemon-info-row level-hp-info-row">
                        <div class="info-label">Level & HP</div>
                        <div class="level-hp-wrapper">
                            <div class="level-input-group">
                                <span class="text-secondary">Lvl:</span>
                                <input type="number" id="levelInput" min="1" max="100" value="${pokemon.level}" class="level-number-input" />
                            </div>
                            <div class="level-input-group">
                                <span class="text-secondary">HP:</span>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <input type="number" id="hpCurrentInput" class="level-number-input" value="${pokemon.hitPoints}" style="flex: 1;" />
                                    <span class="text-secondary">/</span>
                                    <div id="hpMaxDisplay" style="min-width: 50px; text-align: center;">${pokemon.hitPointsMax}</div>
                                </div>
                            </div>
                        </div>
                        <div class="margin-top-8">
                            <input type="text" id="hpFormulaInput" value="${pokemon.hpFormula || 'LEVEL + (HP * 3) + 10'}" class="skill-input" placeholder="e.g., LEVEL + (HP * 3) + DEF" title="Formula placeholders: LEVEL, HP, ATK, DEF, SPA, SPD, SPE" />
                        </div>
                        <div class="hp-damage-controls">
                            <input type="number" id="damageAmountInput" class="hp-damage-input" min="0" placeholder="Damage" />
                            <select id="damageTypeSelect" class="hp-damage-select">
                                <option value="typeless">Typeless</option>
                                ${['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']
                                    .map(type => `<option value="${type.toLowerCase()}">${type}</option>`)
                                    .join('')}
                            </select>
                            <select id="damageCategorySelect" class="hp-damage-select">
                                <option value="physical">Physical</option>
                                <option value="special">Special</option>
                            </select>
                            <button id="applyDamageBtn" class="hp-damage-btn" type="button">Apply</button>
                        </div>
                        <div id="damagePreview" class="hp-damage-preview"></div>
                    </div>

                    <div class="info-box pokemon-info-row nature-info-row">
                        <div class="info-label">Nature</div>
                        <div class="nature-control">
                            <select id="natureSelect" class="nature-select">
                                <option value="">Loading natures...</option>
                            </select>
                            <div class="nature-modifiers">
                                <span class="nature-raise" id="natureRaise">+${pokemon.nature.raise}</span>
                                <span class="nature-lower" id="natureLower">-${pokemon.nature.lower}</span>
                            </div>
                        </div>
                    </div>

                    ${pokemon.otherInfo ? `
                        <details class="info-box other-info-panel" ${otherInfoPanelOpen ? 'open' : ''}>
                            <summary class="advanced-toggle collapsible-info-summary">
                                <span class="info-label">Other Information</span>
                                <span class="toggle-icon collapsible-info-chevron" aria-hidden="true">▼</span>
                            </summary>
                            <div class="other-info-grid">
                                <div><strong>Size:</strong> ${pokemon.otherInfo.sizeCategory || 'Unknown'}</div>
                                <div><strong>Weight Class:</strong> ${pokemon.otherInfo.weightClass || 'Unknown'}</div>
                                <label class="other-info-gender">
                                    <strong>Gender:</strong>
                                    <select id="genderSelect" class="gender-select">
                                        ${genderOptions.map(gender => `<option value="${gender.value}" ${gender.value === currentGender ? 'selected' : ''}>${gender.label}</option>`).join('')}
                                    </select>
                                </label>
                                <div><strong>Diet:</strong> ${pokemon.otherInfo.diet || 'Unknown'}</div>
                                <div><strong>Habitat:</strong> ${pokemon.otherInfo.habitat || 'Unknown'}</div>
                            </div>
                        </details>
                    ` : ''}

                    <!-- Unified Capture Rate panel -->
                    <details id="captureRatePanel" class="info-box capture-rate-panel" ${capturePanelOpen ? 'open' : ''}>
                        <summary class="advanced-toggle capture-rate-panel-summary">
                            <span class="capture-rate-heading">
                                <span class="info-label">Capture Rate</span>
                                <label class="capture-rate-mode-toggle capture-rate-mode-toggle-header">
                                    <input type="checkbox" id="errata2015Toggle" />
                                    <span>Use September 2015 errata</span>
                                </label>
                            </span>
                            <span class="capture-rate-display" id="captureRateDisplay">
                                <span class="capture-rate-value">Base <strong id="baseCapture">100</strong></span>
                                <span class="capture-rate-value capture-rate-current">Current <strong id="currentCapture">100</strong></span>
                            </span>
                            <span class="toggle-icon capture-rate-chevron" aria-hidden="true">▼</span>
                        </summary>

                        <div class="capture-rate-panel-body">
                            <!-- Standard Capture Rate Modifiers -->
                            <div class="capture-rate-calculator" id="standardCaptureModifiers">
                                <div class="capture-rate-modifiers">
                            <div class="modifiers-grid">
                                <!-- HP (Automatic) -->
                                <div class="modifier-item" title="Based on current HP percentage">
                                    <span class="modifier-label">HP:</span>
                                    <span class="modifier-value" id="hpModifier">0</span>
                                </div>
                                
                                <!-- Evolution (Automatic) -->
                                <div class="modifier-item">
                                    <span class="modifier-label" title="Evolutionary stages remaining" id="evolutionTooltip">Evolution:</span>
                                    <span class="modifier-value" id="evolutionModifier">0</span>
                                </div>
                                
                                <!-- Shiny (Automatic) -->
                                <div class="modifier-item" id="shinyItem" style="display: none;" title="Pokémon is Shiny">
                                    <span class="modifier-label">Shiny:</span>
                                    <span class="modifier-value">-10</span>
                                </div>
                                
                                <!-- Legendary (Automatic) -->
                                <div class="modifier-item" id="legendaryItem" style="display: none;" title="Pokémon is Legendary">
                                    <span class="modifier-label">Legendary:</span>
                                    <span class="modifier-value">-30</span>
                                </div>
                                
                                <!-- Persistent Afflictions (Manual) -->
                                <div class="modifier-item">
                                    <label>
                                        <span class="modifier-label" title="Persistent Conditions: +10 each">Persistent:</span>
                                        <input type="number" class="status-count-input-standard" data-type="persistent" min="0" value="0">
                                        <span class="status-multiplier-text">× 10</span>
                                    </label>
                                </div>
                                
                                <!-- Injuries/Volatile Afflictions (Manual) -->
                                <div class="modifier-item">
                                    <label>
                                        <span class="modifier-label" title="Injuries/Volatile: +5 each">Injuries:</span>
                                        <input type="number" class="status-count-input-standard" data-type="injuries" min="0" value="0">
                                        <span class="status-multiplier-text">× 5</span>
                                    </label>
                                </div>
                                
                                <!-- Stuck (Manual) -->
                                <div class="modifier-item">
                                    <label>
                                        <input type="checkbox" class="status-modifier-checkbox-standard" data-value="10" data-type="stuck" title="Stuck: +10">
                                        <span>Stuck: +10</span>
                                    </label>
                                </div>
                                
                                <!-- Slow (Manual) -->
                                <div class="modifier-item">
                                    <label>
                                        <input type="checkbox" class="status-modifier-checkbox-standard" data-value="5" data-type="slow" title="Slow: +5">
                                        <span>Slow: +5</span>
                                    </label>
                                </div>
                                </div>
                            </div>
                            </div>

                            <!-- Errata 2015 Capture Rate Modifiers -->
                            <div class="capture-rate-calculator" id="errata2015Modifiers" style="display: none;">
                                <div class="capture-rate-modifiers">
                                    <div class="errata-container">
                                <!-- <div class="errata-info">
                                    <strong>Base:</strong> 10 + (Level ÷ 10). Subtract 2 for each checkbox below.
                                </div> -->
                                
                                <!-- HP at or under 50% -->
                                <label class="errata-row">
                                    <input type="checkbox" class="errata-checkbox" data-type="hp50" />
                                    <span class="errata-row-text">At or under 50% HP?</span>
                                </label>
                                
                                <!-- HP at or under 25% -->
                                <label class="errata-row">
                                    <input type="checkbox" class="errata-checkbox" data-type="hp25" />
                                    <span class="errata-row-text">At or under 25% HP?</span>
                                </label>
                                
                                <!-- Exactly 2 evolution stages (2 checkboxes) -->
                                <div class="errata-row">
                                    <div class="errata-checkbox-group">
                                        <input type="checkbox" class="errata-checkbox" data-type="evo2a" />
                                        <input type="checkbox" class="errata-checkbox" data-type="evo2b" disabled />
                                    </div>
                                    <span class="errata-row-text">Exactly 2 evolution stages? <span class="errata-hint">(counts as 2)</span></span>
                                </div>
                                
                                <!-- At least 1 Persistent/Volatile Status -->
                                <label class="errata-row">
                                    <input type="checkbox" class="errata-checkbox" data-type="status" />
                                    <span class="errata-row-text">Persistent or Volatile Status?</span>
                                </label>
                                
                                <!-- 5 or more Injuries (2 checkboxes) -->
                                <div class="errata-row">
                                    <div class="errata-checkbox-group">
                                        <input type="checkbox" class="errata-checkbox" data-type="injuries5a" />
                                        <input type="checkbox" class="errata-checkbox" data-type="injuries5b" disabled />
                                    </div>
                                    <span class="errata-row-text">5 or more Injuries? <span class="errata-hint">(counts as 2)</span></span>
                                </div>
                                
                                <!-- Exactly 1 evolution stage -->
                                <label class="errata-row">
                                    <input type="checkbox" class="errata-checkbox" data-type="evo1" />
                                    <span class="errata-row-text">Exactly 1 evolution stage remaining?</span>
                                </label>

                                <!-- Manual Rarity Modifier -->
                                <div class="errata-row errata-rarity-row">
                                    <span class="errata-rarity-symbol">+</span>
                                    <label class="errata-rarity-control" for="errata2015RarityBonus">
                                        <span class="errata-row-text">Rarity Bonus:</span>
                                        <input type="number" id="errata2015RarityBonus" min="0" max="20" value="0" class="errata-rarity-input">
                                    </label>
                                </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>

                </div>
                    
                <div class="stats-section">
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
                                        <textarea id="capabilitiesNoValueInput" class="capability-no-value-input" rows="2">${withoutValues.join(', ')}</textarea>
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
                        <div class="button-group" style="display: flex; gap: 8px;">
                            <button id="addAbilityBtn" title="Add ability from list" class="edit-bn">✎ Edit</button>
                            <button id="addBlankAbilityBtn" title="Add blank ability" class="edit-bn">+ Blank</button>
                        </div>
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
                        return Array.from({ length: freqMatch }, (_, i) => `<button class="usage-checkbox ${count > i ? 'checked' : ''}" data-index="${i}" title="Use #${i + 1}"></button>`).join('');
                    })()}
                                        </div>
                                    </span>
                                </div>` : ''}
                                ${ability.trigger ? `<div class="section-card-field"><strong>Trigger:</strong> ${ability.trigger}</div>` : ''}
                                ${ability.effect ? `<div class="section-card-field"><strong>Effect:</strong> ${ability.effect}</div>` : ''}
                                ${typeof renderAbilityTable === 'function' ? renderAbilityTable(ability.table) : ''}
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
                    <div class="type-effectiveness-header">
                        <div class="info-label">Type Effectiveness</div>
                        <button id="editTypeEffectivenessBtn" type="button" title="Edit type effectiveness" class="edit-bn">✎ Edit</button>
                    </div>
                    <div id="typeEffectiveness" class="type-effectiveness-display">
                        <!-- Type effectiveness will be generated here -->
                    </div>
                </div>

                <div class="section">
                    <div class="flex-between-center-15">
                        <h3 class="section-title">⚔️ Moves</h3>
                        <div class="button-group" style="display: flex; gap: 8px;">
                            <button id="addMoveBtn" title="Edit" class="edit-bn">✎ Edit</button>
                            <button id="addBlankMoveBtn" title="Add blank move" class="edit-bn">+ Blank</button>
                        </div>
                    </div>
                    <div class="section-list" id="movesList">
                        ${pokemon.moves.map(move => `
                            <div class="section-card move type-${(move.type || 'normal').toLowerCase().replace(' ', '-')}" data-move-name="${move.name}">
                                <div class="section-card-header">
                                    <div class="section-card-name">${move.name}${move.class ? `<span class="move-badge move-class-${move.class.toLowerCase()}">${move.class}</span>` : ''}</div>
                                    <button class="remove-move-btn" title="Remove this move">✕ Remove</button>
                                </div>
                                <div class="move-meta-row">
                                    <div class="section-card-field"><strong>Type:</strong> ${move.type || 'N/A'}</div>
                                    <div class="section-card-field"><strong>Class:</strong> ${move.class || 'N/A'}</div>
                                    <div class="section-card-field"><strong>Range:</strong> ${move.range || 'N/A'}</div>
                                    ${move.ac ? `<div class="section-card-field"><strong>AC:</strong> ${move.ac}</div>` : ''}
                                </div>
                                <div class="section-card-field">
                                    <strong>Frequency:</strong> ${move.frequency || 'N/A'}
                                    ${move.frequency ? `<span class="usage-tracker" data-move-name="${move.name}"><span class="usage-label">Uses:</span><div class="usage-boxes">${Array.from({ length: /\d+/.test(move.frequency) ? parseInt(move.frequency.match(/\d+/)[0]) : 1 }, (_, i) => `<button class="usage-checkbox ${move.usageCount && move.usageCount > i ? 'checked' : ''}" data-index="${i}" title="Use #${i + 1}"></button>`).join('')}</div></span>` : ''}
                                </div>
                                ${move.damageBase ? `<div class="section-card-field db-field" data-move-name="${move.name}"><strong>${move.damageBase.short}${move.damageBase.stab ? ' (STAB)' : ''}:</strong> ${move.damageBase.dmg} (${move.damageBase.min} | <strong>${move.damageBase.avg}</strong> | ${move.damageBase.max})
                                    <button class="db-adjust-btn db-decrease" title="Decrease DB">−</button>
                                    <button class="db-adjust-btn db-increase" title="Increase DB">+</button>
                                </div>` : ''}
                                ${move.effect ? `<div class="section-card-field"><strong>Effect:</strong> ${move.effect}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="section">
                    <div class="flex-between-center-15">
                        <h3 class="section-title">Poké Edges</h3>
                        <div class="button-group poke-edges-toolbar">
                            <label class="tutor-points-control">
                                <span>Tutor Points</span>
                                <span class="tutor-points-counter">
                                    <span id="tutorPointsCurrentDisplay">${pokemon.tutorPoints}</span>
                                    <span class="text-secondary">/</span>
                                    <input type="number" id="tutorPointsInput" min="0" value="${pokemon.tutorPoints}" />
                                </span>
                            </label>
                            <button id="addPokeEdgeBtn" title="Add Poké Edge from list" class="edit-bn">✎ Add</button>
                            <button id="addBlankPokeEdgeBtn" title="Add blank Poké Edge" class="edit-bn">+ Blank</button>
                        </div>
                    </div>
                    <div class="section-list" id="pokeEdgesList">
                        ${pokemon.pokeEdges.length === 0 ? '<div class="empty-state compact">No Poké Edges yet.</div>' : ''}
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
        (pokemon.ignoreBaseRelation === 'ALL' || pokemon.ignoreBaseRelation === 'IGNORE') ? shortNames
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
                        <input type="number" class="cs-input" data-stat="${statName}" min="-6" max="6" value="${pokemon.combatStages[statName] || 0}" />
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
            let ignoredStats = (pokemon.ignoreBaseRelation === 'ALL' || pokemon.ignoreBaseRelation === 'IGNORE') ? shortNames : (pokemon.ignoreBaseRelation ? pokemon.ignoreBaseRelation.split(',').map(s => s.trim()) : []);
            if (pokemon.ignoreBaseRelation === 'ALL' || pokemon.ignoreBaseRelation === 'IGNORE') {
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
                // If all stats are ignored, use 'ALL'
                if (ignoredStats.length === shortNames.length) {
                    pokemon.ignoreBaseRelation = 'ALL';
                } else {
                    pokemon.ignoreBaseRelation = ignoredStats.length === 0 ? undefined : ignoredStats.join(',');
                }
            }
            saveSelectedPokemon(pokemon);

            const updatedIgnoredStats = new Set(
                (pokemon.ignoreBaseRelation === 'ALL' || pokemon.ignoreBaseRelation === 'IGNORE')
                    ? shortNames
                    : (pokemon.ignoreBaseRelation ? pokemon.ignoreBaseRelation.split(',').map(value => value.trim()) : [])
            );

            statsBreakdownContainer.querySelectorAll('.stat-ignore-btn').forEach(toggle => {
                const isIgnored = updatedIgnoredStats.has(toggle.dataset.stat);
                toggle.classList.toggle('ignored', isIgnored);
                toggle.textContent = isIgnored ? 'Ignored' : 'In Relation';
            });

            const baseRelationSummaryElement = document.getElementById('baseRelationSummary');
            if (baseRelationSummaryElement) {
                baseRelationSummaryElement.innerHTML = naturalGroups
                    .map(group => group.stats
                        .map(groupStat => `<span class="br-stat${updatedIgnoredStats.has(groupStat) ? ' br-stat-ignored' : ''}">${groupStat}</span>`)
                        .join(' <span class="br-sep">=</span> '))
                    .join(' <span class="br-sep br-gt">&gt;</span> ');
            }
        });
    });

    // Add event listeners for stat modifications
    document.querySelectorAll('.level-points-input, .cs-input').forEach(input => {
        input.addEventListener('change', function (e) {
            updateStatTotal(e);
            updateRemainingPoints(pokemon);
        });
        input.addEventListener('input', function (e) {
            updateStatTotal(e);
            updateRemainingPoints(pokemon);
        });
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

        // Keep the model and move damage rolls synchronized with edited stats.
        pokemon.stats[statName] = subtotal;
        if (csInput) pokemon.combatStages[statName] = Math.max(-6, Math.min(6, cs));
        saveSelectedPokemon(pokemon);
        if ((statName === 'atk' || statName === 'spA') && document.getElementById('movesList')) {
            updateMovesDisplay(pokemon);
        }
    }

    // Handle capability value changes
    document.querySelectorAll('.capability-value-input').forEach(input => {
        const persistCapability = function () {
            const index = Number(this.dataset.index);
            const capability = pokemon.capabilities[index];
            const match = capability?.match(/^(.+?)\s+[\d/]+$/);
            if (match) {
                pokemon.capabilities[index] = `${match[1]} ${this.value}`;
                saveSelectedPokemon(pokemon);
            }
        };
        input.addEventListener('input', persistCapability);
        input.addEventListener('change', persistCapability);
    });

    // Handle capability without value changes
    const capNoValueInput = document.getElementById('capabilitiesNoValueInput');
    if (capNoValueInput) {
        const resizeCapNoValueInput = () => {
            capNoValueInput.style.height = 'auto';
            capNoValueInput.style.height = `${capNoValueInput.scrollHeight}px`;
        };

        const persistCapabilities = function () {
            resizeCapNoValueInput();
            // Accept comma-separated capabilities as well as one capability per line.
            const capabilitiesWithValues = pokemon.capabilities.filter(cap => /^.+\s+[\d/]+$/.test(cap));
            const newCapNoValues = this.value.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 0);
            pokemon.capabilities = [...capabilitiesWithValues, ...newCapNoValues];
            saveSelectedPokemon(pokemon);
        };
        capNoValueInput.addEventListener('input', persistCapabilities);
        capNoValueInput.addEventListener('change', persistCapabilities);

        resizeCapNoValueInput();
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

    // Setup HP current value editor
    const hpCurrentInput = document.getElementById('hpCurrentInput');
    const hpMaxDisplay = document.getElementById('hpMaxDisplay');

    function updateHPMax() {
        const hpFormula = pokemon.hpFormula || 'LEVEL + (HP * 3) + 10';
        const hpMax = calculateHPValue(pokemon.level, pokemon.stats, hpFormula);
        pokemon.hitPointsMax = hpMax;
        if (hpMaxDisplay) hpMaxDisplay.textContent = hpMax;
    }

    updateHPMax();

    if (hpCurrentInput) {
        hpCurrentInput.addEventListener('change', function () {
            pokemon.hitPoints = parseIntegerInputValue(this.value, 0);
            saveSelectedPokemon(pokemon);
        });
    }

    setupDamageControls(pokemon);

    // Display type effectiveness
    displayTypeEffectiveness(pokemon);
    setupTypeEffectivenessEditor(pokemon);

    // Setup stat distribution buttons
    setupStatDistributionButtons(pokemon);

    // Setup moves editor
    setupMovesEditor(pokemon);

    // Setup Poké Edges editor
    setupPokeEdgesEditor(pokemon);

    // Setup skills editor
    setupSkillsEditor(pokemon);

    // Setup abilities editor
    setupAbilitiesEditor(pokemon);

    // Setup capture rate calculator
    setupCaptureRateCalculator(pokemon);

    // Setup nickname input
    const nicknameInput = document.getElementById('nicknameInput');
    if (nicknameInput) {
        nicknameInput.addEventListener('input', function () {
            pokemon.nickname = this.value;
            updateDisplayName(pokemon);
            saveSelectedPokemon(pokemon);
        });
    }

    // Setup gender dropdown
    const genderSelect = document.getElementById('genderSelect');
    if (genderSelect) {
        genderSelect.addEventListener('change', function () {
            pokemon.otherInfo.gender = this.value;
            pokemon.gender = this.value;
            saveSelectedPokemon(pokemon);
        });
    }

    // Setup export buttons
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.getElementById('exportDropdown');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportRoll20Btn = document.getElementById('exportRoll20Btn');
    const exportPokesheetsBtn = document.getElementById('exportPokesheetsBtn');
    const exportOwlbearBtn = document.getElementById('exportOwlbearBtn');
    const owlbearConfigBtn = document.getElementById('owlbearConfigBtn');
    const insertOwlbearTokenBtn = document.getElementById('insertOwlbearTokenBtn');
    const owlbearVisibilityToggle = document.getElementById('owlbearVisibilityToggle');
    const owlbearTokenStatus = document.getElementById('owlbearTokenStatus');
    const owlbearOwnerSelect = document.getElementById('owlbearOwnerSelect');
    const owlbearConfigModal = document.getElementById('owlbearConfigModal');
    const detailsOwlbearVisible = document.getElementById('detailsOwlbearVisible');
    const detailsOwlbearPlayerId = document.getElementById('detailsOwlbearPlayerId');
    const saveOwlbearConfigBtn = document.getElementById('saveOwlbearConfigBtn');
    const closeOwlbearConfigBtn = document.getElementById('closeOwlbearConfigBtn');

    pokemon.owlbear = {
        visible: pokemon.owlbear?.visible !== undefined ? Boolean(pokemon.owlbear.visible) : true,
        playerId: String(pokemon.owlbear?.playerId || '').trim(),
        trackers: pokemon.owlbear?.trackers === 'owltrackers' ? 'owltrackers' : 'none',
        initiative: pokemon.owlbear?.initiative === 'prettysordid' ? 'prettysordid' : 'none',
        diceRoller: pokemon.owlbear?.diceRoller === 'justdices' ? 'justdices' : 'none',
        tokenId: String(pokemon.owlbear?.tokenId || '').trim()
    };

    const syncOwlbearConfigFromControls = () => {
        pokemon.owlbear = {
            visible: detailsOwlbearVisible ? detailsOwlbearVisible.checked : true,
            playerId: detailsOwlbearPlayerId ? detailsOwlbearPlayerId.value.trim() : '',
            trackers: pokemon.owlbear?.trackers === 'owltrackers' ? 'owltrackers' : 'none',
            initiative: pokemon.owlbear?.initiative === 'prettysordid' ? 'prettysordid' : 'none',
            diceRoller: pokemon.owlbear?.diceRoller === 'justdices' ? 'justdices' : 'none',
            tokenId: String(pokemon.owlbear?.tokenId || '').trim()
        };
        saveSelectedPokemon(pokemon);
    };

    const hydrateOwlbearConfigControls = () => {
        if (detailsOwlbearVisible) detailsOwlbearVisible.checked = pokemon.owlbear.visible;
        if (detailsOwlbearPlayerId) detailsOwlbearPlayerId.value = pokemon.owlbear.playerId;
    };

    hydrateOwlbearConfigControls();

    // Helper function to sync all pending changes to pokemon object before export
    const syncPokemonBeforeExport = () => {
        // Sync stats from DOM (level points may have been manually edited)
        const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];
        shortNames.forEach(statName => {
            const row = document.querySelector(`[data-stat="${statName}"]`);
            if (!row) return;
            const baseStatEl = row.querySelector('.base-stat-value');
            const levelInput = row.querySelector('.level-points-input');
            const csInput = row.querySelector('.cs-input');
            const effectiveBase = parseInt(baseStatEl?.textContent) || 0;
            const levelPts = parseInt(levelInput?.value) || 0;
            pokemon.stats[statName] = effectiveBase + levelPts;
            if (csInput) pokemon.combatStages[statName] = Math.max(-6, Math.min(6, parseInt(csInput.value) || 0));
        });
        // Sync current HP from input (don't overwrite with calculated max)
        const hpCurrentInput = document.getElementById('hpCurrentInput');
        if (hpCurrentInput) {
            pokemon.hitPoints = parseIntegerInputValue(hpCurrentInput.value, 0);
        }

        // Calculate and store HP max
        const hpFormula = pokemon.hpFormula || 'LEVEL + (HP * 3) + 10';
        pokemon.hitPointsMax = calculateHPValue(pokemon.level, pokemon.stats, hpFormula);

        const tutorPointsInput = document.getElementById('tutorPointsInput');
        if (tutorPointsInput) {
            pokemon.tutorPoints = parseInt(tutorPointsInput.value, 10) || 0;
        }

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
            const newCapNoValues = capNoValueInput.value.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 0);
            pokemon.capabilities = capabilitiesWithValues.concat(newCapNoValues);
        }

        syncOwlbearConfigFromControls();
    };

    let linkedTokenExists = false;
    let owlbearUtilityBusy = false;

    const getOwlbearOwnerOptions = () => {
        const players = new Map();
        if (owlbearCurrentPlayer?.id) {
            players.set(owlbearCurrentPlayer.id, {
                id: owlbearCurrentPlayer.id,
                label: `Me (${owlbearCurrentPlayer.name})`
            });
        }
        owlbearRoomPlayers.forEach(player => {
            if (player.id && !players.has(player.id)) {
                players.set(player.id, { id: player.id, label: player.name });
            }
        });
        return [...players.values()];
    };

    const renderOwlbearOwnerOptions = () => {
        if (!owlbearOwnerSelect) return;
        const players = getOwlbearOwnerOptions();
        const preferredPlayerId = pokemon.owlbear.playerId;
        owlbearOwnerSelect.replaceChildren(...players.map(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.label;
            return option;
        }));
        owlbearOwnerSelect.disabled = owlbearUtilityBusy || players.length === 0;
        owlbearOwnerSelect.value = players.some(player => player.id === preferredPlayerId)
            ? preferredPlayerId
            : (owlbearCurrentPlayer?.id || players[0]?.id || '');
    };

    const applyOwlbearTrackerState = trackerState => {
        if (pokemon.owlbear.trackers !== 'owltrackers' || !trackerState) return false;

        const hpValue = trackerState.hp?.value == null ? null : Number(trackerState.hp.value);
        const hpMax = trackerState.hp?.max == null ? null : Number(trackerState.hp.max);
        const injuriesValue = trackerState.injuries == null ? null : Number(trackerState.injuries);
        let changed = false;
        if (Number.isFinite(hpValue)) {
            const nextHitPoints = Math.trunc(hpValue);
            changed ||= pokemon.hitPoints !== nextHitPoints;
            pokemon.hitPoints = nextHitPoints;
            if (hpCurrentInput) hpCurrentInput.value = pokemon.hitPoints;
        }
        if (Number.isFinite(hpMax) && hpMax > 0) {
            const nextHitPointsMax = Math.trunc(hpMax);
            changed ||= pokemon.hitPointsMax !== nextHitPointsMax;
            pokemon.hitPointsMax = nextHitPointsMax;
            if (hpMaxDisplay) hpMaxDisplay.textContent = pokemon.hitPointsMax;
        }

        if (Number.isFinite(injuriesValue)) {
            const injuries = Math.max(0, Math.trunc(injuriesValue));
            const hasFiveInjuries = injuries >= 5;
            changed ||= Number(pokemon.captureState?.standardCounts?.injuries || 0) !== injuries;
            changed ||= Boolean(pokemon.captureState?.errataFlags?.injuries5a) !== hasFiveInjuries;
            pokemon.captureState = pokemon.captureState || {};
            pokemon.captureState.standardCounts = {
                ...(pokemon.captureState.standardCounts || {}),
                injuries
            };
            pokemon.captureState.errataFlags = {
                ...(pokemon.captureState.errataFlags || {}),
                injuries5a: hasFiveInjuries,
                injuries5b: hasFiveInjuries
            };

            const injuriesInput = document.querySelector('.status-count-input-standard[data-type="injuries"]');
            const injuries5a = document.querySelector('.errata-checkbox[data-type="injuries5a"]');
            const injuries5b = document.querySelector('.errata-checkbox[data-type="injuries5b"]');
            if (injuriesInput) injuriesInput.value = injuries;
            if (injuries5a) injuries5a.checked = hasFiveInjuries;
            if (injuries5b) injuries5b.checked = hasFiveInjuries;
        }

        window.dispatchEvent(new CustomEvent('ptu-owlbear-tracker-state-applied'));
        return changed;
    };

    const renderOwlbearUtilities = () => {
        if (!isEmbeddedDetails || !insertOwlbearTokenBtn || !owlbearVisibilityToggle || !owlbearTokenStatus) return;

        const visible = pokemon.owlbear.visible !== false;
        owlbearVisibilityToggle.dataset.visible = String(visible);
        owlbearVisibilityToggle.setAttribute('aria-pressed', String(visible));
        owlbearVisibilityToggle.disabled = owlbearUtilityBusy;
        insertOwlbearTokenBtn.disabled = owlbearUtilityBusy || linkedTokenExists;
        insertOwlbearTokenBtn.dataset.busy = String(owlbearUtilityBusy);
        insertOwlbearTokenBtn.textContent = owlbearUtilityBusy
            ? 'Working...'
            : linkedTokenExists
                ? 'Token inserted'
                : 'Insert token in scene';

        if (linkedTokenExists && pokemon.owlbear.tokenId) {
            const shortTokenId = pokemon.owlbear.tokenId.length > 12
                ? `${pokemon.owlbear.tokenId.slice(0, 8)}…`
                : pokemon.owlbear.tokenId;
            owlbearTokenStatus.textContent = `Token · ${shortTokenId}`;
            owlbearTokenStatus.title = `Token UUID: ${pokemon.owlbear.tokenId}`;
            owlbearTokenStatus.classList.remove('is-error');
        } else if (!owlbearTokenStatus.classList.contains('is-error')) {
            owlbearTokenStatus.textContent = 'Not inserted';
            owlbearTokenStatus.removeAttribute('title');
        }

        renderOwlbearOwnerOptions();
    };

    const setOwlbearUtilityError = error => {
        if (!owlbearTokenStatus) return;
        owlbearTokenStatus.textContent = error instanceof Error ? error.message : String(error);
        owlbearTokenStatus.classList.add('is-error');
    };

    const saveConfirmedTokenState = token => {
        let changed = false;
        if (!token) {
            changed = linkedTokenExists || Boolean(pokemon.owlbear.tokenId);
            linkedTokenExists = false;
            pokemon.owlbear.tokenId = '';
        } else {
            changed ||= !linkedTokenExists;
            changed ||= pokemon.owlbear.tokenId !== token.id;
            changed ||= pokemon.owlbear.visible !== Boolean(token.visible);
            changed ||= Boolean(token.createdUserId) && pokemon.owlbear.playerId !== String(token.createdUserId);
            linkedTokenExists = true;
            pokemon.owlbear.tokenId = token.id;
            pokemon.owlbear.visible = Boolean(token.visible);
            if (token.createdUserId) pokemon.owlbear.playerId = String(token.createdUserId);
            changed ||= applyOwlbearTrackerState(token.owlTrackers);
        }
        if (detailsOwlbearVisible) detailsOwlbearVisible.checked = pokemon.owlbear.visible;
        if (detailsOwlbearPlayerId) detailsOwlbearPlayerId.value = pokemon.owlbear.playerId;
        if (changed) saveSelectedPokemon(pokemon);
        renderOwlbearUtilities();
    };

    if (isEmbeddedDetails) {
        window.addEventListener('message', event => {
            if (event.origin !== window.location.origin || event.data?.type !== 'ptu-owlbear-token-state') return;
            if (!pokemon.owlbear.tokenId || event.data.tokenId !== pokemon.owlbear.tokenId) return;

            if (!event.data.exists) {
                saveConfirmedTokenState(null);
                return;
            }

            saveConfirmedTokenState({
                id: event.data.tokenId,
                name: event.data.name,
                visible: event.data.visible,
                createdUserId: event.data.createdUserId,
                owlTrackers: event.data.owlTrackers
            });
        });

        window.addEventListener('ptu-owlbear-players-updated', renderOwlbearUtilities);

        if (owlbearOwnerSelect) {
            owlbearOwnerSelect.addEventListener('change', async () => {
                const createdUserId = owlbearOwnerSelect.value;
                if (!createdUserId) return;

                owlbearUtilityBusy = true;
                owlbearTokenStatus?.classList.remove('is-error');
                renderOwlbearUtilities();
                try {
                    if (linkedTokenExists && pokemon.owlbear.tokenId) {
                        const result = await requestOwlbearCommand('set-token-owner', {
                            tokenId: pokemon.owlbear.tokenId,
                            createdUserId
                        });
                        if (!result.token) throw new Error('The linked token no longer exists.');
                        saveConfirmedTokenState(result.token);
                    } else {
                        pokemon.owlbear.playerId = createdUserId;
                        if (detailsOwlbearPlayerId) detailsOwlbearPlayerId.value = createdUserId;
                        saveSelectedPokemon(pokemon);
                    }
                } catch (error) {
                    setOwlbearUtilityError(error);
                } finally {
                    owlbearUtilityBusy = false;
                    renderOwlbearUtilities();
                }
            });
        }

        if (insertOwlbearTokenBtn) {
            insertOwlbearTokenBtn.addEventListener('click', async () => {
                owlbearUtilityBusy = true;
                owlbearTokenStatus?.classList.remove('is-error');
                renderOwlbearUtilities();
                try {
                    syncPokemonBeforeExport();
                    const { item } = buildOwlbearItem(pokemon);
                    const result = await requestOwlbearCommand('insert-token', { item });
                    if (!result.token?.id) throw new Error('Owlbear returned no token UUID.');
                    saveConfirmedTokenState(result.token);
                } catch (error) {
                    setOwlbearUtilityError(error);
                } finally {
                    owlbearUtilityBusy = false;
                    renderOwlbearUtilities();
                }
            });
        }

        if (owlbearVisibilityToggle) {
            owlbearVisibilityToggle.addEventListener('click', async () => {
                const nextVisible = pokemon.owlbear.visible === false;
                owlbearUtilityBusy = true;
                owlbearTokenStatus?.classList.remove('is-error');
                renderOwlbearUtilities();
                try {
                    if (linkedTokenExists && pokemon.owlbear.tokenId) {
                        const result = await requestOwlbearCommand('set-token-visibility', {
                            tokenId: pokemon.owlbear.tokenId,
                            visible: nextVisible
                        });
                        if (!result.token) throw new Error('The linked token no longer exists.');
                        saveConfirmedTokenState(result.token);
                    } else {
                        pokemon.owlbear.visible = nextVisible;
                        if (detailsOwlbearVisible) detailsOwlbearVisible.checked = nextVisible;
                        saveSelectedPokemon(pokemon);
                    }
                } catch (error) {
                    setOwlbearUtilityError(error);
                } finally {
                    owlbearUtilityBusy = false;
                    renderOwlbearUtilities();
                }
            });
        }

        renderOwlbearUtilities();
        window.parent.postMessage({ type: 'ptu-request-owlbear-players' }, window.location.origin);
        if (pokemon.owlbear.tokenId) {
            owlbearUtilityBusy = true;
            renderOwlbearUtilities();
            requestOwlbearCommand('get-token-state', { tokenId: pokemon.owlbear.tokenId })
                .then(result => saveConfirmedTokenState(result.token))
                .catch(setOwlbearUtilityError)
                .finally(() => {
                    owlbearUtilityBusy = false;
                    renderOwlbearUtilities();
                });
        }
    }

    if (owlbearConfigBtn && owlbearConfigModal) {
        owlbearConfigBtn.onclick = (e) => {
            e.stopPropagation();
            hydrateOwlbearConfigControls();
            owlbearConfigModal.style.display = 'flex';
        };
    }

    if (closeOwlbearConfigBtn && owlbearConfigModal) {
        closeOwlbearConfigBtn.onclick = () => {
            hydrateOwlbearConfigControls();
            owlbearConfigModal.style.display = 'none';
        };
    }

    if (saveOwlbearConfigBtn && owlbearConfigModal) {
        saveOwlbearConfigBtn.onclick = () => {
            syncOwlbearConfigFromControls();
            owlbearConfigModal.style.display = 'none';
        };
    }

    if (owlbearConfigModal) {
        owlbearConfigModal.addEventListener('click', (e) => {
            if (e.target === owlbearConfigModal) {
                hydrateOwlbearConfigControls();
                owlbearConfigModal.style.display = 'none';
            }
        });
    }

    if (exportBtn && exportDropdown) {
        // Initialize dropdown display state
        exportDropdown.style.display = 'none';
        
        // Toggle dropdown
        exportBtn.onclick = (e) => {
            e.stopPropagation();
            const isHidden = getComputedStyle(exportDropdown).display === 'none';
            exportDropdown.style.display = isHidden ? 'block' : 'none';
        };

        // Close dropdown when clicking outside button or dropdown
        document.addEventListener('click', (e) => {
            if (!exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
                exportDropdown.style.display = 'none';
            }
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

        // Export Owlbear token (copy to clipboard)
        if (exportOwlbearBtn) {
            exportOwlbearBtn.onclick = async (e) => {
                e.stopPropagation();
                syncPokemonBeforeExport();
                exportDropdown.style.display = 'none';
                const originalContent = exportOwlbearBtn.innerHTML;
                exportOwlbearBtn.textContent = '⏳ Generating...';
                exportOwlbearBtn.disabled = true;
                try {
                    await exportPokemonOwlbear(pokemon);
                    exportOwlbearBtn.textContent = '✅ Copied!';
                } catch (err) {
                    console.error('Owlbear export failed:', err);
                    exportOwlbearBtn.textContent = '❌ Failed';
                } finally {
                    exportOwlbearBtn.disabled = false;
                    setTimeout(() => { exportOwlbearBtn.innerHTML = originalContent; }, 2000);
                }
            };
        }
    }
}

function getPokemonDefendingTypes(pokemon) {
    let typesToUse = pokemon.actualTypes || pokemon.types || [];

    if (typesToUse.isFormeVariant) {
        typesToUse = typesToUse.formes[typesToUse.selectedForme] || [];
    }

    return Array.isArray(typesToUse) ? typesToUse : [];
}

function getDamageTypeMultiplier(pokemon, attackingType) {
    if (!attackingType || attackingType === 'typeless') {
        return 1;
    }

    const effectiveness = getPokemonTypeEffectiveness(pokemon);
    return effectiveness[attackingType] ?? 1;
}

function formatDamageMultiplier(multiplier) {
    if (multiplier === 0) return '0x';
    if (multiplier === 1) return '1x';
    if (Number.isInteger(multiplier)) return `${multiplier}x`;
    return `${parseFloat(multiplier.toFixed(2))}x`;
}

function parseIntegerInputValue(value, fallbackValue = 0) {
    const parsedValue = parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function getCurrentDisplayedStat(statName, fallbackValue = 0) {
    const statTotal = document.querySelector(`.stat-breakdown-row[data-stat="${statName}"] .stat-total`);
    const displayedValue = parseInt(statTotal?.textContent, 10);
    return Number.isFinite(displayedValue) ? displayedValue : fallbackValue;
}

function calculateIncomingDamage(pokemon) {
    const amountInput = document.getElementById('damageAmountInput');
    const typeSelect = document.getElementById('damageTypeSelect');
    const categorySelect = document.getElementById('damageCategorySelect');
    const rawDamage = Math.max(0, parseInt(amountInput?.value, 10) || 0);
    const category = categorySelect?.value || 'physical';
    const defenseStatName = category === 'special' ? 'spD' : 'def';
    const defenseStat = getCurrentDisplayedStat(defenseStatName, pokemon.stats?.[defenseStatName] || 0);
    const afterDefense = rawDamage > 0 ? Math.max(1, rawDamage - defenseStat) : 0;
    const multiplier = getDamageTypeMultiplier(pokemon, typeSelect?.value || 'typeless');
    const finalDamage = multiplier === 0 ? 0 : Math.max(1, Math.floor(afterDefense * multiplier));

    return {
        rawDamage,
        defenseStat,
        multiplier,
        finalDamage: rawDamage > 0 ? finalDamage : 0
    };
}

function setupDamageControls(pokemon) {
    const amountInput = document.getElementById('damageAmountInput');
    const typeSelect = document.getElementById('damageTypeSelect');
    const categorySelect = document.getElementById('damageCategorySelect');
    const applyButton = document.getElementById('applyDamageBtn');
    const preview = document.getElementById('damagePreview');
    const hpCurrentInput = document.getElementById('hpCurrentInput');

    if (!amountInput || !typeSelect || !categorySelect || !applyButton || !hpCurrentInput) return;

    const updatePreview = () => {
        const damage = calculateIncomingDamage(pokemon);
        if (!preview) return;

        if (damage.rawDamage <= 0) {
            preview.textContent = '';
            return;
        }

        preview.textContent = `Final: ${damage.finalDamage} (${damage.rawDamage} - ${damage.defenseStat}, ${formatDamageMultiplier(damage.multiplier)})`;
    };

    const applyDamage = () => {
        const damage = calculateIncomingDamage(pokemon);
        if (damage.rawDamage <= 0) return;

        const currentHp = parseIntegerInputValue(hpCurrentInput.value, 0);
        pokemon.hitPoints = currentHp - damage.finalDamage;
        hpCurrentInput.value = pokemon.hitPoints;
        saveSelectedPokemon(pokemon);
        hpCurrentInput.dispatchEvent(new Event('input', { bubbles: true }));
        hpCurrentInput.dispatchEvent(new Event('change', { bubbles: true }));
        updatePreview();
    };

    amountInput.addEventListener('input', updatePreview);
    typeSelect.addEventListener('change', updatePreview);
    categorySelect.addEventListener('change', updatePreview);
    applyButton.addEventListener('click', applyDamage);
    amountInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyDamage();
        }
    });

    updatePreview();
}

// Setup capture rate calculator
async function setupCaptureRateCalculator(pokemon) {
    const standardModifiers = document.getElementById('standardCaptureModifiers');
    const errata2015Modifiers = document.getElementById('errata2015Modifiers');
    const errata2015Toggle = document.getElementById('errata2015Toggle');

    // Standard system selectors
    const statusCountInputs = document.querySelectorAll('.status-count-input-standard');
    const statusCheckboxes = document.querySelectorAll('.status-modifier-checkbox-standard');

    // Errata 2015 selectors
    const errataCheckboxes = document.querySelectorAll('.errata-checkbox:not(.errata-double)');
    const errataDoubleCheckboxes = document.querySelectorAll('.errata-checkbox.errata-double');
    const errataRarityInput = document.getElementById('errata2015RarityBonus');
    const savedCaptureState = pokemon.captureState || {};

    // The mode control lives inside <summary>; using it must not toggle the panel.
    errata2015Toggle.closest('.capture-rate-mode-toggle')?.addEventListener('click', event => {
        event.stopPropagation();
    });

    errata2015Toggle.checked = Boolean(savedCaptureState.useErrata);
    statusCountInputs.forEach(input => {
        input.value = savedCaptureState.standardCounts?.[input.dataset.type] ?? 0;
    });
    statusCheckboxes.forEach(checkbox => {
        checkbox.checked = Boolean(savedCaptureState.standardFlags?.[checkbox.dataset.type]);
    });
    errataCheckboxes.forEach(checkbox => {
        checkbox.checked = Boolean(savedCaptureState.errataFlags?.[checkbox.dataset.type]);
    });
    if (errataRarityInput) errataRarityInput.value = savedCaptureState.rarityBonus ?? 0;

    const persistCaptureState = () => {
        pokemon.captureState = {
            useErrata: errata2015Toggle.checked,
            standardCounts: Object.fromEntries(Array.from(statusCountInputs, input => [input.dataset.type, parseInt(input.value) || 0])),
            standardFlags: Object.fromEntries(Array.from(statusCheckboxes, checkbox => [checkbox.dataset.type, checkbox.checked])),
            errataFlags: Object.fromEntries(Array.from(errataCheckboxes, checkbox => [checkbox.dataset.type, checkbox.checked])),
            rarityBonus: parseInt(errataRarityInput?.value) || 0
        };
        saveSelectedPokemon(pokemon);
    };

    // Determine evolution stages remaining
    let evolutionStagesRemaining = 0;
    try {
        const response = await fetch(`/api/pokemon/evolutions/${encodeURIComponent(pokemon.name)}?dataset=${pokemon.dataset || 'core'}`);
        if (response.ok) {
            const data = await response.json();
            evolutionStagesRemaining = data.evolutionsRemaining || 0;
            console.log('Evolutions remaining from API:', evolutionStagesRemaining);
        } else {
            console.error('Failed to fetch evolution data:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Could not fetch evolution data:', error);
    }

    // Display evolution modifier (standard system)
    const evolutionModifier = document.getElementById('evolutionModifier');
    if (evolutionModifier) {
        if (evolutionStagesRemaining === 2) {
            evolutionModifier.textContent = '+10';
        } else if (evolutionStagesRemaining === 1) {
            evolutionModifier.textContent = '0';
        } else {
            evolutionModifier.textContent = '-10';
        }
    }

    // Auto-show Shiny and Legendary modifiers
    if (pokemon.shiny) {
        const shinyItem = document.getElementById('shinyItem');
        if (shinyItem) {
            shinyItem.style.display = 'flex';
        }
    }

    if (pokemon.legendary) {
        const legendaryItem = document.getElementById('legendaryItem');
        if (legendaryItem) {
            legendaryItem.style.display = 'flex';
        }
    }

    // Standard system capture rate calculation
    const updateCaptureRateStandard = () => {
        let captureRate = 100;
        captureRate -= pokemon.level * 2;

        // HP modification
        let hpModifier = 0;
        const hpPercentage = (pokemon.hitPoints / pokemon.hitPointsMax) * 100;
        if (pokemon.hitPoints <= 0) {
            captureRate = 'CANNOT CAPTURE (0 HP)';
        } else if (pokemon.hitPoints === 1) {
            hpModifier = 30;
            captureRate += 30;
        } else if (hpPercentage <= 25) {
            hpModifier = 15;
            captureRate += 15;
        } else if (hpPercentage <= 50) {
            hpModifier = 0;
        } else if (hpPercentage <= 75) {
            hpModifier = -15;
            captureRate -= 15;
        } else {
            hpModifier = -30;
            captureRate -= 30;
        }

        const hpModifierDisplay = document.getElementById('hpModifier');
        if (hpModifierDisplay && typeof captureRate === 'number') {
            hpModifierDisplay.textContent = hpModifier >= 0 ? `+${hpModifier}` : `${hpModifier}`;
        }

        // Evolutionary stage
        if (typeof captureRate === 'number') {
            if (evolutionStagesRemaining === 2) {
                captureRate += 10;
            } else if (evolutionStagesRemaining === 1) {
                // No change
            } else {
                captureRate -= 10;
            }
        }

        // Rarity
        if (pokemon.shiny) {
            captureRate = typeof captureRate === 'string' ? captureRate : captureRate - 10;
        }
        if (pokemon.legendary) {
            captureRate = typeof captureRate === 'string' ? captureRate : captureRate - 30;
        }

        // Status afflictions
        statusCountInputs.forEach(input => {
            const count = parseInt(input.value) || 0;
            const type = input.getAttribute('data-type');
            if (type === 'persistent') {
                captureRate = typeof captureRate === 'string' ? captureRate : captureRate + (count * 10);
            } else if (type === 'injuries') {
                captureRate = typeof captureRate === 'string' ? captureRate : captureRate + (count * 5);
            }
        });

        statusCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const value = parseInt(checkbox.getAttribute('data-value'));
                captureRate = typeof captureRate === 'string' ? captureRate : captureRate + value;
            }
        });

        const baseValue = 100 - (pokemon.level * 2);
        document.getElementById('baseCapture').textContent = baseValue;
        const currentCaptureDisplay = document.getElementById('currentCapture');
        if (currentCaptureDisplay) {
            if (typeof captureRate === 'string') {
                currentCaptureDisplay.textContent = '0 HP';
                currentCaptureDisplay.title = captureRate;
                currentCaptureDisplay.classList.add('capture-rate-warning');
            } else {
                currentCaptureDisplay.textContent = Math.max(0, captureRate);
                currentCaptureDisplay.title = '';
                currentCaptureDisplay.classList.remove('capture-rate-warning');
            }
        }
    };

    // Errata 2015 system capture rate calculation
    const updateCaptureRateErrata2015 = () => {
        let captureRate = 10 + Math.floor(pokemon.level / 10);

        // Count checked boxes
        let checkboxCount = 0;

        // Standard conditions (1 checkbox each = -2)
        const hp50 = document.querySelector('.errata-checkbox[data-type="hp50"]');
        const hp25 = document.querySelector('.errata-checkbox[data-type="hp25"]');
        const status = document.querySelector('.errata-checkbox[data-type="status"]');
        const evo1 = document.querySelector('.errata-checkbox[data-type="evo1"]');

        // Double conditions (2 checkboxes each = -4 total)
        const evo2a = document.querySelector('.errata-checkbox[data-type="evo2a"]');
        const evo2b = document.querySelector('.errata-checkbox[data-type="evo2b"]');
        const injuries5a = document.querySelector('.errata-checkbox[data-type="injuries5a"]');
        const injuries5b = document.querySelector('.errata-checkbox[data-type="injuries5b"]');

        const hpPercentage = (pokemon.hitPoints / pokemon.hitPointsMax) * 100;

        // Auto-check conditions based on pokemon state
        if (hp50 && hpPercentage <= 50) {
            hp50.checked = true;
        } else if (hp50) {
            hp50.checked = false;
        }

        if (hp25 && hpPercentage <= 25) {
            hp25.checked = true;
        } else if (hp25) {
            hp25.checked = false;
        }

        // Count all checked boxes
        if (hp50 && hp50.checked) checkboxCount++;
        if (hp25 && hp25.checked) checkboxCount++;
        if (status && status.checked) checkboxCount++;
        if (evo1 && evo1.checked) checkboxCount++;
        if (evo2a && evo2a.checked) checkboxCount += 2;
        if (injuries5a && injuries5a.checked) checkboxCount += 2;

        // Sync double checkboxes
        if (evo2a && evo2b) {
            evo2b.checked = evo2a.checked;
        }
        if (injuries5a && injuries5b) {
            injuries5b.checked = injuries5a.checked;
        }

        // Apply rarity bonus
        const rarityBonus = parseInt(errataRarityInput.value) || 0;
        captureRate += rarityBonus;

        // Subtract 2 for each checkbox
        captureRate -= (checkboxCount * 2);

        const baseValue = 10 + Math.floor(pokemon.level / 10);
        document.getElementById('baseCapture').textContent = baseValue;
        const currentCaptureDisplay = document.getElementById('currentCapture');
        if (currentCaptureDisplay) {
            currentCaptureDisplay.textContent = Math.max(0, captureRate);
            currentCaptureDisplay.title = '';
            currentCaptureDisplay.classList.remove('capture-rate-warning');
        }
    };

    // Toggle between systems
    const toggleSystem = () => {
        const useErrata = errata2015Toggle.checked;
        standardModifiers.style.display = useErrata ? 'none' : 'block';
        errata2015Modifiers.style.display = useErrata ? 'block' : 'none';

        if (useErrata) {
            updateCaptureRateErrata2015();
        } else {
            updateCaptureRateStandard();
        }
    };

    errata2015Toggle.addEventListener('change', () => {
        toggleSystem();
        persistCaptureState();
    });

    // Attach listeners for standard system
    statusCountInputs.forEach(input => {
        input.addEventListener('input', () => {
            updateCaptureRateStandard();
            persistCaptureState();
        });
    });

    statusCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateCaptureRateStandard();
            persistCaptureState();
        });
    });

    // Attach listeners for errata 2015 system
    errataCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateCaptureRateErrata2015();
            persistCaptureState();
        });
    });

    errataDoubleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCaptureRateErrata2015);
    });

    if (errataRarityInput) {
        errataRarityInput.addEventListener('input', () => {
            updateCaptureRateErrata2015();
            persistCaptureState();
        });
    }

    // Listen to HP changes
    const hpCurrentInput = document.getElementById('hpCurrentInput');
    if (hpCurrentInput) {
        hpCurrentInput.addEventListener('input', function () {
            pokemon.hitPoints = parseIntegerInputValue(this.value, 0);
            saveSelectedPokemon(pokemon);
            const updateFn = errata2015Toggle.checked ? updateCaptureRateErrata2015 : updateCaptureRateStandard;
            updateFn();
        });
        hpCurrentInput.addEventListener('change', function () {
            pokemon.hitPoints = parseIntegerInputValue(this.value, 0);
            const updateFn = errata2015Toggle.checked ? updateCaptureRateErrata2015 : updateCaptureRateStandard;
            updateFn();
        });
    }

    // Initial calculation and restored calculator mode.
    toggleSystem();
    window.addEventListener('ptu-owlbear-tracker-state-applied', toggleSystem);
}

window.addEventListener('load', function () {
    loadPokemonDetails();
});
