/* Every old drawing/model must expose its superseded engineering status. */
(function () {
  "use strict";
  const box = document.createElement("aside");
  box.setAttribute("role", "note");
  box.style.cssText = "padding:16px 24px;background:#fff0d8;color:#422a0f;border-bottom:2px solid #bc793b;font:16px/1.5 system-ui";
  const title = document.createElement("strong");
  title.textContent = "2026-09-28: legacy study — not the current stair purchase baseline. ";
  box.append(title, document.createTextNode("No components purchased. Single support, full-step reach and stationary thermal duty remain unresolved. "));
  const link = document.createElement("a");
  link.href = "engineering.html";
  link.textContent = "Open the head/leg review and current BOM";
  box.append(link);
  document.body.prepend(box);
})();
