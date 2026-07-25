/**
 * Shared wizard dismiss guard — kept out of NewSplitNavigator so Results
 * can arm a one-time bypass without a require cycle.
 */

let skipNextDiscardConfirmation = false;

export function skipNextNewSplitDiscardConfirmation() {
  skipNextDiscardConfirmation = true;
}

/** Peek without consuming — used to disable usePreventRemove for Done. */
export function isSkipNewSplitDiscardConfirmationArmed(): boolean {
  return skipNextDiscardConfirmation;
}

export function consumeSkipNewSplitDiscardConfirmation(): boolean {
  if (!skipNextDiscardConfirmation) {
    return false;
  }

  skipNextDiscardConfirmation = false;
  return true;
}
