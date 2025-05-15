import * as dotenv from "dotenv";
import { Browser, Page, chromium } from "playwright";
import { BasePlaywrightComputer } from "./base_playwright";
import Browserbase from "@browserbasehq/sdk";
import { SessionCreateResponse } from "@browserbasehq/sdk/resources/sessions/sessions.mjs";
import axios from "axios";

dotenv.config();

// Define a custom type that includes all necessary properties
interface BrowserbaseSession extends SessionCreateResponse {
  connectUrl: string;
}

// Define the type for session creation parameters
interface SessionCreateParams {
  projectId: string;
  browserSettings: {
    viewport: {
      width: number;
      height: number;
    };
    blockAds: boolean;
  };
  region: "us-west-2" | "us-east-1" | "eu-central-1" | "ap-southeast-1";
  proxies: boolean;
  keepAlive: boolean;
}

export class BrowserbaseBrowser extends BasePlaywrightComputer {
  /**
   * Browserbase is a headless browser platform that offers a remote browser API. You can use it to control thousands of browsers from anywhere.
   * With Browserbase, you can watch and control a browser in real-time, record and replay sessions, and use built-in proxies for more reliable browsing.
   * You can find more information about Browserbase at https://docs.browserbase.com/ or view our OpenAI CUA Quickstart at https://docs.browserbase.com/integrations/openai-cua/introduction.
   */

  private bb: Browserbase;
  private projectId: string;
  private session: BrowserbaseSession | null = null;
  private region: string;
  private proxies: boolean;
  private sessionId: string | null;

  constructor(
    width: number = 1024,
    height: number = 768,
    region: string = "us-east-1",
    proxies: boolean = true,
    sessionId: string | null = null
  ) {
    /**
     * Initialize the Browserbase instance. Additional configuration options for features such as persistent cookies, ad blockers, file downloads and more can be found in the Browserbase API documentation: https://docs.browserbase.com/reference/api/create-a-session
     *
     * @param width - The width of the browser viewport. Default is 1024.
     * @param height - The height of the browser viewport. Default is 768.
     * @param region - The region for the Browserbase session. Default is "us-west-2". Pick a region close to you for better performance. https://docs.browserbase.com/guides/multi-region
     * @param proxies - Whether to use a proxy for the session. Default is False. Turn on proxies if you're browsing is frequently interrupted. https://docs.browserbase.com/features/proxies
     * @param sessionId - Optional. If provided, use an existing session instead of creating a new one.
     */
    super();
    // We're using a dynamic import here as a workaround since we don't have the actual types
    // In a real project, you would install the proper types and import correctly
    this.bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY});
    this.projectId = process.env.BROWSERBASE_PROJECT_ID!;
    this.session = null;
    this.dimensions = [width, height];
    this.region = region;
    this.proxies = proxies;
    this.sessionId = sessionId;
  }

  protected async _getBrowserAndPage(): Promise<[Browser, Page]> {
    /**
     * Create a Browserbase session and connect to it, or connect to an existing session if a session ID is provided.
     *
     * @returns A tuple containing the connected browser and page objects.
     */
    if (this.sessionId) {
      // TODO: replace with this when we ship connectUrl via session GET to the SDK
      const response = await axios.get(
        `https://api.browserbase.com/v1/sessions/${this.sessionId}`,
        {
          headers: {
            "X-BB-API-Key": process.env.BROWSERBASE_API_KEY,
          },
        }
      );
      this.session = {
        connectUrl: response.data.connectUrl,
      } as unknown as BrowserbaseSession;
    } else {
      // Create a new session on Browserbase with specified parameters
      const [width, height] = this.dimensions;
      const sessionParams: SessionCreateParams = {
        projectId: this.projectId,
        browserSettings: {
          blockAds: true,
          viewport: {
            width,
            height,
          },
        },
        region: this.region as
          | "us-west-2"
          | "us-east-1"
          | "eu-central-1"
          | "ap-southeast-1",
        proxies: true,
        keepAlive: true,
      };

      this.session = (await this.bb.sessions.create(
        sessionParams
      )) as unknown as BrowserbaseSession;
    }

    if (!this.session) {
      throw new Error("Failed to create or retrieve session");
    }

    // Connect to the remote session
    const browser = await chromium.connectOverCDP(this.session.connectUrl, {
      timeout: 1000 * 60,
    });
    const context = browser.contexts()[0];
    // Inject inline cursor-rendering script globally for every page
    const pages = context.pages();
    const page = pages[pages.length - 1];
    page
      .evaluate(() => {
        const CURSOR_ID = "__cursor__";

        // Check if cursor element already exists
        if (document.getElementById(CURSOR_ID)) return;

        const cursor = document.createElement("div");
        cursor.id = CURSOR_ID;
        Object.assign(cursor.style, {
          position: "fixed",
          top: "0px",
          left: "0px",
          width: "20px",
          height: "20px",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='1' stroke-linejoin='round' stroke-linecap='round'><polygon points='2,2 2,22 8,16 14,22 17,19 11,13 20,13'/></svg>\")",
          backgroundSize: "cover",
          pointerEvents: "none",
          zIndex: "99999",
          transform: "translate(-2px, -2px)",
        });

        document.body.appendChild(cursor);

        document.addEventListener("mousemove", (e) => {
          cursor.style.top = `${e.clientY}px`;
          cursor.style.left = `${e.clientX}px`;
        });
        document.addEventListener("mousedown", (e) => {
          cursor.style.top = `${e.clientY}px`;
          cursor.style.left = `${e.clientX}px`;
        });
      })
      .catch((error) => {
        console.error("Error injecting cursor-rendering script:", error);
      });

    // Only navigate to Google if it's a new session
    if (!this.sessionId) {
      await page.goto("https://www.google.com");
    }

    return [browser, page];
  }

  async disconnect(): Promise<void> {
    /**
     * Clean up resources when exiting the context manager.
     */
    /*if (this._page) {
      await this._page.close();
    }
    if (this._browser) {
      await this._browser.close();
    }
    
    if (this.session) {
      console.log(`Session completed. View replay at https://browserbase.com/sessions/${this.session.id}`);
    }*/
  }

  async screenshot(): Promise<string> {
    /**
     * Capture a screenshot of the current viewport using CDP.
     *
     * @returns A base64 encoded string of the screenshot.
     */
    if (!this._page) {
      throw new Error("Page not initialized");
    }

    try {
      // Get CDP session from the page
      const cdpSession = await this._page.context().newCDPSession(this._page);

      // Capture screenshot using CDP
      const { data } = await cdpSession.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
      });

      return data; // CDP already returns base64 encoded string
    } catch (error) {
      console.warn(
        "CDP screenshot failed, falling back to standard screenshot:",
        error
      );
      // Fall back to standard Playwright screenshot
      const buffer = await this._page.screenshot({ type: "png" });
      return buffer.toString("base64");
    }
  }

  async refresh(): Promise<void> {
    /**
     * Refresh the current page.
     */
    if (!this._page) {
      throw new Error("Page not initialized");
    }

    await this._page.reload();
  }

  async listTabs(): Promise<string[]> {
    /**
     * Get the list of tabs, including the current tab.
     */
    if (!this._page) {
      throw new Error("Page not initialized");
    }

    const tabs = await this._page.context().pages();
    const tabUrls = tabs.map((tab) => tab.url());
    const currentTab = this._page.url();
    return [...tabUrls, currentTab];
  }

  async changeTab(tabUrl: string): Promise<void> {
    /**
     * Change to a specific tab.
     */
    if (!this._page) {
      throw new Error("Page not initialized");
    }

    const tabs = await this._page.context().pages();
    const tab = tabs.find((t) => t.url() === tabUrl);
    if (!tab) {
      throw new Error(`Tab with URL ${tabUrl} not found`);
    }
    await tab.bringToFront();
    this._page = tab;
  }
}
