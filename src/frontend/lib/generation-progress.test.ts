import { describe, expect, it, vi } from 'vitest';
import app from '../../worker.js';
import PokemonGenerator from '../../../utils/pokemonGenerator.js';

vi.mock('../../../utils/pokemonGenerator.js', () => ({
  initializeDatasets: vi.fn(),
  default: { generatePokemon: vi.fn() }
}));

describe('generation endpoint progress', () => {
  it('streams generator stages followed by the result', async () => {
    vi.mocked(PokemonGenerator.generatePokemon).mockImplementationOnce(async (_options, progress) => {
      progress?.('Selecting species and form…');
      progress?.('Applying nature and distributing stats…');
      return { name: 'Pikachu' } as any;
    });
    const response = await app.request('/api/pokemon/generate', { headers: { Accept: 'application/x-ndjson' } });
    expect(response.headers.get('Content-Type')).toBe('application/x-ndjson');
    const events = (await response.text()).trim().split('\n').map(line => JSON.parse(line));
    expect(events).toEqual([
      { stage: 'Loading generator data…' },
      { stage: 'Selecting species and form…' },
      { stage: 'Applying nature and distributing stats…' },
      { pokemon: { name: 'Pikachu' } }
    ]);
  });

  it('sends generation errors through the stream', async () => {
    vi.mocked(PokemonGenerator.generatePokemon).mockRejectedValueOnce(new Error('Species not found'));
    const response = await app.request('/api/pokemon/generate', { headers: { Accept: 'application/x-ndjson' } });
    const events = (await response.text()).trim().split('\n').map(line => JSON.parse(line));
    expect(events.at(-1)).toEqual({ error: 'Species not found' });
  });

  it('keeps the JSON response for existing API callers', async () => {
    vi.mocked(PokemonGenerator.generatePokemon).mockResolvedValueOnce({ name: 'Pikachu' } as any);
    const response = await app.request('/api/pokemon/generate?matchEvolutionStageToLevel=true');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'Pikachu' });
    expect(PokemonGenerator.generatePokemon).toHaveBeenLastCalledWith(
      expect.objectContaining({ matchevolutionstagetolevel: 'true' }), expect.any(Function)
    );
  });
});
