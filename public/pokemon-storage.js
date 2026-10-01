(() => {
    const HISTORY_KEY = 'ptu-pokemon-history-v1';
    const RECORD_PREFIX = 'ptu-pokemon-record-';
    const MAX_HISTORY_SIZE = 50;

    function historyKey(scope = 'site') {
        return scope === 'site' ? HISTORY_KEY : `${HISTORY_KEY}:${encodeURIComponent(scope)}`;
    }

    function recordPrefix(scope = 'site') {
        return scope === 'site' ? RECORD_PREFIX : `${RECORD_PREFIX}${encodeURIComponent(scope)}-`;
    }

    function createId() {
        return typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function readIndex(scope = 'site') {
        try {
            const history = JSON.parse(localStorage.getItem(historyKey(scope)));
            return Array.isArray(history) ? history : [];
        } catch (error) {
            console.error('Unable to read Pokémon history:', error);
            return [];
        }
    }

    function getIcon(pokemon) {
        const number = pokemon.Icon || pokemon.id;
        const path = pokemon._fandex ? `${pokemon._fandex}/${number}` : number;
        return `https://sewef.github.io/ptu/img/pokemon/icons/${path}.png`;
    }

    function ensureId(pokemon) {
        if (!pokemon._ptuRecordId) pokemon._ptuRecordId = createId();
        return pokemon._ptuRecordId;
    }

    function save(pokemon, scope = 'site') {
        if (!pokemon || typeof pokemon !== 'object') return null;

        const id = ensureId(pokemon);
        const updatedAt = new Date().toISOString();
        pokemon._ptuHistoryScope = scope;
        pokemon._ptuUpdatedAt = updatedAt;
        localStorage.setItem(`${recordPrefix(scope)}${id}`, JSON.stringify(pokemon));

        const entry = {
            id,
            name: pokemon.name || 'Unknown Pokémon',
            nickname: pokemon.nickname || '',
            level: Number(pokemon.level) || 1,
            icon: getIcon(pokemon),
            updatedAt
        };
        const history = [entry, ...readIndex(scope).filter(item => item?.id !== id)];
        const removed = history.splice(MAX_HISTORY_SIZE);
        removed.forEach(item => localStorage.removeItem(`${recordPrefix(scope)}${item.id}`));
        localStorage.setItem(historyKey(scope), JSON.stringify(history));
        window.dispatchEvent(new CustomEvent('ptu-history-updated', { detail: entry }));
        return id;
    }

    function load(id, scope = 'site') {
        if (!id) return null;
        try {
            return JSON.parse(localStorage.getItem(`${recordPrefix(scope)}${id}`));
        } catch (error) {
            console.error('Unable to load Pokémon from history:', error);
            return null;
        }
    }

    function list(scope = 'site') {
        return readIndex(scope).filter(item => item?.id && localStorage.getItem(`${recordPrefix(scope)}${item.id}`));
    }

    function remove(id, scope = 'site') {
        localStorage.removeItem(`${recordPrefix(scope)}${id}`);
        localStorage.setItem(historyKey(scope), JSON.stringify(readIndex(scope).filter(item => item?.id !== id)));
        window.dispatchEvent(new CustomEvent('ptu-history-updated'));
    }

    function clear(scope = 'site') {
        readIndex(scope).forEach(item => localStorage.removeItem(`${recordPrefix(scope)}${item.id}`));
        localStorage.removeItem(historyKey(scope));
        window.dispatchEvent(new CustomEvent('ptu-history-updated'));
    }

    window.PTUPokemonStorage = { HISTORY_KEY, historyKey, ensureId, save, load, list, remove, clear, getIcon };
})();
