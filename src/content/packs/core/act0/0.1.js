const text = [
  '     MERIDIAN / VISITOR ACCESS',
  '',
  '     ┌────────────────────────────┐',
  '     │ ·························· │',
  '     │ ·························· │',
  '     │ ·························· │',
  '     │ ··········◆··············· │',
  '     │ ·························· │',
  '     └────────────────────────────┘',
  '',
  '     ◆  reception terminal',
].join('\n');

export default {
  id: '0.1', act: 0, order: 1, type: 'briefing', live: false,
  title: 'Day One', extract: 'wq',
  par: { keys: 18, seconds: null },
  solution: 'jjjllllllllll:wq<CR>',
  toolkit: { introduces: ['hjkl', 'Esc'], recalls: [] },
  settings: { spamPenalty: null, relativeNumber: false },
  buffers: [{ name: 'reception.txt', text, cursor: [4, 7] }],
  windows: null, registers: {}, marks: {}, rules: [],
  dialogue: {
    intro: [
      'I’m :wq, your handler. Use h / j / k / l to move left / down / up / right until your cursor reaches the ◆.',
      'Vim starts in normal mode; Esc or Ctrl-[ returns you there after typing. When you reach the ◆, type :wq and press Enter to save and quit — that’s extraction.',
      'Type :q! and Enter to abort, or :e! and Enter for a fresh start. We count keystrokes like golf: fewer is better, and this briefing carries no career score.',
    ],
    outro: ['You found reception without touching an arrow key. HR has filed this under “promising, pending further evidence.”'],
  },
  objectives: [
    { id: 'arrival', text: 'Place your cursor on the ◆ reception terminal.',
      check: (s) => s.buf('reception.txt').text === text && s.cursor().offset === text.indexOf('◆') },
  ],
  hints: [
    'The cursor is the solid block; the ◆ is below and to its right. Keep the map intact.',
    'j moves down one line; l moves right one character. Use h and k if you overshoot.',
    'From the starting position: jjjllllllllll, then :wq and Enter. Use :e! first if you need to restore the map.',
  ],
  controls: [
    ['h', 'left'], ['j', 'down'], ['k', 'up'], ['l', 'right'],
    ['Esc / Ctrl-[', 'return to normal mode'], [':wq ↵', 'save & extract at the ◆'],
    [':q! ↵', 'abort to mission hub'], [':e! ↵', 'restart this briefing'],
  ],
};
