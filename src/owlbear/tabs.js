import { POKEMON_KEY_PREFIX, TABS_STORAGE_KEY } from './constants.js';

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

function getHpPercentage(pokemon) {
    const current = Number(pokemon?.hitPoints);
    const maximum = Number(pokemon?.hitPointsMax);
    if (!Number.isFinite(current) || !Number.isFinite(maximum) || maximum <= 0) return 100;
    return Math.max(0, Math.min(100, (current / maximum) * 100));
}

function getTabLabel(pokemon) {
    return `${pokemon.nickname || pokemon.name} · Lv. ${pokemon.level}`;
}

export function createTabManager({ tabList, panelList, historyScope, sendOwlbearContext, schedulePokemonTokenSync }) {
    let tabs = [];
    let activeId = 'home';
    const scopeKey = encodeURIComponent(historyScope);
    const tabsStorageKey = `${TABS_STORAGE_KEY}:${scopeKey}`;
    const pokemonKeyPrefix = `${POKEMON_KEY_PREFIX}${scopeKey}-`;

    function persistTabs() {
        localStorage.setItem(tabsStorageKey, JSON.stringify({ tabs, activeId }));
    }

    function switchTab(id) {
        if (id !== 'home' && !tabs.some(tab => tab.id === id)) return;
        activeId = id;

        document.querySelectorAll('[data-tab-id]').forEach(element => {
            const active = element.dataset.tabId === id;
            const visualTab = element.closest('.extension-tab') || element;
            visualTab.classList.toggle('is-active', active);
            element.setAttribute('aria-selected', String(active));
            element.tabIndex = active ? 0 : -1;
        });
        document.querySelectorAll('[data-panel-id]').forEach(element => {
            const active = element.dataset.panelId === id;
            element.classList.toggle('is-active', active);
            element.hidden = !active;
        });

        persistTabs();
        document.querySelector(`[data-tab-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    function createTabElements(tab) {
        const tabElement = document.createElement('div');
        tabElement.className = 'extension-tab';

        const button = document.createElement('button');
        button.className = 'extension-tab-main';
        button.id = `tab-${tab.id}`;
        button.dataset.tabId = tab.id;
        button.type = 'button';
        button.role = 'tab';
        button.setAttribute('aria-selected', 'false');
        button.tabIndex = -1;

        const icon = document.createElement('img');
        icon.className = 'tab-icon';
        icon.src = tab.icon;
        icon.alt = '';

        const label = document.createElement('span');
        label.className = 'tab-label';
        label.textContent = tab.title;

        const health = document.createElement('span');
        health.className = 'tab-health';
        health.setAttribute('aria-hidden', 'true');
        const healthValue = document.createElement('span');
        healthValue.className = 'tab-health-value';
        healthValue.style.setProperty('--hp-percent', `${tab.hpPercent ?? 100}%`);
        health.appendChild(healthValue);

        const close = document.createElement('button');
        close.className = 'tab-close';
        close.type = 'button';
        close.setAttribute('aria-label', `Close ${tab.title}`);
        close.title = `Close ${tab.title}`;
        close.textContent = '×';
        close.addEventListener('click', event => {
            event.stopPropagation();
            closeTab(tab.id);
        });

        button.append(icon, label, health);
        button.addEventListener('click', () => switchTab(tab.id));
        tabElement.append(button, close);
        tabList.appendChild(tabElement);

        const panel = document.createElement('div');
        panel.className = 'extension-panel';
        panel.id = `panel-${tab.id}`;
        panel.dataset.panelId = tab.id;
        panel.role = 'tabpanel';
        panel.setAttribute('aria-labelledby', button.id);

        const frame = document.createElement('iframe');
        frame.src = `details.html?embedded=true&pokemonKey=${encodeURIComponent(tab.storageKey)}&historyScope=${encodeURIComponent(historyScope)}`;
        frame.title = `Details for ${tab.title}`;
        frame.addEventListener('load', () => sendOwlbearContext(frame.contentWindow));
        panel.appendChild(frame);
        panelList.appendChild(panel);
    }

    function openPokemon(pokemon, { activate = true } = {}) {
        const id = createId();
        const storageKey = `${pokemonKeyPrefix}${id}`;
        PTUPokemonStorage.save(pokemon, historyScope);
        const title = getTabLabel(pokemon);
        const tab = { id, storageKey, title, icon: getPokemonIcon(pokemon), hpPercent: getHpPercentage(pokemon) };

        localStorage.setItem(storageKey, JSON.stringify(pokemon));
        tabs.push(tab);
        createTabElements(tab);
        if (activate) switchTab(id);
        else persistTabs();
    }

    function closeTab(id) {
        const index = tabs.findIndex(tab => tab.id === id);
        if (index === -1) return;

        const [tab] = tabs.splice(index, 1);
        localStorage.removeItem(tab.storageKey);
        document.querySelector(`[data-tab-id="${CSS.escape(id)}"]`)?.closest('.extension-tab')?.remove();
        document.querySelector(`[data-panel-id="${CSS.escape(id)}"]`)?.remove();

        if (activeId === id) {
            switchTab(tabs[index - 1]?.id || tabs[index]?.id || 'home');
        } else {
            persistTabs();
        }
    }

    function restoreTabs() {
        try {
            const saved = JSON.parse(localStorage.getItem(tabsStorageKey));
            if (!saved || !Array.isArray(saved.tabs)) return;

            tabs = saved.tabs.filter(tab =>
                tab &&
                typeof tab.id === 'string' &&
                typeof tab.storageKey === 'string' &&
                tab.storageKey.startsWith(pokemonKeyPrefix) &&
                localStorage.getItem(tab.storageKey)
            ).map(tab => {
                const pokemon = JSON.parse(localStorage.getItem(tab.storageKey));
                return {
                    ...tab,
                    title: getTabLabel(pokemon),
                    icon: getPokemonIcon(pokemon),
                    hpPercent: getHpPercentage(pokemon)
                };
            });
            tabs.forEach(createTabElements);
            activeId = saved.activeId === 'home' || tabs.some(tab => tab.id === saved.activeId)
                ? saved.activeId
                : 'home';
        } catch (error) {
            console.error('Unable to restore Owlbear tabs:', error);
            tabs = [];
            activeId = 'home';
        }
        switchTab(activeId);
    }

    function updatePokemonTab(storageKey, pokemon) {
        const tab = tabs.find(item => item.storageKey === storageKey);
        if (!tab || !pokemon || typeof pokemon !== 'object') return;

        tab.title = getTabLabel(pokemon);
        tab.icon = getPokemonIcon(pokemon);
        tab.hpPercent = getHpPercentage(pokemon);
        const tabButton = document.querySelector(`[data-tab-id="${CSS.escape(tab.id)}"]`);
        const tabElement = tabButton?.closest('.extension-tab');
        const label = tabButton?.querySelector('.tab-label');
        const icon = tabButton?.querySelector('.tab-icon');
        const close = tabElement?.querySelector('.tab-close');
        const healthValue = tabButton?.querySelector('.tab-health-value');
        if (label) label.textContent = tab.title;
        if (icon) icon.src = tab.icon;
        if (close) {
            close.setAttribute('aria-label', `Close ${tab.title}`);
            close.title = `Close ${tab.title}`;
        }
        if (healthValue) healthValue.style.setProperty('--hp-percent', `${tab.hpPercent}%`);
        const frame = document.querySelector(`[data-panel-id="${CSS.escape(tab.id)}"] iframe`);
        if (frame) frame.title = `Details for ${tab.title}`;
        persistTabs();
        schedulePokemonTokenSync(pokemon);
    }

    function setupTabKeyboard() {
        tabList.addEventListener('keydown', event => {
            const currentTab = event.target.closest('[role="tab"]');
            if (!currentTab) return;
            const ids = ['home', ...tabs.map(tab => tab.id)];
            const currentId = currentTab.dataset.tabId;
            const currentIndex = ids.indexOf(currentId);
            if (currentIndex < 0) return;

            let nextIndex;
            if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % ids.length;
            else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + ids.length) % ids.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = ids.length - 1;
            else if (event.key === 'Delete' && currentId !== 'home') {
                event.preventDefault();
                closeTab(currentId);
                document.querySelector(`[data-tab-id="${CSS.escape(activeId)}"]`)?.focus();
                return;
            } else return;

            event.preventDefault();
            switchTab(ids[nextIndex]);
            document.querySelector(`[data-tab-id="${CSS.escape(activeId)}"]`)?.focus();
        });

        document.getElementById('tab-home').addEventListener('click', () => switchTab('home'));
    }

    return {
        openPokemon,
        restoreTabs,
        setupTabKeyboard,
        updatePokemonTab
    };
}
