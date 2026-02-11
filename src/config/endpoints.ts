export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        SIGNUP: '/auth/signup',
        ME: '/auth/me',
        UPDATE_PROFILE: '/auth/profile',
        UPDATE_PASSWORD: '/auth/password',
        UPDATE_PUSH_TOKEN: '/auth/push-token',
    },
    BINS: {
        TYPES: '/bins/types',
        SIZES: (typeId: number) => `/bins/sizes?binTypeId=${typeId}`,
        PHYSICAL: '/bins/physical',
        UPDATE_PHYSICAL: (id: number) => `/bins/physical/${id}`,
    },
    BOOKINGS: {
        CREATE: '/bookings',
        MY_REQUESTS: '/bookings/my-requests',
        SUPPLIER_REQUESTS: '/bookings/supplier/requests',
        PENDING: '/bookings/supplier/pending',
        ACCEPT: (id: string) => `/bookings/${id}/accept`,
        UPDATE_STATUS: (id: string) => `/bookings/${id}/status`,
        ORDER_ITEMS: (id: string) => `/bookings/${id}/order-items`,
        MARK_READY: (id: string) => `/bookings/${id}/ready-to-pickup`,
    },
    USER: {
        PROFILE: '/auth/me', // Same as ME in many cases but can be different
        UPDATE_PROFILE: '/user/profile', // hypothetical
    },
    SYSTEM: {
        SETTINGS: '/system-settings',
    },
    WALLET: {
        GET: '/wallet',
        TRANSACTIONS: '/wallet/transactions',
        REQUEST_PAYOUT: '/wallet/payout',
        MY_PAYOUTS: '/wallet/payouts',
    },
    SUPPLIER: {
        AVAILABILITY: '/supplier/availability',
        SERVICE_AREAS: '/supplier/service-areas',
    }
};
