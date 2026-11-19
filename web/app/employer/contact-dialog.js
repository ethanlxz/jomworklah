"use client";

import { useEffect, useRef } from "react";
import { sendRequest } from "./contact-store";
import { skillName } from "./data";
import { CloseIcon, LockIcon } from "./icons";

function firstName(name) {
  return name.split(/\s+/)[0];
}

function defaultMessage(candidate, role) {
  const keySkill = [...role.requirements].sort((a, b) => b.weight - a.weight)[0];
  return `Hi ${firstName(candidate.name)}, I am hiring for ${role.title} in ${role.location}. `
    + `Your ${skillName(keySkill.skillId)} evidence looks relevant to the role. `
    + `Would you be open to a short call this week?`;
}

/* Rendered only while a candidate is selected, so showing the dialog on mount
   is safe and each candidate gets a fresh form through the React key. */
export default function ContactDialog({ candidate, role, match, onClose }) {
  const dialogRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    nameRef.current?.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    sendRequest(candidate.id, {
      roleId: role.id,
      roleTitle: role.title,
      employer: String(data.get('name') || '').trim(),
      company: String(data.get('company') || '').trim(),
      message: String(data.get('message') || '').trim(),
      sentAt: new Date().toISOString()
    });
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      className="emp-dialog"
      aria-labelledby="emp-contact-title"
      onClose={onClose}
    >
      <div className="modal-heading">
        <h2 id="emp-contact-title">Contact {candidate.name}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
        >
          <CloseIcon />
        </button>
      </div>

      <p className="modal-description">
        {candidate.location} · {candidate.qualification} · {match}% match for {role.title}.
        The candidate sees your request first and decides whether to share contact details.
      </p>

      <form className="emp-contact-form" onSubmit={handleSubmit}>
        <div className="emp-form-row">
          <label className="field">
            <span>Your name</span>
            <input name="name" autoComplete="name" required ref={nameRef} />
          </label>
          <label className="field">
            <span>Company</span>
            <input name="company" autoComplete="organization" required />
          </label>
        </div>

        <label className="field">
          <span>Message</span>
          <textarea name="message" rows={5} required defaultValue={defaultMessage(candidate, role)} />
        </label>

        <p className="notice">
          <LockIcon />
          <span>
            Saved in this browser only. No email or message leaves this device, and contact
            details stay hidden until the candidate responds.
          </span>
        </p>

        <div className="modal-actions">
          <button type="button" className="button button-plain" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="button button-primary">Send request</button>
        </div>
      </form>
    </dialog>
  );
}
