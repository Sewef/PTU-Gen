const POKE_EDGES_URL = 'https://sewef.github.io/ptu/data/pokeedges/pokeedges_core.min.json';

function calculateDefaultTutorPoints(level) {
    return Math.floor((parseInt(level, 10) || 0) / 5) + 1;
}

function setupPokeEdgesEditor(pokemon) {
    const addPokeEdgeBtn = document.getElementById('addPokeEdgeBtn');
    const addBlankPokeEdgeBtn = document.getElementById('addBlankPokeEdgeBtn');
    const tutorPointsInput = document.getElementById('tutorPointsInput');

    if (!pokemon.pokeEdges) {
        pokemon.pokeEdges = [];
    }

    if (pokemon.tutorPoints === undefined || pokemon.tutorPoints === null) {
        pokemon.tutorPoints = calculateDefaultTutorPoints(pokemon.level);
    }

    if (tutorPointsInput) {
        tutorPointsInput.value = pokemon.tutorPoints;
        tutorPointsInput.addEventListener('change', function () {
            pokemon.tutorPoints = parseInt(this.value, 10) || 0;
            pokemon.tutorPointsManual = true;
            localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
        });
    }

    updatePokeEdgesDisplay(pokemon);

    if (addPokeEdgeBtn) {
        addPokeEdgeBtn.addEventListener('click', function () {
            showAddPokeEdgeModal(pokemon);
        });
    }

    if (addBlankPokeEdgeBtn) {
        addBlankPokeEdgeBtn.addEventListener('click', function () {
            addBlankPokeEdge(pokemon);
        });
    }
}

function normalizePokeEdge(rawEdge, fallbackName = '') {
    if (typeof rawEdge === 'string') {
        return {
            name: fallbackName || rawEdge,
            effect: rawEdge
        };
    }

    const edge = rawEdge || {};
    return {
        name: edge.name || edge.Name || edge.Edge || fallbackName,
        prerequisites: edge.prerequisites || edge.Prerequisites || edge.Prerequisite || edge.Requirements || '',
        cost: edge.cost || edge.Cost || edge.TutorPoints || edge['Tutor Points'] || '',
        effect: edge.effect || edge.Effect || edge.Description || edge.description || '',
        note: edge.note || edge.Note || '',
        raw: edge
    };
}

function normalizePokeEdgesData(data) {
    if (Array.isArray(data)) {
        return data
            .map(edge => normalizePokeEdge(edge))
            .filter(edge => edge.name);
    }

    if (data && typeof data === 'object') {
        const directList = data.pokeEdges || data.PokeEdges || data.edges || data.Edges || data.all || data.All;
        if (Array.isArray(directList)) {
            return normalizePokeEdgesData(directList);
        }

        const categoryLists = Object.values(data).filter(Array.isArray);
        if (categoryLists.length > 0) {
            return categoryLists
                .flat()
                .map(edge => normalizePokeEdge(edge))
                .filter(edge => edge.name);
        }

        return Object.entries(data)
            .map(([name, edge]) => normalizePokeEdge(edge, name))
            .filter(edge => edge.name);
    }

    return [];
}

async function fetchAllPokeEdges() {
    const response = await fetch(POKE_EDGES_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch Poké Edges: ${response.statusText}`);
    }

    return normalizePokeEdgesData(await response.json());
}

function addPokeEdge(pokemon, edgeData) {
    const exists = pokemon.pokeEdges.some(edge => edge.name === edgeData.name);
    if (exists) {
        removePokeEdge(pokemon, edgeData.name);
    } else {
        pokemon.pokeEdges.push(edgeData);
        localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
        updatePokeEdgesDisplay(pokemon);
    }

    const btn = document.querySelector(`button[data-poke-edge-name="${edgeData.name.toLowerCase()}"]`);
    if (btn) {
        const nowExists = pokemon.pokeEdges.some(edge => edge.name === edgeData.name);
        btn.classList.toggle('exists', nowExists);
        const checkmark = btn.querySelector('.poke-edge-btn-checkmark');
        if (nowExists && !checkmark) {
            const span = document.createElement('span');
            span.className = 'poke-edge-btn-checkmark';
            span.textContent = ' ✓';
            btn.appendChild(span);
        } else if (!nowExists && checkmark) {
            checkmark.remove();
        }
    }
}

function addBlankPokeEdge(pokemon) {
    let counter = 1;
    let newName = `Custom Poké Edge ${counter}`;
    while (pokemon.pokeEdges.some(edge => edge.name === newName)) {
        counter++;
        newName = `Custom Poké Edge ${counter}`;
    }

    pokemon.pokeEdges.push({
        name: newName,
        prerequisites: '',
        cost: '',
        effect: '',
        editable: true
    });
    localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
    updatePokeEdgesDisplay(pokemon);
}

function removePokeEdge(pokemon, edgeName) {
    pokemon.pokeEdges = pokemon.pokeEdges.filter(edge => edge.name !== edgeName);
    localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
    updatePokeEdgesDisplay(pokemon);
}

function updatePokeEdgesDisplay(pokemon) {
    const pokeEdgesList = document.getElementById('pokeEdgesList');
    if (!pokeEdgesList) return;

    if (!pokemon.pokeEdges || pokemon.pokeEdges.length === 0) {
        pokeEdgesList.innerHTML = '<div class="empty-state compact">No Poké Edges yet.</div>';
        return;
    }

    pokeEdgesList.innerHTML = pokemon.pokeEdges.map(edge => {
        if (edge.editable) {
            return `
                <div class="section-card poke-edge" data-poke-edge-name="${edge.name}">
                    <div class="section-card-header">
                        <input type="text" class="custom-poke-edge-name-input" value="${edge.name}" placeholder="Poké Edge name" />
                        <button class="remove-poke-edge-btn" title="Remove this Poké Edge">✕ Remove</button>
                    </div>
                    <div class="section-card-field"><strong>Prerequisites:</strong> <input type="text" class="custom-poke-edge-field-input" data-field="prerequisites" value="${edge.prerequisites || ''}" /></div>
                    <div class="section-card-field"><strong>Cost:</strong> <input type="text" class="custom-poke-edge-field-input short" data-field="cost" value="${edge.cost || ''}" /></div>
                    <div class="section-card-field"><strong>Effect:</strong> <input type="text" class="custom-poke-edge-field-input" data-field="effect" value="${edge.effect || ''}" /></div>
                </div>
            `;
        }

        return `
            <div class="section-card poke-edge" data-poke-edge-name="${edge.name}">
                <div class="section-card-header">
                    <div class="section-card-name">${edge.name}</div>
                    <button class="remove-poke-edge-btn" title="Remove this Poké Edge">✕ Remove</button>
                </div>
                ${edge.prerequisites ? `<div class="section-card-field"><strong>Prerequisites:</strong> ${edge.prerequisites}</div>` : ''}
                ${edge.cost ? `<div class="section-card-field"><strong>Cost:</strong> ${edge.cost}</div>` : ''}
                ${edge.effect ? `<div class="section-card-field"><strong>Effect:</strong> ${edge.effect}</div>` : ''}
                ${edge.note ? `<div class="section-card-field note"><strong>Note:</strong> ${edge.note}</div>` : ''}
            </div>
        `;
    }).join('');

    document.querySelectorAll('.remove-poke-edge-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const edgeElement = btn.closest('.section-card');
            removePokeEdge(pokemon, edgeElement.getAttribute('data-poke-edge-name'));
        });
    });

    document.querySelectorAll('.custom-poke-edge-name-input').forEach(input => {
        input.addEventListener('change', function () {
            const edgeElement = input.closest('.section-card');
            const previousName = edgeElement.getAttribute('data-poke-edge-name');
            const edge = pokemon.pokeEdges.find(item => item.name === previousName);
            if (!edge) return;
            edge.name = input.value.trim() || previousName;
            localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
            updatePokeEdgesDisplay(pokemon);
        });
    });

    document.querySelectorAll('.custom-poke-edge-field-input').forEach(input => {
        input.addEventListener('change', function () {
            const edgeElement = input.closest('.section-card');
            const edge = pokemon.pokeEdges.find(item => item.name === edgeElement.getAttribute('data-poke-edge-name'));
            if (!edge) return;
            edge[input.dataset.field] = input.value.trim();
            localStorage.setItem('selectedPokemon', JSON.stringify(pokemon));
        });
    });
}

async function showAddPokeEdgeModal(pokemon) {
    try {
        const allPokeEdges = await fetchAllPokeEdges();
        const modalHTML = createAddPokeEdgeModalHTML(allPokeEdges);
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('addPokeEdgeModal');
        const closeBtn = document.getElementById('closeAddPokeEdgeBtn');
        const searchInput = document.getElementById('pokeEdgeSearchInput');
        const grid = document.getElementById('pokeEdgeGrid');

        closeBtn.addEventListener('click', function () {
            modal.remove();
        });

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.remove();
            }
        });

        searchInput.addEventListener('input', function () {
            filterPokeEdges(grid, this.value.toLowerCase());
        });

        displayPokeEdgesInGrid(grid, allPokeEdges, pokemon);
    } catch (error) {
        console.error('Failed to load Poké Edges:', error);
        alert('Failed to load Poké Edges');
    }
}

function createAddPokeEdgeModalHTML(allPokeEdges) {
    return `
        <div id="addPokeEdgeModal" class="modal-overlay">
            <div class="modal-content" style="max-width: 800px;">
                <h2 class="modal-title">Add Poké Edge</h2>
                <div class="modal-search-bar">
                    <input type="text" id="pokeEdgeSearchInput" placeholder="Search Poké Edges..." class="modal-search-input" />
                </div>
                <div class="modal-info-box">
                    <p class="modal-info-text"><strong>Total Poké Edges:</strong> <span id="pokeEdgeCountSpan">${allPokeEdges.length}</span></p>
                </div>
                <div id="pokeEdgeGrid" class="move-grid"></div>
                <div class="modal-buttons">
                    <button id="closeAddPokeEdgeBtn" class="modal-btn modal-btn-secondary">Close</button>
                </div>
            </div>
        </div>
    `;
}

function displayPokeEdgesInGrid(grid, allPokeEdges, pokemon) {
    grid.innerHTML = '';

    if (allPokeEdges.length === 0) {
        grid.innerHTML = '<div class="empty-grid-message">No Poké Edges available</div>';
        return;
    }

    const section = document.createElement('div');
    section.className = 'move-section';
    section.innerHTML = '<div class="move-section-header">All Poké Edges</div>';

    const list = document.createElement('div');
    list.className = 'move-section-list';

    allPokeEdges.forEach(edge => {
        list.appendChild(createPokeEdgeButton(edge, pokemon));
    });

    section.appendChild(list);
    grid.appendChild(section);
}

function createPokeEdgeButton(edge, pokemon) {
    const btn = document.createElement('button');
    const edgeExists = pokemon.pokeEdges.some(item => item.name === edge.name);
    btn.className = `modal-move-btn ${edgeExists ? 'exists' : ''}`;
    btn.dataset.pokeEdgeName = edge.name.toLowerCase();
    btn.dataset.pokeEdgeText = `${edge.name} ${edge.prerequisites || ''} ${edge.effect || ''}`.toLowerCase();
    btn.textContent = edge.name;

    if (edgeExists) {
        const checkmark = document.createElement('span');
        checkmark.className = 'poke-edge-btn-checkmark';
        checkmark.textContent = ' ✓';
        btn.appendChild(checkmark);
    }

    btn.addEventListener('click', function (event) {
        event.stopPropagation();
        addPokeEdge(pokemon, edge);
    });

    return btn;
}

function filterPokeEdges(grid, searchTerm) {
    let visibleCount = 0;

    grid.querySelectorAll('button[data-poke-edge-name]').forEach(btn => {
        const isVisible = btn.dataset.pokeEdgeText.includes(searchTerm);
        btn.classList.toggle('btn-hidden', !isVisible);
        if (isVisible) visibleCount++;
    });

    if (visibleCount === 0) {
        if (!grid.querySelector('.no-results-poke-edges')) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results-poke-edges';
            noResults.style.cssText = 'padding: 20px; text-align: center; color: #999; grid-column: 1 / -1;';
            noResults.textContent = 'No Poké Edges match your search';
            grid.appendChild(noResults);
        }
    } else {
        const noResults = grid.querySelector('.no-results-poke-edges');
        if (noResults) noResults.remove();
    }
}
