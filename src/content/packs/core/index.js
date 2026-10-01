export default {
  id: 'core', title: 'Ghost Protocol', acts: [0],
  toolkit: ['hjkl', 'Esc'],
  levels: [{ id: '0.1', title: 'Day One', act: 0, type: 'briefing', load: () => import('./act0/0.1.js') }],
};
