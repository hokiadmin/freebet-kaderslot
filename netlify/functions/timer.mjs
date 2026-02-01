import { getStore } from "@netlify/blobs";

const STORE_NAME = "tianslot";
const KEY = "state";
const ADMIN_PIN = "378378";

function defaultTable() {
  return Array.from({ length: 50 }, (_, i) => {
    const bonus = 1755000 - i * 30000;
    return {
      user: "user" + (i + 1),
      bonus,
      kode: "TS" + Math.floor(bonus / 1000),
    };
  });
}

async function getState(store) {
  const state = await store.get(KEY, { type: "json" });
  if (state) return state;

  const init = {
    targetTime: Date.now() + 4 * 60 * 60 * 1000,
    tableData: defaultTable(),
  };
  await store.set(KEY, init);
  return init;
}

export default async (req, context) => {
  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    const state = await getState(store);
    return new Response(JSON.stringify(state), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const { pin, newTarget, newTable } = body;

    if (pin !== ADMIN_PIN) return new Response("PIN salah", { status: 403 });

    const state = await getState(store);
    if (typeof newTarget === "number") state.targetTime = newTarget;
    if (Array.isArray(newTable)) state.tableData = newTable;

    await store.set(KEY, state);

    return new Response(JSON.stringify(state), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};
