import { NextResponse } from 'next/server';
import { Agent } from '../../agent/agent';
import { BrowserbaseBrowser } from '../../agent/browserbase';

export async function POST(request: Request) {
  let computer: BrowserbaseBrowser | null = null;
  let agent: Agent | null = null;

  try {
    const body = await request.json();
    const { sessionId, output } = body;
    console.log("output", output);

    computer = new BrowserbaseBrowser(1024, 768, "us-west-2", false, sessionId);
    agent = new Agent("gpt-5.4-mini", computer);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId in request body' },
        { status: 400 }
      );
    }

    await computer.connect();

    const result = await agent.takeAction(output.output);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in cua endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
