/* Keep bookmarks to the former single-page workbench useful. */
(function () {
  'use strict';
  const page = location.pathname.split('/').pop();
  if (!['', 'index.html', 'v1-proof.html'].includes(page)) return;
  const routes = {
    build: 'build.html#build', model: 'mechanical.html#model',
    connections: 'electrical.html#wiring', intelligence: 'controls.html#intelligence',
    budget: 'parts.html#budget', archive: 'documents.html#archive',
    'next-version': 'documents.html#next-version',
    'plan-panel-workbench': 'build.html#build',
    'plan-panel-milestones': 'build.html#plan-panel-milestones',
    'plan-panel-updates': 'build.html#plan-panel-updates',
    'plan-panel-parts': 'parts.html', 'plan-panel-library': 'documents.html',
  };
  const destination = routes[location.hash.slice(1)];
  if (destination) {
    const target = new URL(destination, location.href);
    target.search = location.search;
    location.replace(target);
  }
})();
