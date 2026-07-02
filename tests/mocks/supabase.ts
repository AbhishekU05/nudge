import { mockStore } from "./store";

class MockQueryBuilder {
  table: string;
  filters: Array<{ col: string; op: string; val: any }>;
  limitCount?: number;
  orderCol?: string;
  orderDesc?: boolean;
  isSingle = false;
  isMaybeSingle = false;
  countOption?: string;

  constructor(table: string) {
    this.table = table;
    this.filters = [];
  }

  select(columns?: string, options?: any) {
    if (options && options.count) {
      this.countOption = options.count;
    }
    return this;
  }

  insert(values: any) {
    const list = Array.isArray(values) ? values : [values];
    if (!mockStore.database[this.table]) {
      mockStore.database[this.table] = [];
    }
    const inserted: any[] = [];
    for (const val of list) {
      const row = {
        id: Math.random().toString(36).substring(7),
        created_at: new Date().toISOString(),
        ...val,
      };
      mockStore.database[this.table].push(row);
      inserted.push(row);
    }
    mockStore.history.push({ type: "insert", table: this.table, values: list });

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

  update(values: any) {
    mockStore.history.push({ type: "update", table: this.table, values, filters: [...this.filters] });

    let rows = mockStore.database[this.table] || [];
    const updatedRows: any[] = [];
    for (const row of rows) {
      let match = true;
      for (const filter of this.filters) {
        if (filter.op === "eq" && row[filter.col] !== filter.val) match = false;
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
      eq: (col: string, val: any) => { this.eq(col, val); return this; },
    });
  }

  delete() {
    mockStore.history.push({ type: "delete", table: this.table, filters: [...this.filters] });
    let rows = mockStore.database[this.table] || [];
    const remaining: any[] = [];
    const deleted: any[] = [];
    for (const row of rows) {
      let match = true;
      for (const filter of this.filters) {
        if (filter.op === "eq" && row[filter.col] !== filter.val) match = false;
      }
      if (match) {
        deleted.push(row);
      } else {
        remaining.push(row);
      }
    }
    mockStore.database[this.table] = remaining;
    return Promise.resolve({ data: deleted, error: null });
  }

  eq(col: string, val: any) {
    this.filters.push({ col, op: "eq", val });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ col, op: "neq", val });
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push({ col, op: "gte", val });
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push({ col, op: "lte", val });
    return this;
  }

  is(col: string, val: any) {
    this.filters.push({ col, op: "is", val });
    return this;
  }

  in(col: string, val: any[]) {
    this.filters.push({ col, op: "in", val });
    return this;
  }

  order(col: string, options?: any) {
    this.orderCol = col;
    this.orderDesc = options?.ascending === false;
    return this;
  }

  limit(count: number) {
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

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    mockStore.history.push({ type: "select", table: this.table, filters: [...this.filters] });
    let rows = mockStore.database[this.table] || [];

    for (const filter of this.filters) {
      rows = rows.filter((row) => {
        if (filter.op === "eq") return row[filter.col] === filter.val;
        if (filter.op === "neq") return row[filter.col] !== filter.val;
        if (filter.op === "gte") return new Date(row[filter.col]) >= new Date(filter.val);
        if (filter.op === "lte") return new Date(row[filter.col]) <= new Date(filter.val);
        if (filter.op === "is") return row[filter.col] === filter.val;
        if (filter.op === "in") return filter.val.includes(row[filter.col]);
        return true;
      });
    }

    if (this.orderCol) {
      rows.sort((a, b) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA < valB) return this.orderDesc ? 1 : -1;
        if (valA > valB) return this.orderDesc ? -1 : 1;
        return 0;
      });
    }

    if (this.limitCount !== undefined) {
      rows = rows.slice(0, this.limitCount);
    }

    let data: any = rows;
    if (this.isSingle) {
      data = rows[0] || null;
    } else if (this.isMaybeSingle) {
      data = rows[0] || null;
    }

    const result: any = { data, error: null };
    if (this.countOption === "exact") {
      result.count = rows.length;
    }

    if (mockStore.dbErrors[this.table]) {
      result.error = mockStore.dbErrors[this.table];
      result.data = null;
    }

    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

export const mockSupabaseClient = {
  auth: {
    signUp: async (params: any) => {
      mockStore.history.push({ type: "signUp", params });
      if (mockStore.signUpError) {
        return { data: { user: null, session: null }, error: mockStore.signUpError };
      }
      const user = {
        id: "mock-user-id-" + Math.random().toString(36).substring(7),
        email: params.email,
        user_metadata: params.options?.data || {},
        identities: [{}],
      };
      mockStore.supabaseAuthUsers.push(user);
      return { data: { user, session: { access_token: "mock-token" } }, error: null };
    },
    signInWithPassword: async (params: any) => {
      mockStore.history.push({ type: "signInWithPassword", params });
      if (mockStore.signInError) {
        return { data: { user: null, session: null }, error: mockStore.signInError };
      }
      // find user in list
      const user = mockStore.supabaseAuthUsers.find(u => u.email === params.email) || {
        id: "mock-user-id",
        email: params.email,
        user_metadata: {},
      };
      mockStore.currentUser = user;
      return { data: { user, session: { access_token: "mock-token" } }, error: null };
    },
    signOut: async () => {
      mockStore.history.push({ type: "signOut" });
      mockStore.currentUser = null;
      return { error: null };
    },
    signInWithOAuth: async (params: any) => {
      mockStore.history.push({ type: "signInWithOAuth", params });
      if (mockStore.signInError) {
        return { data: { url: null }, error: mockStore.signInError };
      }
      return { data: { url: "https://google.com/oauth" }, error: null };
    },
    getUser: async () => {
      mockStore.history.push({ type: "getUser" });
      return { data: { user: mockStore.currentUser }, error: null };
    },
    updateUser: async (params: any) => {
      mockStore.history.push({ type: "updateUser", params });
      if (mockStore.updateUserError) {
        return { data: { user: null }, error: mockStore.updateUserError };
      }
      if (mockStore.currentUser) {
        mockStore.currentUser.user_metadata = {
          ...mockStore.currentUser.user_metadata,
          ...params.data,
        };
      }
      return { data: { user: mockStore.currentUser }, error: null };
    },
    resetPasswordForEmail: async (email: string, options: any) => {
      mockStore.history.push({ type: "resetPasswordForEmail", email, options });
      if (mockStore.resetPasswordError) {
        return { error: mockStore.resetPasswordError };
      }
      return { data: {}, error: null };
    },
    admin: {
      listUsers: async (params: any) => {
        mockStore.history.push({ type: "listUsers", params });
        const users = mockStore.supabaseAuthUsers;
        return { data: { users }, error: null };
      },
    },
  },
  from: (table: string) => {
    return new MockQueryBuilder(table);
  },
};

export function createSupabaseServerClient() {
  return Promise.resolve(mockSupabaseClient);
}

export function createSupabaseAdminClient() {
  return mockSupabaseClient;
}
