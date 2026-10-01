export function createOwlbearContext({ OBR, resolveOwlbearReady, notifyTrackedTokenStates }) {
    let currentPlayer = null;
    let partyPlayers = [];

    function getOwlbearContextMessage() {
        return {
            type: 'ptu-owlbear-players',
            roomId: OBR.room.id,
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
                console.log('PTU Gen Owlbear extension ready');
            } catch (error) {
                console.error('Unable to load Owlbear players:', error);
            }
        });
    }

    return {
        initializeOwlbearContext,
        sendOwlbearContext
    };
}
