import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDiceService } from '../../owlbear/dice.js';

afterEach(() => vi.useRealTimers());

function setup(timeoutMs = 5000) {
  let listener: (event: any) => void = () => {};
  const unsubscribe = vi.fn();
  const OBR = {
    broadcast: {
      onMessage: vi.fn((_channel: string, callback: (event: any) => void) => {
        listener = callback;
        return unsubscribe;
      }),
      sendMessage: vi.fn(async () => undefined)
    }
  };
  const service = createDiceService({ OBR, owlbearReady: Promise.resolve(true), timeoutMs });
  return { OBR, service, unsubscribe, respond: (data: any) => listener({ data }) };
}

describe('JustDices service', () => {
  it('waits for the matching successful response', async () => {
    const { OBR, service, unsubscribe, respond } = setup();
    const pending = service.sendJustDicesRoll({ callId: 'call-1', expression: '/r 4d6k3', showInLogs: false });
    await Promise.resolve();

    respond({ callId: 'another-call', ok: false, error: 'PARSE_ERROR' });
    respond({ callId: 'call-1', ok: true, expressionOut: '4d6k3', data: { total: 16 } });

    await expect(pending).resolves.toMatchObject({ ok: true, data: { total: 16 } });
    expect(OBR.broadcast.onMessage).toHaveBeenCalledWith('com.sewef.justdices/api.response', expect.any(Function));
    expect(OBR.broadcast.sendMessage).toHaveBeenCalledWith('com.sewef.justdices/api.request', {
      callId: 'call-1', expression: '/r 4d6k3', showInLogs: false
    }, { destination: 'LOCAL' });
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it.each([
    ['PARSE_ERROR', 'invalid syntax or unsupported tokens'],
    ['ROLL_ERROR', 'internal roll evaluation failed']
  ])('reports a %s response', async (code, message) => {
    const { service, unsubscribe, respond } = setup();
    const pending = service.sendJustDicesRoll({ callId: 'call-1', expression: '/r invalid' });
    await Promise.resolve();
    respond({ callId: 'call-1', ok: false, error: code });

    await expect(pending).rejects.toThrow(message);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('reports API_TIMEOUT and unsubscribes when JustDices does not answer', async () => {
    vi.useFakeTimers();
    const { service, unsubscribe } = setup(1000);
    const pending = service.sendJustDicesRoll({ callId: 'call-1', expression: '/r 2d6' });
    const rejection = expect(pending).rejects.toThrow('API_TIMEOUT');
    await vi.advanceTimersByTimeAsync(1001);

    await rejection;
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
