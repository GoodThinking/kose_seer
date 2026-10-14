import { Config, ServerConfig, IServerConfig } from '../ServerConfig';
import { ConfigLoader } from '../ConfigLoader';

describe('cumulativePetExperience server option', () => {
  const load = (option: unknown, present = true): IServerConfig => {
    const source = structuredClone(Config.Config);
    source.services.game.clientProtocol = 'kose';
    if (present) (source.services.game as any).cumulativePetExperience = option;
    else delete source.services.game.cumulativePetExperience;
    jest.spyOn(ConfigLoader.Instance, 'LoadJson').mockReturnValue(source);
    return (ServerConfig.Instance as any).LoadConfig();
  };
  afterEach(() => jest.restoreAllMocks());
  test('missing option defaults false without changing kose profile', () => {
    expect(load(undefined, false).services.game).toMatchObject({
      clientProtocol: 'kose', cumulativePetExperience: false,
    });
  });
  test.each([false, true])('explicit boolean %s is retained without changing profile', value => {
    expect(load(value).services.game).toMatchObject({
      clientProtocol: 'kose', cumulativePetExperience: value,
    });
  });
  test.each(['true', 'false', 1, 0, null])('invalid non-boolean %s is rejected', value => {
    expect(() => load(value)).toThrow('Invalid cumulativePetExperience setting');
  });
  test('no configuration file defaults the option off', () => {
    jest.spyOn(ConfigLoader.Instance, 'LoadJson').mockReturnValue(null);
    expect((ServerConfig.Instance as any).LoadConfig().services.game.cumulativePetExperience).toBe(false);
  });
});
