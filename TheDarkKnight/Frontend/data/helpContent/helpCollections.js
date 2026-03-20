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
        case "SubmitDoubleHashTask":
            return [
                helpItems["TaskId"],
                helpItems["HashKey"],
                helpItems["FirstHashResult"],
                helpItems["SecondHashResult"],
                helpItems["HashValue"],
                helpItems["SecondResponseWindow"],
                helpItems["Delay"],
                helpItems["TaskCompleted"],
                helpItems["Deadline"],
                helpItems["Reward"],
                helpItems["ResponseCount"],
                helpItems["SubmitWindowStart"],
                helpItems["CurrentTime"],
                helpItems["SubmitWindowEnd"],
                helpItems["ViewSubmissions"],
                helpItems["SubmitFirstHash"],
                helpItems["SubmitSecondHash"]
            ];
        default:
            return [];
    }
}