const JUSTDICES_REQUEST = 'com.sewef.justdices/api.request';
const JUSTDICES_RESPONSE = 'com.sewef.justdices/api.response';

function justDicesError(code) {
    if (code === 'PARSE_ERROR') return new Error('JustDices PARSE_ERROR: invalid syntax or unsupported tokens.');
    if (code === 'ROLL_ERROR') return new Error('JustDices ROLL_ERROR: internal roll evaluation failed.');
    return new Error(`JustDices ${String(code || 'ROLL_ERROR')}`);
}

export function createDiceService({ OBR, owlbearReady, timeoutMs = 5000 }) {
    async function sendJustDicesRoll(payload) {
        const ready = await owlbearReady;
        if (!ready) throw new Error('Owlbear Rodeo is not available.');

        const callId = String(payload.callId || '').trim();
        const expression = String(payload.expression || '').trim();
        if (!callId || !expression) throw new Error('The dice roll request is incomplete.');

        return new Promise((resolve, reject) => {
            let settled = false;
            let unsubscribe = () => {};
            let timeout;

            const finish = (callback, value) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                unsubscribe();
                callback(value);
            };

            try {
                const subscription = OBR.broadcast.onMessage(JUSTDICES_RESPONSE, event => {
                    const response = event?.data;
                    if (!response || String(response.callId || '') !== callId) return;
                    if (response.ok) finish(resolve, response);
                    else finish(reject, justDicesError(response.error));
                });
                unsubscribe = typeof subscription === 'function' ? subscription : () => {};

                timeout = setTimeout(() => {
                    finish(reject, new Error('JustDices API_TIMEOUT: no response received. Is JustDices running?'));
                }, timeoutMs);

                Promise.resolve(OBR.broadcast.sendMessage(JUSTDICES_REQUEST, {
                    callId,
                    expression,
                    showInLogs: payload.showInLogs !== false
                }, { destination: 'LOCAL' })).catch(error => {
                    finish(reject, error instanceof Error ? error : new Error(String(error)));
                });
            } catch (error) {
                finish(reject, error instanceof Error ? error : new Error(String(error)));
            }
        });
    }

    return { sendJustDicesRoll };
}
