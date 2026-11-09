import React, { useEffect, useId, useRef } from 'react';
import './ConfirmationModal.css';

// Cancel-booking confirmation built on the native <dialog> element.
// showModal() gives the backdrop, keeps Tab inside the dialog, closes on
// Escape and returns focus to the button that opened it.
const ConfirmationModal = ({ show, onClose, onConfirm, booking }) => {
  const dialogRef = useRef(null);
  const keepButtonRef = useRef(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (show && !dialog.open) {
      dialog.showModal();
      keepButtonRef.current?.focus(); // start on the safe choice
    } else if (!show && dialog.open) {
      dialog.close();
    }
  }, [show]);

  // A click on the dialog element itself (not its content) is a click on the backdrop
  const handleClick = (event) => {
    if (event.target === dialogRef.current) {
      dialogRef.current.close();
    }
  };

  // Keep Tab inside the dialog: wrap from the last button to the first and back
  const handleKeyDown = (event) => {
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current.querySelectorAll('button:not([disabled])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="ss-dialog"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onClose={onClose}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="ss-dialog__content">
        <h2 id={titleId} className="ss-dialog__title">Cancel this booking?</h2>
        <p id={textId} className="ss-dialog__text">
          Your booking at <strong>{booking?.spaceName}</strong> will be removed. This cannot be undone.
        </p>
        <div className="ss-dialog__actions">
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Yes, cancel booking
          </button>
          <button
            ref={keepButtonRef}
            type="button"
            className="btn btn-outline-primary"
            onClick={() => dialogRef.current?.close()}
          >
            Keep booking
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmationModal;
