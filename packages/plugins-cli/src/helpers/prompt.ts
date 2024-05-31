import type { InitialReturnValue, PromptType } from 'prompts';
import prompts from 'prompts';

interface PromptProps {
  message: string;
  type?: string;
  initial?: string;
  customProps?: any;
}

const onPromptState = (state: { value: InitialReturnValue; aborted: boolean; exited: boolean }) => {
  if (state.aborted) {
    process.stdout.write('\x1B[?25h');
    process.stdout.write('\n');
    process.exit(1);
  }
};

export const requestPrompt = async ({ message, type = 'text', initial = '', customProps }: PromptProps) => {
  const res = await prompts({
    onState: onPromptState,
    type: type as PromptType,
    name: 'res_prompt',
    message,
    initial,
    ...customProps,
  });

  return res['res_prompt'];
};
