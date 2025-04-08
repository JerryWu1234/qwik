import { Link, routeLoader$ } from "@qwik.dev/router";
import { component$ } from "@qwik.dev/core";

let k = 1;
export const useRouteLoader = routeLoader$(() => {
  return k++;
});

export default component$(() => {
  const t = useRouteLoader();
  return (
    <div class="flex flex-col">
      <h1 class="text-2xl">Test route {t}</h1>
      <Link class="underline text-blue-600" href="/qwikrouter-test/testname/">
        Go to homepage
      </Link>
    </div>
  );
});
