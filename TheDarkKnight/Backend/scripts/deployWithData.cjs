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
        "0x004d61627a",
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed"
    );
    await usersContract.connect(user1)["activateUser(string, bytes, bytes32)"](
        "https://raw.githubusercontent.com/peterparker303e24/Base/main,http://raw.githubusercontent.com/peterparker303e24/Base/main",
        "0x00416c696365",
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed"
    );
    await usersContract.connect(user2)["activateUser(string, bytes, bytes32)"](
        "https://raw.githubusercontent.com/peterparker303e24/Base/main,bob@gmail.com",
        "0x00426f62",
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed"
    );

    // Create two requirements, the second with a new version
    await theListContract.connect(user1).addRequirement("0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed");
    await theListContract.connect(deployer).addRequirement("0xe05fabf858ffc52093439fdcca2f018d5678551ab2c6f529eaa3dee1afa1b6b4");
    await theListContract.connect(user1).voteRequirementUpdate(1, 0);
    await theListContract.connect(user2).voteRequirementUpdate(1, 0);
    await theListContract.connect(user1).updateEthicsRequirements(ETHICS_REQUIREMENTS2);

    // h-0: Task deadline passed incomplete
    await hashTaskContract.connect(user1).addHashTask(
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed",
        "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
        1,
        10,
        true,
        { value: 420_000_000_000_000_000n }
    );

    // h-1: Task passed complete
    await hashTaskContract.connect(user1).addHashTask(
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed",
        "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
        60,
        10,
        true,
        { value: 420_000_000_000_000_000n }
    );

    // h-2: Task passed incomplete
    await hashTaskContract.connect(user2).addHashTask(
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed",
        "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
        100,
        10,
        true,
        { value: 420_000_000_000_000_000n }
    );

    // h-3: Task with no difficulty
    await hashTaskContract.connect(user1).addHashTask(
        "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed",
        "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
        100,
        0,
        true,
        { value: 420_000_000_000_000_000n }
    );

    // dh-0: Long and instand submission window
    await doubleHashTaskContract.connect(user1).addDoubleHashTask(
        "0xe8b6d628aa68d0f061dc10b6131a1436d674bd45e8fb672a614f3d6553e51c8f",
        "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
        30_000_000,
        true,
        10_000,
        0,
        { value: 1_000_000_000_000_000n }
    );

    // dh-1: medium length submission window
    await doubleHashTaskContract.connect(user1).addDoubleHashTask(
        "0xe8b6d628aa68d0f061dc10b6131a1436d674bd45e8fb672a614f3d6553e51c8f",
        "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
        30_000_000,
        true,
        100,
        100,
        { value: 1_000_000_000_000_000n }
    );

    // h-4 - h-13: Add a few tasks
    for (let i = 0; i < 3; i++) {
        await hashTaskContract.connect(user1).addHashTask(
            "0x1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed",
            "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
            30_000_000,
            10,
            true,
            { value: 1_000_000_000_000_000n * BigInt(i) }
        );
        await doubleHashTaskContract.connect(user1).addDoubleHashTask(
            "0xe8b6d628aa68d0f061dc10b6131a1436d674bd45e8fb672a614f3d6553e51c8f",
            "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
            30_000_000,
            true,
            40,
            20,
            { value: 1_000_000_000_000_000n * BigInt(i) }
        );
        await validatorTaskContract.connect(user1).addTask(
            "0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e",
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
    await hashTaskContract.connect(user1).submitHashTask(
        1,
        "0x387a8233c96e1fc0ad5e284353276177af2186e7afa85296f106336e376669f7",
        670
    );
}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });