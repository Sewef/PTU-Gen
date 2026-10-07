import { OWL_TRACKERS_METADATA_KEY } from './constants.js';

function getFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function createTempHpTracker(value) {
    return {
        id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        variant: 'value',
        color: 3,
        value,
        name: 'Temp HP'
    };
}

function getOwlTrackerState(item) {
    const trackers = item?.metadata?.[OWL_TRACKERS_METADATA_KEY];
    if (!Array.isArray(trackers)) return null;

    const hpTracker = trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'hp');
    const injuriesTracker = trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'injuries');
    const tempHpTracker = trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'temp hp');
    const hpValue = getFiniteNumber(hpTracker?.value);
    const hpMax = getFiniteNumber(hpTracker?.max);
    const injuries = getFiniteNumber(injuriesTracker?.value);
    const tempHp = getFiniteNumber(tempHpTracker?.value);

    return {
        hp: hpValue === null && hpMax === null ? null : { value: hpValue, max: hpMax },
        injuries: injuries === null ? null : Math.max(0, Math.trunc(injuries)),
        tempHp: tempHp === null ? null : Math.max(0, Math.trunc(tempHp))
    };
}

export function createTokenService({ OBR, buildImage, owlbearReady }) {
    const trackedTokenWindows = new Map();
    const tokenSyncTimers = new Map();

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

    async function focusSceneToken(tokenId, targetWindow) {
        const item = await getSceneToken(tokenId, targetWindow);
        if (!item) throw new Error('The linked token no longer exists in this scene.');

        const [bounds, viewportPosition, viewportWidth, viewportHeight] = await Promise.all([
            OBR.scene.items.getItemBounds([tokenId]),
            OBR.viewport.getPosition(),
            OBR.viewport.getWidth(),
            OBR.viewport.getHeight()
        ]);
        const tokenScreenPosition = await OBR.viewport.transformPoint(bounds.center);
        await OBR.viewport.setPosition({
            x: viewportPosition.x + (viewportWidth / 2) - tokenScreenPosition.x,
            y: viewportPosition.y + (viewportHeight / 2) - tokenScreenPosition.y
        });
        await OBR.player.select([tokenId], true);
        return item;
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

        const desiredName = (pokemon.shiny ? '✨ ' : '') + (String(pokemon.nickname || '').trim() || String(pokemon.name || 'Pokémon'));
        const trackersEnabled = pokemon.owlbear?.trackers === 'owltrackers';
        const trackers = existing.metadata?.[OWL_TRACKERS_METADATA_KEY];
        const hpTracker = Array.isArray(trackers)
            ? trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'hp')
            : null;
        const injuriesTracker = Array.isArray(trackers)
            ? trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'injuries')
            : null;
        const tempHpTracker = Array.isArray(trackers)
            ? trackers.find(tracker => String(tracker?.name || '').toLowerCase() === 'temp hp')
            : null;
        const desiredHp = getFiniteNumber(pokemon.hitPoints);
        const desiredHpMax = getFiniteNumber(pokemon.hitPointsMax);
        const desiredInjuries = Math.max(0, Math.trunc(getFiniteNumber(pokemon.captureState?.standardCounts?.injuries) || 0));
        const desiredTempHp = Math.max(0, Math.trunc(getFiniteNumber(pokemon.tempHitPoints) || 0));
        const desiredImageUrl = String(pokemon.imageUrl || '').trim();
        const nameChanged = existing.name !== desiredName || (existing.text?.plainText !== undefined && existing.text.plainText !== desiredName);
        const imageChanged = Boolean(desiredImageUrl && existing.image?.url !== desiredImageUrl);
        const hpChanged = trackersEnabled && hpTracker && (
            (desiredHp !== null && Number(hpTracker.value) !== desiredHp) ||
            (desiredHpMax !== null && Number(hpTracker.max) !== desiredHpMax)
        );
        const injuriesChanged = trackersEnabled && injuriesTracker && Number(injuriesTracker.value) !== desiredInjuries;
        const tempHpChanged = trackersEnabled && Array.isArray(trackers) && (!tempHpTracker || Number(tempHpTracker.value) !== desiredTempHp);
        if (!nameChanged && !imageChanged && !hpChanged && !injuriesChanged && !tempHpChanged) return existing;

        await OBR.scene.items.updateItems([tokenId], items => {
            items.forEach(item => {
                if (item.name !== desiredName) item.name = desiredName;
                if (item.text?.plainText !== undefined && item.text.plainText !== desiredName) {
                    item.text.plainText = desiredName;
                }
                if (desiredImageUrl && item.image?.url !== desiredImageUrl) {
                    // Owlbear hands updateItems an Immer draft. Mutate the image
                    // content in place so its SDK-managed dimensions/MIME stay intact.
                    item.image.url = desiredImageUrl;
                }

                if (!trackersEnabled) return;
                const itemTrackers = item.metadata?.[OWL_TRACKERS_METADATA_KEY];
                if (!Array.isArray(itemTrackers)) return;
                const updatedTrackers = itemTrackers.map(tracker => {
                    const name = String(tracker?.name || '').toLowerCase();
                    if (name === 'hp') return {
                        ...tracker,
                        ...(desiredHp !== null ? { value: desiredHp } : {}),
                        ...(desiredHpMax !== null ? { max: desiredHpMax } : {})
                    };
                    if (name === 'injuries') return { ...tracker, value: desiredInjuries };
                    if (name === 'temp hp') return { ...tracker, value: desiredTempHp };
                    return tracker;
                });
                if (!tempHpTracker) updatedTrackers.push(createTempHpTracker(desiredTempHp));
                item.metadata = {
                    ...(item.metadata || {}),
                    [OWL_TRACKERS_METADATA_KEY]: updatedTrackers
                };
            });
        });
        const [updated] = await OBR.scene.items.getItems([tokenId]);
        return updated || existing;
    }

    function schedulePokemonTokenSync(pokemon) {
        const tokenId = String(pokemon?.owlbear?.tokenId || '').trim();
        if (!tokenId || !trackedTokenWindows.has(tokenId)) return;

        clearTimeout(tokenSyncTimers.get(tokenId));
        tokenSyncTimers.set(tokenId, setTimeout(() => {
            tokenSyncTimers.delete(tokenId);
            syncPokemonToSceneToken(pokemon).catch(error => {
                console.error('Unable to synchronize the Owlbear token:', error);
            });
        }, 300));
    }

    return {
        insertSceneToken,
        getSceneToken,
        focusSceneToken,
        setSceneTokenVisibility,
        setSceneTokenOwner,
        syncPokemonToSceneToken,
        notifyTrackedTokenStates,
        schedulePokemonTokenSync,
        serializeToken
    };
}
