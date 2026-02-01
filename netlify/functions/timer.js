const { getStore } = require("@netlify/blobs");

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

function makeInitialState() {
  return {
    targetTime: Date.now() + 4 * 60 * 60 * 1000,
    tableData: defaultTable(),
  };
}

async function readState(store) {
  const raw = await store.get(KEY, { type: "text" });

  if (!raw) {
    const init = makeInitialState();
    await store.set(KEY, JSON.stringify(init));
    return init;
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.targetTime !== "number" || !Array.isArray(parsed?.tableData)) {
      throw new Error("invalid shape");
    }
    return parsed;
  } catch (e) {
    const init = makeInitialState();
    await store.set(KEY, JSON.stringify(init));
    return init;
  }
}

async function writeState(store, state) {
  await store.set(KEY, JSON.stringify(state));
}

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);

  if (event.httpMethod === "GET") {
    const state = await readState(store);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    };
  }

  if (event.httpMethod === "POST") {
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      body = {};
    }

    const { pin, newTarget, newTable } = body;

    if (pin !== ADMIN_PIN) {
      return { statusCode: 403, body: "PIN salah" };
    }

    const state = await readState(store);

    if (typeof newTarget === "number" && Number.isFinite(newTarget)) {
      state.targetTime = newTarget;
    }

    if (Array.isArray(newTable)) {
      state.tableData = newTable.map((r) => ({
        user: String(r.user || ""),
        bonus: Number(r.bonus) || 0,
        kode: String(r.kode || ""),
      }));
    }

    await writeState(store, state);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
