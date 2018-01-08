import { Config } from './config';


export const MODE_IOS: any = {
  menuType: 'reveal',
};

export const MODE_MD: any = {
  menuType: 'overlay',
};

export const MODE_WP: any = {
  menuType: 'overlay',
};

export function registerModeConfigs(config: Config) {
  return function() {
    // // iOS Mode Settings
    config.setModeConfig('ios', MODE_IOS);

    // // Material Design Mode Settings
    config.setModeConfig('md', MODE_MD);

    // // Windows Mode Settings
    config.setModeConfig('wp', MODE_WP);
  };
}
