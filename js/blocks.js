import { getRoute, onRouteChange } from "./router.js";
import { mountBlocks, cleanupBlocks } from "./blocks.js";

const content = document.getElementById("content");

async function load() {
  const route = getRoute() || "focus";

  cleanupBlocks();
  content.innerHTML = "";

  try {
    const html = await fetch(`content/${route}.html`).then(r => {
      if (!r.ok) throw new Error();
      return r.text();
    });

    content.innerHTML = html;
    mountBlocks(content);

  } catch {
    content.innerHTML = "<h1>404</h1>";
  }
}

onRouteChange(load);
