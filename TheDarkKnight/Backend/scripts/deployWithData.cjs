const hre = require('hardhat');
async function main() {
    const ETHICS_REQUIREMENTS = [
        "Task or submission does not produce content of excessive harm of living beings.",
        "Task or submission does not produce content of weapons of which the prominent purpose is to harm.",
        "Task or submission does not produce content of any non-consentual nudity or sexual acts.",
        "Task or submission does not produce content of an individual's information for which there is a reasonable expectation of privacy."
    ];
    const ETHICS_REQUIREMENTS2 = [
        "Don't talk about Freelance Society."
    ];
    const UsersContractFactory = await hre.ethers.getContractFactory("Users");
    const usersContract = await UsersContractFactory.deploy();
    const usersAddress = usersContract.target;
    const TheListContractFactory = await hre.ethers.getContractFactory("TheList");
    const theListContract = await TheListContractFactory.deploy(ETHICS_REQUIREMENTS, usersAddress);
    const HashTaskContractFactory = await hre.ethers.getContractFactory("HashTask");
    const hashTaskContract = await HashTaskContractFactory.deploy(usersAddress);
    const DoubleHashTaskFactory = await hre.ethers.getContractFactory("DoubleHashTask");
    const doubleHashTaskContract = await DoubleHashTaskFactory.deploy(usersAddress);
    const ValidatorTaskFactory = await hre.ethers.getContractFactory("ValidatorTask");
    const validatorTaskContract = await ValidatorTaskFactory.deploy(usersAddress);

    const [deployer, user1, user2] = await ethers.getSigners();
    await usersContract.connect(deployer)["activateUser(string, bytes, bytes32)"](
        "https://raw.githubusercontent.com/peterparker303e24/Base/main",
        "0x0050657465725061726b6572333033653234",
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed"
    );
    await usersContract.connect(user1)["activateUser(string, bytes, bytes32)"](
        "https://raw.githubusercontent.com/peterparker303e24/Base/main,http://raw.githubusercontent.com/peterparker303e24/FreelanceSociety/main",
        "0x00416c696365",
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed"
    );
    await usersContract.connect(user2)["activateUser(string, bytes, bytes32)"](
        "https://raw.githubusercontent.com/peterparker303e24/Base/main,bob@gmail.com",
        "0x00426f62",
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed"
    );

    // Create two requirements, the second with a new version
    await theListContract.connect(deployer).addRequirement("0x8e1e294d1ffc2e0eff8e327229247a6029e42dc76f5d12f543230d50625e43dc");
    await theListContract.connect(deployer).addRequirement("0xfdcc01b08d46c3d858f62cbe95fb32c9ab78d883d4acb39255059c1a4ab7e7db");
    await theListContract.connect(deployer).addRequirement("0x8e1e294d1ffc2e0eff8e327229247a6029e42dc76f5d12f543230d50625e43dc");
    await theListContract.connect(user1).voteRequirementUpdate(1, 0);
    await theListContract.connect(user2).voteRequirementUpdate(1, 0);
    await theListContract.connect(user1).updateEthicsRequirements(ETHICS_REQUIREMENTS2);

    // h-0: Task deadline passed incomplete
    await hashTaskContract.connect(user1).addHashTask(
        "0x1204b3dcd975ba0a68eafbf4d2ca0d13cc7b5e3709749c1dc36e6e74934270b3",
        "0x5347d46ee824f7d4c3d191cda72bcee55f05613c02ef4aeaf023d29f97894669",
        1,
        10,
        true,
        { value: 420_000_000_000_000_000n }
    );

    // h-1: Task passed complete
    await hashTaskContract.connect(user1).addHashTask(
        "0x1204b3dcd975ba0a68eafbf4d2ca0d13cc7b5e3709749c1dc36e6e74934270b3",
        "0x5347d46ee824f7d4c3d191cda72bcee55f05613c02ef4aeaf023d29f97894669",
        60,
        10,
        true,
        { value: 420_000_000_000_000_000n }
    );

    // h-2: Task passed incomplete
    await hashTaskContract.connect(user2).addHashTask(
        "0x1204b3dcd975ba0a68eafbf4d2ca0d13cc7b5e3709749c1dc36e6e74934270b3",
        "0x5347d46ee824f7d4c3d191cda72bcee55f05613c02ef4aeaf023d29f97894669",
        100,
        10,
        true,
        { value: 420_000_000_000_000_000n }
    );

    // h-3: Task with no difficulty
    await hashTaskContract.connect(user1).addHashTask(
        "0x1204b3dcd975ba0a68eafbf4d2ca0d13cc7b5e3709749c1dc36e6e74934270b3",
        "0x5347d46ee824f7d4c3d191cda72bcee55f05613c02ef4aeaf023d29f97894669",
        100,
        0,
        true,
        { value: 420_000_000_000_000_000n }
    );

    // dh-0: Long and instand submission window
    await doubleHashTaskContract.connect(user1).addDoubleHashTask(
        "0x1c45d96fec31449eec463a618003378fb419a566a7c56ce7e6053c5aaa01e466",
        "0x374ade3263564fe559b28e4156d73af37d57bea2ae63883c9d0ac9842b2cc38d",
        30_000_000,
        true,
        10_000,
        0,
        { value: 1_000_000_000_000_000n }
    );

    // dh-1: medium length submission window
    await doubleHashTaskContract.connect(user1).addDoubleHashTask(
        "0x1c45d96fec31449eec463a618003378fb419a566a7c56ce7e6053c5aaa01e466",
        "0x374ade3263564fe559b28e4156d73af37d57bea2ae63883c9d0ac9842b2cc38d",
        30_000_000,
        true,
        100,
        100,
        { value: 1_000_000_000_000_000n }
    );

    // h-4 - h-6, dh-2 - dh-4, v-0 - v-2: Add a few tasks
    for (let i = 0; i < 3; i++) {
        await hashTaskContract.connect(user1).addHashTask(
            "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed",
            "0x5347d46ee824f7d4c3d191cda72bcee55f05613c02ef4aeaf023d29f97894669",
            30_000_000,
            10,
            true,
            { value: 1_000_000_000_000_000n * BigInt(i) }
        );
        await doubleHashTaskContract.connect(user1).addDoubleHashTask(
            "0x1c45d96fec31449eec463a618003378fb419a566a7c56ce7e6053c5aaa01e466",
            "0x374ade3263564fe559b28e4156d73af37d57bea2ae63883c9d0ac9842b2cc38d",
            30_000_000,
            true,
            40,
            20,
            { value: 1_000_000_000_000_000n * BigInt(i) }
        );
        await validatorTaskContract.connect(user1).addTask(
            "0x54a7232f0cdbf8f9f18ba940bb65dd4f1694b676aacc42501a4029e5c43bde5b",
            1,
            30_000_000,
            true,
            20,
            600,
            [user1.address],
            100_000_000_000n,
            { value: 1_000_000_000_000_000n * BigInt(i) }
        );
    }

    // Complete h-1
    await hashTaskContract.connect(deployer).submitHashTask(
        1,
        "0xad7c5bef027816a800da1736444fb58a807ef4c9603b7848673f7e3a68eb14a5",
        9768163911
    );
}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });