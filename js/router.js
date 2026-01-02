export function getRoute() {
  return location.hash.replace("#", "");
}

export function onRouteChange(cb) {
  window.addEventListener("hashchange", cb);
  window.addEventListener("load", cb);
}
