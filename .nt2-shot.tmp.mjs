import { writeFileSync } from "fs";
import WebSocket from "ws";

async function cdp(port) {
  const res = await fetch(`http://localhost:${port}/json/new?about:blank`, { method: "PUT" });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  await new Promise((r) => ws.on("open", r));
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const myId = ++id;
      pending.set(myId, resolve);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  }
  return { ws, send };
}

const dir = "/tmp/claude-1000/-home-moje-Desktop-project-porto-mojepict/37ae8383-5d1d-48d2-b45f-26ad67d69f3e/scratchpad";

async function shot(url, file, clickSelector) {
  const { send, ws } = await cdp(9340);
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 1500));
  if (clickSelector) {
    await send("Runtime.evaluate", { expression: clickSelector });
    await new Promise((r) => setTimeout(r, 500));
  }
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${dir}/${file}.png`, Buffer.from(shot.result.data, "base64"));
  console.log("saved", file);
  ws.close();
}

await shot("http://localhost:3000/uuid-generator", "nt2-uuid", `document.querySelector('button')?.parentElement && Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Generate'))?.click()`);
await shot("http://localhost:3000/regex-tester", "nt2-regex");
await shot("http://localhost:3000/number-base-converter", "nt2-numbase");
await shot("http://localhost:3000/jwt-decoder", "nt2-jwt", `document.querySelector('textarea').value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"; document.querySelector('textarea').dispatchEvent(new Event('input', {bubbles:true}))`);
await shot("http://localhost:3000/bmi-calculator", "nt2-bmi");
await shot("http://localhost:3000/tip-calculator", "nt2-tip");
await shot("http://localhost:3000/gradient-generator", "nt2-gradient");
await shot("http://localhost:3000/contrast-checker", "nt2-contrast");
await shot("http://localhost:3000/markdown-previewer", "nt2-markdown");
await shot("http://localhost:3000/text-diff", "nt2-textdiff", `document.querySelectorAll('textarea')[0].value = "Hello world\\nThis is line two\\nUnchanged line"; document.querySelectorAll('textarea')[0].dispatchEvent(new Event('input', {bubbles:true})); document.querySelectorAll('textarea')[1].value = "Hello there\\nThis is line two\\nUnchanged line\\nNew line added"; document.querySelectorAll('textarea')[1].dispatchEvent(new Event('input', {bubbles:true}))`);
await shot("http://localhost:3000/lorem-ipsum", "nt2-lorem-fixed", `document.querySelector('input[type=number]').value = "3000000"; document.querySelector('input[type=number]').dispatchEvent(new Event('input', {bubbles:true}))`);
