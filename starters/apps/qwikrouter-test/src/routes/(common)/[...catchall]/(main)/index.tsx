import { Homepage } from "./homepage";
import { component$ } from "@qwik.dev/core";
import { type DocumentHead } from "@qwik.dev/router";

export default component$(() => {
  return <Homepage />;
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
