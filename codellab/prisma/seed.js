const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await prisma.submissionEvent.deleteMany();
    await prisma.cheatLog.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.contestParticipant.deleteMany();
    await prisma.testCase.deleteMany();
    await prisma.contestQuestion.deleteMany();
    await prisma.questionTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.question.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.message.deleteMany();
    await prisma.file.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.roomMember.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    const admin = await prisma.user.create({
        data: {
            id: 'admin-user-id',
            username: 'admin',
            email: 'admin@codellab.com',
            password: hashPassword('admin123'),
            role: 'ADMIN',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        },
    });

    const user1 = await prisma.user.create({
        data: {
            id: 'user-1',
            username: 'gaurav',
            email: 'gaurav@example.com',
            password: hashPassword('password123'),
            role: 'USER',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gaurav',
        },
    });

    const user2 = await prisma.user.create({
        data: {
            id: 'user-2',
            username: 'rahul',
            email: 'rahul@example.com',
            password: hashPassword('password123'),
            role: 'USER',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
        },
    });

    const user3 = await prisma.user.create({
        data: {
            id: 'user-3',
            username: 'nishant',
            email: 'nishant@example.com',
            password: hashPassword('password123'),
            role: 'USER',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nishant',
        },
    });

    console.log('✅ Created users');

    // Create Tags
    const tags = await Promise.all([
        prisma.tag.create({ data: { name: 'Array' } }),
        prisma.tag.create({ data: { name: 'Hash Table' } }),
        prisma.tag.create({ data: { name: 'Two Pointers' } }),
        prisma.tag.create({ data: { name: 'String' } }),
        prisma.tag.create({ data: { name: 'Dynamic Programming' } }),
        prisma.tag.create({ data: { name: 'Recursion' } }),
    ]);

    console.log('✅ Created tags');

    // Create Questions
    const question1 = await prisma.question.create({
        data: {
            title: 'Two Sum',
            slug: 'two-sum',
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty: 'EASY',
            points: 100,
            timeLimit: 2000,
            memoryLimit: 256,
            starterCode: JSON.stringify({
                javascript: 'function twoSum(nums, target) {\n  // Your code here\n  return [];\n}',
                python: 'def two_sum(nums, target):\n    # Your code here\n    return []',
            }),
            solution: 'Use a hash map to store seen numbers and their indices',
            authorId: admin.id,
        },
    });

    await prisma.questionTag.createMany({
        data: [
            { questionId: question1.id, tagId: tags[0].id },
            { questionId: question1.id, tagId: tags[1].id },
        ],
    });

    await prisma.testCase.createMany({
        data: [
            {
                questionId: question1.id,
                input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }),
                output: JSON.stringify([0, 1]),
                isPublic: true,
            },
            {
                questionId: question1.id,
                input: JSON.stringify({ nums: [3, 2, 4], target: 6 }),
                output: JSON.stringify([1, 2]),
                isPublic: true,
            },
            {
                questionId: question1.id,
                input: JSON.stringify({ nums: [3, 3], target: 6 }),
                output: JSON.stringify([0, 1]),
                isPublic: false,
            },
        ],
    });

    const question2 = await prisma.question.create({
        data: {
            title: 'Palindrome String',
            slug: 'palindrome-string',
            description: 'Given a string, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.',
            difficulty: 'EASY',
            points: 80,
            timeLimit: 1500,
            memoryLimit: 128,
            starterCode: JSON.stringify({
                javascript: 'function isPalindrome(s) {\n  // Your code here\n  return false;\n}',
                python: 'def is_palindrome(s):\n    # Your code here\n    return False',
            }),
            solution: 'Use two pointers from both ends',
            authorId: admin.id,
        },
    });

    await prisma.questionTag.createMany({
        data: [
            { questionId: question2.id, tagId: tags[2].id },
            { questionId: question2.id, tagId: tags[3].id },
        ],
    });

    await prisma.testCase.createMany({
        data: [
            {
                questionId: question2.id,
                input: JSON.stringify({ s: 'A man, a plan, a canal: Panama' }),
                output: JSON.stringify(true),
                isPublic: true,
            },
            {
                questionId: question2.id,
                input: JSON.stringify({ s: 'race a car' }),
                output: JSON.stringify(false),
                isPublic: true,
            },
        ],
    });

    const question3 = await prisma.question.create({
        data: {
            title: 'Fibonacci Number',
            slug: 'fibonacci-number',
            description: 'The Fibonacci numbers form a sequence where each number is the sum of the two preceding ones. Given n, calculate F(n).',
            difficulty: 'MEDIUM',
            points: 150,
            timeLimit: 2000,
            memoryLimit: 256,
            starterCode: JSON.stringify({
                javascript: 'function fib(n) {\n  // Your code here\n  return 0;\n}',
                python: 'def fib(n):\n    # Your code here\n    return 0',
            }),
            solution: 'Use dynamic programming or recursion with memoization',
            authorId: admin.id,
        },
    });

    await prisma.questionTag.createMany({
        data: [
            { questionId: question3.id, tagId: tags[4].id },
            { questionId: question3.id, tagId: tags[5].id },
        ],
    });

    await prisma.testCase.createMany({
        data: [
            {
                questionId: question3.id,
                input: JSON.stringify({ n: 5 }),
                output: JSON.stringify(5),
                isPublic: true,
            },
            {
                questionId: question3.id,
                input: JSON.stringify({ n: 10 }),
                output: JSON.stringify(55),
                isPublic: false,
            },
        ],
    });

    console.log('✅ Created questions with test cases');

    // Create Contest
    const contest = await prisma.contest.create({
        data: {
            title: 'Weekly Coding Challenge #1',
            description: 'Practice your algorithmic skills with these carefully selected problems',
            startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
            endTime: new Date(Date.now() + 7200000), // Ends in 2 hours
        },
    });

    await prisma.contestQuestion.createMany({
        data: [
            { contestId: contest.id, questionId: question1.id, order: 1, points: 100 },
            { contestId: contest.id, questionId: question2.id, order: 2, points: 80 },
            { contestId: contest.id, questionId: question3.id, order: 3, points: 150 },
        ],
    });

    await prisma.contestParticipant.createMany({
        data: [
            { contestId: contest.id, userId: user1.id, score: 180, rank: 1 },
            { contestId: contest.id, userId: user2.id, score: 100, rank: 2 },
            { contestId: contest.id, userId: user3.id, score: 80, rank: 3 },
        ],
    });

    console.log('✅ Created contest');

    // Create Rooms
    const room1 = await prisma.room.create({
        data: {
            name: 'Algorithm Practice Room',
            description: 'Collaborative space for algorithm practice',
            inviteCode: 'ALGO2024',
            ownerId: user1.id,
            isPublic: true,
            maxParticipants: 10,
            language: 'javascript',
            difficulty: 'medium',
        },
    });

    await prisma.roomMember.createMany({
        data: [
            { roomId: room1.id, userId: user1.id },
            { roomId: room1.id, userId: user2.id },
            { roomId: room1.id, userId: user3.id },
        ],
    });

    await prisma.permission.createMany({
        data: [
            { roomId: room1.id, userId: user1.id, role: 'ADMIN' },
            { roomId: room1.id, userId: user2.id, role: 'WRITE' },
            { roomId: room1.id, userId: user3.id, role: 'WRITE' },
        ],
    });

    await prisma.file.createMany({
        data: [
            {
                roomId: room1.id,
                name: 'solution.js',
                path: '/solution.js',
                content: '// Write your solution here\nfunction solve() {\n  return "Hello World";\n}',
            },
            {
                roomId: room1.id,
                name: 'test.js',
                path: '/test.js',
                content: '// Test cases\nconsole.log(solve());',
            },
        ],
    });

    console.log('✅ Created rooms with files and permissions');

    // Create Sample Submissions
    const submission1 = await prisma.submission.create({
        data: {
            userId: user1.id,
            questionId: question1.id,
            contestId: contest.id,
            code: 'function twoSum(nums, target) { const map = {}; for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (complement in map) { return [map[complement], i]; } map[nums[i]] = i; } return []; }',
            language: 'javascript',
            status: 'ACCEPTED',
            runtime: 68,
            memory: 42,
            passedTests: 3,
            totalTests: 3,
        },
    });

    await prisma.submission.create({
        data: {
            userId: user2.id,
            questionId: question1.id,
            contestId: contest.id,
            code: 'function twoSum(nums, target) { for (let i = 0; i < nums.length; i++) { for (let j = i + 1; j < nums.length; j++) { if (nums[i] + nums[j] === target) { return [i, j]; } } } return []; }',
            language: 'javascript',
            status: 'TIME_LIMIT_EXCEEDED',
            runtime: 2500,
            memory: 38,
            passedTests: 2,
            totalTests: 3,
        },
    });

    console.log('✅ Created sample submissions');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Users: 4 (1 admin, 3 regular users)');
    console.log('  - Questions: 3');
    console.log('  - Test Cases: 7');
    console.log('  - Contest: 1 (active)');
    console.log('  - Rooms: 1');
    console.log('  - Submissions: 2');
    console.log('\n🔑 Login Credentials:');
    console.log('  Admin: admin@codellab.com / admin123');
    console.log('  User1: gaurav@example.com / password123');
    console.log('  User2: rahul@example.com / password123');
    console.log('  User3: nishant@example.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
