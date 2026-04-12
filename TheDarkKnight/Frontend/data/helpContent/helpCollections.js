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
        case "HashTask":
            return [
                helpItems["TaskId"],
                helpItems["HashValue"],
                helpItems["TaskHash"],
                helpItems["ManagerAddress"],
                helpItems["Reward"],
                helpItems["Deadline"],
                helpItems["TaskCompleted"],
                helpItems["KeyReveal"],
                helpItems["Difficulty"],
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
                helpItems["ViewTasks"],
                helpItems["AddTask"],
                helpItems["ZipContents"]
            ];
        case "ValidatorTask":
            return [
                helpItems["TaskId"],
                helpItems["TaskHash"],
                helpItems["ManagerAddress"],
                helpItems["Reward"],
                helpItems["Deadline"],
                helpItems["TaskCompleted"],
                helpItems["TaskDefaulted"],
                helpItems["SpecificationsCount"],
                helpItems["ValidationTime"],
                helpItems["NextSlotTime"],
                helpItems["SubmissionsCount"],
                helpItems["EvaluatedSubmissionsCount"],
                helpItems["BlockValidation"],
                helpItems["Delay"],
                helpItems["CompletionIndex"],
                helpItems["CompletionAddress"],
                helpItems["Validators"],
                helpItems["ValidatorCommission"],
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
                helpItems["ViewTasks"],
                helpItems["AddTask"],
                helpItems["ZipContents"]
            ];
        case "EthicsRequirementsProposal":
            return [
                helpItems["EthicsRequirementsProposalId"],
                helpItems["ProposalHash"],
                helpItems["ProposalValidatorAddress"],
                helpItems["ProposalVotesFor"],
                helpItems["VoteForEthicsProposal"],
                helpItems["EthicsRequirementsProposal"],
                helpItems["SaveLocally"],
                helpItems["ViewEthicsRequirementsProposals"],
                helpItems["ViewEthicsRequirements"],
                helpItems["AddEthicsRequirementsProposal"]
            ];
        case "AddDoubleHashTask":
            return [
                helpItems["HashValue"],
                helpItems["TaskHash"],
                helpItems["Deadline"],
                helpItems["KeyReveal"],
                helpItems["SecondResponseWindow"],
                helpItems["Delay"],
                helpItems["Reward"],
                helpItems["EthicsRequirementsCheck"],
                helpItems["AddDoubleHashTask"],
                helpItems["UploadZipFile"]
            ];
        case "AddEthicsRequirementsProposal":
            return [
                helpItems["EthicsRequirementsVersion"],
                helpItems["EthicsRequirementsProposals"],
                helpItems["AddEthicsRequirements"],
                helpItems["WriteEthicsRequirements"]
            ];
        case "AddHashTask":
            return [
                helpItems["HashValue"],
                helpItems["TaskHash"],
                helpItems["Deadline"],
                helpItems["KeyReveal"],
                helpItems["Difficulty"],
                helpItems["Reward"],
                helpItems["EthicsRequirementsCheck"],
                helpItems["AddHashTask"],
                helpItems["UploadZipFile"]
            ];
        case "AddValidatorTask":
            return [
                helpItems["TaskHash"],
                helpItems["SpecificationsCount"],
                helpItems["Deadline"],
                helpItems["BlockValidation"],
                helpItems["ValidationTime"],
                helpItems["Delay"],
                helpItems["Validators"],
                helpItems["ValidatorCommission"],
                helpItems["Reward"],
                helpItems["EthicsRequirementsCheck"],
                helpItems["AddValidatorTask"],
                helpItems["UploadZipFile"],
                helpItems["TaskSpecifications"],
            ];
        case "Requirement":
            return [
                helpItems["RequirementId"],
                helpItems["RequirementHash"],
                helpItems["ManagerAddress"],
                helpItems["AutoDiscover"],
                helpItems["TryDownloadFrom"],
                helpItems["SkipAddress"],
                helpItems["SkipLink"],
                helpItems["ManuallyDiscover"],
                helpItems["DownloadFromUser"],
                helpItems["Requirement"],
                helpItems["SaveLocally"],
                helpItems["UploadLocally"],
                helpItems["ViewProposals"],
                helpItems["ViewOtherVersions"],
                helpItems["AddRequirement"],
                helpItems["ZipContents"]
            ];
        case "RequirementProposal":
            return [
                helpItems["RequirementProposalId"],
                helpItems["RequirementHash"],
                helpItems["ManagerAddress"],
                helpItems["ProposalVotesFor"],
                helpItems["AutoDiscover"],
                helpItems["TryDownloadFrom"],
                helpItems["SkipAddress"],
                helpItems["SkipLink"],
                helpItems["ManuallyDiscover"],
                helpItems["DownloadFromUser"],
                helpItems["Requirement"],
                helpItems["SaveLocally"],
                helpItems["UploadLocally"],
                helpItems["ViewProposals"],
                helpItems["ViewOtherVersions"],
                helpItems["AddRequirementProposal"],
                helpItems["ZipContents"]
            ];
        case "User":
            return [
                helpItems["EthereumAddress"],
                helpItems["Name"],
                helpItems["Links"],
                helpItems["LockoutCode"],
                helpItems["ActivationStatus"],
                helpItems["UserDefinedData"],
                helpItems["MinimumCommission"],
                helpItems["EthicsRequirementsStandards"],
                helpItems["WorkerTasks"],
                helpItems["ManagerTasks"],
                helpItems["ValidatorTasks"],
                helpItems["ValidationRequirementsWhitelist"],
                helpItems["AvailableValidationTime"],
                helpItems["ShowOnlyUserInitiatedContractCalls"],
                helpItems["Search"],
                helpItems["Previous/Next"],
                helpItems["Results"],
                helpItems["SearchResult"],
                helpItems["ContractInitiatorAddress"],
                helpItems["BlockIndex"],
                helpItems["BlockTimestamp"],
                helpItems["EventContract"],
                helpItems["EventName"],
                helpItems["EventData"],
                helpItems["ViewEvent"]
            ];
        default:
            return [];
    }
}