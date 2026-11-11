export interface AppTask {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
}

export interface AppSnapshot {
  name: string;
  audience: string;
  tasks: AppTask[];
}

export const appSnapshot: AppSnapshot = {
  name: 'Pet Show and Tell',
  audience: 'Pet owners and people who love pet pictures',
  tasks: [
    { id: 'task-1', title: 'Create a pet profile and first photo post', status: 'done' },
    { id: 'task-2', title: 'Browse pet posts and react with Like or Love', status: 'doing' },
    { id: 'task-3', title: 'Add comments to post detail', status: 'todo' },
  ] satisfies AppTask[],
};
