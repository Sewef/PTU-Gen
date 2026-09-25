import OBR, { buildImage } from '@owlbear-rodeo/sdk';

(() => {
    const TABS_STORAGE_KEY = 'ptu-owlbear-tabs-v1';
    const POKEMON_KEY_PREFIX = 'ptu-owlbear-pokemon-';
    const tabList = document.getElementById('tabList');
    const panelList = document.getElementById('panelList');
    let tabs = [];
    let activeId = 'home';
    let currentPlayer = null;
    let partyPlayers = [];
    let resolveOwlbearReady;
    const owlbearReady = new Promise(resolve => {
        resolveOwlbearReady = resolve;
    });
    const trackedTokenWindows = new Map();
    const tokenSyncTimers = new Map();
    const OWL_TRACKERS_METADATA_KEY = 'com.owl-trackers/trackers';

    function getFiniteNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function getOwlTrackerState(item) {
        const trackers = item?.metadata?.[OWL_TRACKERS_METADATA_KEY];
        if (!Array.isArray(trackers)) return null;

        const hpTracker = trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'hp');
        const injuriesTracker = trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'injuries');
        const hpValue = getFiniteNumber(hpTracker?.value);
        const hpMax = getFiniteNumber(hpTracker?.max);
        const injuries = getFiniteNumber(injuriesTracker?.value);

        return {
            hp: hpValue === null && hpMax === null ? null : { value: hpValue, max: hpMax },
            injuries: injuries === null ? null : Math.max(0, Math.trunc(injuries))
        };
    }

    function serializeToken(item) {
        return item ? {
            id: item.id,
            name: String(item.name || ''),
            visible: Boolean(item.visible),
            createdUserId: String(item.createdUserId || ''),
            owlTrackers: getOwlTrackerState(item)
        } : null;
    }

    function registerTrackedToken(tokenId, targetWindow) {
        if (!tokenId || !targetWindow) return;
        if (!trackedTokenWindows.has(tokenId)) trackedTokenWindows.set(tokenId, new Set());
        trackedTokenWindows.get(tokenId).add(targetWindow);
    }

    function postTokenState(targetWindow, tokenId, item) {
        targetWindow?.postMessage({
            type: 'ptu-owlbear-token-state',
            tokenId,
            exists: Boolean(item),
            ...(serializeToken(item) || {
                name: null,
                visible: null,
                createdUserId: null,
                owlTrackers: null
            })
        }, window.location.origin);
    }

    function notifyTrackedTokenStates(items) {
        const itemsById = new Map(items.map(item => [item.id, item]));
        trackedTokenWindows.forEach((windows, tokenId) => {
            windows.forEach(targetWindow => postTokenState(targetWindow, tokenId, itemsById.get(tokenId)));
        });
    }

    async function requireOwlbearScene() {
        const ready = await owlbearReady;
        if (!ready) throw new Error('Owlbear Rodeo is not available.');
        if (!await OBR.scene.isReady()) throw new Error('No Owlbear scene is currently ready.');
    }

    async function getViewportCenter() {
        const [width, height] = await Promise.all([
            OBR.viewport.getWidth(),
            OBR.viewport.getHeight()
        ]);
        return OBR.viewport.inverseTransformPoint({ x: width / 2, y: height / 2 });
    }

    function buildSceneToken(source, position) {
        const builder = buildImage(source.image, source.grid)
            .id(source.id)
            .name(source.name)
            .position(position)
            .rotation(source.rotation || 0)
            .scale(source.scale || { x: 1, y: 1 })
            .visible(source.visible !== false)
            .locked(Boolean(source.locked))
            .metadata(source.metadata || {})
            .layer(source.layer || 'CHARACTER');

        if (source.text) builder.text(source.text);
        if (source.textItemType) builder.textItemType(source.textItemType);
        if (source.createdUserId) builder.createdUserId(source.createdUserId);
        return builder.build();
    }

    async function insertSceneToken(source, targetWindow) {
        await requireOwlbearScene();
        if (!source?.id || !source.image || !source.grid) throw new Error('The token data is incomplete.');

        const existing = await OBR.scene.items.getItems([source.id]);
        if (existing.length > 0) {
            registerTrackedToken(source.id, targetWindow);
            return existing[0];
        }

        const position = await getViewportCenter();
        const token = buildSceneToken(source, position);
        await OBR.scene.items.addItems([token]);

        const [inserted] = await OBR.scene.items.getItems([token.id]);
        if (!inserted) throw new Error('Owlbear did not confirm the inserted token.');
        registerTrackedToken(inserted.id, targetWindow);
        return inserted;
    }

    async function getSceneToken(tokenId, targetWindow) {
        await requireOwlbearScene();
        registerTrackedToken(tokenId, targetWindow);
        const [item] = await OBR.scene.items.getItems([tokenId]);
        return item || null;
    }

    async function setSceneTokenVisibility(tokenId, visible, targetWindow) {
        const existing = await getSceneToken(tokenId, targetWindow);
        if (!existing) throw new Error('The linked token no longer exists in this scene.');

        await OBR.scene.items.updateItems([tokenId], items => {
            items.forEach(item => {
                item.visible = Boolean(visible);
            });
        });

        const [updated] = await OBR.scene.items.getItems([tokenId]);
        if (!updated) throw new Error('The linked token could not be read after updating it.');
        return updated;
    }

    async function setSceneTokenOwner(tokenId, createdUserId, targetWindow) {
        const existing = await getSceneToken(tokenId, targetWindow);
        if (!existing) throw new Error('The linked token no longer exists in this scene.');

        const validPlayerIds = new Set([
            OBR.player.id,
            ...(await OBR.party.getPlayers()).map(player => player.id)
        ]);
        if (!validPlayerIds.has(createdUserId)) throw new Error('The selected player is no longer in the room.');

        await OBR.scene.items.updateItems([tokenId], items => {
            items.forEach(item => {
                item.createdUserId = createdUserId;
            });
        });

        const [updated] = await OBR.scene.items.getItems([tokenId]);
        if (!updated) throw new Error('The linked token could not be read after changing its owner.');
        return updated;
    }

    async function syncPokemonToSceneToken(pokemon) {
        const tokenId = String(pokemon?.owlbear?.tokenId || '').trim();
        if (!tokenId) return;

        await requireOwlbearScene();
        const [existing] = await OBR.scene.items.getItems([tokenId]);
        if (!existing) return;

        const desiredName = String(pokemon.nickname || '').trim() || String(pokemon.name || 'Pokémon');
        const trackersEnabled = pokemon.owlbear?.trackers === 'owltrackers';
        const trackers = existing.metadata?.[OWL_TRACKERS_METADATA_KEY];
        const hpTracker = Array.isArray(trackers)
            ? trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'hp')
            : null;
        const desiredHp = getFiniteNumber(pokemon.hitPoints);
        const desiredHpMax = getFiniteNumber(pokemon.hitPointsMax);
        const nameChanged = existing.name !== desiredName || (existing.text?.plainText !== undefined && existing.text.plainText !== desiredName);
        const hpChanged = trackersEnabled && hpTracker && (
            (desiredHp !== null && Number(hpTracker.value) !== desiredHp) ||
            (desiredHpMax !== null && Number(hpTracker.max) !== desiredHpMax)
        );
        if (!nameChanged && !hpChanged) return;

        await OBR.scene.items.updateItems([tokenId], items => {
            items.forEach(item => {
                item.name = desiredName;
                if (item.text?.plainText !== undefined) item.text.plainText = desiredName;

                if (!trackersEnabled) return;
                const itemTrackers = item.metadata?.[OWL_TRACKERS_METADATA_KEY];
                if (!Array.isArray(itemTrackers)) return;
                const itemHp = itemTrackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'hp');
                if (itemHp && desiredHp !== null) itemHp.value = desiredHp;
                if (itemHp && desiredHpMax !== null) itemHp.max = desiredHpMax;
            });
        });
    }

    function schedulePokemonTokenSync(pokemon) {
        const tokenId = String(pokemon?.owlbear?.tokenId || '').trim();
        if (!tokenId || !trackedTokenWindows.has(tokenId)) return;

        clearTimeout(tokenSyncTimers.get(tokenId));
        tokenSyncTimers.set(tokenId, setTimeout(() => {
            tokenSyncTimers.delete(tokenId);
            syncPokemonToSceneToken(pokemon).catch(error => {
                console.warn('Unable to synchronize the Owlbear token:', error);
            });
        }, 300));
    }

    async function handleOwlbearCommand(event) {
        const { requestId, command, payload = {} } = event.data;
        if (!requestId || !command) return;

        try {
            let item = null;
            if (command === 'insert-token') {
                item = await insertSceneToken(payload.item, event.source);
            } else if (command === 'get-token-state') {
                item = await getSceneToken(payload.tokenId, event.source);
            } else if (command === 'set-token-visibility') {
                item = await setSceneTokenVisibility(payload.tokenId, payload.visible, event.source);
            } else if (command === 'set-token-owner') {
                item = await setSceneTokenOwner(payload.tokenId, payload.createdUserId, event.source);
            } else {
                throw new Error(`Unknown Owlbear command: ${command}`);
            }

            event.source?.postMessage({
                type: 'ptu-owlbear-command-result',
                requestId,
                ok: true,
                token: serializeToken(item)
            }, window.location.origin);
        } catch (error) {
            event.source?.postMessage({
                type: 'ptu-owlbear-command-result',
                requestId,
                ok: false,
                error: error instanceof Error ? error.message : String(error)
            }, window.location.origin);
        }
    }

    function getOwlbearContextMessage() {
        return {
            type: 'ptu-owlbear-players',
            currentPlayer,
            players: partyPlayers
        };
    }

    function sendOwlbearContext(targetWindow) {
        if (!targetWindow || !currentPlayer) return;
        targetWindow.postMessage(getOwlbearContextMessage(), window.location.origin);
    }

    function broadcastOwlbearContext() {
        document.querySelectorAll('.extension-panel iframe').forEach(frame => {
            sendOwlbearContext(frame.contentWindow);
        });
    }

    async function initializeOwlbearContext() {
        if (!OBR.isAvailable) {
            resolveOwlbearReady(false);
            return;
        }

        OBR.onReady(async () => {
            resolveOwlbearReady(true);
            try {
                currentPlayer = {
                    id: OBR.player.id,
                    name: await OBR.player.getName()
                };
                partyPlayers = (await OBR.party.getPlayers())
                    .filter(player => player.id !== currentPlayer.id);
                broadcastOwlbearContext();

                OBR.party.onChange(players => {
                    partyPlayers = players.filter(player => player.id !== currentPlayer.id);
                    broadcastOwlbearContext();
                });

                OBR.player.onChange(player => {
                    currentPlayer = { id: player.id, name: player.name };
                    partyPlayers = partyPlayers.filter(partyPlayer => partyPlayer.id !== player.id);
                    broadcastOwlbearContext();
                });

                OBR.scene.items.onChange(items => {
                    notifyTrackedTokenStates(items);
                });
            } catch (error) {
                console.warn('Unable to load Owlbear players:', error);
            }
        });
    }

    function createId() {
        return typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function getPokemonIcon(pokemon) {
        const number = pokemon.Icon || pokemon.id;
        const path = pokemon._fandex ? `${pokemon._fandex}/${number}` : number;
        return `https://sewef.github.io/ptu/img/pokemon/icons/${path}.png`;
    }

    function persistTabs() {
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify({ tabs, activeId }));
    }

    function switchTab(id) {
        if (id !== 'home' && !tabs.some(tab => tab.id === id)) return;
        activeId = id;

        document.querySelectorAll('[data-tab-id]').forEach(element => {
            const active = element.dataset.tabId === id;
            element.classList.toggle('is-active', active);
            element.setAttribute('aria-selected', String(active));
        });
        document.querySelectorAll('[data-panel-id]').forEach(element => {
            element.classList.toggle('is-active', element.dataset.panelId === id);
        });

        persistTabs();
        document.querySelector(`[data-tab-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    function createTabElements(tab) {
        const button = document.createElement('button');
        button.className = 'extension-tab';
        button.id = `tab-${tab.id}`;
        button.dataset.tabId = tab.id;
        button.type = 'button';
        button.role = 'tab';
        button.setAttribute('aria-selected', 'false');

        const icon = document.createElement('img');
        icon.className = 'tab-icon';
        icon.src = tab.icon;
        icon.alt = '';

        const label = document.createElement('span');
        label.className = 'tab-label';
        label.textContent = tab.title;

        const close = document.createElement('span');
        close.className = 'tab-close';
        close.setAttribute('role', 'button');
        close.setAttribute('aria-label', `Close ${tab.title}`);
        close.textContent = '×';
        close.addEventListener('click', event => {
            event.stopPropagation();
            closeTab(tab.id);
        });

        button.append(icon, label, close);
        button.addEventListener('click', () => switchTab(tab.id));
        tabList.appendChild(button);

        const panel = document.createElement('div');
        panel.className = 'extension-panel';
        panel.id = `panel-${tab.id}`;
        panel.dataset.panelId = tab.id;
        panel.role = 'tabpanel';
        panel.setAttribute('aria-labelledby', button.id);

        const frame = document.createElement('iframe');
        frame.src = `details.html?embedded=true&pokemonKey=${encodeURIComponent(tab.storageKey)}`;
        frame.title = `Details for ${tab.title}`;
        frame.addEventListener('load', () => sendOwlbearContext(frame.contentWindow));
        panel.appendChild(frame);
        panelList.appendChild(panel);
    }

    function openPokemon(pokemon) {
        const id = createId();
        const storageKey = `${POKEMON_KEY_PREFIX}${id}`;
        PTUPokemonStorage.save(pokemon);
        const title = `${pokemon.nickname || pokemon.name} · Lv. ${pokemon.level}`;
        const tab = { id, storageKey, title, icon: getPokemonIcon(pokemon) };

        localStorage.setItem(storageKey, JSON.stringify(pokemon));
        tabs.push(tab);
        createTabElements(tab);
        switchTab(id);
    }

    function closeTab(id) {
        const index = tabs.findIndex(tab => tab.id === id);
        if (index === -1) return;

        const [tab] = tabs.splice(index, 1);
        localStorage.removeItem(tab.storageKey);
        document.querySelector(`[data-tab-id="${CSS.escape(id)}"]`)?.remove();
        document.querySelector(`[data-panel-id="${CSS.escape(id)}"]`)?.remove();

        if (activeId === id) {
            switchTab(tabs[index - 1]?.id || tabs[index]?.id || 'home');
        } else {
            persistTabs();
        }
    }

    function restoreTabs() {
        try {
            const saved = JSON.parse(localStorage.getItem(TABS_STORAGE_KEY));
            if (!saved || !Array.isArray(saved.tabs)) return;

            tabs = saved.tabs.filter(tab =>
                tab &&
                typeof tab.id === 'string' &&
                typeof tab.storageKey === 'string' &&
                tab.storageKey.startsWith(POKEMON_KEY_PREFIX) &&
                localStorage.getItem(tab.storageKey)
            ).map(tab => {
                const pokemon = JSON.parse(localStorage.getItem(tab.storageKey));
                return {
                    ...tab,
                    title: `${pokemon.nickname || pokemon.name} · Lv. ${pokemon.level}`,
                    icon: getPokemonIcon(pokemon)
                };
            });
            tabs.forEach(createTabElements);
            activeId = saved.activeId === 'home' || tabs.some(tab => tab.id === saved.activeId)
                ? saved.activeId
                : 'home';
        } catch (error) {
            console.warn('Unable to restore Owlbear tabs:', error);
            tabs = [];
            activeId = 'home';
        }
        switchTab(activeId);
    }

    tabList.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const ids = ['home', ...tabs.map(tab => tab.id)];
        const offset = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (ids.indexOf(activeId) + offset + ids.length) % ids.length;
        switchTab(ids[nextIndex]);
        document.querySelector(`[data-tab-id="${CSS.escape(activeId)}"]`)?.focus();
    });

    document.getElementById('tab-home').addEventListener('click', () => switchTab('home'));
    document.querySelector('#panel-home iframe')?.addEventListener('load', event => {
        sendOwlbearContext(event.currentTarget.contentWindow);
    });
    window.addEventListener('message', event => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'ptu-request-owlbear-players') {
            sendOwlbearContext(event.source);
            return;
        }

        if (event.data?.type === 'ptu-owlbear-command') {
            handleOwlbearCommand(event);
            return;
        }

        if (event.data?.type === 'ptu-open-pokemon') {
            if (!event.data.pokemon || typeof event.data.pokemon !== 'object') return;
            openPokemon(event.data.pokemon);
            return;
        }

        if (event.data?.type === 'ptu-pokemon-updated') {
            const tab = tabs.find(item => item.storageKey === event.data.storageKey);
            const pokemon = event.data.pokemon;
            if (!tab || !pokemon || typeof pokemon !== 'object') return;

            tab.title = `${pokemon.nickname || pokemon.name} · Lv. ${pokemon.level}`;
            tab.icon = getPokemonIcon(pokemon);
            const tabElement = document.querySelector(`[data-tab-id="${CSS.escape(tab.id)}"]`);
            const label = tabElement?.querySelector('.tab-label');
            const icon = tabElement?.querySelector('.tab-icon');
            const close = tabElement?.querySelector('.tab-close');
            if (label) label.textContent = tab.title;
            if (icon) icon.src = tab.icon;
            if (close) close.setAttribute('aria-label', `Close ${tab.title}`);
            const frame = document.querySelector(`[data-panel-id="${CSS.escape(tab.id)}"] iframe`);
            if (frame) frame.title = `Details for ${tab.title}`;
            persistTabs();
            schedulePokemonTokenSync(pokemon);
        }
    });

    restoreTabs();
    initializeOwlbearContext();
})();
