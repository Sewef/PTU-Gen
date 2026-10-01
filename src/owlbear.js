import OBR, { buildImage } from '@owlbear-rodeo/sdk';
import { createOwlbearContext } from './owlbear/context.js';
import { createDiceService } from './owlbear/dice.js';
import { createTabManager } from './owlbear/tabs.js';
import { createTokenService } from './owlbear/tokens.js';

(() => {
    const tabList = document.getElementById('tabList');
    const panelList = document.getElementById('panelList');
    let resolveOwlbearReady;
    const owlbearReady = new Promise(resolve => {
        resolveOwlbearReady = resolve;
    });

    const tokenService = createTokenService({ OBR, buildImage, owlbearReady });
    const diceService = createDiceService({ OBR, owlbearReady });
    const owlbearContext = createOwlbearContext({
        OBR,
        resolveOwlbearReady,
        notifyTrackedTokenStates: tokenService.notifyTrackedTokenStates
    });
    const tabs = createTabManager({
        tabList,
        panelList,
        sendOwlbearContext: owlbearContext.sendOwlbearContext,
        schedulePokemonTokenSync: tokenService.schedulePokemonTokenSync
    });

    async function handleOwlbearCommand(event) {
        const { requestId, command, payload = {} } = event.data;
        if (!requestId || !command) return;

        try {
            let item = null;
            if (command === 'insert-token') {
                item = await tokenService.insertSceneToken(payload.item, event.source);
            } else if (command === 'get-token-state') {
                item = await tokenService.getSceneToken(payload.tokenId, event.source);
            } else if (command === 'focus-token') {
                item = await tokenService.focusSceneToken(payload.tokenId, event.source);
            } else if (command === 'set-token-visibility') {
                item = await tokenService.setSceneTokenVisibility(payload.tokenId, payload.visible, event.source);
            } else if (command === 'set-token-owner') {
                item = await tokenService.setSceneTokenOwner(payload.tokenId, payload.createdUserId, event.source);
            } else if (command === 'sync-token') {
                item = await tokenService.syncPokemonToSceneToken(payload.pokemon);
            } else if (command === 'roll-justdices') {
                await diceService.sendJustDicesRoll(payload);
            } else {
                throw new Error(`Unknown Owlbear command: ${command}`);
            }

            event.source?.postMessage({
                type: 'ptu-owlbear-command-result',
                requestId,
                ok: true,
                token: tokenService.serializeToken(item)
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

    document.querySelector('#panel-home iframe')?.addEventListener('load', event => {
        owlbearContext.sendOwlbearContext(event.currentTarget.contentWindow);
    });

    window.addEventListener('message', event => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'ptu-request-owlbear-players') {
            owlbearContext.sendOwlbearContext(event.source);
            return;
        }

        if (event.data?.type === 'ptu-owlbear-command') {
            handleOwlbearCommand(event);
            return;
        }

        if (event.data?.type === 'ptu-open-pokemon') {
            if (!event.data.pokemon || typeof event.data.pokemon !== 'object') return;
            tabs.openPokemon(event.data.pokemon, { activate: event.data.activate !== false });
            return;
        }

        if (event.data?.type === 'ptu-pokemon-updated') {
            tabs.updatePokemonTab(event.data.storageKey, event.data.pokemon);
        }
    });

    tabs.setupTabKeyboard();
    tabs.restoreTabs();
    owlbearContext.initializeOwlbearContext();
})();
