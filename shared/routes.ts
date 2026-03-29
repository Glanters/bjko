import { z } from 'zod';
import { User, Staff, Leave, StaffPermission } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  unauthorized: z.object({ message: z.string() }),
  forbidden: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ user: z.custom<User>() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() })
      }
    }
  },
  leaves: {
    list: {
      method: 'GET' as const,
      path: '/api/leaves' as const,
      responses: {
        200: z.array(z.custom<Leave>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/leaves' as const,
      input: z.object({ staffId: z.number() }),
      responses: {
        201: z.custom<Leave>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    clockIn: {
      method: 'PATCH' as const,
      path: '/api/leaves/:id/clock-in' as const,
      input: z.object({}),
      responses: {
        200: z.custom<Leave>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/leaves/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/leaves/:id' as const,
      input: z.object({ clockInTime: z.string().nullable().optional() }),
      responses: {
        200: z.custom<Leave>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<User>()),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    updateIp: {
      method: 'PATCH' as const,
      path: '/api/users/:id/ip' as const,
      input: z.object({ allowedIp: z.string() }),
      responses: {
        200: z.custom<User>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    updatePassword: {
      method: 'PATCH' as const,
      path: '/api/users/:id/password' as const,
      input: z.object({ password: z.string().min(6) }),
      responses: {
        200: z.custom<User>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    updateUsername: {
      method: 'PATCH' as const,
      path: '/api/users/:id/username' as const,
      input: z.object({ username: z.string().min(1) }),
      responses: {
        200: z.custom<User>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    updateAvatar: {
      method: 'PATCH' as const,
      path: '/api/users/:id/avatar' as const,
      input: z.object({ avatarUrl: z.string() }),
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    bulkUpdateIp: {
      method: 'PATCH' as const,
      path: '/api/users/bulk-ip' as const,
      input: z.object({ allowedIp: z.string() }),
      responses: {
        200: z.object({ message: z.string(), updated: z.number() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    bulkUpdatePassword: {
      method: 'PATCH' as const,
      path: '/api/users/bulk-password' as const,
      input: z.object({ password: z.string().min(6) }),
      responses: {
        200: z.object({ message: z.string(), updated: z.number() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    bulkDeleteAgents: {
      method: 'DELETE' as const,
      path: '/api/users/bulk-agents' as const,
      responses: {
        200: z.object({ message: z.string(), deleted: z.number() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    }
  },
  staff: {
    list: {
      method: 'GET' as const,
      path: '/api/staff' as const,
      responses: {
        200: z.array(z.custom<Staff>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/staff' as const,
      input: z.object({
        name: z.string().min(1),
        jobdesk: z.string().min(1),
        shift: z.enum(["PAGI", "GANTUNG", "SORE", "MALAM"]).optional().default("PAGI"),
      }),
      responses: {
        201: z.custom<Staff>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    updateName: {
      method: 'PATCH' as const,
      path: '/api/staff/:id/name' as const,
      input: z.object({ name: z.string().min(1) }),
      responses: {
        200: z.custom<Staff>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/staff/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    bulkDeleteAll: {
      method: 'DELETE' as const,
      path: '/api/staff/bulk-all' as const,
      responses: {
        200: z.object({ message: z.string(), deleted: z.number() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    }
  },
  whitelist: {
    get: {
      method: 'GET' as const,
      path: '/api/whitelist' as const,
      responses: {
        200: z.object({ ips: z.array(z.string()) }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/whitelist' as const,
      input: z.object({ ips: z.array(z.string()) }),
      responses: {
        200: z.object({ ips: z.array(z.string()) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    }
  },
  jobdeskLimits: {
    get: {
      method: 'GET' as const,
      path: '/api/jobdesk-limits' as const,
      responses: {
        200: z.object({ limits: z.record(z.string(), z.number()) }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/jobdesk-limits' as const,
      input: z.object({ limits: z.record(z.string(), z.number()) }),
      responses: {
        200: z.object({ limits: z.record(z.string(), z.number()) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    }
  },
  permissions: {
    list: {
      method: 'GET' as const,
      path: '/api/permissions' as const,
      responses: {
        200: z.array(z.custom<StaffPermission>()),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/permissions/me' as const,
      responses: {
        200: z.custom<StaffPermission | null>(),
        401: errorSchemas.unauthorized,
      }
    },
    upsert: {
      method: 'POST' as const,
      path: '/api/permissions/:role' as const,
      input: z.object({
        canAddStaff: z.boolean(),
        allowedShifts: z.string(),
        allowedJobdesks: z.string(),
        canEditJobdesk: z.boolean().optional(),
        canDeleteStaff: z.boolean().optional(),
        canEditName: z.boolean().optional(),
        canEditPassword: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<StaffPermission>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/permissions/:role' as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
