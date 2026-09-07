/// <reference lib="webworker" />

import ts from "typescript";
import type { PracticeDiagnostic } from "./runner";

type CheckRequest = {
  id: number;
  files: Record<string, string>;
  react: boolean;
};

type CheckResponse = {
  id: number;
  diagnostics: PracticeDiagnostic[];
};

const STRICT_RUNTIME_SHIMS = `
interface Object {}
interface Function {}
interface CallableFunction extends Function {}
interface NewableFunction extends Function {}
interface IArguments { length: number; [index: number]: unknown; }
interface String { readonly length: number; trim(): string; toLowerCase(): string; }
interface Number {}
interface Boolean {}
interface RegExp {}
interface IteratorResult<T> { done?: boolean; value: T; }
interface Iterator<T> { next(): IteratorResult<T>; }
interface SymbolConstructor { readonly iterator: unique symbol; }
declare var Symbol: SymbolConstructor;
interface Iterable<T> { [Symbol.iterator](): Iterator<T>; }
interface Error { name: string; message: string; stack?: string; }
interface ErrorConstructor { new(message?: string): Error; }
declare var Error: ErrorConstructor;
interface Array<T> extends Iterable<T> {
  readonly length: number;
  [index: number]: T;
  map<U>(callback: (value: T, index: number, array: T[]) => U): U[];
  every<S extends T>(callback: (value: T, index: number, array: T[]) => value is S): this is S[];
  every(callback: (value: T, index: number, array: T[]) => unknown): boolean;
  filter<S extends T>(callback: (value: T, index: number, array: T[]) => value is S): S[];
  filter(callback: (value: T, index: number, array: T[]) => unknown): T[];
  reduce<U>(callback: (previous: U, current: T, index: number, array: T[]) => U, initial: U): U;
  includes(value: T): boolean;
}
interface ReadonlyArray<T> extends Iterable<T> {
  readonly length: number;
  readonly [index: number]: T;
  map<U>(callback: (value: T, index: number, array: readonly T[]) => U): U[];
  every(callback: (value: T, index: number, array: readonly T[]) => unknown): boolean;
  includes(value: T): boolean;
}
interface ArrayConstructor {
  isArray(value: unknown): value is unknown[];
}
declare var Array: ArrayConstructor;
interface PromiseLike<T> { then<TResult>(callback: (value: T) => TResult | PromiseLike<TResult>): PromiseLike<TResult>; }
interface Promise<T> {
  then<TResult>(callback: (value: T) => TResult | PromiseLike<TResult>): Promise<TResult>;
  catch<TResult>(callback: (reason: unknown) => TResult | PromiseLike<TResult>): Promise<T | TResult>;
}
interface PromiseConstructor { resolve<T>(value: T): Promise<T>; reject(reason?: unknown): Promise<never>; }
declare var Promise: PromiseConstructor;
type Record<K extends keyof any, T> = { [P in K]: T };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Exclude<T, U> = T extends U ? never : T;
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Readonly<T> = { readonly [P in keyof T]: T[P] };
interface JSON { parse(text: string): unknown; stringify(value: unknown): string | undefined; }
declare var JSON: JSON;
declare function String(value?: unknown): string;
declare function Number(value?: unknown): number;
declare function setTimeout(callback: () => void, delay?: number): number;
declare function clearTimeout(id: number): void;
interface EventTarget {}
interface Event { readonly target: EventTarget | null; readonly currentTarget: EventTarget | null; }
interface Element extends EventTarget { textContent: string | null; }
interface HTMLElement extends Element {}
interface HTMLInputElement extends HTMLElement { value: string; }
interface Document { querySelector<E extends Element = Element>(selector: string): E | null; }
declare var document: Document;
`;

const REACT_SHIMS = `
declare module "react" {
  export type ReactNode = unknown;
  export type SetStateAction<S> = S | ((previous: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export type DependencyList = readonly unknown[];
  export interface RefObject<T> { current: T; }
  export interface SyntheticEvent<T = Element> { currentTarget: T; target: EventTarget; }
  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {}
  export interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), dependencies?: DependencyList): void;
  export function useRef<T>(initial: T): RefObject<T>;
}
declare module "react/jsx-runtime" {
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown;
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
  export const Fragment: unknown;
}
declare namespace JSX {
  type Element = unknown;
  interface IntrinsicElements { [name: string]: any; }
}
`;

function normalizePath(filePath: string) {
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}

function directoryOf(filePath: string) {
  const index = filePath.lastIndexOf("/");
  return index <= 0 ? "/" : filePath.slice(0, index);
}

function resolveRelativeModule(
  containingFile: string,
  moduleName: string,
  files: Map<string, string>,
): string | null {
  if (!moduleName.startsWith(".")) return null;
  const segments = `${directoryOf(containingFile)}/${moduleName}`.split("/");
  const resolved: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") resolved.pop();
    else resolved.push(segment);
  }
  const base = `/${resolved.join("/")}`;
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (files.has(candidate)) return candidate;
  }
  return null;
}

function check(request: CheckRequest): PracticeDiagnostic[] {
  const shimPath = "/__mycareer_runtime_shims__.d.ts";
  const files = new Map(
    Object.entries(request.files).map(([filePath, code]) => [
      normalizePath(filePath),
      code,
    ]),
  );
  files.set(
    shimPath,
    `${STRICT_RUNTIME_SHIMS}\n${request.react ? REACT_SHIMS : ""}`,
  );

  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    noLib: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
  };
  const host: ts.CompilerHost = {
    fileExists: (fileName) => files.has(normalizePath(fileName)),
    readFile: (fileName) => files.get(normalizePath(fileName)),
    getSourceFile: (fileName, languageVersion) => {
      const normalized = normalizePath(fileName);
      const source = files.get(normalized);
      return source === undefined
        ? undefined
        : ts.createSourceFile(normalized, source, languageVersion, true);
    },
    getDefaultLibFileName: () => shimPath,
    writeFile: () => {},
    getCurrentDirectory: () => "/",
    getDirectories: () => [],
    directoryExists: () => true,
    getCanonicalFileName: (fileName) => normalizePath(fileName),
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    resolveModuleNames: (moduleNames, containingFile) =>
      moduleNames.map((moduleName) => {
        if (moduleName === "react" || moduleName === "react/jsx-runtime") {
          return {
            resolvedFileName: shimPath,
            extension: ts.Extension.Dts,
            isExternalLibraryImport: true,
          };
        }
        const resolvedFileName = resolveRelativeModule(
          normalizePath(containingFile),
          moduleName,
          files,
        );
        return resolvedFileName
          ? {
              resolvedFileName,
              extension: resolvedFileName.endsWith(".tsx")
                ? ts.Extension.Tsx
                : ts.Extension.Ts,
            }
          : undefined;
      }),
  };
  const program = ts.createProgram({
    rootNames: [...files.keys()],
    options,
    host,
  });

  return ts
    .getPreEmitDiagnostics(program)
    .filter(
      (diagnostic) =>
        diagnostic.category === ts.DiagnosticCategory.Error &&
        diagnostic.file &&
        diagnostic.file.fileName !== shimPath,
    )
    .map((diagnostic) => {
      const position = diagnostic.file && diagnostic.start !== undefined
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        : null;
      return {
        file: diagnostic.file?.fileName ?? "TypeScript",
        ...(position ? { line: position.line + 1 } : {}),
        message: `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          " ",
        )}`,
      };
    });
}

self.onmessage = (event: MessageEvent<CheckRequest>) => {
  const response: CheckResponse = {
    id: event.data.id,
    diagnostics: check(event.data),
  };
  self.postMessage(response);
};

export {};
