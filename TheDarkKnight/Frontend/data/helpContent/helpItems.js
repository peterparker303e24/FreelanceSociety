export const helpItems = {
    "TaskId": {
        "name": `Task ID`,
        "description": `The unique identifier for a task. It is formed by the task type shortname followed by a dash "-" then the task index for the respective task type.`,
        "examples": `Task ID: h-0\nTask ID: dh-1\nTask ID: v-6`,
        "purpose": `To uniquely identify a task and provide information about the smart contract incentive structure of the task.`
    },
    "Reward": {
        "name": `Reward`,
        "description": `The ETH payout to the worker that completes the task.`,
        "examples": `Reward (Wei): 2 000 000 000 000 000\nReward (ETH): 0.005`,
        "purpose": `To incentivize workers to complete the tasks provided by managers.`
    }
};