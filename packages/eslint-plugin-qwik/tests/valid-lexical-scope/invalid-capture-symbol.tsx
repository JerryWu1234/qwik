// Expect error: { "messageId": "referencesOutside" }
import { component$, useTask$ } from '@builder.io/qwik';

export const HelloWorld = component$(() => {
  const a = Symbol();
  useTask$(() => {
    console.log(a);
  });
  return <div></div>;
});
