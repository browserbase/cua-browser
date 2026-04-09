export type Includable = "output[*].file_search_call.search_results";

export type FunctionOutput = {
  type: "function_call_output";
  call_id: string;
  output: string;
};

export type ComputerCallOutput = {
  type: "computer_call_output";
  call_id: string;
  output: { type: "computer_screenshot"; image_url: string };
  acknowledged_safety_checks: SafetyCheck[];
  current_url?: string;
};

export type EasyMessage = {
  role: "system" | "user" | "assistant" | "developer";
  content: string | InputContent[];
};

export type ItemReference = {
  type: "item_reference";
  id: string;
};

export type InputItem = EasyMessage | FunctionOutput | ComputerCallOutput;

export type Tool = FunctionTool | ComputerTool;

export type ComputerTool = {
  type: "computer";
};

export type FunctionTool = {
  type: "function";
  name: string;
  description: string | null;
  parameters: object;
  strict: boolean;
};

export type Item = Message | FunctionToolCall | ComputerToolCall | Reasoning;

export type Message = {
  id: string;
  type: "message";
  role: "user" | "assistant" | "developer" | "system";
  content: Content[];
};

export type Reasoning = {
  id: string;
  type: "reasoning";
  content: [];
};

export type FunctionToolCall = {
  type: "function_call";
  id: string;
  call_id: string;
  name: string;
  arguments: string;
  output: Content[] | null;
};

export type ComputerAction =
  | Click
  | DoubleClick
  | Drag
  | Screenshot
  | KeyPress
  | Move
  | Scroll
  | Type
  | Wait;

export type ComputerToolCall = {
  type: "computer_call";
  id: string;
  call_id: string;
  actions?: ComputerAction[];
  action?: ComputerAction;
  pending_safety_checks: SafetyCheck[];
};

export type Click = {
  type: "click";
  button: "left" | "right" | "wheel" | "back" | "forward";
  x: number;
  y: number;
};

export type DoubleClick = {
  type: "double_click";
  x: number;
  y: number;
};

export type Scroll = {
  type: "scroll";
  x: number;
  y: number;
  scroll_x: number;
  scroll_y: number;
};

export type Type = {
  type: "type";
  text: string;
};

export type Wait = {
  type: "wait";
};

export type KeyPress = {
  type: "keypress";
  keys: string[];
};

export type Drag = {
  type: "drag";
  path: {
    x: number;
    y: number;
  }[];
};

export type Screenshot = {
  type: "screenshot";
};

export type Move = {
  type: "move";
  x: number;
  y: number;
};

export type SafetyCheck = {
  id: string;
  code: string;
  message: string;
};

export type InputContent = InputText | InputImage | InputFile;

export type OutputContent = OutputText | Refusal;

export type Content = InputContent | OutputContent | Reasoning;

export type InputText = {
  type: "input_text";
  text: string;
};

export type OutputText = {
  type: "output_text";
  text: string;
  logprobs?: LogProb[] | null;
  annotations: Annotation[];
};

export type Refusal = {
  type: "refusal";
  refusal: string;
};

export type InputImage = {
  type: "input_image";
  image_url?: string;
  file_id?: string;
  detail: "high" | "low" | "auto";
};

export type InputFile = {
  type: "input_file";
  file_id: string | null;
  filename: string | null;
  file_data: string | null;
};

export type LogProb = {
  token: string;
  logprob: number;
  bytes: number[];
  top_logprobs?: LogProb[];
};

export type FileCitation = {
  type: "file_citation";
  index: number;
  file_id: string;
  filename: string;
};

export type FilePath = {
  type: "file_path";
  file_id: string;
  index: number;
};

export type Annotation = FileCitation | FilePath;

export type RequestOptions = {
  model: string;
  input?: string | InputItem[];
  previous_response_id?: string;
  include?: Includable[];
  tools?: Tool[];

  metadata?: Record<string, string>;
  tool_choice?:
    | "none"
    | "auto" // default
    | "required"
    | { type: "file_search" }
    | { type: "computer" }
    | { type: "function"; name: string };
  text?: {
    format?:
      | { type: "text" } // default
      | { type: "json_object" }
      | {
          type: "json_schema";
          schema: object;
          name: string;
          description?: string;
          strict?: boolean; // default true
        };
  };
  temperature?: number; // default 1
  top_p?: number; // default 1
  truncation?: "auto" | "disabled";
  parallel_tool_calls?: boolean; // default true
  stream?: boolean;
  reasoning?: { effort?: "low" | "medium" | "high" };
};

export type Response = {
  id: string;
  object: "response";
  created_at: number;
  completed_at: number | null;
  error: Error | null;
  model: string;
  tools: Tool[];
  tool_choice:
    | "none"
    | "auto"
    | "required"
    | { type: "file_search" }
    | { type: "code_interpreter" }
    | { type: "function"; name: string };
  text: {
    response_format:
      | { type: "text" } // default
      | { type: "json_object" }
      | {
          type: "json_schema";
          schema: object;
          name: string;
          description?: string;
          strict: boolean | null;
        };
  };
  previous_response_id: string | null;
  output: Item[];
  metadata: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usage: any | null;
};
