import { helpItems } from "./helpItems.js";

export function getHelpCollectionData(helpCollectionName) {
    switch(helpCollectionName) {
        case "SubmitValidatorTask":
            return [
                helpItems["TaskId"],
                helpItems["Reward"],
                helpItems["ValidatorCommission"],
                helpItems["TaskCompleted"],
                helpItems["TaskDefaulted"],
                helpItems["Deadline"],
                helpItems["NextSlotTime"],
                helpItems["SubmissionsCount"],
                helpItems["EvaluatedSubmissionsCount"],
                helpItems["ViewSubmissions"],
                helpItems["UploadZipFile"],
                helpItems["Links"],
                helpItems["HostingStatus"],
                helpItems["FetchStatus"],
                helpItems["EthicsRequirementsCheck"],
                helpItems["AddValidatorTaskSubmission"]
            ];
        case "Profile":
            return [
                helpItems["Connect"],
                helpItems["EthereumAddress"],
                helpItems["Links"],
                helpItems["Name"],
                helpItems["LockoutCode"],
                helpItems["ActivateUser"],
                helpItems["EditUser"],
                helpItems["LockoutKey"]
            ];
        default:
            return [];
    }
}