/* Every old drawing/model must expose its superseded engineering status. */
(function () {
  "use strict";
  const box = document.createElement("aside");
  box.setAttribute("role", "note");
  box.style.cssText = "padding:16px 24px;background:#fff0d8;color:#422a0f;border-bottom:2px solid #bc793b;font:16px/1.5 system-ui";
  const title = document.createElement("strong");
  title.textContent = "V0-GENESIS — archived planning (formerly STAIR-V1). ";
  box.append(title, document.createTextNode("V1-PROOF is now the active plan: under $1,000, four actuators and flat-floor balance. The numbers and requirements below belong to the previous project. "));
  const link = document.createElement("a");
  link.href = "v1-proof.html#build";
  link.textContent = "Open V1-PROOF";
  box.append(link);
  const archive = document.createElement("a");
  archive.href = "v0-genesis.html";
  archive.textContent = "V0-GENESIS overview";
  box.append(document.createTextNode(" · "), archive);
  document.body.prepend(box);
})();
