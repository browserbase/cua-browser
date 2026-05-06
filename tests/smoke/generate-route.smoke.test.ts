import { describe, expect, it, vi } from "vitest";

const connect = vi.fn();
const getAction = vi.fn();
const takeAction = vi.fn();

vi.mock("@/app/api/cua/agent/browserbase", () => {
  return {
    BrowserbaseBrowser: class MockBrowserbaseBrowser {
      connect = connect;
    },
  };
});

vi.mock("@/app/api/cua/agent/agent", () => {
  return {
    Agent: class MockAgent {
      getAction = getAction;
      takeAction = takeAction;
    },
  };
});

describe("smoke: /api/cua/step/generate", () => {
  it("handles screenshot-first output and returns follow-up action", async () => {
    getAction
      .mockResolvedValueOnce({
        output: [
          {
            type: "computer_call",
            id: "item_1",
            call_id: "call_1",
            action: {
              type: "screenshot",
            },
          },
        ],
        responseId: "resp_1",
      })
      .mockResolvedValueOnce({
        output: [
          {
            type: "message",
            id: "item_2",
            role: "assistant",
            content: [],
          },
        ],
        responseId: "resp_2",
      });
    takeAction.mockResolvedValue([
      {
        type: "computer_call_output",
        call_id: "call_1",
        acknowledged_safety_checks: [],
        output: {
          type: "computer_screenshot",
          image_url: "data:image/png;base64,screenshot",
        },
      },
    ]);

    const { POST } = await import("@/app/api/cua/step/generate/route");
    const response = await POST(
      new Request("http://localhost/api/cua/step/generate", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "session_123",
          responseId: "resp_0",
          input: [
            {
              role: "user",
              content: "continue",
            },
          ],
        }),
      })
    );
    const payload = await response.json();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(takeAction).toHaveBeenCalledTimes(1);
    expect(getAction).toHaveBeenCalledTimes(2);
    expect(payload).toEqual([
      {
        output: [
          {
            type: "message",
            id: "item_2",
            role: "assistant",
            content: [],
          },
        ],
        responseId: "resp_2",
      },
    ]);
  });
});
