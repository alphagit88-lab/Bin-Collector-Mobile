export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        SIGNUP: '/auth/signup',
        ME: '/auth/me',
        UPDATE_PROFILE: '/auth/profile',
        UPDATE_PASSWORD: '/auth/password',
    },
    BINS: {
        TYPES: '/bins/types',
        SIZES: (typeId: number) => `/bins/sizes?binTypeId=${typeId}`,
    },
    BOOKINGS: {
        CREATE: '/bookings',
        MY_REQUESTS: '/bookings/my-requests',
        SUPPLIER_REQUESTS: '/bookings/supplier',
        PENDING: '/bookings/pending',
        ACCEPT: (id: string) => `/bookings/${id}/accept`,
        UPDATE_STATUS: (id: string) => `/bookings/${id}/status`,
        ORDER_ITEMS: (id: string) => `/bookings/${id}/items`,
        MARK_READY: (id: string) => `/bookings/${id}/ready`,
    },
    USER: {
        PROFILE: '/auth/me', // Same as ME in many cases but can be different
        UPDATE_PROFILE: '/user/profile', // hypothetical
    },
    SYSTEM: {
        SETTINGS: '/system-settings',
    }
};
