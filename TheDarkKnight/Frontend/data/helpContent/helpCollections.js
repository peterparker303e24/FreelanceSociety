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
        case "EthicsRequirements":
            return [
                helpItems["EthicsRequirementsVersion"],
                helpItems["ViewEthicsRequirementsProposals"],
                helpItems["AddEthicsRequirementsProposal"],
                helpItems["EthicsRequirements"]
            ];
        case "SubmitHashTask":
            return [
                helpItems["TaskId"],
                helpItems["HashKey"],
                helpItems["FirstHashResult"],
                helpItems["HashValue"],
                helpItems["HashTaskNonce"],
                helpItems["GenerateNonce"],
                helpItems["EthereumAddress"],
                helpItems["DifficultyValue"],
                helpItems["ExpectedDifficultyValue"],
                helpItems["TaskCompleted"],
                helpItems["Deadline"],
                helpItems["Reward"],
                helpItems["SubmitHashTask"]
            ];
        case "ViewTasks":
            return [
                helpItems["TotalTasksCount"],
                helpItems["AddTask"],
                helpItems["HideCompletedAndPastTasks"],
                helpItems["Search"],
                helpItems["Previous/Next"],
                helpItems["Results"],
                helpItems["SearchResult"],
                helpItems["TaskId"],
                helpItems["TaskHash"],
                helpItems["ManagerAddress"],
                helpItems["Reward"],
                helpItems["Deadline"],
                helpItems["TaskCompleted"],
                helpItems["ViewTask"]
            ];
        case "DoubleHashTask":
            return [
                helpItems["TaskId"],
                helpItems["HashValue"],
                helpItems["TaskHash"],
                helpItems["ManagerAddress"],
                helpItems["Reward"],
                helpItems["Deadline"],
                helpItems["TaskCompleted"],
                helpItems["KeyReveal"],
                helpItems["SecondResponseWindow"],
                helpItems["Delay"],
                helpItems["ResponseCount"],
                helpItems["NextSlotTime"],
                helpItems["FundTaskAmount"],
                helpItems["FundTask"],
                helpItems["WithdrawTaskFunds"],
                helpItems["AutoDiscover"],
                helpItems["TryDownloadFrom"],
                helpItems["SkipAddress"],
                helpItems["SkipLink"],
                helpItems["ManuallyDiscover"],
                helpItems["DownloadFromUser"],
                helpItems["TaskSpecifications"],
                helpItems["TaskSpecificationHeader"],
                helpItems["TaskSpecificationCondition"],
                helpItems["SaveLocally"],
                helpItems["UploadLocally"],
                helpItems["SubmitTask"],
                helpItems["ViewSubmissions"],
                helpItems["ViewTasks"],
                helpItems["AddTask"],
                helpItems["ZipContents"]
            ];
        default:
            return [];
    }
}