import { beforeEach, describe, expect, it, vi } from "vitest";

const createSession = vi.fn();
const axiosGet = vi.fn();
const connectOverCDP = vi.fn();

vi.mock("@browserbasehq/sdk", () => {
  return {
    default: class MockBrowserbase {
      sessions = {
        create: createSession,
      };
    },
  };
});

vi.mock("axios", () => {
  return {
    default: {
      get: axiosGet,
    },
  };
});

vi.mock("playwright", () => {
  return {
    chromium: {
      connectOverCDP,
    },
  };
});

describe("integration: Browserbase startup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BROWSERBASE_API_KEY = "bb-api-key";
    process.env.BROWSERBASE_PROJECT_ID = "bb-project-id";
  });

  it("keeps critical session settings enabled when creating a session", async () => {
    const goto = vi.fn();
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue("about:blank"),
      goto,
      evaluate,
    };
    const context = {
      pages: vi.fn().mockReturnValue([page]),
      newPage: vi.fn(),
    };
    const browser = {
      contexts: vi.fn().mockReturnValue([context]),
      newContext: vi.fn(),
    };

    createSession.mockResolvedValue({
      connectUrl: "wss://browserbase/session",
    });
    connectOverCDP.mockResolvedValue(browser);

    const { BrowserbaseBrowser } = await import(
      "@/app/api/cua/agent/browserbase"
    );
    const computer = new BrowserbaseBrowser(1024, 768, "us-west-2", false);

    await (computer as never)._getBrowserAndPage();

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "bb-project-id",
        keepAlive: true,
        proxies: true,
        browserSettings: expect.objectContaining({
          advancedStealth: true,
          blockAds: true,
          viewport: {
            width: 1024,
            height: 768,
          },
        }),
      })
    );
  });

  it("bootstraps from about:blank for existing sessions", async () => {
    const goto = vi.fn();
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const page = {
      url: vi.fn().mockReturnValue("about:blank"),
      goto,
      evaluate,
    };
    const context = {
      pages: vi.fn().mockReturnValue([page]),
      newPage: vi.fn(),
    };
    const browser = {
      contexts: vi.fn().mockReturnValue([context]),
      newContext: vi.fn(),
    };

    axiosGet.mockResolvedValue({
      data: {
        connectUrl: "wss://browserbase/existing-session",
      },
    });
    connectOverCDP.mockResolvedValue(browser);

    const { BrowserbaseBrowser } = await import(
      "@/app/api/cua/agent/browserbase"
    );
    const computer = new BrowserbaseBrowser(
      1024,
      768,
      "us-west-2",
      false,
      "session_123"
    );

    await (computer as never)._getBrowserAndPage();

    expect(axiosGet).toHaveBeenCalledWith(
      "https://api.browserbase.com/v1/sessions/session_123",
      expect.objectContaining({
        headers: {
          "X-BB-API-Key": "bb-api-key",
        },
      })
    );
    expect(goto).toHaveBeenCalledWith("https://www.google.com", {
      waitUntil: "domcontentloaded",
    });
  });
});
