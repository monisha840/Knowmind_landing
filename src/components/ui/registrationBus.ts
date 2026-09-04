/**
 * The one channel that opens the registration modal.
 *
 * Every call to action on the page used to be an `<a href="#begin-journey">`
 * that scrolled to a section. They open a dialog now, and the dialog is mounted
 * once at the end of the page rather than once per button.
 *
 * A three-line emitter rather than React context, for one reason: context needs
 * a provider around everything that consumes it, and that provider is a client
 * component — wrapping the page in one would pull every section across the
 * server/client boundary and undo the thing that keeps this route's first paint
 * cheap (CLAUDE.md §4.1). With this, the buttons are client components, the
 * dialog is a client component, and every section between them stays on the
 * server.
 *
 * No dependency, and nothing here touches the browser at module scope, so it is
 * safe to import from either side.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Ask the mounted modal to open. No-op if none is mounted. */
export function openRegistration() {
  for (const listener of listeners) listener();
}

/** Subscribe the mounted modal. Returns its own unsubscribe, for effect cleanup. */
export function onOpenRegistration(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
