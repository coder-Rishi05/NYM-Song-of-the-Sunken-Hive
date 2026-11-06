// Global tuning + boot flags.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const TILE = 32;
export const FIXED_DT = 1 / 60;
export const MAX_STEPS = 5;
export const SAVE_SLOT = 1;

export const params = new URLSearchParams(location.search);
export const DEBUG = params.has('debug');
export const AUTOSTART = params.has('play');
export const START_ROOM = params.get('room');
export const START_FLAGS = params.get('flags');
export const NO_AUDIO = params.has('silent');

export const GAME_TITLE = 'NYM';
export const GAME_SUBTITLE = 'song of the sunken hive';
