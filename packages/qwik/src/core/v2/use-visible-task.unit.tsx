import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { component$ } from '../component/component.public';
import { Fragment as Component, Fragment, Fragment as Signal } from '../render/jsx/jsx-runtime';
import { useSignal } from '../use/use-signal';
import { useVisibleTask$ } from '../use/use-task';
import { ErrorProvider, domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';
import { delay } from '../util/promises';
import { useStore } from '../use/use-store.public';

const debug = false; //true;
Error.stackTraceLimit = 100;

export function useDelay(value: string) {
  const ready = useSignal('---');
  useVisibleTask$(() => {
    ready.value = value;
  });
  return ready;
}

describe.each([
  { render: ssrRenderToDom }, //
  { render: domRender }, //
])('$render.name: useVisibleTask', ({ render }) => {
  it('should execute visible task', async () => {
    const VisibleCmp = component$(() => {
      const state = useSignal('SSR');
      useVisibleTask$(() => {
        state.value = 'CSR';
      });
      return <span>{state.value}</span>;
    });

    const { vNode, document } = await render(<VisibleCmp />, { debug });
    if (render === ssrRenderToDom) {
      await trigger(document.body, 'span', 'qvisible');
    }
    expect(vNode).toMatchVDOM(
      <Component>
        <span>
          <Signal>CSR</Signal>
        </span>
      </Component>
    );
  });

  it('should execute visible task with strategy document-ready', async () => {
    const VisibleCmp = component$(() => {
      const state = useSignal('SSR');
      useVisibleTask$(
        () => {
          state.value = 'CSR';
        },
        {
          strategy: 'document-ready',
        }
      );
      return <span>{state.value}</span>;
    });

    const { vNode, document } = await render(<VisibleCmp />, { debug });
    await trigger(document.body, 'span', ':document:qinit');
    expect(vNode).toMatchVDOM(
      <Component>
        <span>
          <Signal>CSR</Signal>
        </span>
      </Component>
    );
  });

  it('should execute visible task with strategy document-idle', async () => {
    const VisibleCmp = component$(() => {
      const state = useSignal('SSR');
      useVisibleTask$(
        () => {
          state.value = 'CSR';
        },
        {
          strategy: 'document-idle',
        }
      );
      return <span>{state.value}</span>;
    });

    const { vNode, document } = await render(<VisibleCmp />, { debug });
    await trigger(document.body, 'span', ':document:qidle');

    expect(vNode).toMatchVDOM(
      <Component>
        <span>
          <Signal>CSR</Signal>
        </span>
      </Component>
    );
  });

  it('should execute async visible task', async () => {
    (globalThis as any).log = [] as string[];
    const VisibleCmp = component$(() => {
      (globalThis as any).log.push('VisibleCmp');
      const state = useSignal('SSR');

      useVisibleTask$(async () => {
        (globalThis as any).log.push('task');
        await delay(10);
        (globalThis as any).log.push('resolved');
        state.value = 'CSR';
      });

      (globalThis as any).log.push('render');
      return <span>{state.value}</span>;
    });
    const { vNode, document } = await render(<VisibleCmp />, { debug });
    if (render === ssrRenderToDom) {
      await trigger(document.body, 'span', 'qvisible');
    }
    expect((globalThis as any).log).toEqual(['VisibleCmp', 'render', 'task', 'resolved']);
    expect(vNode).toMatchVDOM(
      <Component>
        <span>
          <Signal>CSR</Signal>
        </span>
      </Component>
    );
    (globalThis as any).log = undefined;
  });

  it('should handle exception', async () => {
    const error = new Error('HANDLE ME');
    const VisibleCmp = component$(() => {
      const state = useSignal('SSR');
      useVisibleTask$(() => {
        throw error;
      });
      return <span>{state.value}</span>;
    });
    const { document } = await render(
      <ErrorProvider>
        <VisibleCmp />
      </ErrorProvider>,
      { debug }
    );
    if (render === ssrRenderToDom) {
      await trigger(document.body, 'span', 'qvisible');
    }
    expect(ErrorProvider.error).toBe(render === domRender ? error : null);
  });

  it('should handle async exception', async () => {
    const error = new Error('HANDLE ME');
    const VisibleCmp = component$(() => {
      const state = useSignal('SSR');
      useVisibleTask$(async () => {
        await delay(1);
        throw error;
      });
      return <span>{state.value}</span>;
    });

    const { document } = await render(
      <ErrorProvider>
        <VisibleCmp />
      </ErrorProvider>,
      { debug }
    );
    if (render === ssrRenderToDom) {
      await trigger(document.body, 'span', 'qvisible');
    }
    expect(ErrorProvider.error).toBe(render === domRender ? error : null);
  });

  it('should not run next visible task until previous async visible task is finished', async () => {
    (globalThis as any).log = [] as string[];
    const Counter = component$(() => {
      (globalThis as any).log.push('Counter');
      const count = useSignal('');

      useVisibleTask$(async () => {
        (globalThis as any).log.push('1:task');
        await delay(10);
        (globalThis as any).log.push('1:resolved');
        count.value += 'A';
      });

      useVisibleTask$(async () => {
        (globalThis as any).log.push('2:task');
        await delay(10);
        (globalThis as any).log.push('2:resolved');
        count.value += 'B';
      });
      (globalThis as any).log.push('render');
      return <span>{count.value}</span>;
    });

    const { vNode, document } = await render(<Counter />, { debug });
    if (render === ssrRenderToDom) {
      await trigger(document.body, 'span', 'qvisible');
    }
    expect((globalThis as any).log).toEqual([
      'Counter',
      'render',
      '1:task',
      '1:resolved',
      '2:task',
      '2:resolved',
    ]);
    expect(vNode).toMatchVDOM(
      <Component>
        <span>
          <Signal>AB</Signal>
        </span>
      </Component>
    );
  });

  it('should trigger in empty components', async () => {
    const Cmp = component$(() => {
      const signal = useSignal('empty');
      useVisibleTask$(() => {
        signal.value = 'run';
      });
      return <>{signal.value}</>;
    });
    const { vNode, document } = await render(<Cmp />, { debug });
    if (render === ssrRenderToDom) {
      await trigger(document.body, 'script', ':document:qinit');
    }
    expect(vNode).toMatchVDOM(
      <Component>
        <Fragment>
          <Signal>{'run'}</Signal>
          <script type="placeholder" hidden></script>
        </Fragment>
      </Component>
    );
  });

  it('should trigger in empty components array', async () => {
    const Cmp = component$(() => {
      const signal = useSignal('empty');
      useVisibleTask$(() => {
        signal.value = 'run';
      });
      return [<>{signal.value}</>, <>{signal.value}</>];
    });
    const { vNode, document } = await render(<Cmp />, { debug });
    if (render === ssrRenderToDom) {
      await trigger(document.body, 'script', ':document:qinit');
    }
    expect(vNode).toMatchVDOM(
      <Component>
        <Fragment>
          <Signal>{'run'}</Signal>
          <script type="placeholder" hidden></script>
        </Fragment>
        <Fragment>
          <Signal>{'run'}</Signal>
        </Fragment>
      </Component>
    );
  });

  it('should trigger in full empty component', async () => {
    const Cmp = component$(() => {
      const signal = useSignal('empty');
      useVisibleTask$(() => {
        signal.value = 'run';
      });
      return <></>;
    });
    const { vNode, document } = await render(<Cmp />, { debug });
    if (render === ssrRenderToDom) {
      await trigger(document.body, 'script', ':document:qinit');
    }
    expect(vNode).toMatchVDOM(
      <Component>
        <Fragment>
          <script type="placeholder" hidden></script>
        </Fragment>
      </Component>
    );
  });

  describe(render.name + ': track', () => {
    it('should rerun on track', async () => {
      const Counter = component$(() => {
        const count = useSignal(10);
        const double = useSignal(0);

        useVisibleTask$(({ track }) => {
          double.value = 2 * track(count);
        });
        return (
          <button
            onClick$={() => {
              count.value++;
            }}
          >
            {double.value}
          </button>
        );
      });

      const { vNode, document } = await render(<Counter />, { debug });
      if (render === ssrRenderToDom) {
        await trigger(document.body, 'button', 'qvisible');
      }
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>20</Signal>
          </button>
        </Component>
      );
      await trigger(document.body, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>22</Signal>
          </button>
        </Component>
      );
    });

    it('should track store property', async () => {
      const Counter = component$(() => {
        const store = useStore({ count: 1, double: 0 });
        useVisibleTask$(({ track }) => {
          const count = track(store, 'count');
          store.double = 2 * count;
        });
        return <button onClick$={() => store.count++}>{store.double}</button>;
      });

      const { vNode, document } = await render(<Counter />, { debug });
      if (render === ssrRenderToDom) {
        await trigger(document.body, 'button', 'qvisible');
      }
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>2</Signal>
          </button>
        </Component>
      );
      await trigger(document.body, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>4</Signal>
          </button>
        </Component>
      );
    });
  });

  describe(render.name + ': queue', () => {
    it('should execute dependant visible tasks', async () => {
      (globalThis as any).log = [] as string[];
      const Counter = component$(() => {
        const store = useStore({ count: 1, double: 0, quadruple: 0 });
        useVisibleTask$(({ track }) => {
          (globalThis as any).log.push('quadruple');
          store.quadruple = track(store, 'double') * 2;
        });
        useVisibleTask$(({ track }) => {
          (globalThis as any).log.push('double');
          store.double = track(store, 'count') * 2;
        });
        (globalThis as any).log.push('Counter');
        return (
          <button
            onClick$={() => {
              store.count++;
            }}
          >
            {store.count + '/' + store.double + '/' + store.quadruple}
          </button>
        );
      });

      const { vNode, document } = await render(<Counter />, { debug });
      if (render === ssrRenderToDom) {
        await trigger(document.body, 'button', 'qvisible');
      }
      expect((globalThis as any).log).toEqual([
        'Counter',
        'quadruple',
        'double',
        'quadruple',
        // not called with the optimizer
        // 'Counter',
      ]);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>1/2/4</Signal>
          </button>
        </Component>
      );
      (globalThis as any).log = [];
      await trigger(document.body, 'button', 'click');
      expect((globalThis as any).log).toEqual([
        'double',
        'quadruple',
        // not called with the optimizer
        // 'Counter',
      ]);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>2/4/8</Signal>
          </button>
        </Component>
      );
      (globalThis as any).log = [];
    });
  });

  describe(render.name + ': cleanup', () => {
    it('should execute cleanup visible task rerun on track', async () => {
      (globalThis as any).log = [] as string[];
      const Counter = component$(() => {
        const count = useSignal(0);
        useVisibleTask$(({ track }) => {
          const _count = track(() => count.value);
          (globalThis as any).log.push('visible task: ' + _count);
          return () => (globalThis as any).log.push('cleanup: ' + _count);
        });
        (globalThis as any).log.push('Counter: ' + count.value);
        return (
          <button
            onClick$={() => {
              count.value++;
            }}
          >
            {count.value}
          </button>
        );
      });

      const { vNode, document } = await render(<Counter />, { debug });
      if (render === ssrRenderToDom) {
        await trigger(document.body, 'button', 'qvisible');
      }
      expect((globalThis as any).log).toEqual(['Counter: 0', 'visible task: 0']);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>0</Signal>
          </button>
        </Component>
      );
      (globalThis as any).log = [];
      await trigger(document.body, 'button', 'click');
      // expect(log).toEqual(['cleanup: 0', 'task: 1', 'Counter: 1']);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>1</Signal>
          </button>
        </Component>
      );
      (globalThis as any).log = [];
      await trigger(document.body, 'button', 'click');
      expect((globalThis as any).log).toEqual(['Counter: 2', 'cleanup: 1', 'visible task: 2']);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Signal>2</Signal>
          </button>
        </Component>
      );
      (globalThis as any).log = undefined;
    });

    it('should execute cleanup visible task on unmount', async () => {
      (globalThis as any).log = [] as string[];
      const Child = component$(() => {
        useVisibleTask$(({ cleanup }) => {
          (globalThis as any).log.push('visible_task:');
          cleanup(() => (globalThis as any).log.push('cleanup:'));
        });
        (globalThis as any).log.push('Child');
        return <span>Child</span>;
      });
      const Parent = component$(() => {
        const show = useSignal(true);
        return (
          <button
            onClick$={() => {
              show.value = !show.value;
            }}
          >
            {show.value ? <Child /> : 'click'}
          </button>
        );
      });

      const { vNode, document } = await render(<Parent />, { debug });
      if (render === ssrRenderToDom) {
        // only if it is SSR do we need to trigger the qvisible event, in CSR visibleTasks run automatically
        await trigger(document.body, 'span', 'qvisible');
      }
      expect((globalThis as any).log).toEqual(['Child', 'visible_task:']);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Component>
              <span>Child</span>
            </Component>
          </button>
        </Component>
      );
      (globalThis as any).log = [];
      await trigger(document.body, 'button', 'click');

      expect((globalThis as any).log).toEqual(['cleanup:']);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>{'click'}</button>
        </Component>
      );
      (globalThis as any).log = [];
      await trigger(document.body, 'button', 'click');

      expect((globalThis as any).log).toEqual(['Child', 'visible_task:']);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <Component>
              <span>Child</span>
            </Component>
          </button>
        </Component>
      );
      (globalThis as any).log = [];
      await trigger(document.body, 'button', 'click');

      expect((globalThis as any).log).toEqual(['cleanup:']);
      expect(vNode).toMatchVDOM(
        <Component>
          <button>{'click'}</button>
        </Component>
      );
      (globalThis as any).log = undefined;
    });

    it('should handle promises and visible tasks', async () => {
      // vi.useFakeTimers();
      const MyComp = component$(() => {
        const promise = useSignal<Promise<number>>(Promise.resolve(0));

        useVisibleTask$(() => {
          promise.value = promise.value
            .then(() => {
              return delay(10);
            })
            .then(() => {
              return 1;
            });
        });

        useVisibleTask$(() => {
          promise.value = promise.value.then(() => {
            return 2;
          });
        });

        return <p>Should have a number: "{promise.value}"</p>;
      });
      const { vNode, document } = await render(<MyComp />, { debug });

      if (render === ssrRenderToDom) {
        await trigger(document.body, 'p', 'qvisible');
      }
      expect(vNode).toMatchVDOM(
        <Component>
          <p>
            Should have a number: "
            <Fragment>
              <Signal>{'2'}</Signal>
            </Fragment>
            "
          </p>
        </Component>
      );
    });
  });

  describe('ref', () => {
    it('should handle ref prop', async () => {
      const Cmp = component$(() => {
        const v = useSignal<Element>();
        useVisibleTask$(() => {
          v.value!.textContent = 'Abcd';
        });
        return <p ref={v}>Hello Qwik</p>;
      });

      const { document } = await render(<Cmp />, { debug });

      if (render === ssrRenderToDom) {
        await trigger(document.body, 'p', 'qvisible');
      }

      await expect(document.querySelector('p')).toMatchDOM(<p>Abcd</p>);
    });
  });

  describe('regression', () => {
    it('#1717 - custom hooks should work', async () => {
      const Issue1717 = component$(() => {
        const val1 = useDelay('valueA');
        const val2 = useDelay('valueB');
        return (
          <div>
            <p>{val1.value}</p>
            <p>{val2.value}</p>
          </div>
        );
      });

      const { vNode, document } = await render(<Issue1717 />, { debug });

      if (render === ssrRenderToDom) {
        await trigger(document.body, 'div', 'qvisible');
      }

      expect(vNode).toMatchVDOM(
        <Component>
          <div>
            <p>
              <Signal>{'valueA'}</Signal>
            </p>
            <p>
              <Signal>{'valueB'}</Signal>
            </p>
          </div>
        </Component>
      );
    });
  });
});