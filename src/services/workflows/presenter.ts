import type {
  CharacterWorkflowExecutionRecord,
  CharacterWorkflowRecord,
} from "./repository";

export function serializeWorkflowExecution(
  execution: CharacterWorkflowExecutionRecord,
) {
  return {
    id: execution.id,
    workflowId: execution.workflowId,
    characterId: execution.characterId,
    conversationId: execution.conversationId,
    status: execution.status,
    input: execution.input,
    output: execution.output,
    errorMessage: execution.errorMessage,
    requiresConfirmation: execution.requiresConfirmation,
    startedAt: execution.startedAt?.toISOString() ?? null,
    completedAt: execution.completedAt?.toISOString() ?? null,
    createdAt: execution.createdAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString(),
  };
}

export function serializeWorkflow(workflow: CharacterWorkflowRecord) {
  return {
    id: workflow.id,
    characterId: workflow.characterId,
    name: workflow.name,
    description: workflow.description,
    trigger: workflow.trigger,
    steps: workflow.steps,
    permission: workflow.permission,
    status: workflow.status,
    executions: workflow.executions.map(serializeWorkflowExecution),
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  };
}
