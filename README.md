> **This repository is no longer actively maintained.** The source code has been moved to [browserbase/gtm-demos](https://github.com/browserbase/gtm-demos/tree/main/apps/cua-browser).

# CUA Browser

This is a playground for you to test, explore, and get inspired by the power of Browserbase and Open AI's Computer Use Agent. This is free and always will be! It's not a product, just a demo playground

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbrowserbase%2Fcua-browser&env=OPENAI_API_KEY,BROWSERBASE_API_KEY,BROWSERBASE_PROJECT_ID&envDescription=API%20keys%20needed%20to%20run%20CUA%20Browser&envLink=https%3A%2F%2Fgithub.com%2Fbrowserbase%2Fcua-browser%23environment-variables)

## Getting Started

This project uses TypeScript and requires Node.js. We recommend using Node.js version 14.x or later.

First, install the dependencies for this repository:

```bash
npm install
```

Next, copy the example environment variables:

```bash
cp .env.example .env.local
```

You'll need to set up your API keys:

1. Get your OpenAI API key from [OpenAI's dashboard](https://platform.openai.com/api-keys)
2. Get your Browserbase API key and project ID from [Browserbase](https://www.browserbase.com)

1. Clone this repository:
   ```bash
   git clone https://github.com/browserbase/cua-browser.git
   cd cua-browser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your API keys. You can get your API keys from [OpenAI](https://platform.openai.com/api-keys) and [Browserbase](https://www.browserbase.com)
   ```
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_ORG=your_openai_org_id (optional)
   BROWSERBASE_API_KEY=your_browserbase_api_key
   BROWSERBASE_PROJECT_ID=your_browserbase_project_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see CUA Browser in action. You can interact with the CUA Browser by typing natural language commands in the input field and observing the browser's actions in response.

## Usage

Here's a basic example of how to implement the Browserbase Compute Use Agent:

```typescript
import { Agent } from './app/api/agent/agent';
import { BrowserbaseBrowser } from './app/api/agent/browserbase';

async function main() {
  // Initialize the browser
  const browser = new BrowserbaseBrowser(1024, 768);
  await browser.connect();

  // Initialize the agent
  const agent = new Agent(
    "computer-use-preview",
    browser,
    (message) => {
      console.log(`Safety check: ${message}`);
      return true; // Acknowledge all safety checks
    }
  );

  // Prepare the input for the agent
  const inputItems = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Go to google.com and search for 'Browserbase'"
        }
      ]
    }
  ];

  // Get the action from the agent
  const { output, responseId } = await agent.getAction(inputItems, undefined);

  // Take the action
  const results = await agent.takeAction(output);

  // Print the results
  console.log("Action results:", results);

  // Store the response ID for potential future use
  agent.lastResponseId = responseId;

  // Disconnect the browser
  await browser.disconnect();
}

main().catch(console.error);
```

This example demonstrates how to:

1. Initialize the BrowserbaseBrowser with specific dimensions.
2. Create an Agent instance with the appropriate model and browser.
3. Prepare input items for the agent.
4. Get an action from the agent using the `getAction` method.
5. Execute the action using the `takeAction` method.
6. Handle the results of the action.
7. Store the response ID for potential future interactions.

Note that this example uses the `getAction` and `takeAction` methods separately, which allows for more granular control over the agent's behavior. You can expand on this basic example to create more complex interactions with the browser based on your specific use case.

## Files

- `agent.ts`: The main Agent class that handles interactions with the OpenAI API
- `base_playwright.ts`: Base class for Playwright-based browser automation
- `browserbase.ts`: Implementation of the Browserbase browser
- `utils.ts`: Utility functions for API calls and image handling
