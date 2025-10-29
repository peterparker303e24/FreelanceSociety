
### Before You Start

You should be completing this tutorial through either the online Sepolia testnet blockchain or the local blockchain. In both cases you are using testnet cryptocurrencies that are freely available, so no value will be lost in testing within the tutorial. Be aware that if you interact with the Sepolia network, the transactions and data you submit are immutable and public, which may affect your privacy.

If you are using the Sepolia network, then you can use the online GitHub hosted Freelance Society website in the link below. But, if you are using a Localhost blockchain or prefer to locally self host the Freelance Society website on your local computer, then you should have the frontend server running and use the Localhost link below.

GitHub hosted Freelance Society website: [https://peterparker303e24.github.io/FreelanceSociety/TheDarkKnight/Frontend/index.html](https://peterparker303e24.github.io/FreelanceSociety/TheDarkKnight/Frontend/index.html)

Localhost Freelance Society website: [http://localhost:3000](http://localhost:3000)

For the Localhost blockchain it is recommended to use the account 0x70997970C51812dc3A010C7d01b50e0d17dc79C8. You can add this account with the following private key in MetaMask:

###
    0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

### Add A Validator Task

In the Home page, select "Tasks" to navigate to the View Tasks page. In the View Tasks page, you can view the recent hash tasks, double hash tasks, and validator tasks. Select the dropdown arrow and select the "Add Validator Task" button to navigate to the Add Validator Task page.

The "Task Hash" is the keccak256 hash of the Task.zip file data. It is immutably written to the blockchain to authenticate that any manager, worker, or validator users are communicating using the exact same task. In the "Task Hash" input:

###
    0xe493dee3ab0b5e9b97c0659831a0ef3213c82549b33f18fc088a7d4d7e2d503d

The "Specifications Count" is the number of specifications that must be met in the task (not including the ethics requirements). All specifications must be met by the standards of the task validator in order for the worker to complete the task. The specifications are ordered, so if a worker submission gets rejected it is clear to the worker which specification was not met. In the "Specifications Count" input:

###
    2

The "Seconds Until Deadline" is the dedicated time in seconds that workers have to complete the task starting from the task creation time. Note that the blockchain may not have accurate timestamping. But, there are protocols in place to reduce inaccuracies in the blockchain timestamps, so the time is not entirely unreliable. In the "Seconds Until Deadline" input 1 weeks worth of seconds:

###
    604800

The "Block Schedule" is the toggle that determines whether the validator time windows can overlap. If Block Schedule is true, then the start of the validator time window will be at least later than the end of all validator time windows submitted previously. If Block Schedule is false, then the start of the validator time window will begin independent of any other task submissions. Set this toggle to "OFF".

The "Validation Time" is the time, in seconds, allocated for the validator to evaluate the correctness of the task submission conditions. In the "Validation Time" input:

###
    600

(In reality you would want the Validation Time to be much longer so the validator has time to react to the worker submission within a normal work week.)

The "Validation Delay" is the time delay, in seconds, between the blockchain timestamp of the worker submission transaction and the minimum start time of the validator time window. This gives time to allow the transactions to confirm with a greater block depth. In the "Validation Delay" input:

###
    0

The "Validator Addresses" is the comma separated list of addresses that are allowed to submit evaluations of worker submissions. Only one validator among all listed validators may evaluate any single submission, but different validators may evaluate different submissions within the same task. In the "Validator Addresses" input your own address (This can be copied within your MetaMask wallet in the header under the account name).

The "Validator Commission" is the amount of cryptocurrency, in Wei, that the worker sends to the validator that evaluates their submission. This incentivizes validators to put in time and effort to evaluate a submission. This also incentivizes workers to not submit low quality or incorrect submissions to the task. In the "Validator Commission" input:

###
    100000000000000

The "Reward" is the amount of cryptocurrency, in Wei, that is sent to the worker that completes the task. The manager inputs an initial reward to incentivize workers to complete the task. Other users can add funds to the task, even repeatedly. The reward to the worker is the sum of all users funding amounts. In the "Reward" input:

###
    1000000000000000

The checkbox with text "I have have read the ethics requirements and my submission does not violate any of the ethics requirements." checks that the user acknowledges that they have not violated any ethics in the process of creating the task. Select the checkbox so it displays the checked symbol.

Download the ZIP file [here](https://raw.githubusercontent.com/peterparker303e24/Base/main/Tasks/ValidatorTasks/e493dee3ab0b5e9b97c0659831a0ef3213c82549b33f18fc088a7d4d7e2d503d/Task.zip) (open the link in a new tab), select the "Upload Zip File" button, and select the downloaded file. This upload will automatically set the "Task Hash" input value so it matches the actual Task.zip file keccak256 hash. The ZIP file should be uploaded within your base route with the path "Tasks/ValidatorTasks/e493dee3ab0b5e9b97c0659831a0ef3213c82549b33f18fc088a7d4d7e2d503d/Task.zip".

With all task data input set, the "Add Validator Task" button will now be enabled. Select this button and confirm the transaction to add the validator task to the blockchain. You will be redirected to the View Tasks page and the recent tasks will shortly populate the page. Select "View Task" with the task that has the matching "Manager Address" of your account. You will be redirected to the Validator Task page where you can view the task blockchain data, add funds to the task reward, withdraw funds of an incomplete task, and view the task data conditions. You can now use this newly created task for completion.

### Complete The Validator Task

In the Home page, select "Tasks" to navigate to the View Tasks page.

The recent tasks will populate the page. Navigate to a validator task by selecting the "View Task" button of a task with the "v-" shortname prefix.

View the blockchain task data displayed on the page. The goal in completing the task is to submit a ZIP file with contents that satisfy all the conditions in the task specifications and satisfy all ethics requirements. The instructions for these specifications should be described in the task specifications. Scroll down and discover the task data. Once the task has been discovered, you can view the task folder contents in the file tree display to the right. You can also select "Save Locally" once the data has been discovered to download the ZIP file to your computer to view all of the contents in the task. Now select "Submit Task" to navigate to the Add Validator Task Submission page.

Once you have completed the instructions in the task description, you should have a ZIP file with the contents that meet all the task specification conditions and all ethics requirements conditions. If you are using the task from the previous section, then you can use the ZIP file [here](https://raw.githubusercontent.com/peterparker303e24/Base/main/Submissions/ValidatorSubmissions/6bfdd52a384ec3147c32962ccf3615526faf7144a7706c3db554aad116be4539/Submission.zip) (open the link in a new tab). The ZIP file should be uploaded within your base route with the path "Submissions/ValidatorSubmissions/6bfdd52a384ec3147c32962ccf3615526faf7144a7706c3db554aad116be4539/Submission.zip".

Select "Upload Zip File" and select the downloaded ZIP file.

Select the "I have have read the ethics requirements and my submission does not violate any of the ethics requirements." checkbox so it displays the checked symbol.

The "Add Validator Task Submission" button should now be enabled if the submission file is correctly hosted.

Select "Add Validator Task Submission" and confirm the transaction. When the transaction is confirmed on the blockchain the page will refresh. If your account address is one of the listed validators in the task, then you can evaluate the submission you just created.

Select "View Submissions" to navigate to the View Validator Task Submissions page. In this page you can view task submission related blockchain data. The "Submissions Count" is the number of worker submissions to the task. The "Evaluated Submissions Count" is the number of submissions that have been evaluated by validators, where the evaluations are always made in order of submission time. The "Task Complete" shows whether a validator has evaluated any worker submission as complete. The "Task Defaulted" shows whether the task has been defaulted as complete to a worker as a result of no validators evaluating the submission within its validation time window. This incentivizes validators to make evaluations and incentivizes managers to choose validators that have high availability. When the task submission data populates the bottom of the page, a list of all worker submissions will display with the most recent submissions displayed first. You can view submission blockchain data and click the "View Submission" button to redirect to the corresponding Validator Task Submission page. Select "View Submission" of the submission you created.

View the blockchain data of the task and submission. Scroll down to the Validator Evaluation section which shows if the account connected to the website is in the list of validator addresses for the task. Select "Try download submission zip file from worker" to download their submission ZIP file from their user hosted endpoints. The submission should be downloaded to your local computer and is available for review as the validator for the evaluation. The validator is able to toggle the ethics requirements checkbox and all requirement condition checkboxes corresponding to the task. Toggle the checkboxes so they are all checked and this should alter the Submit Evaluation button to be "ACCEPTED". Select the "Submit Evaluation: ACCEPTED" to accept the worker submission as correct and completing the task, then confirm the transaction. The page will reload and the worker that submitted the corresponding submission can withdraw the task reward.

Scroll down to the button "Withdraw Submission Completion" which should show if the submission worker address is the address of the connected account to the website. Select "Withdraw Submission Completion" to complete the task and withdraw the task reward. You now have the knowledge to use the validator task to incentivize labor for a specific product or exchange labor for a capital reward.

### What To Do Next

You have now completed all sections of the tutorial. You can now try interacting with the Sepolia network if you have not already done so. You can create your own tasks for other users to grow the platform. Try making at least 2 of each type of hash task, double hash task, and validator task. You can complete the existing tasks that others have added to the platform. You have the basic knowledge to interact on the platform and explore additional features that were not covered in this tutorial. You can grow the network of users on the platform to contribute more tasks and greater participation. You have the power to spread the ideas of Freelance Society.
