import OpenAI from 'openai';

const EXTRACT_PURPOSE = 'file-extract';
const REQUEST_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 400;
const PROCESSING_ATTEMPTS = 15;
const PROCESSING_INTERVAL_MS = 2000;
const READY_STATUSES = new Set(['processed', 'completed', 'succeeded', 'ready', 'ok']);
const FAILED_STATUSES = new Set(['failed', 'error', 'rejected', 'deleted']);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function describeError(error) {
  return String(error?.message ?? error ?? 'unknown error').slice(0, 300);
}

/**
 * Provider failures are grouped so the service layer can pick an HTTP status
 * without knowing anything about the Model Studio wire format.
 */
export class QwenDocError extends Error {
  constructor(reason, message, options = {}) {
    super(message);
    this.name = 'QwenDocError';
    this.reason = reason;
    this.retryable = Boolean(options.retryable);
    this.cause = options.cause;
  }
}

function isRetryable(error) {
  if (error instanceof QwenDocError) return error.retryable;
  const name = error?.name ?? '';
  if (['APIConnectionError', 'APIConnectionTimeoutError', 'APIUserAbortError', 'AbortError', 'TypeError'].includes(name)) return true;
  const status = Number(error?.status ?? 0);
  return status === 408 || status === 429 || status >= 500;
}

function reasonFor(status) {
  if (status === 408 || status === 429 || status >= 500) return 'busy';
  return 'unavailable';
}

function fencedBlock(text) {
  const match = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  return match?.[1]?.trim() ?? null;
}

function braces(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 && end > start ? text.slice(start, end + 1) : null;
}

export function parseJsonObject(text) {
  const trimmed = String(text ?? '').trim();
  for (const candidate of [trimmed, fencedBlock(trimmed), braces(trimmed)]) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // try the next candidate
    }
  }
  throw new QwenDocError('unavailable', 'Qwen returned a response that is not a JSON object.');
}

export function createQwenDocClient(config) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    timeout: config.timeoutMs,
    maxRetries: 0
  });

  async function attempt(label, fn) {
    let lastError;
    for (let index = 0; index < REQUEST_ATTEMPTS; index += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (!isRetryable(error) || index === REQUEST_ATTEMPTS - 1) break;
        await sleep(BACKOFF_BASE_MS * 2 ** index + Math.floor(Math.random() * 250));
      }
    }
    if (lastError instanceof QwenDocError) throw lastError;
    const status = Number(lastError?.status ?? 0);
    throw new QwenDocError(reasonFor(status), `${label}: ${describeError(lastError)}`, { cause: lastError });
  }

  async function upload({ buffer, filename, mimetype }) {
    const file = new File([buffer], filename, { type: mimetype });
    const created = await attempt('Qwen upload failed', () => client.files.create({ file, purpose: EXTRACT_PURPOSE }));
    if (!created?.id) throw new QwenDocError('unavailable', 'Qwen did not return a file id for the uploaded resume.');
    return { id: String(created.id), status: created.status ?? null };
  }

  async function waitForProcessing(fileId) {
    for (let index = 0; index < PROCESSING_ATTEMPTS; index += 1) {
      const info = await attempt('Qwen status check failed', () => client.files.retrieve(fileId));
      const status = String(info?.status ?? '').toLowerCase();
      if (!status || READY_STATUSES.has(status)) return info;
      if (FAILED_STATUSES.has(status)) {
        throw new QwenDocError('document', `Qwen could not read the resume (file status: ${status}).`);
      }
      await sleep(PROCESSING_INTERVAL_MS);
    }
    throw new QwenDocError('busy', 'Qwen is still processing the resume. Try again in a moment.');
  }

  async function extract({ fileId, prompt }) {
    const completion = await attempt('Qwen extraction failed', () => client.chat.completions.create({
      model: config.model,
      temperature: 0,
      messages: [
        { role: 'system', content: 'You extract structured facts from one attached document and reply with JSON only.' },
        { role: 'system', content: `fileid://${fileId}` },
        { role: 'user', content: prompt }
      ]
    }));

    const choice = completion?.choices?.[0];
    if (choice?.finish_reason === 'length') {
      throw new QwenDocError('unavailable', 'Qwen returned a truncated extraction. Retry with a shorter resume.');
    }
    const content = choice?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new QwenDocError('unavailable', 'Qwen returned an empty extraction.');
    }
    return parseJsonObject(content);
  }

  async function remove(fileId) {
    try {
      await client.files.delete(fileId);
      return true;
    } catch (error) {
      console.warn(`Qwen could not delete file ${fileId}: ${describeError(error)}`);
      return false;
    }
  }

  return { model: config.model, upload, waitForProcessing, extract, remove };
}
