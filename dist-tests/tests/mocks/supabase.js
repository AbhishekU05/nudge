"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockSupabaseClient = void 0;
exports.createSupabaseServerClient = createSupabaseServerClient;
exports.createSupabaseAdminClient = createSupabaseAdminClient;
const store_1 = require("./store");
class MockQueryBuilder {
    constructor(table) {
        this.isSingle = false;
        this.isMaybeSingle = false;
        this.table = table;
        this.filters = [];
    }
    select(columns, options) {
        if (options && options.count) {
            this.countOption = options.count;
        }
        return this;
    }
    insert(values) {
        const list = Array.isArray(values) ? values : [values];
        if (!store_1.mockStore.database[this.table]) {
            store_1.mockStore.database[this.table] = [];
        }
        const inserted = [];
        for (const val of list) {
            const row = {
                id: Math.random().toString(36).substring(7),
                created_at: new Date().toISOString(),
                ...val,
            };
            store_1.mockStore.database[this.table].push(row);
            inserted.push(row);
        }
        store_1.mockStore.history.push({ type: "insert", table: this.table, values: list });
        const promise = Promise.resolve({ data: Array.isArray(values) ? inserted : inserted[0], error: null });
        return Object.assign(promise, {
            select: () => {
                return Object.assign(Promise.resolve({ data: Array.isArray(values) ? inserted : inserted[0], error: null }), {
                    single: () => Promise.resolve({ data: inserted[0], error: null }),
                    maybeSingle: () => Promise.resolve({ data: inserted[0], error: null }),
                });
            },
            single: () => Promise.resolve({ data: inserted[0], error: null }),
            maybeSingle: () => Promise.resolve({ data: inserted[0], error: null }),
        });
    }
    update(values) {
        store_1.mockStore.history.push({ type: "update", table: this.table, values, filters: [...this.filters] });
        let rows = store_1.mockStore.database[this.table] || [];
        const updatedRows = [];
        for (const row of rows) {
            let match = true;
            for (const filter of this.filters) {
                if (filter.op === "eq" && row[filter.col] !== filter.val)
                    match = false;
            }
            if (match) {
                Object.assign(row, values);
                updatedRows.push(row);
            }
        }
        const result = { data: updatedRows, error: null };
        const promise = Promise.resolve(result);
        return Object.assign(promise, {
            select: () => Object.assign(Promise.resolve(result), {
                single: () => Promise.resolve({ data: updatedRows[0], error: null }),
                maybeSingle: () => Promise.resolve({ data: updatedRows[0], error: null }),
            }),
            single: () => Promise.resolve({ data: updatedRows[0], error: null }),
            maybeSingle: () => Promise.resolve({ data: updatedRows[0], error: null }),
            eq: (col, val) => { this.eq(col, val); return this; },
        });
    }
    delete() {
        store_1.mockStore.history.push({ type: "delete", table: this.table, filters: [...this.filters] });
        let rows = store_1.mockStore.database[this.table] || [];
        const remaining = [];
        const deleted = [];
        for (const row of rows) {
            let match = true;
            for (const filter of this.filters) {
                if (filter.op === "eq" && row[filter.col] !== filter.val)
                    match = false;
            }
            if (match) {
                deleted.push(row);
            }
            else {
                remaining.push(row);
            }
        }
        store_1.mockStore.database[this.table] = remaining;
        return Promise.resolve({ data: deleted, error: null });
    }
    eq(col, val) {
        this.filters.push({ col, op: "eq", val });
        return this;
    }
    neq(col, val) {
        this.filters.push({ col, op: "neq", val });
        return this;
    }
    gte(col, val) {
        this.filters.push({ col, op: "gte", val });
        return this;
    }
    lte(col, val) {
        this.filters.push({ col, op: "lte", val });
        return this;
    }
    is(col, val) {
        this.filters.push({ col, op: "is", val });
        return this;
    }
    in(col, val) {
        this.filters.push({ col, op: "in", val });
        return this;
    }
    order(col, options) {
        this.orderCol = col;
        this.orderDesc = options?.ascending === false;
        return this;
    }
    limit(count) {
        this.limitCount = count;
        return this;
    }
    single() {
        this.isSingle = true;
        return this;
    }
    maybeSingle() {
        this.isMaybeSingle = true;
        return this;
    }
    then(onfulfilled, onrejected) {
        store_1.mockStore.history.push({ type: "select", table: this.table, filters: [...this.filters] });
        let rows = store_1.mockStore.database[this.table] || [];
        for (const filter of this.filters) {
            rows = rows.filter((row) => {
                if (filter.op === "eq")
                    return row[filter.col] === filter.val;
                if (filter.op === "neq")
                    return row[filter.col] !== filter.val;
                if (filter.op === "gte")
                    return new Date(row[filter.col]) >= new Date(filter.val);
                if (filter.op === "lte")
                    return new Date(row[filter.col]) <= new Date(filter.val);
                if (filter.op === "is")
                    return row[filter.col] === filter.val;
                if (filter.op === "in")
                    return filter.val.includes(row[filter.col]);
                return true;
            });
        }
        if (this.orderCol) {
            rows.sort((a, b) => {
                const valA = a[this.orderCol];
                const valB = b[this.orderCol];
                if (valA < valB)
                    return this.orderDesc ? 1 : -1;
                if (valA > valB)
                    return this.orderDesc ? -1 : 1;
                return 0;
            });
        }
        if (this.limitCount !== undefined) {
            rows = rows.slice(0, this.limitCount);
        }
        let data = rows;
        if (this.isSingle) {
            data = rows[0] || null;
        }
        else if (this.isMaybeSingle) {
            data = rows[0] || null;
        }
        const result = { data, error: null };
        if (this.countOption === "exact") {
            result.count = rows.length;
        }
        if (store_1.mockStore.dbErrors[this.table]) {
            result.error = store_1.mockStore.dbErrors[this.table];
            result.data = null;
        }
        return Promise.resolve(result).then(onfulfilled, onrejected);
    }
}
exports.mockSupabaseClient = {
    auth: {
        signUp: async (params) => {
            store_1.mockStore.history.push({ type: "signUp", params });
            if (store_1.mockStore.signUpError) {
                return { data: { user: null, session: null }, error: store_1.mockStore.signUpError };
            }
            const user = {
                id: "mock-user-id-" + Math.random().toString(36).substring(7),
                email: params.email,
                user_metadata: params.options?.data || {},
                identities: [{}],
            };
            store_1.mockStore.supabaseAuthUsers.push(user);
            return { data: { user, session: { access_token: "mock-token" } }, error: null };
        },
        signInWithPassword: async (params) => {
            store_1.mockStore.history.push({ type: "signInWithPassword", params });
            if (store_1.mockStore.signInError) {
                return { data: { user: null, session: null }, error: store_1.mockStore.signInError };
            }
            // find user in list
            const user = store_1.mockStore.supabaseAuthUsers.find(u => u.email === params.email) || {
                id: "mock-user-id",
                email: params.email,
                user_metadata: {},
            };
            store_1.mockStore.currentUser = user;
            return { data: { user, session: { access_token: "mock-token" } }, error: null };
        },
        signOut: async () => {
            store_1.mockStore.history.push({ type: "signOut" });
            store_1.mockStore.currentUser = null;
            return { error: null };
        },
        signInWithOAuth: async (params) => {
            store_1.mockStore.history.push({ type: "signInWithOAuth", params });
            if (store_1.mockStore.signInError) {
                return { data: { url: null }, error: store_1.mockStore.signInError };
            }
            return { data: { url: "https://google.com/oauth" }, error: null };
        },
        getUser: async () => {
            store_1.mockStore.history.push({ type: "getUser" });
            return { data: { user: store_1.mockStore.currentUser }, error: null };
        },
        updateUser: async (params) => {
            store_1.mockStore.history.push({ type: "updateUser", params });
            if (store_1.mockStore.updateUserError) {
                return { data: { user: null }, error: store_1.mockStore.updateUserError };
            }
            if (store_1.mockStore.currentUser) {
                store_1.mockStore.currentUser.user_metadata = {
                    ...store_1.mockStore.currentUser.user_metadata,
                    ...params.data,
                };
            }
            return { data: { user: store_1.mockStore.currentUser }, error: null };
        },
        resetPasswordForEmail: async (email, options) => {
            store_1.mockStore.history.push({ type: "resetPasswordForEmail", email, options });
            if (store_1.mockStore.resetPasswordError) {
                return { error: store_1.mockStore.resetPasswordError };
            }
            return { data: {}, error: null };
        },
        admin: {
            listUsers: async (params) => {
                store_1.mockStore.history.push({ type: "listUsers", params });
                const users = store_1.mockStore.supabaseAuthUsers;
                return { data: { users }, error: null };
            },
        },
    },
    from: (table) => {
        return new MockQueryBuilder(table);
    },
};
function createSupabaseServerClient() {
    return Promise.resolve(exports.mockSupabaseClient);
}
function createSupabaseAdminClient() {
    return exports.mockSupabaseClient;
}
