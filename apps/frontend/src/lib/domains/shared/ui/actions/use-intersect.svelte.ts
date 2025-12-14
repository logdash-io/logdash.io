// keep track of which callback is associated with each element
type IntersectionCallback = (entry: IntersectionObserverEntry) => void;
const intersectionCallbacks = new WeakMap<Element, IntersectionCallback>();

// use a single intersection observer instance per options
const intersectionObservers = new WeakMap<
  IntersectionObserverInit,
  IntersectionObserver
>();

function createObserver(init: IntersectionObserverInit) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const callback = intersectionCallbacks.get(entry.target);
      if (callback) {
        callback(entry);
      }
    }
  }, init);
  intersectionObservers.set(init, observer);
  return observer;
}

export interface Options extends IntersectionObserverInit {
  callback: IntersectionCallback;
}

// separated from action to make it easier to destroy / recreate when options change
function observe(target: Element, options: Options) {
  const { callback } = options;

  const observer =
    intersectionObservers.get(options) || createObserver(options);

  intersectionCallbacks.set(target, callback);
  observer.observe(target);

  return () => {
    observer.unobserve(target);
    intersectionCallbacks.delete(target);
  };
}

// the actual action
export function intersect(target: Element, options: Options) {
  let unobserve = observe(target, options);

  return {
    update(options: Options) {
      unobserve();
      unobserve = observe(target, options);
    },
    destroy() {
      unobserve();
    },
  };
}
