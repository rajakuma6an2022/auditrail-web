import "@testing-library/jest-dom/vitest";

// jsdom has no layout engine, so give virtualized lists a fake 600px-tall viewport.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
const rect = { width: 1000, height: 600, top: 0, left: 0, right: 1000, bottom: 600, x: 0, y: 0, toJSON: () => ({}) };
HTMLElement.prototype.getBoundingClientRect = () => rect as DOMRect;
Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 600 });
Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 1000 });

// jsdom (as of v26) does not implement <dialog>.showModal()/close(): minimal stand-ins so Dialog can be tested.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
