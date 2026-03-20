import { helpItems } from "./helpItems.js";

export function getHelpCollectionData(helpCollectionName) {
    switch(helpCollectionName) {
        case "SubmitValidatorTask":
            return [
                helpItems["TaskId"],
                helpItems["Reward"]
            ];
        default:
            return [];
    }
}