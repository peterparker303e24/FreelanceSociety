const hre = require('hardhat');
async function main() {

    // Ethics requirements initialization for The List
    const ETHICS_REQUIREMENTS = [
        "Task or submission does not produce content of excessive harm of living beings.",
        "Task or submission does not produce content of weapons of which the prominent purpose is to harm.",
        "Task or submission does not produce content of any non-consentual nudity or sexual acts.",
        "Task or submission does not produce content of an individual's information for which there is a reasonable expectation of privacy."
    ];

    // Users contract deployment
    const UsersContractFactory = await hre.ethers.getContractFactory("Users");
    const usersContract = await UsersContractFactory.deploy();
    await usersContract.waitForDeployment();
    const usersAddress = usersContract.target;
    console.log("Users: " + usersAddress);

    // TheList contract deployment
    const TheListContractFactory = await hre.ethers.getContractFactory("TheList");
    const theListContract = await TheListContractFactory.deploy(ETHICS_REQUIREMENTS, usersAddress);
    await theListContract.waitForDeployment();
    const theListAddress = theListContract.target;
    console.log("TheList: " + theListAddress);

    // HashTask contract deployment
    const HashTaskContractFactory = await hre.ethers.getContractFactory("HashTask");
    const hashTaskContract = await HashTaskContractFactory.deploy(usersAddress);
    await hashTaskContract.waitForDeployment();
    const hashTaskAddress = hashTaskContract.target;
    console.log("HashTask: " + hashTaskAddress);

    // DoubleHashTask contract deployment
    const DoubleHashTaskFactory = await hre.ethers.getContractFactory("DoubleHashTask");
    const doubleHashTaskContract = await DoubleHashTaskFactory.deploy(usersAddress);
    await doubleHashTaskContract.waitForDeployment();
    const doubleHashTaskAddress = doubleHashTaskContract.target;
    console.log("DoubleHashTask: " + doubleHashTaskAddress);

    // ValidatorTask contract deployment
    const ValidatorTaskFactory = await hre.ethers.getContractFactory("ValidatorTask");
    const validatorTaskContract = await ValidatorTaskFactory.deploy(usersAddress);
    await validatorTaskContract.waitForDeployment();
    const validatorTaskAddress = validatorTaskContract.target;
    console.log("ValidatorTask: " + validatorTaskAddress);
}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });