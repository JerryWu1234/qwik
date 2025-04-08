import { component$ } from "@qwik.dev/core";

import { Link } from "@qwik.dev/router";

export const Homepage = component$(() => {
  return (
    <div class="flex flex-col">
      <h1 class="text-2xl">Homepage 👋</h1>
      <Link class="underline text-blue-600" href="/qwikrouter-test/test">
        Go to Serbian test route
      </Link>
    </div>
  );
});
