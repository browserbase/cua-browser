# Agent Browser

> WELCOME!
> This is a proof of concept. 
> This is a playground for you to test, explore, and get inspired by the power of Browserbase and Open AI’s Computer Use Agent. This is free and always will be! It’s not a product, just a demo playground. We strongly recommend you check out both [Browserbase](https://www.browserbase.com) and our open source project [Stagehand](https://www.stagehand.dev) to build your own web agent.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbrowserbase%2Fcua-browser&env=OPENAI_API_KEY,BROWSERBASE_API_KEY,BROWSERBASE_PROJECT_ID&envDescription=API%20keys%20needed%20to%20run%20CUA%20Browser&envLink=https%3A%2F%2Fgithub.com%2Fbrowserbase%2Fcua-browser%23environment-variables)

## Getting Started

First, install the dependencies for this repository. This requires npm

<!-- This doesn't work with NPM, haven't tested with yarn -->

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

Update `.env.local` with your API keys:

- `OPENAI_API_KEY`: Your OpenAI API key
- `BROWSERBASE_API_KEY`: Your Browserbase API key
- `BROWSERBASE_PROJECT_ID`: Your Browserbase project ID

Then, run the development server:

<!-- This doesn't work with NPM, haven't tested with yarn -->

```bash
npm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see CUA Browser in action.


### Key Technologies

- **[Browserbase](https://www.browserbase.com)**: Powers the core browser automation and interaction capabilities
- **[Stagehand](https://www.stagehand.dev)**: Handles precise DOM manipulation and state management
- **[Next.js](https://nextjs.org)**: Provides the modern web framework foundation
- **[OpenAI](https://openai.com)**: Enable natural language understanding and decision making

## Contributing

We welcome contributions! Whether it's:

- Adding new features
- Improving documentation
- Reporting bugs
- Suggesting enhancements

Please feel free to open issues and pull requests.

## License

CUA Browser is open source software licensed under the MIT license.

## Acknowledgments

This project is inspired by OpenAI's CUA feature and builds upon various open source technologies including Next.js, React, Browserbase, and Stagehand.

# Browserbase Agent TypeScript Implementation

This is a TypeScript implementation of the Browserbase agent, which allows you to control browsers programmatically using the OpenAI API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your API keys:
```
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORG=your_openai_org_id (optional)
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id
```

3. Compile TypeScript:
```bash
npx tsc
```

## Usage

Here's a basic example of how to use the agent:

```typescript
import { Agent } from './app/api/agent/agent';
import { BrowserbaseBrowser } from './app/api/agent/browserbase';

async function main() {
  // Initialize the browser
  const browser = new BrowserbaseBrowser(1024, 768);
  await browser.connect();

  // Initialize the agent
  const agent = new Agent(
    "computer-use-preview-2025-02-04",
    browser,
    [],
    (message) => {
      console.log(`Safety check: ${message}`);
      return true; // Acknowledge all safety checks
    }
  );

  // Run the agent with a prompt
  const result = await agent.runFullTurn([
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Go to google.com and search for 'Browserbase'"
        }
      ]
    }
  ], true, false, true);

  // Disconnect the browser
  await browser.disconnect();
}

main().catch(console.error);
```

## Files

- `agent.ts`: The main Agent class that handles interactions with the OpenAI API
- `base_playwright.ts`: Base class for Playwright-based browser automation
- `browserbase.ts`: Implementation of the Browserbase browser
- `utils.ts`: Utility functions for API calls and image handling

## Dependencies

- `playwright`: For browser automation
- `axios`: For making HTTP requests
- `dotenv`: For loading environment variables
