'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, ChevronDown, Lock, Play, RefreshCw, Search } from 'lucide-react';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

type JsonSchema = {
  $ref?: string;
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  example?: unknown;
  default?: unknown;
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  nullable?: boolean;
};

type OpenAPIParameter = {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: JsonSchema;
};

type OpenAPIMedia = { schema?: JsonSchema };

type OpenAPIRequestBody = {
  required?: boolean;
  content?: Record<string, OpenAPIMedia>;
};

type OpenAPIResponse = {
  description?: string;
  content?: Record<string, OpenAPIMedia>;
};

type OpenAPIOperation = {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, OpenAPIResponse>;
  security?: Array<Record<string, string[]>>;
};

type PathItem = Partial<Record<HttpMethod, OpenAPIOperation>> & {
  parameters?: OpenAPIParameter[];
};

type OpenAPISpec = {
  info: { title: string; version: string; description?: string };
  paths: Record<string, PathItem>;
  components?: { schemas?: Record<string, JsonSchema> };
  tags?: Array<{ name: string; description?: string }>;
};

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type ParsedOp = {
  id: string;
  method: HttpMethod;
  path: string;
  tag: string;
  summary: string;
  description?: string;
  parameters: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
  requiresAuth: boolean;
};

type TryResult = {
  status: number;
  statusText: string;
  durationMs: number;
  body: string;
};

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

const METHOD_STYLES: Record<
  HttpMethod,
  { badge: string; border: string; panel: string; text: string }
> = {
  get: {
    badge: 'bg-[#61affe]',
    border: 'border-[#61affe]',
    panel: 'bg-[#ebf3fb]',
    text: 'text-[#3b82c4]',
  },
  post: {
    badge: 'bg-[#49cc90]',
    border: 'border-[#49cc90]',
    panel: 'bg-[#e8f6f0]',
    text: 'text-[#2e8f67]',
  },
  put: {
    badge: 'bg-[#fca130]',
    border: 'border-[#fca130]',
    panel: 'bg-[#fbf1e6]',
    text: 'text-[#c67a16]',
  },
  patch: {
    badge: 'bg-[#50e3c2]',
    border: 'border-[#50e3c2]',
    panel: 'bg-[#e8f6f4]',
    text: 'text-[#2a9d86]',
  },
  delete: {
    badge: 'bg-[#f93e3e]',
    border: 'border-[#f93e3e]',
    panel: 'bg-[#fae7e7]',
    text: 'text-[#d32f2f]',
  },
};

function resolveRef(spec: OpenAPISpec, schema?: JsonSchema): JsonSchema {
  if (!schema) return {};
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop();
    return name ? spec.components?.schemas?.[name] ?? schema : schema;
  }
  if (schema.anyOf?.length) {
    const useful = schema.anyOf.find((item) => item.type !== 'null' && !item.$ref) ?? schema.anyOf[0];
    return resolveRef(spec, useful);
  }
  if (schema.allOf?.length) {
    return schema.allOf.reduce<JsonSchema>(
      (acc, item) => ({ ...acc, ...resolveRef(spec, item), properties: { ...acc.properties, ...resolveRef(spec, item).properties } }),
      {},
    );
  }
  if (schema.oneOf?.length) return resolveRef(spec, schema.oneOf[0]);
  return schema;
}

function schemaExample(spec: OpenAPISpec, schema?: JsonSchema, seen = new Set<string>()): unknown {
  const resolved = resolveRef(spec, schema);
  if (schema?.$ref) {
    if (seen.has(schema.$ref)) return {};
    seen.add(schema.$ref);
  }
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;
  if (resolved.enum?.length) return resolved.enum[0];
  if (resolved.type === 'array') return [schemaExample(spec, resolved.items, seen)];
  if (resolved.type === 'object' || resolved.properties) {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(resolved.properties ?? {})) {
      obj[key] = schemaExample(spec, value, seen);
    }
    return obj;
  }
  if (resolved.type === 'integer' || resolved.type === 'number') return 0;
  if (resolved.type === 'boolean') return false;
  if (resolved.format === 'binary') return '(archivo)';
  if (resolved.type === 'string') return '';
  return null;
}

function schemaTypeLabel(spec: OpenAPISpec, schema?: JsonSchema): string {
  const resolved = resolveRef(spec, schema);
  if (resolved.$ref) return resolved.$ref.split('/').pop() ?? 'object';
  if (schema?.$ref) return schema.$ref.split('/').pop() ?? 'object';
  if (resolved.type === 'array') return `array<${schemaTypeLabel(spec, resolved.items)}>`;
  if (resolved.enum?.length) return `enum`;
  return resolved.format ? `${resolved.type ?? 'object'} (${resolved.format})` : resolved.type ?? 'object';
}

function jsonBody(spec: OpenAPISpec, body?: OpenAPIRequestBody) {
  const json = body?.content?.['application/json'];
  return json?.schema ? JSON.stringify(schemaExample(spec, json.schema), null, 2) : '';
}

function multipartFields(spec: OpenAPISpec, body?: OpenAPIRequestBody) {
  const multipart = body?.content?.['multipart/form-data'];
  if (!multipart?.schema) return [];
  const resolved = resolveRef(spec, multipart.schema);
  return Object.entries(resolved.properties ?? {}).map(([name, schema]) => {
    const field = resolveRef(spec, schema);
    return {
      name,
      required: resolved.required?.includes(name) ?? false,
      binary: field.format === 'binary',
      type: schemaTypeLabel(spec, schema),
    };
  });
}

function parseSpec(spec: OpenAPISpec): ParsedOp[] {
  const ops: ParsedOp[] = [];
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (!operation) continue;
      const parameters = [...(item.parameters ?? []), ...(operation.parameters ?? [])];
      const tag = operation.tags?.[0] ?? 'default';
      ops.push({
        id: `${method}-${path}`,
        method,
        path,
        tag,
        summary: operation.summary || operation.operationId || path,
        description: operation.description,
        parameters,
        requestBody: operation.requestBody,
        responses: operation.responses ?? {},
        requiresAuth: Boolean(operation.security?.length) || parameters.some((p) => p.in === 'header' && /authorization/i.test(p.name)),
      });
    }
  }
  return ops;
}

function isProtectedRoute(op: ParsedOp) {
  if (op.requiresAuth) return true;
  if (op.path === '/api/auth/login' || op.path === '/api/health' || op.path === '/api/detect') {
    return false;
  }
  return op.path.startsWith('/api/admin') || op.path.startsWith('/api/auth');
}

export function ApiDocsExplorer() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openTags, setOpenTags] = useState<Record<string, boolean>>({});
  const [openOps, setOpenOps] = useState<Record<string, boolean>>({});
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({});
  const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, Record<string, File | null>>>({});
  const [results, setResults] = useState<Record<string, TryResult>>({});
  const [executing, setExecuting] = useState<string | null>(null);

  const loadSpec = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/openapi.json`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 403) {
        throw new Error('Solo los administradores pueden ver la documentación de la API.');
      }
      if (!response.ok) {
        throw new Error('No se pudo cargar la especificación OpenAPI.');
      }
      const data = (await response.json()) as OpenAPISpec;
      setSpec(data);
      const tags = new Set<string>();
      for (const op of parseSpec(data)) tags.add(op.tag);
      setOpenTags(Object.fromEntries([...tags].map((tag) => [tag, true])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la documentación.');
      setSpec(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSpec();
  }, [loadSpec]);

  const operations = useMemo(() => (spec ? parseSpec(spec) : []), [spec]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = operations.filter((op) => {
      if (!q) return true;
      return (
        op.path.toLowerCase().includes(q) ||
        op.summary.toLowerCase().includes(q) ||
        op.method.includes(q) ||
        op.tag.toLowerCase().includes(q)
      );
    });
    const order = spec?.tags?.map((tag) => tag.name) ?? [];
    const map = new Map<string, ParsedOp[]>();
    for (const op of filtered) {
      const list = map.get(op.tag) ?? [];
      list.push(op);
      map.set(op.tag, list);
    }
    const keys = [...map.keys()].sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return keys.map((tag) => ({
      tag,
      description: spec?.tags?.find((item) => item.name === tag)?.description,
      operations: map.get(tag) ?? [],
    }));
  }, [operations, query, spec]);

  const execute = async (op: ParsedOp) => {
    const token = getAdminToken();
    if (!token) return;

    setExecuting(op.id);
    const values = paramValues[op.id] ?? {};
    let path = op.path;
    for (const param of op.parameters.filter((item) => item.in === 'path')) {
      path = path.replace(`{${param.name}}`, encodeURIComponent(values[param.name] ?? ''));
    }
    const search = new URLSearchParams();
    for (const param of op.parameters.filter((item) => item.in === 'query')) {
      const value = values[param.name];
      if (value) search.set(param.name, value);
    }
    const url = `${API_BASE}${path}${search.toString() ? `?${search}` : ''}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const files = fileValues[op.id] ?? {};
    const fields = spec ? multipartFields(spec, op.requestBody) : [];
    const hasMultipart = fields.length > 0;
    let body: BodyInit | undefined;

    if (hasMultipart && op.method !== 'get') {
      const form = new FormData();
      for (const field of fields) {
        if (field.binary) {
          const file = files[field.name];
          if (file) form.append(field.name, file);
        } else if (values[field.name]) {
          form.append(field.name, values[field.name]);
        }
      }
      body = form;
    } else if (op.requestBody?.content?.['application/json'] && op.method !== 'get') {
      headers['Content-Type'] = 'application/json';
      body = bodyValues[op.id] ?? jsonBody(spec!, op.requestBody);
    }

    const started = performance.now();
    try {
      const response = await fetch(url, { method: op.method.toUpperCase(), headers, body });
      const text = await response.text();
      let pretty = text;
      try {
        pretty = text ? JSON.stringify(JSON.parse(text), null, 2) : '';
      } catch {
        pretty = text;
      }
      setResults((prev) => ({
        ...prev,
        [op.id]: {
          status: response.status,
          statusText: response.statusText,
          durationMs: Math.round(performance.now() - started),
          body: pretty || '(sin cuerpo)',
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [op.id]: {
          status: 0,
          statusText: 'Network Error',
          durationMs: Math.round(performance.now() - started),
          body: err instanceof Error ? err.message : 'No se pudo completar la petición.',
        },
      }));
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-green-600" />
          <p className="text-sm text-gray-600">Cargando especificación OpenAPI…</p>
        </div>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-900">{error || 'Sin datos'}</p>
            <button
              type="button"
              onClick={() => void loadSpec()}
              className="mt-3 text-sm font-semibold text-red-700 underline-offset-2 hover:underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#d8e0dc] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#d8e0dc] bg-[#1a2f26] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8fa89a]">
            OpenAPI {spec.info.version}
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">{spec.info.title}</h2>
          {spec.info.description ? (
            <p className="mt-1 max-w-2xl text-sm text-[#c5d4cc]">{spec.info.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#49cc90]/40 bg-[#49cc90]/15 px-3 py-1.5 text-xs font-semibold text-[#9aebc4]">
            <Lock className="size-3.5" aria-hidden />
            Bearer JWT activo
          </span>
          <button
            type="button"
            onClick={() => void loadSpec()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Recargar
          </button>
        </div>
      </div>

      <div className="border-b border-[#e4ebe6] bg-[#f7faf8] px-5 py-3 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar por ruta, método o tag…"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none ring-[#61affe] focus:border-[#61affe] focus:ring-2"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Las peticiones de prueba siempre envían el token de tu sesión. Las rutas públicas de `/docs` y
          `/openapi.json` están deshabilitadas.
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {grouped.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No hay rutas que coincidan con el filtro.</p>
        ) : null}

        {grouped.map((group) => {
          const isOpen = openTags[group.tag] !== false;
          return (
            <section key={group.tag}>
              <button
                type="button"
                onClick={() => setOpenTags((prev) => ({ ...prev, [group.tag]: !isOpen }))}
                className="mb-2 flex w-full items-center gap-2 border-b border-[#89bf65] pb-2 text-left"
              >
                <h3 className="text-2xl font-semibold tracking-tight text-[#3b4151]">{group.tag}</h3>
                <ChevronDown
                  className={`ml-auto size-5 text-[#89bf65] transition ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {group.description ? <p className="mb-3 text-sm text-gray-500">{group.description}</p> : null}
              {isOpen ? (
                <ul className="space-y-2">
                  {group.operations.map((op) => (
                    <OperationBlock
                      key={op.id}
                      op={op}
                      spec={spec}
                      expanded={Boolean(openOps[op.id])}
                      onToggle={() => setOpenOps((prev) => ({ ...prev, [op.id]: !prev[op.id] }))}
                      paramValues={paramValues[op.id] ?? {}}
                      onParamChange={(name, value) =>
                        setParamValues((prev) => ({
                          ...prev,
                          [op.id]: { ...prev[op.id], [name]: value },
                        }))
                      }
                      bodyValue={bodyValues[op.id] ?? jsonBody(spec, op.requestBody)}
                      onBodyChange={(value) => setBodyValues((prev) => ({ ...prev, [op.id]: value }))}
                      onFileChange={(name, file) =>
                        setFileValues((prev) => ({
                          ...prev,
                          [op.id]: { ...prev[op.id], [name]: file },
                        }))
                      }
                      executing={executing === op.id}
                      result={results[op.id]}
                      onExecute={() => void execute(op)}
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OperationBlock({
  op,
  spec,
  expanded,
  onToggle,
  paramValues,
  onParamChange,
  bodyValue,
  onBodyChange,
  onFileChange,
  executing,
  result,
  onExecute,
}: {
  op: ParsedOp;
  spec: OpenAPISpec;
  expanded: boolean;
  onToggle: () => void;
  paramValues: Record<string, string>;
  onParamChange: (name: string, value: string) => void;
  bodyValue: string;
  onBodyChange: (value: string) => void;
  onFileChange: (name: string, file: File | null) => void;
  executing: boolean;
  result?: TryResult;
  onExecute: () => void;
}) {
  const styles = METHOD_STYLES[op.method];
  const fields = multipartFields(spec, op.requestBody);
  const hasJson = Boolean(op.requestBody?.content?.['application/json']);
  const locked = isProtectedRoute(op);
  const visibleParams = op.parameters.filter((param) => param.in === 'path' || param.in === 'query');

  return (
    <li className={`overflow-hidden rounded border ${styles.border} ${styles.panel}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-stretch gap-0 text-left"
      >
        <span
          className={`inline-flex w-[76px] shrink-0 items-center justify-center text-[11px] font-extrabold uppercase tracking-wide text-white ${styles.badge}`}
        >
          {op.method}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
          <code className="truncate font-mono text-[13px] font-semibold text-[#3b4151]">{op.path}</code>
          <span className="hidden truncate text-sm text-[#3b4151]/70 sm:inline">{op.summary}</span>
          {locked ? <Lock className={`ml-auto size-3.5 shrink-0 ${styles.text}`} aria-label="Requiere autenticación" /> : null}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-black/5 bg-white px-4 py-4 sm:px-5">
          <p className="text-sm text-gray-600 sm:hidden">{op.summary}</p>
          {op.description ? <p className="mt-1 text-sm text-gray-500">{op.description}</p> : null}

          {visibleParams.length > 0 ? (
            <Fieldset title="Parameters">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                      <th className="py-2 pr-4 font-semibold">Name</th>
                      <th className="py-2 pr-4 font-semibold">In</th>
                      <th className="py-2 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleParams.map((param) => (
                      <tr key={`${param.in}-${param.name}`} className="border-b border-gray-100">
                        <td className="py-2 pr-4">
                          <span className="font-mono text-[13px] font-medium text-gray-900">{param.name}</span>
                          {param.required ? <span className="ml-1 text-xs font-semibold text-red-600">*</span> : null}
                          <p className="text-xs text-gray-500">{schemaTypeLabel(spec, param.schema)}</p>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-600">{param.in}</td>
                        <td className="py-2">
                          <input
                            value={paramValues[param.name] ?? ''}
                            onChange={(event) => onParamChange(param.name, event.target.value)}
                            placeholder={param.required ? 'requerido' : 'opcional'}
                            className="h-9 w-full min-w-40 rounded border border-gray-200 px-2 font-mono text-sm outline-none focus:border-[#61affe]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Fieldset>
          ) : null}

          {fields.length > 0 ? (
            <Fieldset title="Request body · multipart/form-data">
              <div className="space-y-3">
                {fields.map((field) => (
                  <label key={field.name} className="block">
                    <span className="mb-1 block font-mono text-[13px] font-medium text-gray-900">
                      {field.name}
                      {field.required ? <span className="ml-1 text-xs text-red-600">*</span> : null}
                      <span className="ml-2 font-sans text-xs font-normal text-gray-500">{field.type}</span>
                    </span>
                    {field.binary ? (
                      <input
                        type="file"
                        onChange={(event) => onFileChange(field.name, event.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-[#1a2f26] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                      />
                    ) : (
                      <input
                        value={paramValues[field.name] ?? ''}
                        onChange={(event) => onParamChange(field.name, event.target.value)}
                        className="h-9 w-full rounded border border-gray-200 px-2 font-mono text-sm outline-none focus:border-[#61affe]"
                      />
                    )}
                  </label>
                ))}
              </div>
            </Fieldset>
          ) : null}

          {hasJson ? (
            <Fieldset title="Request body · application/json">
              <textarea
                value={bodyValue}
                onChange={(event) => onBodyChange(event.target.value)}
                spellCheck={false}
                rows={Math.min(12, Math.max(6, bodyValue.split('\n').length + 1))}
                className="w-full rounded border border-gray-200 bg-[#f8f9fa] p-3 font-mono text-[13px] text-gray-900 outline-none focus:border-[#61affe]"
              />
            </Fieldset>
          ) : null}

          <Fieldset title="Responses">
            <ul className="space-y-1.5">
              {Object.entries(op.responses).map(([code, response]) => (
                <li key={code} className="flex gap-3 text-sm">
                  <span className="w-10 shrink-0 font-mono font-semibold text-gray-800">{code}</span>
                  <span className="text-gray-600">
                    {response.description || '—'}
                    {response.content ? (
                      <span className="ml-2 font-mono text-xs text-gray-400">
                        {Object.keys(response.content).join(', ')}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </Fieldset>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onExecute}
              disabled={executing}
              className="inline-flex min-h-10 items-center gap-2 rounded bg-[#4990e2] px-4 text-sm font-semibold text-white transition hover:bg-[#3b7cc9] disabled:opacity-60"
            >
              {executing ? (
                <RefreshCw className="size-4 animate-spin" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
              Execute
            </button>
            <p className="text-xs text-gray-500">Authorization: Bearer &lt;sesión actual&gt;</p>
          </div>

          {result ? (
            <div className="mt-4 overflow-hidden rounded border border-gray-200">
              <div className="flex items-center justify-between bg-[#41444e] px-3 py-2 text-xs text-white">
                <span>
                  {result.status} {result.statusText}
                </span>
                <span>{result.durationMs} ms</span>
              </div>
              <pre className="max-h-80 overflow-auto bg-[#1b1c21] p-3 font-mono text-[12px] leading-relaxed text-[#e8e8e8]">
                {result.body}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function Fieldset({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-[13px] font-semibold text-[#3b4151]">{title}</h4>
      {children}
    </div>
  );
}
