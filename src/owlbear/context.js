export function createOwlbearContext({
    OBR,
    resolveOwlbearReady,
    notifyTrackedTokenStates,
    ensurePlayerOwnedOwlTrackersVisibility
}) {
    let currentPlayer = null;
    let partyPlayers = [];
    const playerRoles = new Map();

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

    function handlePlayerRoles(players) {
        const changedPlayers = players.filter(player => {
            if (!player?.id || playerRoles.get(player.id) === player.role) return false;
            playerRoles.set(player.id, player.role);
            return true;
        });
        if (changedPlayers.length === 0) return;
        ensurePlayerOwnedOwlTrackersVisibility(changedPlayers).catch(error => {
            console.error('Unable to update Owl Trackers visibility after a role change:', error);
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
                const [currentPlayerName, currentPlayerRole, players] = await Promise.all([
                    OBR.player.getName(),
                    OBR.player.getRole(),
                    OBR.party.getPlayers()
                ]);
                currentPlayer = {
                    id: OBR.player.id,
                    name: currentPlayerName,
                    role: currentPlayerRole
                };
                partyPlayers = players.filter(player => player.id !== currentPlayer.id);
                handlePlayerRoles([currentPlayer, ...partyPlayers]);
                broadcastOwlbearContext();

                OBR.party.onChange(players => {
                    partyPlayers = players.filter(player => player.id !== currentPlayer.id);
                    handlePlayerRoles(players);
                    broadcastOwlbearContext();
                });

                OBR.player.onChange(player => {
                    currentPlayer = { id: player.id, name: player.name, role: player.role };
                    partyPlayers = partyPlayers.filter(partyPlayer => partyPlayer.id !== player.id);
                    handlePlayerRoles([player]);
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
