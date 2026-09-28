export function createDiceService({ OBR, owlbearReady }) {
    async function sendJustDicesRoll(payload) {
        const ready = await owlbearReady;
        if (!ready) throw new Error('Owlbear Rodeo is not available.');

        const callId = String(payload.callId || '').trim();
        const expression = String(payload.expression || '').trim();
        if (!callId || !expression) throw new Error('The dice roll request is incomplete.');

        await OBR.broadcast.sendMessage('com.sewef.justdices/api.request', {
            callId,
            expression,
            showInLogs: payload.showInLogs !== false
        }, { destination: 'LOCAL' });
    }

    return { sendJustDicesRoll };
}
