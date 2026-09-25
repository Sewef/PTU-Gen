(() => {
    const HISTORY_KEY = 'ptu-pokemon-history-v1';
    const RECORD_PREFIX = 'ptu-pokemon-record-';
    const MAX_HISTORY_SIZE = 50;

    function createId() {
        return typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function readIndex() {
        try {
            const history = JSON.parse(localStorage.getItem(HISTORY_KEY));
            return Array.isArray(history) ? history : [];
        } catch (error) {
            console.warn('Unable to read Pokémon history:', error);
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

    function save(pokemon) {
        if (!pokemon || typeof pokemon !== 'object') return null;

        const id = ensureId(pokemon);
        const updatedAt = new Date().toISOString();
        pokemon._ptuUpdatedAt = updatedAt;
        localStorage.setItem(`${RECORD_PREFIX}${id}`, JSON.stringify(pokemon));

        const entry = {
            id,
            name: pokemon.name || 'Unknown Pokémon',
            nickname: pokemon.nickname || '',
            level: Number(pokemon.level) || 1,
            icon: getIcon(pokemon),
            updatedAt
        };
        const history = [entry, ...readIndex().filter(item => item?.id !== id)];
        const removed = history.splice(MAX_HISTORY_SIZE);
        removed.forEach(item => localStorage.removeItem(`${RECORD_PREFIX}${item.id}`));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        window.dispatchEvent(new CustomEvent('ptu-history-updated', { detail: entry }));
        return id;
    }

    function load(id) {
        if (!id) return null;
        try {
            return JSON.parse(localStorage.getItem(`${RECORD_PREFIX}${id}`));
        } catch (error) {
            console.warn('Unable to load Pokémon from history:', error);
            return null;
        }
    }

    function list() {
        return readIndex().filter(item => item?.id && localStorage.getItem(`${RECORD_PREFIX}${item.id}`));
    }

    function remove(id) {
        localStorage.removeItem(`${RECORD_PREFIX}${id}`);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(readIndex().filter(item => item?.id !== id)));
        window.dispatchEvent(new CustomEvent('ptu-history-updated'));
    }

    function clear() {
        readIndex().forEach(item => localStorage.removeItem(`${RECORD_PREFIX}${item.id}`));
        localStorage.removeItem(HISTORY_KEY);
        window.dispatchEvent(new CustomEvent('ptu-history-updated'));
    }

    window.PTUPokemonStorage = { HISTORY_KEY, ensureId, save, load, list, remove, clear, getIcon };
})();
