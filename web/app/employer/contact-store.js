"use client";

/* Contact requests are stored per browser only. There is no backend, so this
   module is the single source of truth for "has this employer contacted X". */

import { useSyncExternalStore } from "react";

const storageKey = 'jomworklah-employer-v1';
const emptySnapshot = {};

let cache = null;
const listeners = new Set();

function read() {
  if (typeof window === 'undefined') return emptySnapshot;
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : emptySnapshot;
  } catch {
    return emptySnapshot;
  }
}

function write(next) {
  cache = next;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    /* storage can be blocked; the in-memory snapshot still updates this tab */
  }
  listeners.forEach(listener => listener());
}

function getSnapshot() {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot() {
  return emptySnapshot;
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = event => {
    if (event.key !== storageKey) return;
    cache = null;
    listeners.forEach(notify => notify());
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function sendRequest(candidateId, payload) {
  write({ ...getSnapshot(), [candidateId]: payload });
}

export function withdrawRequest(candidateId) {
  const next = { ...getSnapshot() };
  delete next[candidateId];
  write(next);
}

export function useContactRequests() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
