import { initSimulation, destroyAll } from './sims.js';

export function mount(container) {
  const blocks = container.querySelectorAll('[data-block]');
  
  blocks.forEach(block => {
    const type = block.dataset.block;
    const sim = block.dataset.sim;
    
    if (sim) {
      initSimulation(sim, block);
    }
    
    // Video lazy load
    if (type === 'media') {
      const video = block.querySelector('video');
      if (video) video.load();
    }
  });
}

export function unmount() {
  destroyAll();
}