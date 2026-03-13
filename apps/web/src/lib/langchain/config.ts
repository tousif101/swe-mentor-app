import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import type { StructuredToolInterface } from "@langchain/core/tools";
import type { RunnableToolLike } from "@langchain/core/runnables";
import type { BaseCheckpointSaver } from "@langchain/langgraph-checkpoint";
import type { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250514",
  temperature: 0.7,
  maxTokens: 2000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

// Dev: MemorySaver (in-memory). Prod: use PostgresSaver from @langchain/langgraph-checkpoint-postgres
const defaultCheckpointer = new MemorySaver();

type ToolInput = StructuredToolInterface | RunnableToolLike;

type PromptFunction = (
  state: { messages: BaseMessage[] },
  config: LangGraphRunnableConfig
) => Promise<BaseMessageLike[]>;

type PreModelHookFunction = (
  state: { messages: BaseMessage[]; llmInputMessages: BaseMessage[] },
  config: LangGraphRunnableConfig
) => Promise<{
  messages?: BaseMessage[];
  llmInputMessages?: BaseMessage[];
}>;

export function createMentorAgent({
  tools = [],
  checkpointer = defaultCheckpointer,
  prompt,
  preModelHook,
}: {
  tools?: ToolInput[];
  checkpointer?: BaseCheckpointSaver;
  prompt?: PromptFunction;
  preModelHook?: PreModelHookFunction;
} = {}) {
  return createReactAgent({
    llm: model,
    tools,
    checkpointer,
    ...(prompt ? { prompt } : {}),
    ...(preModelHook ? { preModelHook } : {}),
  });
}

export { model };
