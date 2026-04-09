import { NextResponse } from "next/server";
import { Agent } from "../../agent/agent";
import { BrowserbaseBrowser } from "../../agent/browserbase";
import { ComputerToolCall } from "../../agent/types";

export async function POST(request: Request) {
  let computer: BrowserbaseBrowser | null = null;
  let agent: Agent | null = null;

  try {
    const body = await request.json();
    const { sessionId, responseId, input } = body;
    console.log("input", input);

    computer = new BrowserbaseBrowser(1024, 768, "us-west-2", false, sessionId);
    agent = new Agent("gpt-5.4-mini", computer);
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId in request body" },
        { status: 400 }
      );
    }

    let result = await agent.getAction(input, responseId);

    // If there's a screenshot returned, just handle it right here so we don't have to make a round trip.
    if (result.output.find((item) => item.type === "computer_call")) {
      const computerCall = result.output.find(
        (item) => item.type === "computer_call"
      ) as ComputerToolCall;
      const actions =
        computerCall.actions && computerCall.actions.length > 0
          ? computerCall.actions
          : computerCall.action
            ? [computerCall.action]
            : [];

      if (actions.length === 1 && actions[0].type === "screenshot") {
        await computer.connect();

        const screenshotAction = await agent.takeAction(result.output);
        result = await agent.getAction(
          screenshotAction.filter((item) => item.type != "message"),
          result.responseId
        );
      }
    }

    // If the generated action is only reasoning, let's request a real action.
    if (
      result.output.length == 1 &&
      result.output.find((item) => item.type === "reasoning")
    ) {
      do {
        result = await agent.getAction(
          [
            {
            role: "user",
            content: "Please continue with the task.",
          },
        ],
          result.responseId
        );
      } while (result.output.length == 1 && result.output.find((item) => item.type === "reasoning"));
    }

    return NextResponse.json([result]);
  } catch (error) {
    console.error("Error in cua endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
