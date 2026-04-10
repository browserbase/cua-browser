import { describe, expect, it, vi } from "vitest";
import { BasePlaywrightComputer } from "@/app/api/cua/agent/base_playwright";

class TestComputer extends BasePlaywrightComputer {
  public setPage(page: unknown) {
    this._page = page as never;
  }

  protected async _getBrowserAndPage() {
    throw new Error("not needed");
  }
}

describe("regression: key normalization", () => {
  it("normalizes model keys like ARROW_LEFT and ARROW_UP", async () => {
    const press = vi.fn();
    const computer = new TestComputer();
    computer.setPage({
      keyboard: {
        press,
      },
    });

    await computer.keypress(["ARROW_LEFT", "ARROW_UP"]);

    expect(press).toHaveBeenNthCalledWith(1, "ArrowLeft");
    expect(press).toHaveBeenNthCalledWith(2, "ArrowUp");
  });

  it("normalizes hotkeys with uppercase and underscores", async () => {
    const down = vi.fn();
    const press = vi.fn();
    const up = vi.fn();
    const computer = new TestComputer();
    computer.setPage({
      keyboard: {
        down,
        press,
        up,
      },
    });

    await computer.keypress(["CTRL", "ARROW_LEFT"]);

    expect(down).toHaveBeenCalledWith("Control");
    expect(press).toHaveBeenCalledWith("ArrowLeft");
    expect(up).toHaveBeenCalledWith("Control");
  });
});
