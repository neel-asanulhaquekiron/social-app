// Env the app validates at import time. No real credentials are needed —
// every Supabase call is mocked in the suites.
process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.LOG_LEVEL = "silent";
