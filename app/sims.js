const registry = new Map();
const active = new Map();

// Register a simulation module
export function register(name, module) {
  if (!module.init || !module.destroy) {
    throw new Error(`Simulation "${name}" must export init() and destroy()`);
  }
  registry.set(name, module);
}

// Initialize a simulation
export function initSimulation(name, el) {
  const module = registry.get(name);
  if (!module) {
    console.warn(`Simulation "${name}" not found`);
    return;
  }
  
  const instance = module.init(el);
  active.set(el, { name, instance });
}

// Destroy all active simulations
export function destroyAll() {
  active.forEach(({ instance }) => {
    if (instance && instance.destroy) {
      instance.destroy();
    }
  });
  active.clear();
}