import plugins from './plugins';
import path from 'path';

const DEFINE_PLUGIN = 2;

describe('plugins generations, no option', () => {
  const enabledPlugins = plugins({ rootFolder: '/foo/bar' });

  it('should generate plugins', () => {
    expect(enabledPlugins.length).toBe(4);
  });

  it('should generate plugins with sourceMaps', () => {
    const enabledPlugins = plugins({ generateSourceMaps: true, rootFolder: '/foo/bar' });
    expect(enabledPlugins.length).toBe(5);
  });
});

describe('TS for plugins', () => {
  const pluginsWithTs = plugins({ generateSourceMaps: true, rootFolder: path.resolve(__dirname, '../../../') });
  it('should have TSForkPlugin and 6 plugins in todal', () => {
    expect(pluginsWithTs).toHaveLength(6);
  });
});

it('definePlugin should have default replace of CRC_APP_NAME', () => {
  const enabledPlugins = plugins({
    rootFolder: '/foo/bar',
    insights: { appname: 'test_app' },
  });
  expect(enabledPlugins[DEFINE_PLUGIN].definitions.CRC_APP_NAME).toBe('"test_app"');
});

it('definePlugin should update', () => {
  const enabledPlugins = plugins({
    rootFolder: '/foo/bar',
    definePlugin: {
      SOME_VAR: JSON.stringify('test_val'),
    },
  });
  expect(enabledPlugins[DEFINE_PLUGIN].definitions.SOME_VAR).toBe('"test_val"');
});
