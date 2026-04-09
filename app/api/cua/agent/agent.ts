import { BrowserbaseBrowser } from "./browserbase";
import OpenAI from "openai";
import {
  InputItem,
  Item,
  Message,
  FunctionToolCall,
  ComputerToolCall,
  ComputerCallOutput,
  FunctionOutput,
  Tool,
  RequestOptions,
} from "./types";
import { AxiosError } from "axios";
import axios from "axios";
import axiosRetry from 'axios-retry';

type AcknowledgeSafetyCheckCallback = (message: string) => boolean;

export class Agent {
  private client: OpenAI;
  private model: string;
  private computer: BrowserbaseBrowser;
  private tools: Tool[];
  private printSteps: boolean = true;
  private acknowledgeSafetyCheckCallback: AcknowledgeSafetyCheckCallback;
  public lastResponseId: string | undefined = undefined;

  constructor(
    model: string = "gpt-5.4-mini",
    computer: BrowserbaseBrowser,
    acknowledgeSafetyCheckCallback: AcknowledgeSafetyCheckCallback = () => true
  ) {
    this.client = new OpenAI();
    this.model = model;
    this.computer = computer;
    this.acknowledgeSafetyCheckCallback = acknowledgeSafetyCheckCallback;

    this.tools = [
      {
        type: "computer",
      },
      {
        type: "function",
        name: "back",
        description: "Go back to the previous page.",
        parameters: {},
        strict: false,
      },
      {
        type: "function",
        name: "goto",
        description: "Go to a specific URL.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Fully qualified URL to navigate to.",
            },
          },
          additionalProperties: false,
          required: ["url"],
        },
        strict: false,
      },
    ];
    /* Some additional tools, disabled as they seem to slow down model performance
      {
        type: "function",
        name: "refresh",
        description: "Refresh the current page.",
        parameters: {},
        strict: false,
      },
      {
        type: "function",
        name: "listTabs",
        description: "Get the list of tabs, including the current tab.",
        parameters: {},
        strict: false,
      },
      {
        type: "function",
        name: "changeTab",
        description: "Change to a specific tab.",
        parameters: {
          type: "object",
          properties: {
            tab: {
              type: "string",
              description: "The URL of the tab to change to.",
            },
          },
          additionalProperties: false,
          required: ["tab"],
        },
        strict: false,
      },
      */
  }

  private async createResponse(options: RequestOptions): Promise<Response> {
    const url = "https://api.openai.com/v1/responses";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'Openai-beta': 'responses=v1',
    };
  
    const openaiOrg = process.env.OPENAI_ORG;
    if (openaiOrg) {
      headers['Openai-Organization'] = openaiOrg;
    }

    // Configure retry behavior
    axiosRetry(axios, { 
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError): boolean => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               (error.response?.status ? error.response.status >= 500 : false);
      }
    });
  
    try {
      const response = await axios.post(url, options, { headers });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      console.error(`Error: ${axiosError.response?.status} ${axiosError.response?.data || axiosError.message}`);
      console.error(`${JSON.stringify(axiosError.response?.data)}`);
      throw error;
    }
  } 

  async getAction(
    inputItems: InputItem[],
    previousResponseId: string | undefined
  ): Promise<{
    output: Item[];
    responseId: string;
  }> {
    const response = await this.createResponse({
      model: this.model,
      input: inputItems,
      tools: this.tools,
      ...(previousResponseId
        ? { previous_response_id: previousResponseId }
        : {}),
    });

    console.log("response", response);

    return {
      output: response.output as Item[],
      responseId: response.id as string,
    };
  }

  async takeAction(
    output: Item[]
  ): Promise<(Message | ComputerCallOutput | FunctionOutput)[]> {
    const actions: Promise<Message | ComputerCallOutput | FunctionOutput>[] =
      [];
    for (const item of output) {
      if (item.type === "message") {
        // Do nothing
      }
      if (item.type === "computer_call") {
        actions.push(this.takeComputerAction(item as ComputerToolCall));
      }
      if (item.type === "function_call") {
        actions.push(this.takeFunctionAction(item as FunctionToolCall));
      }
    }

    const results = await Promise.all(actions);
    return results;
  }

  async takeMessageAction(messageItem: Message): Promise<Message> {
    if (this.printSteps && messageItem.content?.[0]) {
      console.log(messageItem.content[0]);
    }
    return messageItem;
  }

  async takeComputerAction(
    computerItem: ComputerToolCall
  ): Promise<ComputerCallOutput> {
    if (!this.computer) {
      throw new Error("Computer not initialized");
    }

    const actions =
      computerItem.actions && computerItem.actions.length > 0
        ? computerItem.actions
        : computerItem.action
          ? [computerItem.action]
          : [];

    for (const action of actions) {
      const actionType = action.type;
      const actionArgs = Object.fromEntries(
        Object.entries(action).filter(([key]) => key !== "type")
      );

      if (this.printSteps) {
        console.log(`${actionType}(${JSON.stringify(actionArgs)})`);
      }

      const method = (this.computer as unknown as Record<string, unknown>)[
        actionType
      ] as (...args: unknown[]) => unknown;

      if (typeof method !== "function") {
        throw new Error(`Unsupported computer action: ${actionType}`);
      }

      await method.apply(this.computer, Object.values(actionArgs));
    }

    const screenshot = await this.computer.screenshot();

    // Handle safety checks
    const pendingChecks = computerItem.pending_safety_checks || [];
    for (const check of pendingChecks) {
      const message = check.message;
      if (!this.acknowledgeSafetyCheckCallback(message)) {
        throw new Error(
          `Safety check failed: ${message}. Cannot continue with unacknowledged safety checks.`
        );
      }
    }

    return {
      type: "computer_call_output",
      call_id: computerItem.call_id,
      acknowledged_safety_checks: pendingChecks,
      output: {
        type: "computer_screenshot",
        image_url: `data:image/png;base64,${screenshot}`,
      },
    };
  }

  async takeFunctionAction(
    functionItem: FunctionToolCall
  ): Promise<FunctionOutput> {
    const name = functionItem.name;
    const args = JSON.parse(functionItem.arguments);
    if (this.printSteps) {
      console.log(`${name}(${JSON.stringify(args)})`);
    }

    if (
      this.computer &&
      typeof (this.computer as unknown as Record<string, unknown>)[name] ===
        "function"
    ) {
      const method = (this.computer as unknown as Record<string, unknown>)[
        name
      ] as (...args: unknown[]) => unknown;
      await method.apply(this.computer, Object.values(args));
    }

    return {
      type: "function_call_output",
      call_id: functionItem.call_id,
      output: "success", // hard-coded output for demo
    };
  }
}
