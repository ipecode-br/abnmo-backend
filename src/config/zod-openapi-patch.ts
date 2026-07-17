type CachedModule = {
  exports: Record<string, unknown>;
};

type JsonSchemaProcessor = (
  schema: unknown,
  ctx: unknown,
  json: { type: string; format: string },
) => void;

export function applyZodOpenApiPatch(): void {
  const cache = require.cache as Record<string, CachedModule | undefined>;
  for (const key of Object.keys(cache)) {
    if (!key.includes('json-schema-processors')) continue;
    const mod = cache[key];
    if (!mod?.exports?.dateProcessor) continue;
    mod.exports.dateProcessor = (
      (): JsonSchemaProcessor => (_schema, _ctx, json) => {
        json.type = 'string';
        json.format = 'date-time';
      }
    )();
    return;
  }
}
