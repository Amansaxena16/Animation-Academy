// "Enquire" on a course card pre-fills the message form further down the same page.

const EVENT = "aa:enquire";

export function enquireAbout(slug: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: slug }));
}

/** Calls `handler` with the course slug whenever a card's Enquire is pressed. */
export function onEnquire(handler: (slug: string) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
