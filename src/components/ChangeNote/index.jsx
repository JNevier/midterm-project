import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

// The change-deadline note from getChangeNote, used on the booking cards and the
// change page. Not a live region: it refreshes every 30 seconds and screen
// readers should not be interrupted each time.
const ChangeNote = ({ note, id, banner = false }) => {
  if (!note) return null;
  const classes = ['ss-note'];
  if (banner) classes.push('ss-note--banner');
  if (note.tone === 'warning') classes.push('ss-note--warning');
  return (
    <p id={id} className={classes.join(' ')}>
      {note.tone === 'warning' && <FaExclamationTriangle aria-hidden="true" />}
      <span>{note.text}</span>
    </p>
  );
};

export default ChangeNote;
