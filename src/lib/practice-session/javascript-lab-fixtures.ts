import type { PracticeWorkspace } from "./workspace";

export type JavaScriptLabFixture = {
  lessonId: string;
  title: string;
  workspace: PracticeWorkspace;
};

export const JAVASCRIPT_LAB_FIXTURES: JavaScriptLabFixture[] = [
  {
    lessonId: "js-output-reasoning-lab",
    title: "值與比較輸出推理",
    workspace: {
      version: 2,
      description: "固定驗收解答：coercion、nullish、NaN、identity 與 shallow copy。",
      entryFile: "/predictions.js",
      files: [
        {
          path: "/predictions.js",
          role: "starter",
          readOnly: false,
          code: `export function predictOutputs() {
  const shared = { nested: { value: 1 } };
  const alias = shared;
  const shallow = { ...shared };
  alias.nested.value = 2;
  return [
    { label: 'zero-or', value: 0 || 20, rule: '|| returns the first truthy operand' },
    { label: 'zero-nullish', value: 0 ?? 20, rule: '?? only defaults null or undefined' },
    { label: 'nan-strict', value: NaN === NaN, rule: 'NaN is not strictly equal to itself' },
    { label: 'nan-object-is', value: Object.is(NaN, NaN), rule: 'Object.is treats NaN as identical' },
    { label: 'string-number', value: '5' + 1, rule: '+ concatenates with a string operand' },
    { label: 'shared-nested', value: shallow.nested.value, rule: 'spread is a shallow copy' },
  ];
}
`,
        },
        {
          path: "/predictions.test.js",
          role: "test",
          readOnly: true,
          code: `import { predictOutputs } from './predictions';
const rows = () => Object.fromEntries(predictOutputs().map((item) => [item.label, item]));
describe('predictOutputs', () => {
  it('區分 || 與 ??', () => {
    expect(rows()['zero-or'].value).toBe(20);
    expect(rows()['zero-nullish'].value).toBe(0);
  });
  it('區分 === 與 Object.is 的 NaN 邊界', () => {
    expect(rows()['nan-strict'].value).toBe(false);
    expect(rows()['nan-object-is'].value).toBe(true);
  });
  it('推理字串 coercion', () => expect(rows()['string-number'].value).toBe('51'));
  it('辨認 shallow copy 的 nested sharing', () => expect(rows()['shared-nested'].value).toBe(2));
  it('每項都有規則', () => expect(predictOutputs().every((item) => item.rule.length > 15)).toBe(true));
});
`,
        },
      ],
    },
  },
  {
    lessonId: "js-closure-this-debug-lab",
    title: "Closure 與 this Debug",
    workspace: {
      version: 2,
      description: "固定驗收解答：私有狀態、loop binding 與 detached method。",
      entryFile: "/closure-debug.js",
      files: [
        {
          path: "/closure-debug.js",
          role: "starter",
          readOnly: false,
          code: `export function createCounter(initial = 0) {
  let count = initial;
  return {
    increment() { count += 1; return count; },
    value() { return count; },
  };
}
export const createTaskHandlers = (items) => items.map((item) => () => item);
export const bindLogger = (logger) => logger.log.bind(logger);
`,
        },
        {
          path: "/closure-debug.test.js",
          role: "test",
          readOnly: true,
          code: `import { bindLogger, createCounter, createTaskHandlers } from './closure-debug';
describe('closure and this', () => {
  it('counter factory 建立獨立私有狀態', () => {
    const a = createCounter(1); const b = createCounter(10);
    expect(a.increment()).toBe(2); expect(b.value()).toBe(10); expect(a.value()).toBe(2);
  });
  it('loop handlers 捕捉各輪 binding', () => {
    expect(createTaskHandlers(['a', 'b', 'c']).map((run) => run())).toEqual(['a', 'b', 'c']);
  });
  it('空 items 回傳空 handlers', () => expect(createTaskHandlers([])).toEqual([]));
  it('detached method 保留 receiver', () => {
    const logger = { prefix: 'app', log(value) { return this.prefix + ':' + value; } };
    expect(bindLogger(logger)('ready')).toBe('app:ready');
  });
});
`,
        },
      ],
    },
  },
  {
    lessonId: "js-data-transform-lab",
    title: "資料正規化與 groupBy",
    workspace: {
      version: 2,
      description: "固定驗收解答：去重、缺值分組、排序與 input immutability。",
      entryFile: "/normalize.js",
      files: [
        {
          path: "/normalize.js",
          role: "starter",
          readOnly: false,
          code: `export function normalizeAndGroup(records) {
  const byId = new Map();
  for (const record of records) {
    if (!record || typeof record.id !== 'string' || record.id.trim() === '') continue;
    byId.set(record.id, {
      id: record.id,
      score: typeof record.score === 'number' ? record.score : 0,
      category: record.category || 'uncategorized',
    });
  }
  const groups = {};
  for (const record of byId.values()) {
    (groups[record.category] ??= []).push({ id: record.id, score: record.score });
  }
  for (const values of Object.values(groups)) {
    values.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  }
  return groups;
}
`,
        },
        {
          path: "/normalize.test.js",
          role: "test",
          readOnly: true,
          code: `import { normalizeAndGroup } from './normalize';
describe('normalizeAndGroup', () => {
  it('空 input 回傳空結果', () => expect(normalizeAndGroup([])).toEqual({}));
  it('重複 id 保留最後一筆', () => {
    const rows = [{ id: 'a', score: 1, category: 'x' }, { id: 'a', score: 3, category: 'x' }];
    expect(normalizeAndGroup(rows).x).toEqual([{ id: 'a', score: 3 }]);
  });
  it('缺少 category 歸類且保留 score 0', () => {
    expect(normalizeAndGroup([{ id: 'a', score: 0 }]).uncategorized).toEqual([{ id: 'a', score: 0 }]);
  });
  it('score 降冪且同分 id 升冪', () => {
    const rows = [
      { id: 'b', score: 2, category: 'x' },
      { id: 'c', score: 3, category: 'x' },
      { id: 'a', score: 2, category: 'x' },
    ];
    expect(normalizeAndGroup(rows).x.map(({ id }) => id)).toEqual(['c', 'a', 'b']);
  });
  it('忽略無效 id 且不修改 input', () => {
    const input = [{ id: 'a', score: 1, category: 'x' }, { id: '', score: 9 }];
    const before = JSON.stringify(input); normalizeAndGroup(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
`,
        },
      ],
    },
  },
  {
    lessonId: "js-promise-concurrency-lab",
    title: "批次請求與錯誤策略",
    workspace: {
      version: 2,
      description: "固定驗收解答：sequential、fail-fast 與 partial-result。",
      entryFile: "/batch.js",
      files: [
        {
          path: "/batch.js",
          role: "starter",
          readOnly: false,
          code: `export async function runSequential(items, worker) {
  const results = [];
  for (const item of items) results.push(await worker(item));
  return results;
}
export const runFailFast = (items, worker) => Promise.all(items.map((item) => worker(item)));
export async function runPartial(items, worker) {
  const settled = await Promise.allSettled(items.map((item) => worker(item)));
  return settled.map((result, index) => result.status === 'fulfilled'
    ? { id: items[index].id, status: 'fulfilled', value: result.value }
    : { id: items[index].id, status: 'rejected', reason: result.reason });
}
`,
        },
        {
          path: "/batch.test.js",
          role: "test",
          readOnly: true,
          code: `import { runFailFast, runPartial, runSequential } from './batch';
describe('batch strategies', () => {
  it('sequential 同時只執行一項並保持順序', async () => {
    let active = 0; let maximum = 0;
    const worker = async ({ id }) => {
      active += 1; maximum = Math.max(maximum, active);
      await Promise.resolve(); active -= 1; return id;
    };
    await expect(runSequential([{ id: 'a' }, { id: 'b' }], worker)).resolves.toEqual(['a', 'b']);
    expect(maximum).toBe(1);
  });
  it('fail-fast 同時啟動並傳遞 rejection', async () => {
    const started = [];
    const worker = ({ id }) => {
      started.push(id);
      return id === 'b' ? Promise.reject(new Error('boom')) : Promise.resolve(id);
    };
    await expect(runFailFast([{ id: 'a' }, { id: 'b' }], worker)).rejects.toThrow('boom');
    expect(started).toEqual(['a', 'b']);
  });
  it('partial result 保留 success、error 與 id', async () => {
    const result = await runPartial([{ id: 'a' }, { id: 'b' }], ({ id }) =>
      id === 'b' ? Promise.reject('bad') : Promise.resolve('ok'));
    expect(result).toEqual([
      { id: 'a', status: 'fulfilled', value: 'ok' },
      { id: 'b', status: 'rejected', reason: 'bad' },
    ]);
  });
  it('完成順序不同仍維持 input 對應', async () => {
    const resolvers = {};
    const pending = runPartial([{ id: 'slow' }, { id: 'fast' }], ({ id }) =>
      new Promise((resolve) => { resolvers[id] = resolve; }));
    resolvers.fast(2); resolvers.slow(1);
    expect((await pending).map(({ id, value }) => [id, value])).toEqual([['slow', 1], ['fast', 2]]);
  });
  it('空 input 立即回傳空結果', async () => {
    await expect(runPartial([], () => Promise.resolve())).resolves.toEqual([]);
  });
});
`,
        },
      ],
    },
  },
  {
    lessonId: "js-autocomplete-capstone",
    title: "Autocomplete Capstone",
    workspace: {
      version: 2,
      description: "固定驗收解答：debounce、abort、latest-request-wins 與四態 UI。",
      entryFile: "/autocomplete.js",
      files: [
        {
          path: "/autocomplete.js",
          role: "starter",
          readOnly: false,
          code: `export function createAutocomplete({
  input,
  results,
  fetchSuggestions,
  debounceMs = 250,
  scheduler = { set: setTimeout, clear: clearTimeout },
}) {
  let timer = null;
  let controller = null;
  let requestId = 0;
  let destroyed = false;

  function render(state, value = []) {
    if (destroyed) return;
    results.dataset.state = state;
    results.textContent = state === 'results'
      ? value.join(',')
      : state === 'empty' ? '沒有結果'
        : state === 'error' ? '載入失敗'
          : state === 'loading' ? '載入中' : '';
  }

  function cancelPending() {
    if (timer !== null) scheduler.clear(timer);
    timer = null;
    controller?.abort();
    controller = null;
  }

  function onInput() {
    const query = input.value.trim();
    cancelPending();
    const currentId = ++requestId;
    if (!query) { render('idle'); return; }

    timer = scheduler.set(async () => {
      timer = null;
      controller = new AbortController();
      render('loading');
      try {
        const response = await fetchSuggestions(query, { signal: controller.signal });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        if (!Array.isArray(data)) throw new TypeError('invalid response');
        if (destroyed || currentId !== requestId) return;
        render(data.length === 0 ? 'empty' : 'results', data);
      } catch (error) {
        if (error?.name === 'AbortError' || destroyed || currentId !== requestId) return;
        render('error');
      }
    }, debounceMs);
  }

  input.addEventListener('input', onInput);
  return {
    destroy() {
      destroyed = true;
      requestId += 1;
      cancelPending();
      input.removeEventListener('input', onInput);
    },
  };
}
`,
        },
        {
          path: "/autocomplete.test.js",
          role: "test",
          readOnly: true,
          code: `import { createAutocomplete } from './autocomplete';

const response = (data, options = {}) => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  json: async () => data,
});
const deferred = () => {
  let resolve;
  const promise = new Promise((yes) => { resolve = yes; });
  return { promise, resolve };
};
const harness = (fetchSuggestions) => {
  const input = document.createElement('input');
  const results = document.createElement('div');
  const jobs = new Map();
  let id = 0;
  const scheduler = {
    set(callback) { id += 1; jobs.set(id, callback); return id; },
    clear(jobId) { jobs.delete(jobId); },
    async flush() {
      const callbacks = [...jobs.values()]; jobs.clear();
      for (const callback of callbacks) await callback();
    },
  };
  const controller = createAutocomplete({ input, results, fetchSuggestions, scheduler });
  const type = (value) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  return { results, scheduler, controller, type };
};

describe('autocomplete', () => {
  it('快速輸入 debounce 後只查最後一筆', async () => {
    const queries = [];
    const app = harness(async (query) => { queries.push(query); return response([query]); });
    app.type('a'); app.type('ab'); app.type('abc');
    await app.scheduler.flush();
    expect(queries).toEqual(['abc']);
    expect(app.results.textContent).toBe('abc');
  });
  it('新查詢 abort 前次 signal', async () => {
    const first = deferred(); const signals = [];
    const app = harness((query, { signal }) => {
      signals.push(signal);
      return query === 'a' ? first.promise : Promise.resolve(response([query]));
    });
    app.type('a'); const firstRun = app.scheduler.flush(); await Promise.resolve();
    app.type('ab'); expect(signals[0].aborted).toBe(true);
    first.resolve(response(['old'])); await firstRun;
  });
  it('舊回應較晚完成也不能覆蓋新結果', async () => {
    const slow = deferred();
    const app = harness((query) => query === 'old' ? slow.promise : Promise.resolve(response(['new'])));
    app.type('old'); const oldRun = app.scheduler.flush(); await Promise.resolve();
    app.type('new'); await app.scheduler.flush();
    slow.resolve(response(['old'])); await oldRun;
    expect(app.results.textContent).toBe('new');
  });
  it('HTTP error 顯示 error state', async () => {
    const app = harness(async () => response([], { ok: false, status: 500 }));
    app.type('fail'); await app.scheduler.flush();
    expect(app.results.dataset.state).toBe('error');
  });
  it('成功空陣列顯示 empty，空 query 清回 idle', async () => {
    const app = harness(async () => response([]));
    app.type('none'); await app.scheduler.flush();
    expect(app.results.dataset.state).toBe('empty');
    app.type('   '); expect(app.results.dataset.state).toBe('idle');
  });
  it('destroy 清除 timer 且不再送 request', async () => {
    let calls = 0;
    const app = harness(async () => { calls += 1; return response([]); });
    app.type('a'); app.controller.destroy(); await app.scheduler.flush();
    app.type('b'); await app.scheduler.flush(); expect(calls).toBe(0);
  });
});
`,
        },
      ],
    },
  },
];
