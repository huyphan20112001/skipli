process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error";

const originalConsole = { ...console };

beforeAll(() => {
  if (process.env.SUPPRESS_TEST_LOGS === "true") {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  if (process.env.SUPPRESS_TEST_LOGS === "true") {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
});

jest.setTimeout(30000);
