import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {},
  };
});

describe("regression: OpenAI computer tool shapes", () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("handles single-action shape from computer_call.action", async () => {
    const keypress = vi.fn();
    const screenshot = vi.fn().mockResolvedValue("test-screenshot");

    const { Agent } = await import("@/app/api/cua/agent/agent");
    const agent = new Agent(
      "gpt-5.4-mini",
      {
        keypress,
        screenshot,
      } as never
    );

    const result = await agent.takeComputerAction({
      type: "computer_call",
      id: "item_1",
      call_id: "call_1",
      action: {
        type: "keypress",
        keys: ["ARROW_UP"],
      },
    } as never);

    expect(keypress).toHaveBeenCalledWith(["ARROW_UP"]);
    expect(result.call_id).toBe("call_1");
    expect(result.output.image_url).toContain("test-screenshot");
  });

  it("handles multi-action shape from computer_call.actions", async () => {
    const click = vi.fn();
    const type = vi.fn();
    const screenshot = vi.fn().mockResolvedValue("test-screenshot");

    const { Agent } = await import("@/app/api/cua/agent/agent");
    const agent = new Agent(
      "gpt-5.4-mini",
      {
        click,
        type,
        screenshot,
      } as never
    );

    await agent.takeComputerAction({
      type: "computer_call",
      id: "item_2",
      call_id: "call_2",
      actions: [
        {
          type: "click",
          button: "left",
          x: 10,
          y: 20,
        },
        {
          type: "type",
          text: "hello",
        },
      ],
      pending_safety_checks: [],
    });

    expect(click).toHaveBeenCalledWith("left", 10, 20);
    expect(type).toHaveBeenCalledWith("hello");
  });
});
