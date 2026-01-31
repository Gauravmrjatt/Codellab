import { PrismaClient, Role, Difficulty } from '@prisma/client';
import { hash } from 'bcrypt'; // We'll need to install bcrypt or use a simple hash for dev

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Clean existing data
    await prisma.submissionEvent.deleteMany();
    await prisma.cheatLog.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.testCase.deleteMany();
    await prisma.contestQuestion.deleteMany();
    await prisma.contestParticipant.deleteMany();
    await prisma.questionTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.message.deleteMany();
    await prisma.roomMember.deleteMany();
    await prisma.file.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.room.deleteMany();
    await prisma.question.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned database');

    // 2. Create Users
    // In a real app we'd use bcrypt, but for seed we can use a placeholder or install bcrypt
    // For now, let's assume we'll mock the password or use a simple string since auth isn't fully hooked up yet
    // actually, we should probably install bcrypt types if we use it, but for now let's use a predictable hash
    const passwordHash = "$2b$10$P87veNv1sne20GQMex.TnetWDZcqU7qJd.nmme9vhGiJNbgKzh2Rm"; // "password123" (valid bcrypt hash)

    const admin = await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@codellab.com',
            password: passwordHash,
            role: Role.ADMIN,
            avatarUrl: 'https://github.com/shadcn.png',
        },
    });

    const user1 = await prisma.user.create({
        data: {
            username: 'alice',
            email: 'alice@codellab.com',
            password: passwordHash,
            role: Role.USER,
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        },
    });

    const user2 = await prisma.user.create({
        data: {
            username: 'bob',
            email: 'bob@codellab.com',
            password: passwordHash,
            role: Role.USER,
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        },
    });

    console.log('👥 Created users');

    // 3. Create Tags
    const twoPointers = await prisma.tag.create({ data: { name: 'Two Pointers' } });
    const arrayTag = await prisma.tag.create({ data: { name: 'Array' } });
    const hashTable = await prisma.tag.create({ data: { name: 'Hash Table' } });
    const dp = await prisma.tag.create({ data: { name: 'Dynamic Programming' } });

    // 4. Create Questions

    // Question 1: Two Sum
    const twoSum = await prisma.question.create({
        data: {
            title: 'Two Sum',
            slug: 'two-sum',
            description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
            difficulty: Difficulty.EASY,
            points: 100,
            timeLimit: 1000,
            memoryLimit: 256,
            authorId: admin.id,
            starterCode: JSON.stringify({
                javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n  \n};`,
                python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass`
            }),
            testCases: {
                create: [
                    { input: '[2,7,11,15]\n9', output: '[0,1]', isPublic: true },
                    { input: '[3,2,4]\n6', output: '[1,2]', isPublic: true },
                    { input: '[3,3]\n6', output: '[0,1]', isPublic: false },
                ]
            },
            tags: {
                create: [
                    { tagId: arrayTag.id },
                    { tagId: hashTable.id }
                ]
            }
        }
    });

    // Question 2: Palindrome Number
    const palindrome = await prisma.question.create({
        data: {
            title: 'Palindrome Number',
            slug: 'palindrome-number',
            description: `Given an integer x, return true if x is a palindrome, and false otherwise.

Example 1:
Input: x = 121
Output: true

Example 2:
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.`,
            difficulty: Difficulty.EASY,
            points: 100,
            authorId: admin.id,
            starterCode: JSON.stringify({
                javascript: `/**\n * @param {number} x\n * @return {boolean}\n */\nvar isPalindrome = function(x) {\n  \n};`,
                python: `class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass`
            }),
            testCases: {
                create: [
                    { input: '121', output: 'true', isPublic: true },
                    { input: '-121', output: 'false', isPublic: true },
                    { input: '10', output: 'false', isPublic: true }
                ]
            }
        }
    });

    console.log('📚 Created questions');

    // 5. Create Contest
    const contest = await prisma.contest.create({
        data: {
            title: 'Weekly Contest 1',
            description: 'The first ever Codellab weekly contest!',
            startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // Starts tomorrow
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 26),   // Lasts 2 hours
            questions: {
                create: [
                    { questionId: twoSum.id, order: 1, points: 100 },
                    { questionId: palindrome.id, order: 2, points: 200 }
                ]
            }
        }
    });

    console.log('🏆 Created contest');

    // 6. Create a Room
    const room = await prisma.room.create({
        data: {
            name: 'Interview Prep',
            inviteCode: 'code-123',
            ownerId: user1.id,
            language: 'javascript',
            files: {
                create: [
                    { name: 'main.js', path: '/main.js', content: '// Write your code here\nconsole.log("Hello World!");' }
                ]
            },
            members: {
                create: [
                    { userId: user1.id }
                ]
            }
        }
    });

    console.log('🏠 Created room');

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
